import { NextRequest, NextResponse } from 'next/server';
import { getChaptersByStoryId } from '@/lib/models';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { updateChapter } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, batchSize = 10, delay = 1000 } = body;

    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Lấy tất cả các chương chưa có nội dung
    const chapters = await getChaptersByStoryId(storyId);
    const pendingChapters = chapters.chapters.filter(
      ch => !ch.originalContent || ch.originalContent.trim() === ''
    );

    if (pendingChapters.length === 0) {
      return NextResponse.json({
        success: true,
        data: { 
          message: 'Không còn chương nào cần crawl', 
          total: 0,
          processed: 0,
          results: []
        },
      });
    }

    const results: Array<{ chapterId: string; status: string; error?: string }> = [];
    const totalChapters = pendingChapters.length;

    // Xử lý theo batch
    for (let i = 0; i < pendingChapters.length; i += batchSize) {
      const batch = pendingChapters.slice(i, i + batchSize);
      
      // Xử lý batch này song song
      const batchPromises = batch.map(async (chapter) => {
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

            return {
              chapterId: chapter._id!.toString(),
              status: 'success',
            };
          } else {
            return {
              chapterId: chapter._id!.toString(),
              status: 'failed',
              error: 'Không tìm thấy nội dung',
            };
          }
        } catch (error) {
          return {
            chapterId: chapter._id!.toString(),
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      // Đợi batch này hoàn thành
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay giữa các batch để tránh rate limit (trừ batch cuối)
      if (i + batchSize < pendingChapters.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;

    return NextResponse.json({
      success: true,
      data: {
        total: totalChapters,
        processed: results.length,
        success: successCount,
        failed: results.length - successCount,
        results,
      },
    });
  } catch (error) {
    console.error('Error in crawl all chapters:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl all chapters',
      },
      { status: 500 }
    );
  }
}

