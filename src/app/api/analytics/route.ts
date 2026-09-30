import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateContractRisk,
  calculateVendorRating,
  ContractRiskReport,
  VendorComplianceRating,
  PortfolioAnalyticsSummary,
  RiskLevel,
} from '@/lib/ai/risk-scoring';

export async function GET() {
  try {
    const [contracts, obligations, deadlines, conflicts, parties] = await Promise.all([
      prisma.contract.findMany({
        include: {
          conflicts: { select: { severity: true, status: true } },
          deadlines: { select: { status: true, severity: true, dueDate: true } },
          obligations: { select: { category: true, severity: true, status: true } },
        },
      }),
      prisma.obligation.findMany({ select: { category: true, responsibleParty: true, status: true } }),
      prisma.deadline.findMany({ select: { status: true, responsibleParty: true } }),
      prisma.policyConflict.findMany({ select: { severity: true, status: true } }),
      prisma.party.findMany({ select: { name: true, role: true, contractId: true } }),
    ]);

    // 1. Calculate Risk Scores for each contract
    const rankedContracts: ContractRiskReport[] = contracts.map((c) =>
      calculateContractRisk({
        contractId: c.id,
        contractTitle: c.title,
        conflicts: c.conflicts,
        deadlines: c.deadlines,
        obligations: c.obligations,
      })
    );

    // Sort contracts by risk score descending
    rankedContracts.sort((a, b) => b.riskScore - a.riskScore);

    // 2. Aggregate Vendor Ratings
    const vendorMap = new Map<
      string,
      {
        name: string;
        role: string;
        contractIds: Set<string>;
        obligations: Array<{ status: string }>;
        deadlines: Array<{ status: string }>;
        conflicts: Array<{ severity: string }>;
      }
    >();

    // Seed vendors from Parties table
    for (const p of parties) {
      if (!p.name) continue;
      const key = p.name.trim().toLowerCase();
      if (!vendorMap.has(key)) {
        vendorMap.set(key, {
          name: p.name.trim(),
          role: p.role || 'Vendor',
          contractIds: new Set([p.contractId]),
          obligations: [],
          deadlines: [],
          conflicts: [],
        });
      } else {
        vendorMap.get(key)!.contractIds.add(p.contractId);
      }
    }

    // Associate obligations with vendor name if responsibleParty is specified
    for (const o of obligations) {
      if (o.responsibleParty) {
        const key = o.responsibleParty.trim().toLowerCase();
        if (!vendorMap.has(key)) {
          vendorMap.set(key, {
            name: o.responsibleParty.trim(),
            role: 'Supplier',
            contractIds: new Set(),
            obligations: [{ status: o.status }],
            deadlines: [],
            conflicts: [],
          });
        } else {
          vendorMap.get(key)!.obligations.push({ status: o.status });
        }
      }
    }

    // Associate deadlines with vendor
    for (const d of deadlines) {
      if (d.responsibleParty) {
        const key = d.responsibleParty.trim().toLowerCase();
        if (vendorMap.has(key)) {
          vendorMap.get(key)!.deadlines.push({ status: d.status });
        }
      }
    }

    const vendorRatings: VendorComplianceRating[] = Array.from(vendorMap.values()).map((v) =>
      calculateVendorRating({
        vendorName: v.name,
        role: v.role,
        contractsCount: Math.max(v.contractIds.size, 1),
        obligations: v.obligations,
        deadlines: v.deadlines,
        conflicts: v.conflicts,
      })
    );

    // Sort vendors by risk score descending
    vendorRatings.sort((a, b) => b.riskScore - a.riskScore);

    // 3. Category Breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const o of obligations) {
      const cat = o.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    // 4. Portfolio Summary
    const totalRiskScoreSum = rankedContracts.reduce((acc, c) => acc + c.riskScore, 0);
    const avgRiskScore = contracts.length > 0 ? Math.round(totalRiskScoreSum / contracts.length) : 0;

    let portfolioRiskLevel: RiskLevel = 'LOW';
    if (avgRiskScore >= 75) portfolioRiskLevel = 'CRITICAL';
    else if (avgRiskScore >= 50) portfolioRiskLevel = 'HIGH';
    else if (avgRiskScore >= 25) portfolioRiskLevel = 'MEDIUM';

    const highRiskContractsCount = rankedContracts.filter(
      (c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'
    ).length;

    const criticalConflictsCount = conflicts.filter(
      (c) => (c.severity || '').toUpperCase() === 'CRITICAL'
    ).length;

    const overdueDeadlinesCount = deadlines.filter(
      (d) => (d.status || '').toUpperCase() === 'OVERDUE'
    ).length;

    const summary: PortfolioAnalyticsSummary = {
      totalContracts: contracts.length,
      averagePortfolioRiskScore: avgRiskScore,
      portfolioRiskLevel,
      highRiskContractsCount,
      criticalConflictsCount,
      overdueDeadlinesCount,
      activeVendorsCount: vendorRatings.length,
      topVendors: vendorRatings,
      rankedContracts,
      categoryBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/analytics error:', error);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to calculate portfolio compliance analytics.' },
      { status: 500 }
    );
  }
}
