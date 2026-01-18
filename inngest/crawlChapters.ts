import { inngest } from './client';
import { getChapterById, updateChapter } from '@/lib/models';
import { crawlChapter } from '@/lib/crawler';
import { getPresetByUrl } from '@/lib/website-presets';

interface CrawlResult {
  chapterId: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  message?: string;
  contentLength?: number;
  title?: string;
  chapterNumber?: number;
}

// Inngest function xử lý crawl nhiều chapters ở background
export const crawlChaptersFn = inngest.createFunction(
  { 
    id: 'crawl-chapters',
    retries: 3,
  },
  { event: 'chapters/crawl' },
  async ({ event, step }) => {
    const { chapterIds, selectors } = event.data as { 
      chapterIds: string[];
      selectors?: {
        titleSelector: string;
        contentSelector: string;
      };
    };

    if (!chapterIds || chapterIds.length === 0) {
      throw new Error('Chapter IDs array is required');
    }

    const results: CrawlResult[] = [];
    let preset: ReturnType<typeof getPresetByUrl> | null = null;

    // Crawl từng chapter với retry và delay
    for (let i = 0; i < chapterIds.length; i++) {
      const chapterId = chapterIds[i];
      
      const result = await step.run(`crawl-chapter-${i}`, async () => {
        try {
          // Get chapter from DB
          const chapter = await getChapterById(chapterId);
          if (!chapter) {
            return {
              chapterId,
              status: 'failed' as const,
              error: 'Chapter not found',
            };
          }

          // Skip if already has content
          if (chapter.originalContent && chapter.originalContent.trim() !== '') {
            return {
              chapterId,
              status: 'skipped' as const,
              message: 'Chapter already has content',
            };
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
            return {
              chapterId,
              status: 'failed' as const,
              error: 'Không tìm thấy nội dung chương',
            };
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

          return {
            chapterId,
            status: 'success' as const,
            contentLength: crawlResult.content.length,
            title: crawlResult.title || chapter.title,
            chapterNumber: chapter.chapterNumber,
          };
        } catch (error) {
          return {
            chapterId,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      results.push(result);

      // Add delay between chapters to avoid rate limiting (except for last chapter)
      if (i < chapterIds.length - 1) {
        await step.sleep('rate-limit-delay', 1000);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    console.log(`[INNGEST] Crawled ${successCount}/${chapterIds.length} chapters successfully`);

    return {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
      },
    };
  }
);
