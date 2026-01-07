import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByStoryId, getChaptersByRange, getChaptersByNumbers, getChaptersFrom } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    
    // Check for smart search patterns
    const rangeMatch = search?.match(/^(\d+)\s*-\s*(\d+)$/);
    const listMatch = search?.match(/^(\d+(?:\s*,\s*\d+)+)$/);
    const fromMatch = search?.match(/^(\d+)\s*\+$/);
    
    let result;
    
    if (rangeMatch) {
      // Range search
      const from = parseInt(rangeMatch[1], 10);
      const to = parseInt(rangeMatch[2], 10);
      const rangeResult = await getChaptersByRange(id, { from, to, status });
      result = {
        chapters: rangeResult.chapters,
        total: rangeResult.count,
        totalPages: 1,
        currentPage: 1,
      };
    } else if (listMatch) {
      // List search
      const numbers = search?.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0) || [];
      const listResult = await getChaptersByNumbers(id, { numbers, status });
      result = {
        chapters: listResult.chapters,
        total: listResult.count,
        totalPages: 1,
        currentPage: 1,
      };
    } else if (fromMatch) {
      // From onwards search
      const from = parseInt(fromMatch[1], 10);
      const fromResult = await getChaptersFrom(id, { from, status });
      result = {
        chapters: fromResult.chapters,
        total: fromResult.count,
        totalPages: 1,
        currentPage: 1,
      };
    } else {
      // Normal paginated search
      result = await getChaptersByStoryId(id, { page, limit, status, search });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        chapters: result.chapters,
        total: result.total,
        totalPages: result.totalPages || 1,
        currentPage: result.currentPage || 1,
      }
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

