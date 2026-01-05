import { NextRequest, NextResponse } from 'next/server';
import { getChapterById } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const chapter = await getChapterById(chapterId);

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        chapterId,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        status: chapter.status,
        logs: chapter.translationLogs || [],
        totalLogs: chapter.translationLogs?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching chapter logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch logs',
      },
      { status: 500 }
    );
  }
}

