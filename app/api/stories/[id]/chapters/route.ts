import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByStoryId } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapters = await getChaptersByStoryId(id);

    return NextResponse.json({ success: true, data: chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

