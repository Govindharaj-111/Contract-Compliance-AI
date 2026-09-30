export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ContractStatus = 'DRAFT' | 'PENDING_ANALYSIS' | 'ANALYZED' | 'COMPLIANCE_REVIEW' | 'ARCHIVED';
export type ObligationStatus = 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'BREACHED' | 'EXPIRED';

export interface AICitation {
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  clauseNumber?: string;
  evidenceText: string;
  relevanceScore?: number;
}

export interface Contract {
  id: string;
  title: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  status: ContractStatus;
  extractedText?: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface Obligation {
  id: string;
  contractId: string;
  title: string;
  description: string;
  category: string;
  responsibleParty?: string | null;
  deadlineText?: string | null;
  noticePeriod?: string | null;
  slaRequirement?: string | null;
  dataHandlingRequirement?: string | null;
  confidence?: number | null;
  status: ObligationStatus;
  severity: SeverityLevel;
  pageNumber?: number | null;
  clauseNumber?: string | null;
  evidenceText?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deadline {
  id: string;
  contractId: string;
  obligationId?: string;
  title: string;
  dueDate: string;
  noticeDays: number;
  isAlertSent: boolean;
  createdAt: string;
  contract?: {
    title: string;
  };
}

export interface PolicyRequirement {
  id: string;
  policyId: string;
  requirement: string;
  category?: string | null;
  clauseCode?: string | null;
  createdAt: string;
}

export interface Policy {
  id: string;
  title: string;
  code: string;
  category: string;
  content: string;
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
  requirements?: PolicyRequirement[];
  conflicts?: PolicyConflict[];
  _count?: {
    requirements?: number;
    conflicts?: number;
  };
}

export interface PolicyConflict {
  id: string;
  contractId: string;
  obligationId?: string | null;
  policyId: string;
  policyRequirementId?: string | null;
  title: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  contractName?: string | null;
  contractClause?: string | null;
  contractRequirement?: string | null;
  policyName?: string | null;
  policyVersion?: string | null;
  policyRequirement?: string | null;
  contractEvidence?: string | null;
  policyEvidence?: string | null;
  pageNumber?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contract?: {
    title: string;
  };
  policy?: {
    title: string;
    code: string;
    version?: string;
  };
}

export interface ConflictDashboardStats {
  totalConflicts: number;
  criticalConflicts: number;
  highConflicts: number;
  mediumConflicts: number;
  lowConflicts: number;
  needsReview: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: AICitation[];
  createdAt: string;
}
