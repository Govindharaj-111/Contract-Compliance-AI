import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { code: 'asc' },
      include: {
        requirements: true,
        _count: {
          select: {
            conflicts: true,
            requirements: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: policies,
      message: 'Policies fetched successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch policies',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, title, category, content, version, isActive } = body;

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Policy title is required.' },
        { status: 400 }
      );
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Policy category is required.' },
        { status: 400 }
      );
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Policy rule content is required.' },
        { status: 400 }
      );
    }

    const policyCode = (code && typeof code === 'string' && code.trim())
      ? code.trim().toUpperCase()
      : `POL-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const policyVersion = (version && typeof version === 'string' && version.trim())
      ? version.trim()
      : '1.0';

    // Create policy and primary requirement in database
    const policy = await prisma.$transaction(async (tx) => {
      const createdPolicy = await tx.policy.create({
        data: {
          code: policyCode,
          title: title.trim(),
          category: category.trim(),
          content: content.trim(),
          version: policyVersion,
          isActive: typeof isActive === 'boolean' ? isActive : true,
        },
      });

      // Also create PolicyRequirement record
      await tx.policyRequirement.create({
        data: {
          policyId: createdPolicy.id,
          requirement: content.trim(),
          category: category.trim(),
          clauseCode: policyCode,
        },
      });

      return createdPolicy;
    });

    return NextResponse.json({
      success: true,
      data: policy,
      message: `Policy ${policy.code} created successfully.`,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'A policy with this code already exists. Please use a unique policy code.',
        },
        { status: 409 }
      );
    }

    console.error('Error creating policy:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to create corporate policy.',
      },
      { status: 500 }
    );
  }
}
