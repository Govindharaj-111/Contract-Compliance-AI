import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const deadlines = await prisma.deadline.findMany({
      orderBy: { dueDate: 'asc' },
      include: {
        contract: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: deadlines,
      message: 'Deadlines fetched successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch deadlines',
        data: [],
      },
      { status: 500 }
    );
  }
}
