import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByStoryId } from '@/lib/models';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { updateChapter } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, limit = 10 } = body;

    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Lấy các chương chưa có nội dung
    const chapters = await getChaptersByStoryId(storyId);
    const pendingChapters = chapters.chapters
      .filter(ch => !ch.originalContent || ch.originalContent.trim() === '')
      .slice(0, limit);

    if (pendingChapters.length === 0) {
      return NextResponse.json({
        success: true,
        data: { message: 'Không còn chương nào cần crawl', count: 0 },
      });
    }

    const results = [];

    for (const chapter of pendingChapters) {
      try {
        // Crawl nội dung
        const response = await axios.get(chapter.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 30000,
        });

        const $ = cheerio.load(response.data);

        const bookTitle = $('h1.current-book').text().trim();
        const chapterInfo = $('h2.current-chapter').text().trim();
        const content = $('div.truyen')
          .map((_, el) => $(el).text().trim())
          .get()
          .join('\n\n')
          .trim();

        if (content) {
          await updateChapter(chapter._id!.toString(), {
            title: `${bookTitle} - ${chapterInfo}`,
            originalContent: content,
            status: 'pending',
          });

          results.push({
            chapterId: chapter._id!.toString(),
            status: 'success',
          });
        } else {
          results.push({
            chapterId: chapter._id!.toString(),
            status: 'failed',
            error: 'Không tìm thấy nội dung',
          });
        }

        // Delay để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          chapterId: chapter._id!.toString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
      },
    });
  } catch (error) {
    console.error('Error in batch crawl:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch crawl',
      },
      { status: 500 }
    );
  }
}

