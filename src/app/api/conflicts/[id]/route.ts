import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conflict = await prisma.policyConflict.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            fileName: true,
            status: true,
          },
        },
        policy: {
          select: {
            id: true,
            title: true,
            code: true,
            category: true,
            version: true,
            content: true,
          },
        },
        obligation: true,
        policyRequirementRef: true,
      },
    });

    if (!conflict) {
      return NextResponse.json(
        { success: false, error: 'Policy conflict record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conflict,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch conflict detail' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, severity } = body;

    const existing = await prisma.policyConflict.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Policy conflict record not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.policyConflict.update({
      where: { id },
      data: {
        status: status || existing.status,
        severity: severity || existing.severity,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Conflict status updated to ${updated.status}.`,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update conflict status' },
      { status: 500 }
    );
  }
}
