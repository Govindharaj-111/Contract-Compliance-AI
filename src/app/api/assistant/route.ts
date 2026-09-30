import { NextResponse } from 'next/server';
import { askAssistant } from '@/lib/ai/assistant';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;
    const conversationId = body?.conversationId;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid, non-empty question or message.',
        },
        { status: 400 }
      );
    }

    // Call Stage 7 Assistant Engine
    const result = await askAssistant({
      message: message.trim(),
      conversationId: conversationId && typeof conversationId === 'string' ? conversationId : undefined,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      needsReview: result.needsReview,
      conversationId: result.conversationId,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/assistant error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to process contract assistant query.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    let conversation = null;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } else {
      // Get most recent conversation
      conversation = await prisma.conversation.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    if (!conversation) {
      return NextResponse.json({
        success: true,
        conversationId: null,
        messages: [],
      });
    }

    const formattedMessages = conversation.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      confidence: m.confidence,
      needsReview: m.needsReview,
      sources: m.sourcesJson ? JSON.parse(m.sourcesJson) : [],
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      title: conversation.title,
      messages: formattedMessages,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/assistant GET error:', error);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve assistant conversation history.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      await prisma.conversation.delete({
        where: { id: conversationId },
      }).catch(() => null);
    } else {
      // Delete all conversations
      await prisma.conversation.deleteMany();
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared successfully.',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('API /api/assistant DELETE error:', error);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to clear conversation history.' },
      { status: 500 }
    );
  }
}
