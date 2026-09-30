import { z } from 'zod';

/**
 * Zod schema for individual compliance obligation extracted by LLM.
 */
export const ExtractedObligationSchema = z.object({
  description: z.string().min(1, 'Obligation description cannot be empty'),
  responsibleParty: z.string().nullable().optional().default(null),
  deadline: z.string().nullable().optional().default(null),
  noticePeriod: z.string().nullable().optional().default(null),
  slaRequirement: z.string().nullable().optional().default(null),
  dataHandlingRequirement: z.string().nullable().optional().default(null),
  category: z.string().min(1).default('Compliance'),
  clauseNumber: z.string().nullable().optional().default(null),
  pageNumber: z.number().int().positive().nullable().optional().default(null),
  evidence: z.string().min(1, 'Every extracted obligation must have supporting evidence'),
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0 and 1')
    .max(1, 'Confidence must be between 0 and 1')
    .default(0.9),
});

/**
 * Zod schema for full contract analysis output.
 */
export const ContractExtractionResultSchema = z.object({
  obligations: z.array(ExtractedObligationSchema).default([]),
});

export type ExtractedObligation = z.infer<typeof ExtractedObligationSchema>;
export type ContractExtractionResult = z.infer<typeof ContractExtractionResultSchema>;

/**
 * Zod schema for individual policy conflict detected by LLM.
 */
export const ExtractedConflictSchema = z.object({
  contractClause: z.string().nullable().optional().default(null),
  contractRequirement: z.string().min(1, 'Contract requirement description is required'),
  policyId: z.string().nullable().optional().default(null),
  policyCode: z.string().nullable().optional().default(null),
  policyName: z.string().nullable().optional().default(null),
  policyVersion: z.string().nullable().optional().default('1.0'),
  policyRequirement: z.string().min(1, 'Policy requirement description is required'),
  explanation: z.string().min(1, 'Explanation of difference is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0 and 1')
    .max(1, 'Confidence must be between 0 and 1')
    .default(0.85),
  contractEvidence: z.string().min(1, 'Contract evidence verbatim snippet is required'),
  policyEvidence: z.string().min(1, 'Policy evidence verbatim snippet is required'),
  pageNumber: z.number().int().positive().nullable().optional().default(null),
  status: z.enum(['UNRESOLVED', 'NEEDS_REVIEW', 'REVIEWED', 'WAIVED', 'RESOLVED']).default('UNRESOLVED'),
  title: z.string().min(1).default('Policy Mismatch'),
  obligationId: z.string().nullable().optional().default(null),
});

/**
 * Zod schema for policy conflict analysis output.
 */
export const PolicyConflictAnalysisResultSchema = z.object({
  conflicts: z.array(ExtractedConflictSchema).default([]),
});

export type ExtractedConflict = z.infer<typeof ExtractedConflictSchema>;
export type PolicyConflictAnalysisResult = z.infer<typeof PolicyConflictAnalysisResultSchema>;

/**
 * Zod schema for individual contract deadline extracted by LLM (Stage 6).
 */
export const ExtractedDeadlineSchema = z.object({
  title: z.string().min(1, 'Deadline title is required'),
  description: z.string().nullable().optional().default(null),
  dueDate: z.string().nullable().optional().default(null),
  deadlineText: z.string().nullable().optional().default(null),
  noticeDays: z.number().int().nonnegative().default(30),
  noticePeriodText: z.string().nullable().optional().default(null),
  responsibleParty: z.string().nullable().optional().default(null),
  category: z.string().default('Deadline'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  confidence: z.number().min(0).max(1).default(0.85),
  clauseNumber: z.string().nullable().optional().default(null),
  pageNumber: z.number().int().positive().nullable().optional().default(null),
  evidence: z.string().min(1, 'Supporting evidence snippet is required'),
  status: z.enum(['UPCOMING', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'EXPIRED', 'NEEDS_REVIEW']).default('UPCOMING'),
  obligationId: z.string().nullable().optional().default(null),
});

/**
 * Zod schema for deadline extraction result.
 */
export const DeadlineExtractionResultSchema = z.object({
  deadlines: z.array(ExtractedDeadlineSchema).default([]),
});

export type ExtractedDeadline = z.infer<typeof ExtractedDeadlineSchema>;
export type DeadlineExtractionResult = z.infer<typeof DeadlineExtractionResultSchema>;

/**
 * Zod schema for individual source evidence item in AI Assistant response (Stage 7).
 */
export const AssistantSourceSchema = z.object({
  type: z.enum(['contract', 'policy', 'obligation', 'deadline', 'conflict']).default('contract'),
  contractId: z.string().nullable().optional().default(null),
  contractTitle: z.string().nullable().optional().default(null),
  title: z.string().min(1, 'Source title is required'),
  pageNumber: z.number().int().nullable().optional().default(null),
  clauseNumber: z.string().nullable().optional().default(null),
  evidence: z.string().min(1, 'Source evidence text is required'),
  policyName: z.string().nullable().optional().default(null),
  policyVersion: z.string().nullable().optional().default(null),
  policyRequirement: z.string().nullable().optional().default(null),
  dueDate: z.string().nullable().optional().default(null),
  responsibleParty: z.string().nullable().optional().default(null),
});

/**
 * Zod schema for AI Contract Assistant response (Stage 7).
 */
export const AssistantResponseSchema = z.object({
  answer: z.string().min(1, 'Assistant answer cannot be empty'),
  confidence: z.number().min(0).max(1).default(0.9),
  sources: z.array(AssistantSourceSchema).default([]),
  needsReview: z.boolean().default(false),
});

export type AssistantSource = z.infer<typeof AssistantSourceSchema>;
export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

