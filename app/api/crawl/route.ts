import { crawlChapter, crawlStoryList } from '@/lib/crawler';
import { createChapter, updateStory } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, url, selectors, mode } = body;

    if (!storyId || !url || !selectors) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (mode === 'single') {
      // Crawl một chương đơn lẻ
      const result = await crawlChapter(url, selectors);
      
      const chapterId = await createChapter({
        storyId,
        chapterNumber: 0, // Sẽ cần cập nhật sau
        title: result.title || 'Untitled',
        originalContent: result.content,
        url,
        status: 'pending',
      });

      return NextResponse.json({
        success: true,
        data: {
          chapterId: chapterId.toString(),
          title: result.title,
          content: result.content,
          nextUrl: result.nextUrl,
        },
      });
    } else if (mode === 'list') {
      // Crawl danh sách chương
      const chapters = await crawlStoryList(url, selectors);
      
      const createdChapters = [];
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterId = await createChapter({
          storyId,
          chapterNumber: i + 1,
          title: chapter.title,
          originalContent: '', // Sẽ crawl sau
          url: chapter.url,
          status: 'pending',
        });
        createdChapters.push({ id: chapterId.toString(), ...chapter });
      }

      // Cập nhật số chương đã crawl
      await updateStory(storyId, {
        totalChapters: chapters.length,
        crawledChapters: chapters.length,
      });

      return NextResponse.json({
        success: true,
        data: {
          chapters: createdChapters,
          total: chapters.length,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Use "single" or "list"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error crawling:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl',
      },
      { status: 500 }
    );
  }
}

