import { prisma } from '@/lib/prisma';
import { aiClient } from './client';
import { AssistantResponseSchema, AssistantResponse, AssistantSource } from './schema';
import { ASSISTANT_SYSTEM_PROMPT, ASSISTANT_QUESTION_PROMPT_TEMPLATE } from './prompts';

export interface AskAssistantOptions {
  message: string;
  conversationId?: string;
}

export interface AskAssistantResult extends AssistantResponse {
  conversationId: string;
}

export async function askAssistant(options: AskAssistantOptions): Promise<AskAssistantResult> {
  const { message, conversationId: reqConversationId } = options;

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Please provide a non-empty question or message for the AI assistant.');
  }

  const queryText = message.trim();
  const queryLower = queryText.toLowerCase();

  // 1. Manage Conversation Session in DB
  let conversation = null;
  if (reqConversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: reqConversationId },
    });
  }

  if (!conversation) {
    const convTitle = queryText.length > 50 ? `${queryText.slice(0, 47)}...` : queryText;
    conversation = await prisma.conversation.create({
      data: {
        title: convTitle,
      },
    });
  }

  // Save User Question Message
  await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: queryText,
    },
  });

  // 2. Perform RAG Database Retrieval across all entity types
  const context = await retrieveRAGContext(queryLower, queryText);

  let assistantResult: AssistantResponse;

  // 3. Try LLM Completion if configured
  if (aiClient.isConfigured() && context.hasData) {
    try {
      const prompt = ASSISTANT_QUESTION_PROMPT_TEMPLATE(queryText, JSON.stringify(context.data, null, 2));
      const rawOutput = await aiClient.completePrompt(prompt, ASSISTANT_SYSTEM_PROMPT);

      const parsed = parseLLMAssistantOutput(rawOutput);
      if (parsed) {
        assistantResult = parsed;
      } else {
        assistantResult = buildFallbackGroundedAnswer(queryLower, context);
      }
    } catch (aiErr) {
      console.warn('LLM Assistant execution error, falling back to deterministic grounding:', aiErr);
      assistantResult = buildFallbackGroundedAnswer(queryLower, context);
    }
  } else {
    // 4. Fallback Grounded Answering Engine (No API key or context specific)
    assistantResult = buildFallbackGroundedAnswer(queryLower, context);
  }

  // Save AI Response Message to Conversation DB
  await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantResult.answer,
      confidence: assistantResult.confidence,
      needsReview: assistantResult.needsReview,
      sourcesJson: JSON.stringify(assistantResult.sources),
    },
  });

  return {
    ...assistantResult,
    conversationId: conversation.id,
  };
}

/**
 * Interface for retrieved DB entities formatted into structured context.
 */
interface RAGContext {
  hasData: boolean;
  totalEntitiesCount: number;
  contracts: Array<{
    id: string;
    title: string;
    fileName: string;
    status: string;
    pageCount: number;
  }>;
  contractPages: Array<{
    contractId: string;
    contractTitle: string;
    pageNumber: number;
    sectionTitle: string | null;
    snippet: string;
  }>;
  obligations: Array<{
    id: string;
    contractId: string;
    contractTitle: string;
    title: string;
    description: string;
    category: string;
    responsibleParty: string | null;
    deadlineText: string | null;
    noticePeriod: string | null;
    slaRequirement: string | null;
    severity: string;
    clauseNumber: string | null;
    pageNumber: number | null;
    evidenceText: string | null;
  }>;
  deadlines: Array<{
    id: string;
    contractId: string;
    contractTitle: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    deadlineText: string | null;
    noticeDays: number;
    responsibleParty: string | null;
    status: string;
    severity: string;
    clauseNumber: string | null;
    pageNumber: number | null;
    evidenceText: string | null;
  }>;
  parties: Array<{
    id: string;
    contractId: string;
    contractTitle: string;
    name: string;
    role: string;
    contactEmail: string | null;
  }>;
  policies: Array<{
    id: string;
    title: string;
    code: string;
    category: string;
    content: string;
    version: string;
  }>;
  policyRequirements: Array<{
    id: string;
    policyCode: string;
    policyTitle: string;
    requirement: string;
    clauseCode: string | null;
  }>;
  conflicts: Array<{
    id: string;
    contractId: string;
    contractTitle: string;
    policyCode: string;
    policyTitle: string;
    title: string;
    description: string;
    severity: string;
    contractClause: string | null;
    contractRequirement: string | null;
    policyRequirement: string | null;
    contractEvidence: string | null;
    policyEvidence: string | null;
    pageNumber: number | null;
    status: string;
  }>;
  data: Record<string, unknown>;
}

async function retrieveRAGContext(queryLower: string, rawQuery: string): Promise<RAGContext> {
  const isDeadlineQuery = queryLower.includes('deadline') || queryLower.includes('due') || queryLower.includes('date') || queryLower.includes('soon') || queryLower.includes('upcoming');
  const isConflictQuery = queryLower.includes('conflict') || queryLower.includes('mismatch') || queryLower.includes('violation') || queryLower.includes('risk') || queryLower.includes('high') || queryLower.includes('critical');
  const isObligationQuery = queryLower.includes('obligation') || queryLower.includes('duty') || queryLower.includes('sla') || queryLower.includes('notice') || queryLower.includes('important');
  const isPartyQuery = queryLower.includes('responsible') || queryLower.includes('party') || queryLower.includes('who') || queryLower.includes('vendor') || queryLower.includes('supplier');
  const isPolicyQuery = queryLower.includes('policy') || queryLower.includes('internal') || queryLower.includes('rule') || queryLower.includes('security');
  const isSummaryQuery = queryLower.includes('summarize') || queryLower.includes('summary') || queryLower.includes('overview');

  // Extract key search terms
  const stopWords = new Set(['what', 'which', 'where', 'when', 'show', 'list', 'give', 'have', 'from', 'with', 'your', 'my', 'that', 'this', 'these', 'those', 'are', 'is', 'for', 'about', 'contract', 'contracts', 'policy', 'policies']);
  const searchTerms = rawQuery
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  // Retrieve base DB records
  const [
    allContracts,
    allPages,
    allObligations,
    allDeadlines,
    allParties,
    allPolicies,
    allPolicyReqs,
    allConflicts,
  ] = await Promise.all([
    prisma.contract.findMany({ select: { id: true, title: true, fileName: true, status: true, pageCount: true, extractedText: true } }),
    prisma.contractPage.findMany({ select: { id: true, contractId: true, pageNumber: true, sectionTitle: true, textContent: true, contract: { select: { title: true } } }, take: 20 }),
    prisma.obligation.findMany({ include: { contract: { select: { title: true } } } }),
    prisma.deadline.findMany({ include: { contract: { select: { title: true } } } }),
    prisma.party.findMany({ include: { contract: { select: { title: true } } } }),
    prisma.policy.findMany({ where: { isActive: true }, include: { requirements: true } }),
    prisma.policyRequirement.findMany({ include: { policy: { select: { code: true, title: true } } } }),
    prisma.policyConflict.findMany({ include: { contract: { select: { title: true } }, policy: { select: { code: true, title: true } } } }),
  ]);

  if (allContracts.length === 0 && allPolicies.length === 0) {
    return emptyRAGContext();
  }

  // Term relevance precision filter: Check if user query contains terms that do not exist anywhere in database
  if (searchTerms.length >= 2 && !isDeadlineQuery && !isConflictQuery && !isObligationQuery && !isPartyQuery && !isSummaryQuery) {
    const matchedTermCount = searchTerms.filter((term) => {
      const inContracts = allContracts.some((c) => `${c.title} ${c.fileName} ${c.extractedText || ''}`.toLowerCase().includes(term));
      const inObs = allObligations.some((o) => `${o.title} ${o.description} ${o.evidenceText || ''}`.toLowerCase().includes(term));
      const inDeadlines = allDeadlines.some((d) => `${d.title} ${d.description || ''} ${d.evidenceText || ''}`.toLowerCase().includes(term));
      const inPolicies = allPolicies.some((p) => `${p.code} ${p.title} ${p.content}`.toLowerCase().includes(term));
      const inConflicts = allConflicts.some((c) => `${c.title} ${c.description}`.toLowerCase().includes(term));
      return inContracts || inObs || inDeadlines || inPolicies || inConflicts;
    }).length;

    const matchRatio = matchedTermCount / searchTerms.length;
    if (matchRatio < 0.4) {
      return emptyRAGContext();
    }
  }

  // Filter relevant items based on search terms and intent
  const filterByTerms = <T>(items: T[], textExtractor: (item: T) => string): T[] => {
    if (searchTerms.length === 0) return items;
    return items.filter((item) => {
      const text = textExtractor(item).toLowerCase();
      return searchTerms.some((term) => text.includes(term));
    });
  };

  let matchedContracts = filterByTerms(allContracts, (c) => `${c.title} ${c.fileName}`);
  if (matchedContracts.length === 0 && (isSummaryQuery || allContracts.length <= 5)) {
    matchedContracts = allContracts;
  }

  let matchedPages = filterByTerms(allPages, (p) => `${p.contract?.title || ''} ${p.sectionTitle || ''} ${p.textContent}`);
  if (matchedPages.length > 5) matchedPages = matchedPages.slice(0, 5);

  let matchedObs = filterByTerms(allObligations, (o) => `${o.title} ${o.description} ${o.category} ${o.responsibleParty || ''} ${o.clauseNumber || ''} ${o.contract?.title || ''}`);
  if (isObligationQuery && matchedObs.length === 0) matchedObs = allObligations;

  let matchedDeadlines = filterByTerms(allDeadlines, (d) => `${d.title} ${d.description || ''} ${d.responsibleParty || ''} ${d.status} ${d.severity} ${d.contract?.title || ''}`);
  if (isDeadlineQuery && matchedDeadlines.length === 0) matchedDeadlines = allDeadlines;

  let matchedParties = filterByTerms(allParties, (p) => `${p.name} ${p.role} ${p.contactEmail || ''} ${p.contract?.title || ''}`);
  if (isPartyQuery && matchedParties.length === 0) matchedParties = allParties;

  let matchedPolicies = filterByTerms(allPolicies, (p) => `${p.code} ${p.title} ${p.category} ${p.content}`);
  if (isPolicyQuery && matchedPolicies.length === 0 && searchTerms.some((t) => ['policy', 'security', 'rule'].includes(t))) {
    matchedPolicies = allPolicies;
  }

  let matchedConflicts = filterByTerms(allConflicts, (c) => `${c.title} ${c.description} ${c.severity} ${c.contract?.title || ''} ${c.policy?.code || ''}`);
  if (isConflictQuery && matchedConflicts.length === 0) matchedConflicts = allConflicts;

  const totalEntities =
    matchedContracts.length +
    matchedObs.length +
    matchedDeadlines.length +
    matchedParties.length +
    matchedPolicies.length +
    matchedConflicts.length;

  if (totalEntities === 0 && !isSummaryQuery && !isDeadlineQuery && !isConflictQuery && !isObligationQuery && !isPartyQuery && !isPolicyQuery) {
    return emptyRAGContext();
  }

  const formattedContracts = matchedContracts.slice(0, 5).map((c) => ({
    id: c.id,
    title: c.title,
    fileName: c.fileName,
    status: c.status,
    pageCount: c.pageCount || 1,
  }));

  const formattedPages = matchedPages.map((p) => ({
    contractId: p.contractId,
    contractTitle: p.contract?.title || 'Contract',
    pageNumber: p.pageNumber,
    sectionTitle: p.sectionTitle,
    snippet: p.textContent.slice(0, 300),
  }));

  const formattedObs = matchedObs.slice(0, 10).map((o) => ({
    id: o.id,
    contractId: o.contractId,
    contractTitle: o.contract?.title || 'Contract',
    title: o.title,
    description: o.description,
    category: o.category,
    responsibleParty: o.responsibleParty,
    deadlineText: o.deadlineText,
    noticePeriod: o.noticePeriod,
    slaRequirement: o.slaRequirement,
    severity: o.severity,
    clauseNumber: o.clauseNumber,
    pageNumber: o.pageNumber,
    evidenceText: o.evidenceText,
  }));

  const formattedDeadlines = matchedDeadlines.slice(0, 10).map((d) => ({
    id: d.id,
    contractId: d.contractId,
    contractTitle: d.contract?.title || 'Contract',
    title: d.title,
    description: d.description,
    dueDate: d.dueDate ? d.dueDate.toISOString().split('T')[0] : null,
    deadlineText: d.deadlineText,
    noticeDays: d.noticeDays,
    responsibleParty: d.responsibleParty,
    status: d.status,
    severity: d.severity,
    clauseNumber: d.clauseNumber,
    pageNumber: d.pageNumber,
    evidenceText: d.evidenceText,
  }));

  const formattedParties = matchedParties.slice(0, 10).map((p) => ({
    id: p.id,
    contractId: p.contractId,
    contractTitle: p.contract?.title || 'Contract',
    name: p.name,
    role: p.role,
    contactEmail: p.contactEmail,
  }));

  const formattedPolicies = matchedPolicies.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    code: p.code,
    category: p.category,
    content: p.content,
    version: p.version,
  }));

  const formattedPolicyReqs = allPolicyReqs
    .filter((pr) => matchedPolicies.some((mp) => mp.id === pr.policyId))
    .slice(0, 10)
    .map((pr) => ({
      id: pr.id,
      policyCode: pr.policy?.code || 'POL',
      policyTitle: pr.policy?.title || 'Policy',
      requirement: pr.requirement,
      clauseCode: pr.clauseCode,
    }));

  const formattedConflicts = matchedConflicts.slice(0, 10).map((c) => ({
    id: c.id,
    contractId: c.contractId,
    contractTitle: c.contract?.title || 'Contract',
    policyCode: c.policy?.code || 'POL',
    policyTitle: c.policy?.title || 'Policy',
    title: c.title,
    description: c.description,
    severity: c.severity,
    contractClause: c.contractClause,
    contractRequirement: c.contractRequirement,
    policyRequirement: c.policyRequirement,
    contractEvidence: c.contractEvidence,
    policyEvidence: c.policyEvidence,
    pageNumber: c.pageNumber,
    status: c.status,
  }));

  return {
    hasData: totalEntities > 0,
    totalEntitiesCount: totalEntities,
    contracts: formattedContracts,
    contractPages: formattedPages,
    obligations: formattedObs,
    deadlines: formattedDeadlines,
    parties: formattedParties,
    policies: formattedPolicies,
    policyRequirements: formattedPolicyReqs,
    conflicts: formattedConflicts,
    data: {
      contracts: formattedContracts,
      contractPages: formattedPages,
      obligations: formattedObs,
      deadlines: formattedDeadlines,
      parties: formattedParties,
      policies: formattedPolicies,
      policyRequirements: formattedPolicyReqs,
      policyConflicts: formattedConflicts,
    },
  };
}

function emptyRAGContext(): RAGContext {
  return {
    hasData: false,
    totalEntitiesCount: 0,
    contracts: [],
    contractPages: [],
    obligations: [],
    deadlines: [],
    parties: [],
    policies: [],
    policyRequirements: [],
    conflicts: [],
    data: {},
  };
}

function parseLLMAssistantOutput(rawOutput: string): AssistantResponse | null {
  if (!rawOutput || !rawOutput.trim()) return null;

  let jsonStr = rawOutput.trim();
  const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    jsonStr = jsonBlockMatch[1].trim();
  } else {
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    const jsonObject = JSON.parse(jsonStr);
    const parseResult = AssistantResponseSchema.safeParse(jsonObject);
    if (parseResult.success) {
      return parseResult.data;
    }
    console.warn('Zod Assistant response schema warning:', parseResult.error.format());
    return null;
  } catch (err) {
    console.error('Failed to parse AI Assistant JSON response:', err);
    return null;
  }
}

/**
 * Helper to construct type-safe AssistantSource objects with defaults.
 */
function makeSource(partial: Partial<AssistantSource> & { title: string; evidence: string }): AssistantSource {
  return {
    type: partial.type || 'contract',
    contractId: partial.contractId ?? null,
    contractTitle: partial.contractTitle ?? null,
    title: partial.title,
    pageNumber: partial.pageNumber ?? null,
    clauseNumber: partial.clauseNumber ?? null,
    evidence: partial.evidence,
    policyName: partial.policyName ?? null,
    policyVersion: partial.policyVersion ?? null,
    policyRequirement: partial.policyRequirement ?? null,
    dueDate: partial.dueDate ?? null,
    responsibleParty: partial.responsibleParty ?? null,
  };
}

/**
 * Deterministic fallback grounded answering engine when LLM is unavailable or for exact schema grounding.
 */
function buildFallbackGroundedAnswer(queryLower: string, context: RAGContext): AssistantResponse {
  if (!context.hasData) {
    return {
      answer: "I couldn't find sufficient information in the available contract and policy data.",
      confidence: 0.0,
      sources: [],
      needsReview: true,
    };
  }

  const sources: AssistantSource[] = [];

  // Check 1: Deadlines query
  if (
    queryLower.includes('deadline') ||
    queryLower.includes('due') ||
    queryLower.includes('coming up') ||
    queryLower.includes('this week') ||
    queryLower.includes('soon')
  ) {
    if (context.deadlines.length > 0) {
      const topDeadlines = context.deadlines.slice(0, 5);
      topDeadlines.forEach((d) => {
        sources.push(
          makeSource({
            type: 'deadline',
            contractId: d.contractId,
            contractTitle: d.contractTitle,
            title: d.title,
            pageNumber: d.pageNumber || 1,
            clauseNumber: d.clauseNumber || 'N/A',
            evidence: d.evidenceText || d.deadlineText || d.description || d.title,
            dueDate: d.dueDate || 'NEEDS_REVIEW',
            responsibleParty: d.responsibleParty || 'Unassigned',
          })
        );
      });

      const deadlineListStr = topDeadlines
        .map(
          (d, idx) =>
            `${idx + 1}. **${d.title}** (${d.contractTitle})\n` +
            `• **Due Date**: ${d.dueDate || 'NEEDS_REVIEW'}\n` +
            `• **Notice Required**: ${d.noticeDays} days\n` +
            `• **Responsible**: ${d.responsibleParty || 'Unassigned'}\n` +
            `• **Status**: ${d.status}`
        )
        .join('\n\n');

      return {
        answer: `There are ${context.deadlines.length} deadline(s) recorded in your active contracts. Here are the most imminent:\n\n${deadlineListStr}`,
        confidence: 0.95,
        sources,
        needsReview: topDeadlines.some((d) => !d.dueDate || d.status === 'NEEDS_REVIEW'),
      };
    }
  }

  // Check 2: Conflicts / High Risk query
  if (
    queryLower.includes('conflict') ||
    queryLower.includes('high and critical') ||
    queryLower.includes('risk') ||
    queryLower.includes('mismatch') ||
    queryLower.includes('violation')
  ) {
    if (context.conflicts.length > 0) {
      const highConflicts = context.conflicts.filter(
        (c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'
      );
      const displayConflicts = highConflicts.length > 0 ? highConflicts.slice(0, 5) : context.conflicts.slice(0, 5);

      displayConflicts.forEach((c) => {
        sources.push(
          makeSource({
            type: 'conflict',
            contractId: c.contractId,
            contractTitle: c.contractTitle,
            title: c.title,
            pageNumber: c.pageNumber || 1,
            clauseNumber: c.contractClause || 'N/A',
            evidence: c.contractEvidence || c.description,
            policyName: c.policyTitle,
            policyVersion: '1.0',
            policyRequirement: c.policyRequirement,
          })
        );
      });

      const conflictListStr = displayConflicts
        .map(
          (c, idx) =>
            `${idx + 1}. **[${c.severity}] ${c.title}**\n` +
            `• **Contract**: ${c.contractTitle} (${c.contractClause || 'Clause N/A'})\n` +
            `• **Violated Policy**: ${c.policyCode} - ${c.policyTitle}\n` +
            `• **Compliance Impact**: ${c.description}`
        )
        .join('\n\n');

      return {
        answer: `Found ${context.conflicts.length} compliance conflict(s) across internal policies and contract terms:\n\n${conflictListStr}`,
        confidence: 0.92,
        sources,
        needsReview: displayConflicts.some((c) => c.status === 'NEEDS_REVIEW'),
      };
    }
  }

  // Check 3: Responsible Parties query
  if (queryLower.includes('responsible') || queryLower.includes('who is responsible') || queryLower.includes('party')) {
    if (context.parties.length > 0 || context.deadlines.some((d) => d.responsibleParty)) {
      const responsibleMap: Array<{ title: string; party: string; contractTitle: string; pageNumber: number | null; clauseNumber: string | null; evidence: string }> = [];

      context.deadlines.forEach((d) => {
        if (d.responsibleParty) {
          responsibleMap.push({
            title: d.title,
            party: d.responsibleParty,
            contractTitle: d.contractTitle,
            pageNumber: d.pageNumber,
            clauseNumber: d.clauseNumber,
            evidence: d.evidenceText || d.title,
          });
        }
      });

      context.obligations.forEach((o) => {
        if (o.responsibleParty) {
          responsibleMap.push({
            title: o.title,
            party: o.responsibleParty,
            contractTitle: o.contractTitle,
            pageNumber: o.pageNumber,
            clauseNumber: o.clauseNumber,
            evidence: o.evidenceText || o.description,
          });
        }
      });

      if (responsibleMap.length > 0) {
        responsibleMap.slice(0, 5).forEach((item) => {
          sources.push(
            makeSource({
              type: 'obligation',
              contractTitle: item.contractTitle,
              title: item.title,
              pageNumber: item.pageNumber || 1,
              clauseNumber: item.clauseNumber || 'N/A',
              evidence: item.evidence,
              responsibleParty: item.party,
            })
          );
        });

        const respStr = responsibleMap
          .slice(0, 5)
          .map((r, i) => `${i + 1}. **${r.party}** is responsible for **"${r.title}"** in *${r.contractTitle}*.`)
          .join('\n');

        return {
          answer: `Here are the responsible parties assigned to contract obligations and upcoming deadlines:\n\n${respStr}`,
          confidence: 0.9,
          sources,
          needsReview: false,
        };
      }
    }
  }

  // Check 4: Contract Summarization query
  if (queryLower.includes('summarize') || queryLower.includes('summary')) {
    const targetContract = context.contracts[0];
    if (targetContract) {
      const contractObs = context.obligations.filter((o) => o.contractId === targetContract.id);
      const contractDeadlines = context.deadlines.filter((d) => d.contractId === targetContract.id);
      const contractConflicts = context.conflicts.filter((c) => c.contractId === targetContract.id);

      contractObs.slice(0, 3).forEach((o) => {
        sources.push(
          makeSource({
            type: 'contract',
            contractId: targetContract.id,
            contractTitle: targetContract.title,
            title: o.title,
            pageNumber: o.pageNumber || 1,
            clauseNumber: o.clauseNumber || 'Section 1',
            evidence: o.evidenceText || o.description,
          })
        );
      });

      const summaryText =
        `### Contract Intelligence Summary: **${targetContract.title}**\n\n` +
        `• **Purpose / Status**: ${targetContract.status} (Ingested ${targetContract.pageCount} page(s))\n` +
        `• **Key Obligations Extracted**: ${contractObs.length} obligation(s)\n` +
        `• **Deadlines & Milestones**: ${contractDeadlines.length} deadline(s)\n` +
        `• **Policy Conflicts Detected**: ${contractConflicts.length} conflict(s)\n\n` +
        (contractObs.length > 0
          ? `**Key Extracted Terms**:\n` +
            contractObs
              .slice(0, 3)
              .map((o) => `- **${o.title}**: ${o.description} (Clause ${o.clauseNumber || 'N/A'}, Pg ${o.pageNumber || '1'})`)
              .join('\n')
          : 'No specific obligations extracted yet.');

      return {
        answer: summaryText,
        confidence: 0.92,
        sources,
        needsReview: false,
      };
    }
  }

  // Check 5: General Obligations query
  if (context.obligations.length > 0) {
    const topObs = context.obligations.slice(0, 5);
    topObs.forEach((o) => {
      sources.push(
        makeSource({
          type: 'obligation',
          contractId: o.contractId,
          contractTitle: o.contractTitle,
          title: o.title,
          pageNumber: o.pageNumber || 1,
          clauseNumber: o.clauseNumber || 'N/A',
          evidence: o.evidenceText || o.description,
          responsibleParty: o.responsibleParty || null,
        })
      );
    });

    const obListStr = topObs
      .map(
        (o, idx) =>
          `${idx + 1}. **${o.title}** (${o.contractTitle})\n` +
          `• **Category**: ${o.category}\n` +
          `• **Description**: ${o.description}\n` +
          `• **Clause**: ${o.clauseNumber || 'N/A'}, Page ${o.pageNumber || 'N/A'}`
      )
      .join('\n\n');

    return {
      answer: `Found ${context.obligations.length} obligation(s) matching your query:\n\n${obListStr}`,
      confidence: 0.88,
      sources,
      needsReview: false,
    };
  }

  // Check 6: Corporate Policies query
  if (context.policies.length > 0) {
    const topPol = context.policies[0];
    sources.push(
      makeSource({
        type: 'policy',
        title: topPol.title,
        evidence: topPol.content,
        policyName: topPol.title,
        policyVersion: topPol.version,
        policyRequirement: topPol.content,
      })
    );

    return {
      answer: `Corporate Policy **[${topPol.code}] ${topPol.title}** (v${topPol.version}):\n\n${topPol.content}`,
      confidence: 0.95,
      sources,
      needsReview: false,
    };
  }

  // Fallback if query terms did not match any factual records
  return {
    answer: "I couldn't find sufficient information in the available contract and policy data.",
    confidence: 0.0,
    sources: [],
    needsReview: true,
  };
}

