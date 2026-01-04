import { NextRequest, NextResponse } from 'next/server';
import { getStoryById, updateStory } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = await getStoryById(id);

    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Story not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: story });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await updateStory(id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

