export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ComplianceGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface RiskFactor {
  category: string;
  impactPoints: number;
  description: string;
}

export interface ContractRiskReport {
  contractId: string;
  contractTitle: string;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  criticalConflictsCount: number;
  highConflictsCount: number;
  overdueDeadlinesCount: number;
  dueSoonDeadlinesCount: number;
  totalObligationsCount: number;
  factors: RiskFactor[];
}

export interface VendorComplianceRating {
  vendorName: string;
  role: string;
  contractsCount: number;
  totalObligations: number;
  fulfilledObligations: number;
  overdueDeadlines: number;
  activeConflicts: number;
  compliancePercentage: number; // 0 to 100%
  grade: ComplianceGrade;
  riskLevel: RiskLevel;
  riskScore: number;
}

export interface PortfolioAnalyticsSummary {
  totalContracts: number;
  averagePortfolioRiskScore: number;
  portfolioRiskLevel: RiskLevel;
  highRiskContractsCount: number;
  criticalConflictsCount: number;
  overdueDeadlinesCount: number;
  activeVendorsCount: number;
  topVendors: VendorComplianceRating[];
  rankedContracts: ContractRiskReport[];
  categoryBreakdown: Record<string, number>;
}

/**
 * Calculate risk score and level for a single contract based on DB entities.
 */
export function calculateContractRisk(input: {
  contractId: string;
  contractTitle: string;
  conflicts: Array<{ severity: string; status: string }>;
  deadlines: Array<{ status: string; severity: string; dueDate?: Date | string | null }>;
  obligations: Array<{ category: string; severity: string; status: string }>;
}): ContractRiskReport {
  const factors: RiskFactor[] = [];
  let score = 0;

  let criticalConflictsCount = 0;
  let highConflictsCount = 0;
  let overdueDeadlinesCount = 0;
  let dueSoonDeadlinesCount = 0;

  // 1. Conflict Risk Impact
  for (const c of input.conflicts) {
    const sev = (c.severity || 'HIGH').toUpperCase();
    if (sev === 'CRITICAL') {
      criticalConflictsCount++;
      score += 25;
      factors.push({ category: 'Policy Conflict', impactPoints: 25, description: 'Critical policy violation detected' });
    } else if (sev === 'HIGH') {
      highConflictsCount++;
      score += 15;
      factors.push({ category: 'Policy Conflict', impactPoints: 15, description: 'High-severity policy mismatch' });
    } else if (sev === 'MEDIUM') {
      score += 8;
      factors.push({ category: 'Policy Conflict', impactPoints: 8, description: 'Medium policy mismatch' });
    } else {
      score += 3;
    }
  }

  // 2. Deadline Overdue & Due Soon Impact
  for (const d of input.deadlines) {
    const status = (d.status || 'UPCOMING').toUpperCase();
    if (status === 'OVERDUE') {
      overdueDeadlinesCount++;
      score += 20;
      factors.push({ category: 'Overdue Deadline', impactPoints: 20, description: 'Contract deadline is overdue' });
    } else if (status === 'DUE_SOON') {
      dueSoonDeadlinesCount++;
      score += 10;
      factors.push({ category: 'Due Soon Deadline', impactPoints: 10, description: 'Deadline due within 30 days' });
    } else if (status === 'NEEDS_REVIEW') {
      score += 5;
      factors.push({ category: 'Unclear Deadline', impactPoints: 5, description: 'Deadline requires review' });
    }
  }

  // 3. High Severity Obligations Impact
  for (const o of input.obligations) {
    if (o.status === 'BREACHED') {
      score += 25;
      factors.push({ category: 'Breached Duty', impactPoints: 25, description: 'Obligation breached' });
    } else if (o.severity === 'CRITICAL' || o.severity === 'HIGH') {
      score += 5;
    }
  }

  // Cap risk score between 0 and 100
  const finalScore = Math.min(Math.max(score, 0), 100);

  let riskLevel: RiskLevel = 'LOW';
  if (finalScore >= 75) riskLevel = 'CRITICAL';
  else if (finalScore >= 50) riskLevel = 'HIGH';
  else if (finalScore >= 25) riskLevel = 'MEDIUM';

  return {
    contractId: input.contractId,
    contractTitle: input.contractTitle,
    riskScore: finalScore,
    riskLevel,
    criticalConflictsCount,
    highConflictsCount,
    overdueDeadlinesCount,
    dueSoonDeadlinesCount,
    totalObligationsCount: input.obligations.length,
    factors: factors.slice(0, 5),
  };
}

/**
 * Calculate vendor compliance rating and grade.
 */
export function calculateVendorRating(input: {
  vendorName: string;
  role: string;
  contractsCount: number;
  obligations: Array<{ status: string }>;
  deadlines: Array<{ status: string }>;
  conflicts: Array<{ severity: string }>;
}): VendorComplianceRating {
  const totalObs = input.obligations.length;
  const overdueCount = input.deadlines.filter((d) => (d.status || '').toUpperCase() === 'OVERDUE').length;
  const activeConflictsCount = input.conflicts.length;

  let compliancePoints = 100;
  compliancePoints -= overdueCount * 15;
  compliancePoints -= activeConflictsCount * 10;

  const breaches = input.obligations.filter((o) => o.status === 'BREACHED').length;
  compliancePoints -= breaches * 25;

  const compliancePercentage = Math.min(Math.max(compliancePoints, 0), 100);

  let grade: ComplianceGrade = 'A+';
  if (compliancePercentage >= 95) grade = 'A+';
  else if (compliancePercentage >= 85) grade = 'A';
  else if (compliancePercentage >= 70) grade = 'B';
  else if (compliancePercentage >= 55) grade = 'C';
  else if (compliancePercentage >= 40) grade = 'D';
  else grade = 'F';

  const riskScore = Math.round(100 - compliancePercentage);
  let riskLevel: RiskLevel = 'LOW';
  if (riskScore >= 75) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 25) riskLevel = 'MEDIUM';

  return {
    vendorName: input.vendorName,
    role: input.role,
    contractsCount: input.contractsCount,
    totalObligations: totalObs,
    fulfilledObligations: Math.max(totalObs - breaches, 0),
    overdueDeadlines: overdueCount,
    activeConflicts: activeConflictsCount,
    compliancePercentage,
    grade,
    riskLevel,
    riskScore,
  };
}
