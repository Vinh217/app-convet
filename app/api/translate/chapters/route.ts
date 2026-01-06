import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByStoryId } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const storyId = searchParams.get('storyId');
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '50', 10) || 50;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';

    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'storyId is required' },
        { status: 400 }
      );
    }

    // Base query via getChaptersByStoryId (handles storyId + status + pagination)
    const baseResult = await getChaptersByStoryId(storyId, {
      page,
      limit,
      status,
    });

    let chapters = baseResult.chapters;
    const total = baseResult.total;

    // Simple in-memory search on title or chapterNumber (can be moved to DB later)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      chapters = chapters.filter((ch) => {
        const titleMatch = ch.title?.toLowerCase().includes(q);
        const numberMatch = String(ch.chapterNumber || '').includes(q);
        return titleMatch || numberMatch;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        chapters,
        pagination: {
          page: baseResult.currentPage,
          limit,
          total,
          totalPages: baseResult.totalPages,
          hasMore: baseResult.currentPage < baseResult.totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching paginated chapters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}


