import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: {
          select: {
            obligations: true,
            deadlines: true,
            conflicts: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: contracts,
      message: 'Contracts fetched successfully',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Database connection error or uninitialized tables',
        data: [],
      },
      { status: 500 }
    );
  }
}
