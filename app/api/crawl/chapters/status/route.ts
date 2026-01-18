import { NextRequest, NextResponse } from 'next/server';
import { getChapterById } from '@/lib/models';

// API endpoint để check status của các chapters đang được crawl
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterIds } = body;

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter IDs array is required' },
        { status: 400 }
      );
    }

    const statuses = [];
    
    for (const chapterId of chapterIds) {
      const chapter = await getChapterById(chapterId);
      if (chapter) {
        statuses.push({
          chapterId,
          chapterNumber: chapter.chapterNumber,
          status: chapter.status,
          hasContent: !!(chapter.originalContent && chapter.originalContent.trim()),
        });
      }
    }

    const crawledCount = statuses.filter(s => s.hasContent).length;
    const pendingCount = statuses.filter(s => !s.hasContent).length;

    return NextResponse.json({
      success: true,
      data: {
        statuses,
        summary: {
          total: statuses.length,
          crawled: crawledCount,
          pending: pendingCount,
        },
      },
    });
  } catch (error) {
    console.error('Error checking crawl status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check crawl status',
      },
      { status: 500 }
    );
  }
}
