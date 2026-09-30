import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const severityParam = searchParams.get('severity');
    const contractIdParam = searchParams.get('contractId');
    const timeWindowParam = searchParams.get('timeWindow');
    const searchQuery = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (contractIdParam) {
      where.contractId = contractIdParam;
    }

    if (severityParam && severityParam !== 'ALL') {
      where.severity = severityParam;
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { responsibleParty: { contains: q } },
        { deadlineText: { contains: q } },
        { clauseNumber: { contains: q } },
        { contract: { title: { contains: q } } },
      ];
    }

    const deadlines = await prisma.deadline.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            fileName: true,
          },
        },
        obligation: {
          select: {
            id: true,
            title: true,
            description: true,
            clauseNumber: true,
            pageNumber: true,
          },
        },
      },
    });

    const now = new Date();

    // Auto-rank status based on current date
    const processedDeadlines = deadlines.map((d) => {
      let currentStatus = d.status;

      if (currentStatus !== 'COMPLETED' && currentStatus !== 'EXPIRED') {
        if (!d.dueDate) {
          currentStatus = 'NEEDS_REVIEW';
        } else {
          const due = new Date(d.dueDate);
          const diffMs = due.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

          if (diffDays < 0) {
            currentStatus = 'OVERDUE';
          } else if (diffDays <= 7) {
            currentStatus = 'DUE_SOON';
          } else if (currentStatus !== 'NEEDS_REVIEW') {
            currentStatus = 'UPCOMING';
          }
        }
      }

      return {
        ...d,
        status: currentStatus,
      };
    });

    // Apply status filter if supplied
    let filteredDeadlines = processedDeadlines;
    if (statusParam && statusParam !== 'ALL') {
      filteredDeadlines = filteredDeadlines.filter((d) => d.status === statusParam);
    }

    // Apply timeWindow filter if supplied
    if (timeWindowParam && timeWindowParam !== 'ALL') {
      filteredDeadlines = filteredDeadlines.filter((d) => {
        if (!d.dueDate) return timeWindowParam === 'NEEDS_REVIEW';
        const due = new Date(d.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (timeWindowParam === '7_DAYS') return diffDays >= 0 && diffDays <= 7;
        if (timeWindowParam === '30_DAYS') return diffDays >= 0 && diffDays <= 30;
        if (timeWindowParam === '90_DAYS') return diffDays >= 0 && diffDays <= 90;
        return true;
      });
    }

    // Calculate Summary Stats
    const stats = {
      totalDeadlines: processedDeadlines.length,
      dueToday: processedDeadlines.filter((d) => {
        if (!d.dueDate) return false;
        const due = new Date(d.dueDate);
        return due.toDateString() === now.toDateString();
      }).length,
      dueThisWeek: processedDeadlines.filter((d) => {
        if (!d.dueDate) return false;
        const diffDays = Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length,
      overdue: processedDeadlines.filter((d) => d.status === 'OVERDUE').length,
      completed: processedDeadlines.filter((d) => d.status === 'COMPLETED').length,
      needsReview: processedDeadlines.filter((d) => d.status === 'NEEDS_REVIEW').length,
      dueSoon: processedDeadlines.filter((d) => d.status === 'DUE_SOON').length,
      criticalCount: processedDeadlines.filter((d) => d.severity === 'CRITICAL').length,
    };

    return NextResponse.json({
      success: true,
      data: filteredDeadlines,
      stats,
      message: 'Deadlines fetched and evaluated successfully.',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/deadlines GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch contract deadlines',
        data: [],
        stats: {
          totalDeadlines: 0,
          dueToday: 0,
          dueThisWeek: 0,
          overdue: 0,
          completed: 0,
          needsReview: 0,
          dueSoon: 0,
          criticalCount: 0,
        },
      },
      { status: 500 }
    );
  }
}
