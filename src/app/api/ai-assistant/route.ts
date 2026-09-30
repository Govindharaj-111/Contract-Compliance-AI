import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a question or search query.',
        },
        { status: 400 }
      );
    }

    const queryLower = message.trim().toLowerCase();

    // Fetch contracts, obligations, and policies from DB for evidence matching
    const [contracts, obligations, policies, conflicts] = await Promise.all([
      prisma.contract.findMany({
        include: { pages: { take: 3 } },
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.obligation.findMany({
        include: { contract: { select: { title: true, fileName: true } } },
      }),
      prisma.policy.findMany({
        where: { isActive: true },
      }),
      prisma.policyConflict.findMany({
        include: {
          contract: { select: { title: true } },
          policy: { select: { code: true, title: true } },
        },
      }),
    ]);

    // Check if external LLM API key is configured
    if (aiClient.isConfigured()) {
      try {
        const dbContext = `
SYSTEM CONTEXT:
Contracts ingested: ${contracts.map((c) => c.title).join(', ')}

EXTRACTED OBLIGATIONS:
${obligations
  .map(
    (o) =>
      `- [${o.contract?.title || 'Contract'}] ${o.title}: ${o.description} (Clause: ${
        o.clauseNumber || 'N/A'
      }, Pg: ${o.pageNumber || 'N/A'}, Notice: ${o.noticePeriod || 'N/A'}, SLA: ${
        o.slaRequirement || 'N/A'
      })`
  )
  .join('\n')}

CORPORATE POLICIES:
${policies.map((p) => `- [${p.code}] ${p.title}: ${p.content}`).join('\n')}

POLICY CONFLICTS:
${conflicts.map((c) => `- [${c.contract?.title} vs ${c.policy?.code}] ${c.title}: ${c.description}`).join('\n')}
`;

        const prompt = `${dbContext}\n\nUSER QUESTION: "${message.trim()}"\n\nProvide a direct, authoritative compliance answer with source citations referencing exact contract names, clause numbers, page numbers, and policy codes.`;

        const rawResponse = await aiClient.completePrompt(prompt);

        // Find primary citation match if possible
        const matchedObligation = obligations.find(
          (o) =>
            queryLower.includes(o.category.toLowerCase()) ||
            (o.clauseNumber && queryLower.includes(o.clauseNumber.toLowerCase())) ||
            o.description.toLowerCase().split(' ').some((w) => w.length > 4 && queryLower.includes(w))
        );

        let citation = null;
        if (matchedObligation) {
          citation = {
            documentId: matchedObligation.contractId,
            documentTitle: matchedObligation.contract?.title || 'Contract Document',
            pageNumber: matchedObligation.pageNumber || 1,
            clauseNumber: matchedObligation.clauseNumber || 'Section 1',
            evidenceText: matchedObligation.evidenceText || matchedObligation.description,
          };
        } else if (contracts.length > 0) {
          citation = {
            documentId: contracts[0].id,
            documentTitle: contracts[0].title,
            pageNumber: 1,
            clauseNumber: 'Section 1.1',
            evidenceText: contracts[0].extractedText?.slice(0, 300) || 'Contract terms preview',
          };
        }

        return NextResponse.json({
          success: true,
          answer: rawResponse,
          citation,
        });
      } catch (aiErr: unknown) {
        console.warn('LLM API call failed, falling back to evidence search:', aiErr);
      }
    }

    // Fallback: Intelligent Database Evidence Retrieval Engine
    const matchedObs = obligations.filter(
      (o) =>
        o.description.toLowerCase().includes(queryLower) ||
        o.category.toLowerCase().includes(queryLower) ||
        (o.responsibleParty && o.responsibleParty.toLowerCase().includes(queryLower)) ||
        (o.noticePeriod && queryLower.includes('notice')) ||
        (o.slaRequirement && queryLower.includes('sla')) ||
        (o.dataHandlingRequirement && queryLower.includes('data'))
    );

    const matchedConflicts = conflicts.filter(
      (c) =>
        c.title.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower) ||
        (c.policy?.code && queryLower.includes(c.policy.code.toLowerCase()))
    );

    const matchedPolicies = policies.filter(
      (p) =>
        p.title.toLowerCase().includes(queryLower) ||
        p.code.toLowerCase().includes(queryLower) ||
        p.content.toLowerCase().includes(queryLower)
    );

    let answerText = '';
    let citation = null;

    if (matchedObs.length > 0) {
      const topOb = matchedObs[0];
      answerText = `Found ${matchedObs.length} relevant obligation(s) in contract database:\n\n` +
        matchedObs
          .slice(0, 3)
          .map(
            (o, i) =>
              `${i + 1}. **${o.title}** (${o.contract?.title})\n` +
              `• **Category**: ${o.category}\n` +
              `• **Duty**: ${o.description}\n` +
              (o.noticePeriod ? `• **Notice Period**: ${o.noticePeriod}\n` : '') +
              (o.slaRequirement ? `• **SLA Standard**: ${o.slaRequirement}\n` : '') +
              `• **Location**: Clause ${o.clauseNumber || 'N/A'}, Page ${o.pageNumber || 'N/A'}`
          )
          .join('\n\n');

      citation = {
        documentId: topOb.contractId,
        documentTitle: topOb.contract?.title || 'Contract Document',
        pageNumber: topOb.pageNumber || 1,
        clauseNumber: topOb.clauseNumber || 'Section 3.1',
        evidenceText: topOb.evidenceText || topOb.description,
      };
    } else if (matchedConflicts.length > 0) {
      const topConf = matchedConflicts[0];
      answerText = `Identified policy conflict matching your query:\n\n` +
        `• **Conflict**: ${topConf.title}\n` +
        `• **Contract Source**: ${topConf.contract?.title}\n` +
        `• **Violated Policy**: ${topConf.policy?.code} (${topConf.policy?.title})\n` +
        `• **Explanation**: ${topConf.description}\n` +
        `• **Severity**: ${topConf.severity}`;

      citation = {
        documentId: topConf.contractId,
        documentTitle: topConf.contract?.title || 'Contract Document',
        pageNumber: topConf.pageNumber || 1,
        clauseNumber: topConf.contractClause || 'Clause 4',
        evidenceText: topConf.contractEvidence || topConf.contractRequirement || topConf.description,
      };
    } else if (matchedPolicies.length > 0) {
      const topPol = matchedPolicies[0];
      answerText = `Found corporate policy rule:\n\n` +
        `• **Policy**: ${topPol.code} - ${topPol.title}\n` +
        `• **Category**: ${topPol.category} (v${topPol.version})\n` +
        `• **Requirement**: ${topPol.content}`;

      if (contracts.length > 0) {
        citation = {
          documentId: contracts[0].id,
          documentTitle: contracts[0].title,
          pageNumber: 1,
          clauseNumber: 'Policy Code ' + topPol.code,
          evidenceText: topPol.content,
        };
      }
    } else if (contracts.length > 0) {
      answerText = `Currently monitoring ${contracts.length} contract(s) and ${obligations.length} extracted obligation(s).\n\n` +
        `Sample ingested contracts:\n` +
        contracts.slice(0, 3).map((c) => `• ${c.title} (${c.pageCount || 1} pages)`).join('\n') +
        `\n\nTry asking about notice periods, SLA requirements, encryption standards, or policy conflicts.`;

      citation = {
        documentId: contracts[0].id,
        documentTitle: contracts[0].title,
        pageNumber: 1,
        clauseNumber: 'General Scope',
        evidenceText: contracts[0].extractedText?.slice(0, 300) || 'Contract content active',
      };
    } else {
      answerText = 'No contracts uploaded yet. Please upload a PDF or DOCX contract document from the Dashboard or Contracts section to enable AI QA.';
    }

    return NextResponse.json({
      success: true,
      answer: answerText,
      citation,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('AI Assistant API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error executing AI contract assistant query.',
      },
      { status: 500 }
    );
  }
}
