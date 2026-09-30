import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const obligations = await prisma.obligation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          select: {
            title: true,
            fileName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: obligations,
      message: 'Obligations fetched successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to fetch obligations',
        data: [],
      },
      { status: 500 }
    );
  }
}
