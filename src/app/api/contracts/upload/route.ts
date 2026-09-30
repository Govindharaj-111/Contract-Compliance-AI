import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DocumentProcessor } from '@/lib/document/processor';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const titleInput = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No contract file provided in upload request.',
        },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileSize = file.size;
    const mimeType = file.type || 'application/octet-stream';
    const contractTitle = titleInput?.trim() || fileName.replace(/\.[^/.]+$/, '');

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run Document Processor
    const result = await DocumentProcessor.processFile(fileName, fileSize, mimeType, buffer);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to extract text from document.',
        },
        { status: 422 }
      );
    }

    // Save Contract and Pages to PostgreSQL via Prisma
    const contract = await prisma.$transaction(async (tx) => {
      const createdContract = await tx.contract.create({
        data: {
          title: contractTitle,
          fileName: fileName,
          fileSize: fileSize,
          mimeType: mimeType,
          pageCount: result.pageCount,
          status: 'PENDING_ANALYSIS',
          extractedText: result.fullText,
          pages: {
            create: result.pages.map((p) => ({
              pageNumber: p.pageNumber,
              sectionTitle: p.sectionTitle || `Page ${p.pageNumber}`,
              textContent: p.textContent,
            })),
          },
        },
        include: {
          pages: {
            orderBy: { pageNumber: 'asc' },
            select: {
              id: true,
              pageNumber: true,
              sectionTitle: true,
              textContent: true,
            },
          },
        },
      });

      return createdContract;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Contract ingested and text extracted successfully.',
        data: {
          id: contract.id,
          title: contract.title,
          fileName: contract.fileName,
          fileSize: contract.fileSize,
          mimeType: contract.mimeType,
          pageCount: contract.pageCount,
          status: contract.status,
          uploadedAt: contract.uploadedAt,
          extractedTextPreview: result.fullText.slice(0, 500) + '...',
          pages: contract.pages,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Contract upload endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Server error occurred while saving contract to database.',
      },
      { status: 500 }
    );
  }
}
