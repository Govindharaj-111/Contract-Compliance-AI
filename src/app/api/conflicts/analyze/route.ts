import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai/client';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { contractId } = body;

    // 1. Check AI Provider API Key Configuration
    if (!aiClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          isConfigured: false,
          error:
            'AI API key is not configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in environment variables (.env file) to perform automated conflict detection.',
        },
        { status: 400 }
      );
    }

    // 2. Fetch Active Corporate Policies
    const activePolicies = await prisma.policy.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    if (!activePolicies || activePolicies.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No active corporate policies found. Please create or enable policies in the Policies section first before running conflict detection.',
        },
        { status: 400 }
      );
    }

    // 3. Fetch Contracts & Extracted Obligations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contractWhere: any = {};
    if (contractId) {
      contractWhere.id = contractId;
    }

    const contracts = await prisma.contract.findMany({
      where: contractWhere,
      include: {
        obligations: true,
      },
    });

    if (!contracts || contracts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: contractId
            ? 'Specified contract was not found.'
            : 'No contracts found in database for policy compliance review.',
        },
        { status: 404 }
      );
    }

    let totalConflictsCreated = 0;
    const policyInputList = activePolicies.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      category: p.category,
      content: p.content,
      version: p.version,
    }));

    // 4. Process Each Contract with AI Conflict Detection Engine
    for (const contract of contracts) {
      const obligations = contract.obligations;
      if (!obligations || obligations.length === 0) {
        continue;
      }

      const obligationInputs = obligations.map((ob) => ({
        id: ob.id,
        title: ob.title,
        description: ob.description,
        clauseNumber: ob.clauseNumber,
        pageNumber: ob.pageNumber,
        evidenceText: ob.evidenceText || ob.description,
        category: ob.category,
      }));

      // Call AI Engine
      const result = await aiClient.detectPolicyConflicts(
        contract.title,
        obligationInputs,
        policyInputList
      );

      const conflicts = result.conflicts || [];

      // Save to Prisma inside Transaction
      await prisma.$transaction(async (tx) => {
        // Clear previous conflicts for this contract
        await tx.policyConflict.deleteMany({
          where: { contractId: contract.id },
        });

        for (const conf of conflicts) {
          // Find matching policy ID or fallback to first policy
          const matchingPolicy =
            activePolicies.find((p) => p.id === conf.policyId) ||
            activePolicies.find((p) => p.code === conf.policyCode) ||
            activePolicies[0];

          await tx.policyConflict.create({
            data: {
              contractId: contract.id,
              obligationId: conf.obligationId || null,
              policyId: matchingPolicy.id,
              title: conf.title || 'Policy Conflict',
              description: conf.explanation,
              severity: conf.severity,
              confidence: conf.confidence ?? 0.85,
              contractName: contract.title,
              contractClause: conf.contractClause || null,
              contractRequirement: conf.contractRequirement,
              policyName: matchingPolicy.title,
              policyVersion: matchingPolicy.version || '1.0',
              policyRequirement: conf.policyRequirement,
              contractEvidence: conf.contractEvidence,
              policyEvidence: conf.policyEvidence || matchingPolicy.content,
              pageNumber: conf.pageNumber || null,
              status: conf.status || 'UNRESOLVED',
            },
          });
          totalConflictsCreated++;
        }

        // Update contract status
        await tx.contract.update({
          where: { id: contract.id },
          data: { status: 'COMPLIANCE_REVIEW' },
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: `Policy conflict detection completed across ${contracts.length} contract(s). Identified ${totalConflictsCreated} policy conflict(s).`,
      data: {
        contractsProcessed: contracts.length,
        totalConflictsCreated,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error running policy conflict detection API:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to complete policy conflict detection.',
      },
      { status: 500 }
    );
  }
}
