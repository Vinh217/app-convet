import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByStoryId } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapters = await getChaptersByStoryId(id);
    
    // Chỉ lấy các chương đã dịch, chỉ trả về thông tin cần thiết
    const translatedChapters = chapters
      .filter(ch => ch.translatedContent && ch.status === 'completed')
      .map(ch => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title,
      }))
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    return NextResponse.json({ success: true, data: translatedChapters });
  } catch (error) {
    console.error('Error fetching translated chapters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch translated chapters' },
      { status: 500 }
    );
  }
}

