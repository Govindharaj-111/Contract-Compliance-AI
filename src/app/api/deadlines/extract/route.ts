import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { contractId } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (contractId) {
      where.id = contractId;
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        pages: { orderBy: { pageNumber: 'asc' } },
        obligations: true,
      },
    });

    if (!contracts || contracts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: contractId ? 'Specified contract was not found.' : 'No contracts available in database for deadline extraction.',
        },
        { status: 404 }
      );
    }

    let totalDeadlinesCreated = 0;
    const now = new Date();

    for (const contract of contracts) {
      const pagesInput = contract.pages.map((p) => ({
        pageNumber: p.pageNumber,
        textContent: p.textContent,
      }));

      const textSource = pagesInput.length > 0 ? pagesInput : contract.extractedText || '';
      if (!textSource) continue;

      // Call AI Extraction Engine
      const extractionResult = await aiClient.extractContractDeadlines(textSource);
      const extractedDeadlines = extractionResult.deadlines || [];

      await prisma.$transaction(async (tx) => {
        // Clear previous deadlines for this contract to prevent duplicates
        await tx.deadline.deleteMany({
          where: { contractId: contract.id },
        });

        for (const item of extractedDeadlines) {
          let parsedDueDate: Date | null = null;
          if (item.dueDate) {
            const d = new Date(item.dueDate);
            if (!isNaN(d.getTime())) {
              parsedDueDate = d;
            }
          }

          let finalStatus = item.status || 'UPCOMING';
          if (!parsedDueDate) {
            finalStatus = 'NEEDS_REVIEW';
          } else if (finalStatus !== 'COMPLETED' && finalStatus !== 'EXPIRED') {
            const diffDays = Math.ceil((parsedDueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (diffDays < 0) {
              finalStatus = 'OVERDUE';
            } else if (diffDays <= 7) {
              finalStatus = 'DUE_SOON';
            }
          }

          // Match corresponding obligation if clauseNumber or title matches
          let matchedObId: string | null = item.obligationId || null;
          if (!matchedObId && contract.obligations.length > 0) {
            const foundOb = contract.obligations.find(
              (o) =>
                (item.clauseNumber && o.clauseNumber === item.clauseNumber) ||
                (item.title && o.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 20)))
            );
            if (foundOb) {
              matchedObId = foundOb.id;
            }
          }

          const respParty = item.responsibleParty && item.responsibleParty !== 'NEEDS_REVIEW'
            ? item.responsibleParty
            : 'NEEDS_REVIEW';

          await tx.deadline.create({
            data: {
              contractId: contract.id,
              obligationId: matchedObId,
              title: item.title,
              description: item.description || item.evidence,
              dueDate: parsedDueDate,
              deadlineText: item.deadlineText || item.title,
              noticeDays: item.noticeDays ?? 30,
              noticePeriodText: item.noticePeriodText || (item.noticeDays ? `${item.noticeDays} days notice` : null),
              responsibleParty: respParty,
              status: finalStatus,
              severity: item.severity || 'MEDIUM',
              confidence: item.confidence ?? 0.85,
              pageNumber: item.pageNumber || 1,
              clauseNumber: item.clauseNumber,
              evidenceText: item.evidence,
            },
          });

          totalDeadlinesCreated++;

          // Register party if specified
          if (respParty && respParty !== 'NEEDS_REVIEW') {
            const existingParty = await tx.party.findFirst({
              where: { contractId: contract.id, name: respParty },
            });

            if (!existingParty) {
              await tx.party.create({
                data: {
                  contractId: contract.id,
                  name: respParty,
                  role: respParty,
                },
              });
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Extracted ${totalDeadlinesCreated} deadline(s) across ${contracts.length} contract(s).`,
      data: {
        contractsProcessed: contracts.length,
        totalDeadlinesCreated,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/deadlines/extract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to extract contract deadlines.',
      },
      { status: 500 }
    );
  }
}
