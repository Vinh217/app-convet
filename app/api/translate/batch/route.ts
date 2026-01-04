import { NextRequest, NextResponse } from 'next/server';
import { getPendingChapters, getStoryContext, updateStoryContext } from '@/lib/models';
import { translateLongText } from '@/lib/translator';
import { updateChapter } from '@/lib/models';
import { extractContextFromChapter, mergeContexts } from '@/lib/context-extractor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, limit = 5, model, chapterIds } = body;

    // Lấy API key từ env hoặc từ request
    const deepseekApiKey = apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
      return NextResponse.json(
        { success: false, error: 'DeepSeek API key is required (set DEEPSEEK_API_KEY in env or provide in request)' },
        { status: 400 }
      );
    }

    // Nếu có chapterIds, lấy các chương đó, nếu không lấy pending chapters
    let chaptersToTranslate;
    if (chapterIds && Array.isArray(chapterIds) && chapterIds.length > 0) {
      const { getChapterById } = await import('@/lib/models');
      chaptersToTranslate = [];
      for (const id of chapterIds) {
        const chapter = await getChapterById(id);
        if (chapter && chapter.originalContent && chapter.originalContent.trim()) {
          chaptersToTranslate.push(chapter);
        }
      }
    } else {
      chaptersToTranslate = await getPendingChapters(limit);
    }
    
    if (chaptersToTranslate.length === 0) {
      return NextResponse.json({
        success: true,
        data: { message: 'No chapters to translate', count: 0 },
      });
    }

    const results = [];

    for (const chapter of chaptersToTranslate) {
      try {
        // Cập nhật status thành translating
        await updateChapter(chapter._id!.toString(), { status: 'translating' });

        // Lấy context từ các chương trước
        const existingContext = await getStoryContext(chapter.storyId);

        // Dịch nội dung với context
        const translatedText = await translateLongText(
          chapter.originalContent,
          deepseekApiKey,
          model || 'deepseek-chat',
          existingContext
        );

        // Cập nhật chapter với nội dung đã dịch
        await updateChapter(chapter._id!.toString(), {
          translatedContent: translatedText,
          status: 'completed',
        });

        // Extract context từ chương vừa dịch và cập nhật
        try {
          const extractedContext = await extractContextFromChapter(
            translatedText,
            deepseekApiKey,
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
          console.error('Error extracting context:', error);
          // Không fail nếu extract context lỗi
        }

        results.push({
          chapterId: chapter._id!.toString(),
          status: 'success',
        });

        // Delay giữa các chương để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        await updateChapter(chapter._id!.toString(), { status: 'failed' });
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
    console.error('Error in batch translate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch translate',
      },
      { status: 500 }
    );
  }
}

