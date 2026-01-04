import { NextRequest, NextResponse } from 'next/server';
import { getChapterByNumber } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string; chapterNumber: string }> }
) {
  try {
    const { storyId, chapterNumber } = await params;
    const chapter = await getChapterByNumber(storyId, parseInt(chapterNumber, 10));

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: chapter });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

