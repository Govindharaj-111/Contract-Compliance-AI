import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SeverityLevel } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const severityParam = searchParams.get('severity');
    const statusParam = searchParams.get('status');
    const contractIdParam = searchParams.get('contractId');
    const searchQuery = searchParams.get('search');

    // Build filter query for Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (severityParam && severityParam !== 'ALL') {
      if (severityParam === 'NEEDS_REVIEW') {
        where.status = 'NEEDS_REVIEW';
      } else if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severityParam)) {
        where.severity = severityParam as SeverityLevel;
      }
    }

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam;
    }

    if (contractIdParam) {
      where.contractId = contractIdParam;
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { contractRequirement: { contains: q } },
        { policyRequirement: { contains: q } },
        { contractClause: { contains: q } },
        { policyName: { contains: q } },
        { contractName: { contains: q } },
      ];
    }

    // Fetch conflicts and overall summary counts concurrently
    const [conflicts, allConflicts] = await Promise.all([
      prisma.policyConflict.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: {
              title: true,
              fileName: true,
            },
          },
          policy: {
            select: {
              title: true,
              code: true,
              version: true,
            },
          },
          obligation: {
            select: {
              id: true,
              clauseNumber: true,
              description: true,
            },
          },
        },
      }),
      prisma.policyConflict.findMany({
        select: {
          severity: true,
          status: true,
        },
      }),
    ]);

    // Compute metrics breakdown for Dashboard Cards
    const stats = {
      totalConflicts: allConflicts.length,
      criticalConflicts: allConflicts.filter((c) => c.severity === 'CRITICAL').length,
      highConflicts: allConflicts.filter((c) => c.severity === 'HIGH').length,
      mediumConflicts: allConflicts.filter((c) => c.severity === 'MEDIUM').length,
      lowConflicts: allConflicts.filter((c) => c.severity === 'LOW').length,
      needsReview: allConflicts.filter((c) => c.status === 'NEEDS_REVIEW').length,
    };

    return NextResponse.json({
      success: true,
      data: conflicts,
      stats,
      message: 'Policy conflicts fetched successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/conflicts GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch policy conflicts',
        data: [],
        stats: {
          totalConflicts: 0,
          criticalConflicts: 0,
          highConflicts: 0,
          mediumConflicts: 0,
          lowConflicts: 0,
          needsReview: 0,
        },
      },
      { status: 500 }
    );
  }
}
