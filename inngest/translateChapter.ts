import { inngest } from './client';
import { getChapterById, getStoryContext, updateStoryContext, updateChapter } from '@/lib/models';
import { translateLongText } from '@/lib/translator';
import { extractContextFromChapter, mergeContexts } from '@/lib/context-extractor';

// Inngest function xử lý dịch 1 chương ở background
export const translateChapterFn = inngest.createFunction(
  { id: 'translate-chapter' },
  { event: 'chapter/translate' },
  async ({ event, step }) => {
    const { chapterId, model } = event.data as { chapterId: string; model?: string };

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
    }

    const chapterStartTime = Date.now();

    await step.run('load-chapter', async () => {
      const chapter = await getChapterById(chapterId);
      if (!chapter || !chapter.originalContent || !chapter.originalContent.trim()) {
        await updateChapter(chapterId, { status: 'failed' });
        throw new Error(`No content found for chapter ${chapterId}`);
      }

      // Cập nhật status thành translating
      await updateChapter(chapterId, { status: 'translating' });

      // Lấy context từ các chương trước
      const existingContext = await getStoryContext(chapter.storyId);

      // Dịch nội dung với context
      const translatedText = await translateLongText(
        chapter.originalContent,
        apiKey,
        model || 'deepseek-chat',
        existingContext,
        chapterId
      );

      // Cập nhật chapter với nội dung đã dịch
      await updateChapter(chapterId, {
        translatedContent: translatedText,
        status: 'completed',
      });

      // Extract context từ chương vừa dịch và cập nhật
      try {
        const extractedContext = await extractContextFromChapter(
          translatedText,
          apiKey,
          model || 'deepseek-chat'
        );

        const mergedContext = existingContext
          ? mergeContexts(
              {
                characters: existingContext.characters || [],
                terms: existingContext.terms || [],
                settings: existingContext.settings || [],
                plotPoints: existingContext.plotPoints || [],
              },
              extractedContext
            )
          : extractedContext;

        await updateStoryContext(chapter.storyId, mergedContext);
      } catch (error) {
        // Không fail toàn bộ job nếu extract context lỗi
        console.error('Error extracting context for chapter', chapterId, error);
      }
    });

    const totalDuration = ((Date.now() - chapterStartTime) / 1000).toFixed(2);
    console.log(`[INNGEST] Chapter ${chapterId} translated in ${totalDuration}s`);

    return { chapterId, duration: totalDuration };
  }
);


