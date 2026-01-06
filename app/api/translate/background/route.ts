import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterIds, model } = body;

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter IDs are required' },
        { status: 400 }
      );
    }

    // Lấy API key từ env
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DEEPSEEK_API_KEY is not set in environment variables' },
        { status: 400 }
      );
    }

    // Gửi event sang Inngest để xử lý background
    await inngest.send(
      chapterIds.map((chapterId: string) => ({
        name: 'chapter/translate',
        data: {
          chapterId,
          model: model || 'deepseek-chat',
        },
      }))
    );

    // Trả về response ngay, dịch chạy ngầm trong Inngest
    const response = NextResponse.json({
      success: true,
      message: `Đã enqueue dịch ${chapterIds.length} chương qua Inngest`,
      data: {
        chapterIds,
        count: chapterIds.length,
      },
    });

    return response;
  } catch (error) {
    console.error('Error starting background translation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start background translation',
      },
      { status: 500 }
    );
  }
}

