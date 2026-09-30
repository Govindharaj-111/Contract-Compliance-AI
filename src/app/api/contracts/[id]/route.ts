import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
        obligations: true,
        deadlines: true,
        conflicts: true,
        parties: true,
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

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch contract details.',
      },
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

    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully.',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to delete contract.',
      },
      { status: 500 }
    );
  }
}
