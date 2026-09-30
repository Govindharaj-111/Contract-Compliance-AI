import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deadline = await prisma.deadline.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            fileName: true,
            mimeType: true,
            status: true,
            uploadedAt: true,
          },
        },
        obligation: true,
      },
    });

    if (!deadline) {
      return NextResponse.json(
        { success: false, error: 'Deadline record not found in database' },
        { status: 404 }
      );
    }

    const now = new Date();
    let currentStatus = deadline.status;
    if (currentStatus !== 'COMPLETED' && currentStatus !== 'EXPIRED') {
      if (!deadline.dueDate) {
        currentStatus = 'NEEDS_REVIEW';
      } else {
        const due = new Date(deadline.dueDate);
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
        if (diffDays < 0) {
          currentStatus = 'OVERDUE';
        } else if (diffDays <= 7) {
          currentStatus = 'DUE_SOON';
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...deadline,
        status: currentStatus,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch deadline details' },
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
    const { status, severity, dueDate, responsibleParty, isAlertSent, noticeDays } = body;

    const existing = await prisma.deadline.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Deadline record not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (severity) updateData.severity = severity;
    if (responsibleParty !== undefined) updateData.responsibleParty = responsibleParty;
    if (typeof isAlertSent === 'boolean') updateData.isAlertSent = isAlertSent;
    if (typeof noticeDays === 'number') updateData.noticeDays = noticeDays;

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: updateData,
      include: {
        contract: {
          select: { title: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Deadline status updated to ${updated.status}.`,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update deadline status' },
      { status: 500 }
    );
  }
}
