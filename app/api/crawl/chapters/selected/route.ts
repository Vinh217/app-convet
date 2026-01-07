import { NextRequest, NextResponse } from 'next/server';
import { getChapterById, updateChapter } from '@/lib/models';
import { crawlChapter } from '@/lib/crawler';
import { getPresetByUrl } from '@/lib/website-presets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterIds, selectors } = body;

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter IDs array is required' },
        { status: 400 }
      );
    }

    const results = [];
    let preset: ReturnType<typeof getPresetByUrl> | null = null;

    for (const chapterId of chapterIds) {
      try {
        // Get chapter from DB
        const chapter = await getChapterById(chapterId);
        if (!chapter) {
          results.push({
            chapterId,
            status: 'failed',
            error: 'Chapter not found',
          });
          continue;
        }

        // Skip if already has content
        if (chapter.originalContent && chapter.originalContent.trim() !== '') {
          results.push({
            chapterId,
            status: 'skipped',
            message: 'Chapter already has content',
          });
          continue;
        }

        // Get selectors from preset (cache it for same domain)
        let finalSelectors = selectors;
        if (!finalSelectors) {
          if (!preset) {
            preset = getPresetByUrl(chapter.url);
          }
          if (preset) {
            finalSelectors = preset.chapterSelectors;
          } else {
            // Fallback to metruyenchu hardcoded selectors
            // h1 = story title, h2 = chapter title, div.truyen = chapter content
            finalSelectors = {
              titleSelector: 'h2',
              contentSelector: 'div.truyen',
            };
          }
        }

        // Crawl chapter content
        const crawlResult = await crawlChapter(chapter.url, finalSelectors);

        if (!crawlResult.content || crawlResult.content.trim() === '') {
          results.push({
            chapterId,
            status: 'failed',
            error: 'Không tìm thấy nội dung chương',
          });
          continue;
        }

        // Update chapter
        const updateData: {
          originalContent: string;
          status: 'failed' | 'pending' | 'translating' | 'completed';
          title?: string;
        } = {
          originalContent: crawlResult.content,
          status: 'pending',
        };

        // Update title if found
        if (crawlResult.title) {
          updateData.title = crawlResult.title;
        }

        await updateChapter(chapterId, updateData);

        results.push({
          chapterId,
          status: 'success',
          contentLength: crawlResult.content.length,
          title: crawlResult.title || chapter.title,
          chapterNumber: chapter.chapterNumber,
        });

        // Small delay between requests to avoid rate limiting
        if (chapterId !== chapterIds[chapterIds.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({
          chapterId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
      },
    });
  } catch (error) {
    console.error('Error crawling selected chapters:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl selected chapters',
      },
      { status: 500 }
    );
  }
}

