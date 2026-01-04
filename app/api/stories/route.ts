import { NextRequest, NextResponse } from 'next/server';
import { getStories, createStory } from '@/lib/models';

export async function GET() {
  try {
    const stories = await getStories();
    return NextResponse.json({ success: true, data: stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, description, author } = body;

    if (!title || !url) {
      return NextResponse.json(
        { success: false, error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    const storyId = await createStory({
      title,
      url,
      description,
      author,
      status: 'crawling',
    });

    return NextResponse.json({ success: true, data: { id: storyId.toString() } });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create story' },
      { status: 500 }
    );
  }
}

