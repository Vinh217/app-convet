import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByRange } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storyId = searchParams.get('storyId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');

    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'storyId is required' },
        { status: 400 }
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'from and to parameters are required' },
        { status: 400 }
      );
    }

    const fromNum = parseInt(from, 10);
    const toNum = parseInt(to, 10);

    if (isNaN(fromNum) || isNaN(toNum)) {
      return NextResponse.json(
        { success: false, error: 'from and to must be valid numbers' },
        { status: 400 }
      );
    }

    if (fromNum > toNum) {
      return NextResponse.json(
        { success: false, error: 'from must be less than or equal to to' },
        { status: 400 }
      );
    }

    const result = await getChaptersByRange(storyId, {
      from: fromNum,
      to: toNum,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          translatedContent: ch.translatedContent,
          status: ch.status,
        })),
        count: result.chapters.length,
      },
    });
  } catch (error) {
    console.error('Error fetching chapters by range:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chapters by range',
      },
      { status: 500 }
    );
  }
}

