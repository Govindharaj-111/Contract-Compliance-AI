import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch Contract & Pages
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found in database.',
        },
        { status: 404 }
      );
    }

    // 2. Check if contract has extracted text content
    const pagesInput = contract.pages.map((p) => ({
      pageNumber: p.pageNumber,
      textContent: p.textContent,
    }));

    const rawFullText = contract.extractedText || pagesInput.map((p) => p.textContent).join('\n\n');

    if (!rawFullText || !rawFullText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract contains no extracted text content to analyze.',
        },
        { status: 400 }
      );
    }

    // 3. Verify AI Provider API Key Configuration
    if (!aiClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          isConfigured: false,
          error:
            'AI API key is not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in your environment variables (.env file) to perform contract analysis.',
        },
        { status: 400 }
      );
    }

    // 4. Run AI Obligation Extraction
    const extractionResult = await aiClient.extractContractObligations(
      pagesInput.length > 0 ? pagesInput : rawFullText
    );

    const obligationsData = extractionResult.obligations || [];

    // 5. Save Extracted Obligations to PostgreSQL via Prisma
    const updatedContract = await prisma.$transaction(async (tx) => {
      // Remove previous obligations for this contract if re-running analysis
      await tx.obligation.deleteMany({
        where: { contractId: id },
      });

      // Insert new extracted obligations
      for (const ob of obligationsData) {
        const title = ob.description.length > 70
          ? `${ob.description.slice(0, 67)}...`
          : ob.description;

        // Determine severity level based on category / keywords
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
        const catLower = ob.category.toLowerCase();
        if (catLower.includes('data') || catLower.includes('privacy') || catLower.includes('security')) {
          severity = 'HIGH';
        } else if (catLower.includes('sla') || catLower.includes('penalty') || catLower.includes('breach')) {
          severity = 'HIGH';
        } else if (catLower.includes('termination') || catLower.includes('breach')) {
          severity = 'CRITICAL';
        }

        const createdOb = await tx.obligation.create({
          data: {
            contractId: id,
            title,
            description: ob.description,
            category: ob.category || 'Compliance',
            responsibleParty: ob.responsibleParty,
            deadlineText: ob.deadline,
            noticePeriod: ob.noticePeriod,
            slaRequirement: ob.slaRequirement,
            dataHandlingRequirement: ob.dataHandlingRequirement,
            confidence: ob.confidence ?? 0.9,
            status: 'PENDING',
            severity,
            pageNumber: ob.pageNumber,
            clauseNumber: ob.clauseNumber,
            evidenceText: ob.evidence,
          },
        });

        // Store Responsible Party in Party table if present
        if (ob.responsibleParty) {
          await tx.party.create({
            data: {
              contractId: id,
              obligationId: createdOb.id,
              name: ob.responsibleParty,
              role: ob.responsibleParty,
            },
          });
        }
      }

      // Update Contract status to ANALYZED
      return await tx.contract.update({
        where: { id },
        data: { status: 'ANALYZED' },
        include: {
          obligations: true,
          parties: true,
          deadlines: true,
        },
      });
    });

    // Compute Summary Counts
    const obligations = updatedContract.obligations;
    const counts = {
      totalObligations: obligations.length,
      deadlinesCount: obligations.filter((o) => Boolean(o.deadlineText)).length,
      noticePeriodsCount: obligations.filter((o) => Boolean(o.noticePeriod)).length,
      slaRequirementsCount: obligations.filter((o) => Boolean(o.slaRequirement) || o.category.toLowerCase().includes('sla')).length,
      dataHandlingCount: obligations.filter((o) => Boolean(o.dataHandlingRequirement) || o.category.toLowerCase().includes('data')).length,
    };

    return NextResponse.json({
      success: true,
      message: `AI analysis complete. Extracted ${obligations.length} compliance obligations.`,
      data: {
        contractId: id,
        status: updatedContract.status,
        obligations: updatedContract.obligations,
        counts,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Contract AI Analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to complete AI contract obligation analysis.',
      },
      { status: 500 }
    );
  }
}
