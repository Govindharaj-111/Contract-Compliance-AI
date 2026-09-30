import { NextResponse } from 'next/server';
import { askAssistant } from '@/lib/ai/assistant';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a question or search query.',
        },
        { status: 400 }
      );
    }

    const result = await askAssistant({ message: message.trim() });

    // Format legacy citation object if sources are available
    let citation = null;
    if (result.sources && result.sources.length > 0) {
      const topSrc = result.sources[0];
      citation = {
        documentId: topSrc.contractId || 'doc-1',
        documentTitle: topSrc.contractTitle || topSrc.title || 'Contract Document',
        pageNumber: topSrc.pageNumber || 1,
        clauseNumber: topSrc.clauseNumber || 'Section 1',
        evidenceText: topSrc.evidence,
      };
    }

    return NextResponse.json({
      success: true,
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      needsReview: result.needsReview,
      citation,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('AI Assistant API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error executing AI contract assistant query.',
      },
      { status: 500 }
    );
  }
}

