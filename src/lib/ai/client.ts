import {
  ContractExtractionResultSchema,
  ContractExtractionResult,
  ExtractedObligation,
  PolicyConflictAnalysisResultSchema,
  PolicyConflictAnalysisResult,
  ExtractedConflict,
} from './schema';
import {
  CONTRACT_ANALYSIS_SYSTEM_PROMPT,
  OBLIGATION_EXTRACTION_PROMPT_TEMPLATE,
  POLICY_COMPARISON_SYSTEM_PROMPT,
  CONFLICT_DETECTION_PROMPT_TEMPLATE,
} from './prompts';

export interface LLMConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface AnalysisPageInput {
  pageNumber: number;
  textContent: string;
}

export interface PolicyInput {
  id: string;
  title: string;
  code: string;
  category: string;
  content: string;
  version?: string;
}

export interface ObligationInput {
  id?: string;
  title?: string;
  description: string;
  clauseNumber?: string | null;
  pageNumber?: number | null;
  evidenceText?: string | null;
  category?: string;
}

export class AIClient {
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      model: process.env.LLM_MODEL,
      temperature: 0.1,
      ...config,
    };
  }

  /**
   * Check if any valid AI provider API key is present in environment variables.
   */
  public isConfigured(): boolean {
    return Boolean(
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
    );
  }

  /**
   * Get active provider name for diagnostics/error reporting.
   */
  public getActiveProvider(): string | null {
    if (process.env.OPENAI_API_KEY) return 'OpenAI';
    if (process.env.ANTHROPIC_API_KEY) return 'Anthropic';
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'Google Gemini';
    return null;
  }

  /**
   * Send text to LLM and get raw JSON completion.
   */
  public async completePrompt(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        'AI API key is not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in your environment variables (.env).'
      );
    }

    const sys = systemPrompt || CONTRACT_ANALYSIS_SYSTEM_PROMPT;

    // 1. OpenAI Integration
    if (process.env.OPENAI_API_KEY) {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = this.config.model || process.env.LLM_MODEL || 'gpt-4o';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: this.config.temperature ?? 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error (${res.status}): ${errJson?.error?.message || res.statusText}`
        );
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    // 2. Anthropic Integration
    if (process.env.ANTHROPIC_API_KEY) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const model = this.config.model || process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          temperature: this.config.temperature ?? 0.1,
          system: sys,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          `Anthropic API error (${res.status}): ${errJson?.error?.message || res.statusText}`
        );
      }

      const data = await res.json();
      return data.content?.[0]?.text || '';
    }

    // 3. Google Gemini Integration
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey) {
      const model = this.config.model || process.env.LLM_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${sys}\n\n${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: this.config.temperature ?? 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          `Gemini API error (${res.status}): ${errJson?.error?.message || res.statusText}`
        );
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    throw new Error('No supported AI provider API key found.');
  }

  /**
   * Primary method for Step 4: Extract obligations from contract text / pages.
   */
  public async extractContractObligations(
    pages: AnalysisPageInput[] | string
  ): Promise<ContractExtractionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'AI API key is not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in environment variables.'
      );
    }

    // Prepare contract text input with page boundary headers if structured pages are given
    let formattedText = '';
    if (Array.isArray(pages)) {
      formattedText = pages
        .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.textContent}`)
        .join('\n\n');
    } else {
      formattedText = pages;
    }

    const prompt = OBLIGATION_EXTRACTION_PROMPT_TEMPLATE(formattedText);
    const rawOutput = await this.completePrompt(prompt);

    // Clean and validate structured JSON response with Zod
    const parsedData = this.parseAndValidateResponse(rawOutput);

    // Post-process & sanitize extracted findings
    const verifiedObligations = this.verifyAndNormalizeObligations(
      parsedData.obligations,
      pages
    );

    return {
      obligations: verifiedObligations,
    };
  }

  /**
   * Primary method for Step 5: Compare contract requirements against corporate policies to detect conflicts.
   */
  public async detectPolicyConflicts(
    contractTitle: string,
    contractInput: string | ObligationInput[],
    policies: PolicyInput[]
  ): Promise<PolicyConflictAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'AI API key is not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in environment variables.'
      );
    }

    if (!policies || policies.length === 0) {
      return { conflicts: [] };
    }

    // Format Contract Text / Obligations
    let contractContentFormatted = `CONTRACT TITLE: ${contractTitle}\n\n`;
    if (Array.isArray(contractInput)) {
      contractContentFormatted += contractInput
        .map((ob, idx) => {
          const clauseStr = ob.clauseNumber ? ` (Clause ${ob.clauseNumber})` : '';
          const pageStr = ob.pageNumber ? ` (Page ${ob.pageNumber})` : '';
          return `[Item ${idx + 1}]${clauseStr}${pageStr} Category: ${ob.category || 'General'}\nRequirement: ${ob.description}\nVerbatim Contract Evidence: "${ob.evidenceText || ob.description}"`;
        })
        .join('\n\n');
    } else {
      contractContentFormatted += contractInput;
    }

    // Format Policies Text
    const policiesContentFormatted = policies
      .map(
        (p) =>
          `POLICY CODE: ${p.code} (v${p.version || '1.0'}) - ${p.title}\nCategory: ${p.category}\nRule Requirement: ${p.content}`
      )
      .join('\n\n');

    const prompt = CONFLICT_DETECTION_PROMPT_TEMPLATE(
      contractContentFormatted,
      policiesContentFormatted
    );

    const rawOutput = await this.completePrompt(prompt, POLICY_COMPARISON_SYSTEM_PROMPT);
    return this.parseAndValidateConflictResponse(rawOutput, policies, contractInput);
  }

  private parseAndValidateConflictResponse(
    rawOutput: string,
    policies: PolicyInput[],
    contractInput: string | ObligationInput[]
  ): PolicyConflictAnalysisResult {
    if (!rawOutput || !rawOutput.trim()) {
      return { conflicts: [] };
    }

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
      const parseResult = PolicyConflictAnalysisResultSchema.safeParse(jsonObject);

      let rawConflicts: ExtractedConflict[] = [];
      if (parseResult.success) {
        rawConflicts = parseResult.data.conflicts;
      } else {
        console.warn('Zod conflict schema warnings:', parseResult.error.format());
        const list = Array.isArray(jsonObject?.conflicts)
          ? jsonObject.conflicts
          : Array.isArray(jsonObject)
          ? jsonObject
          : [];

        for (const item of list) {
          if (item && (item.explanation || item.contractRequirement)) {
            const rawSev = String(item.severity || 'HIGH').toUpperCase();
            const validSev: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
              ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(rawSev)
                ? (rawSev as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
                : 'HIGH';

            rawConflicts.push({
              title: String(item.title || item.conflictTitle || 'Policy Mismatch').trim(),
              contractClause: sanitizeString(item.contractClause || item.clauseNumber),
              contractRequirement: String(item.contractRequirement || item.contractRequirementText || '').trim(),
              policyId: sanitizeString(item.policyId),
              policyCode: sanitizeString(item.policyCode),
              policyName: sanitizeString(item.policyName),
              policyVersion: String(item.policyVersion || '1.0').trim(),
              policyRequirement: String(item.policyRequirement || item.policyRequirementText || '').trim(),
              explanation: String(item.explanation || item.description || '').trim(),
              severity: validSev,
              confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0), 1) : 0.85,
              contractEvidence: String(item.contractEvidence || item.evidenceText || '').trim(),
              policyEvidence: String(item.policyEvidence || item.policyRuleSnippet || '').trim(),
              pageNumber: typeof item.pageNumber === 'number' ? item.pageNumber : null,
              status: item.status === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'UNRESOLVED',
              obligationId: sanitizeString(item.obligationId),
            });
          }
        }
      }

      // Map back policyId and obligationId if missing
      const sanitizedConflicts: ExtractedConflict[] = [];
      for (const conf of rawConflicts) {
        if (!conf.contractRequirement || !conf.policyRequirement || !conf.explanation) {
          continue;
        }

        let matchedPolicyId = conf.policyId;
        let matchedPolicyCode = conf.policyCode;
        let matchedPolicyName = conf.policyName;
        let matchedPolicyVersion = conf.policyVersion || '1.0';
        let policyEv = conf.policyEvidence;

        if (policies.length > 0) {
          const foundPol = policies.find(
            (p) =>
              (conf.policyCode && p.code.toLowerCase() === conf.policyCode.toLowerCase()) ||
              (conf.policyName && p.title.toLowerCase().includes(conf.policyName.toLowerCase())) ||
              p.content.toLowerCase().includes((conf.policyRequirement || '').toLowerCase().slice(0, 25))
          );
          if (foundPol) {
            matchedPolicyId = foundPol.id;
            matchedPolicyCode = foundPol.code;
            matchedPolicyName = foundPol.title;
            matchedPolicyVersion = foundPol.version || '1.0';
            if (!policyEv || policyEv.length < 5) {
              policyEv = foundPol.content;
            }
          }
        }

        let matchedObligationId = conf.obligationId;
        let contractEv = conf.contractEvidence;
        let clauseNum = conf.contractClause;
        let pageNum = conf.pageNumber;

        if (Array.isArray(contractInput)) {
          const foundOb = contractInput.find(
            (o) =>
              (clauseNum && o.clauseNumber && o.clauseNumber === clauseNum) ||
              o.description.toLowerCase().includes(conf.contractRequirement.toLowerCase().slice(0, 25))
          );
          if (foundOb) {
            if (foundOb.id) matchedObligationId = foundOb.id;
            if (!contractEv && foundOb.evidenceText) contractEv = foundOb.evidenceText;
            if (!clauseNum && foundOb.clauseNumber) clauseNum = foundOb.clauseNumber;
            if (!pageNum && foundOb.pageNumber) pageNum = foundOb.pageNumber;
          }
        }

        let confStatus: 'UNRESOLVED' | 'NEEDS_REVIEW' | 'REVIEWED' | 'WAIVED' | 'RESOLVED' =
          conf.status as 'UNRESOLVED' | 'NEEDS_REVIEW' | 'REVIEWED' | 'WAIVED' | 'RESOLVED';
        if (conf.confidence < 0.7 || confStatus === 'NEEDS_REVIEW') {
          confStatus = 'NEEDS_REVIEW';
        }

        sanitizedConflicts.push({
          ...conf,
          policyId: matchedPolicyId,
          policyCode: matchedPolicyCode || 'POL-GEN',
          policyName: matchedPolicyName || 'Internal Policy',
          policyVersion: matchedPolicyVersion,
          policyEvidence: policyEv || conf.policyRequirement,
          contractEvidence: contractEv || conf.contractRequirement,
          contractClause: clauseNum,
          pageNumber: pageNum,
          obligationId: matchedObligationId,
          status: confStatus,
        });
      }

      return { conflicts: sanitizedConflicts };
    } catch (err) {
      console.error('Failed to parse AI Policy Conflict JSON response:', err);
      throw new Error('AI provider returned an invalid or unparseable policy conflict response.');
    }
  }

  /**
   * Safely extract JSON substring and validate with Zod.
   */
  private parseAndValidateResponse(rawOutput: string): ContractExtractionResult {
    if (!rawOutput || !rawOutput.trim()) {
      return { obligations: [] };
    }

    let jsonStr = rawOutput.trim();

    // Strip markdown code block wrappers if present (e.g. ```json ... ```)
    const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1].trim();
    } else {
      // Find first '{' and last '}'
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
    }

    try {
      const jsonObject = JSON.parse(jsonStr);

      // Validate with Zod
      const parseResult = ContractExtractionResultSchema.safeParse(jsonObject);
      if (parseResult.success) {
        return parseResult.data;
      }

      console.warn('Zod schema validation warnings on LLM output:', parseResult.error.format());

      // Attempt soft recovery for individual items if root array was provided
      const rawList = Array.isArray(jsonObject?.obligations)
        ? jsonObject.obligations
        : Array.isArray(jsonObject)
        ? jsonObject
        : [];

      const recoveredObligations: ExtractedObligation[] = [];
      for (const item of rawList) {
        // Sanitize string nulls like "null", "N/A", "undefined"
        const cleanItem = {
          description: String(item.description || item.title || '').trim(),
          responsibleParty: sanitizeString(item.responsibleParty),
          deadline: sanitizeString(item.deadline),
          noticePeriod: sanitizeString(item.noticePeriod),
          slaRequirement: sanitizeString(item.slaRequirement),
          dataHandlingRequirement: sanitizeString(item.dataHandlingRequirement),
          category: String(item.category || 'Compliance').trim(),
          clauseNumber: sanitizeString(item.clauseNumber),
          pageNumber: typeof item.pageNumber === 'number' ? item.pageNumber : null,
          evidence: String(item.evidence || item.evidenceText || item.description || '').trim(),
          confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0), 1) : 0.85,
        };

        if (cleanItem.description && cleanItem.evidence) {
          recoveredObligations.push(cleanItem as ExtractedObligation);
        }
      }

      return { obligations: recoveredObligations };
    } catch (err) {
      console.error('Failed to parse AI JSON response:', err, '\nRaw output:', rawOutput);
      throw new Error('AI provider returned an invalid or unparseable response structure.');
    }
  }

  /**
   * Verify evidence text against original contract pages and enforce strict rules.
   */
  private verifyAndNormalizeObligations(
    obligations: ExtractedObligation[],
    pagesInput: AnalysisPageInput[] | string
  ): ExtractedObligation[] {
    const verified: ExtractedObligation[] = [];

    const pageList = Array.isArray(pagesInput) ? pagesInput : [];

    for (const ob of obligations) {
      if (!ob.description || !ob.evidence) continue;

      let verifiedPageNumber = ob.pageNumber ?? null;

      // If page number is missing or needs verification, attempt matching evidence snippet in document pages
      if (pageList.length > 0 && ob.evidence.length > 10) {
        const snippetLower = ob.evidence.toLowerCase().trim();
        for (const page of pageList) {
          if (page.textContent.toLowerCase().includes(snippetLower)) {
            verifiedPageNumber = page.pageNumber;
            break;
          }
        }
      }

      verified.push({
        ...ob,
        responsibleParty: sanitizeString(ob.responsibleParty),
        deadline: sanitizeString(ob.deadline),
        noticePeriod: sanitizeString(ob.noticePeriod),
        slaRequirement: sanitizeString(ob.slaRequirement),
        dataHandlingRequirement: sanitizeString(ob.dataHandlingRequirement),
        clauseNumber: sanitizeString(ob.clauseNumber),
        pageNumber: verifiedPageNumber,
        confidence: Math.min(Math.max(ob.confidence ?? 0.9, 0), 1),
      });
    }

    return verified;
  }
}

function sanitizeString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'none' || str.toLowerCase() === 'undefined') {
    return null;
  }
  return str;
}

export const aiClient = new AIClient();
