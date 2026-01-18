import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterIds, selectors } = body;

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter IDs array is required' },
        { status: 400 }
      );
    }

    // Trigger Inngest function to crawl chapters in background
    await inngest.send({
      name: 'chapters/crawl',
      data: {
        chapterIds,
        selectors,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Đã bắt đầu crawl ${chapterIds.length} chương trong background`,
        jobId: `crawl-${Date.now()}`,
        totalChapters: chapterIds.length,
      },
    });
  } catch (error) {
    console.error('Error triggering crawl job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger crawl job',
      },
      { status: 500 }
    );
  }
}

