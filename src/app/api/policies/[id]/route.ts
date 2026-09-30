import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        requirements: true,
        conflicts: {
          include: {
            contract: {
              select: { title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { conflicts: true, requirements: true },
        },
      },
    });

    if (!policy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: policy,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { code, title, category, content, version, isActive } = body;

    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: {
        code: code ? code.trim().toUpperCase() : existing.code,
        title: title ? title.trim() : existing.title,
        category: category ? category.trim() : existing.category,
        content: content ? content.trim() : existing.content,
        version: version ? version.trim() : existing.version,
        isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Policy updated successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update policy' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.policy.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Policy deleted successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete policy' },
      { status: 500 }
    );
  }
}
