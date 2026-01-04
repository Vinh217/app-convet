import { NextRequest, NextResponse } from 'next/server';
import { getChapterById, getStoryContext, updateStoryContext } from '@/lib/models';
import { translateLongText } from '@/lib/translator';
import { updateChapter } from '@/lib/models';
import { extractContextFromChapter, mergeContexts } from '@/lib/context-extractor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterIds, model } = body;

    if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter IDs are required' },
        { status: 400 }
      );
    }

    // Lấy API key từ env
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DEEPSEEK_API_KEY is not set in environment variables' },
        { status: 400 }
      );
    }

    const results = [];

    for (const chapterId of chapterIds) {
      try {
        const chapter = await getChapterById(chapterId);
        
        if (!chapter) {
          results.push({
            chapterId,
            status: 'failed',
            error: 'Chapter not found',
          });
          continue;
        }

        if (!chapter.originalContent || !chapter.originalContent.trim()) {
          results.push({
            chapterId,
            status: 'failed',
            error: 'No content to translate',
          });
          continue;
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
          existingContext
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
          console.error('Error extracting context:', error);
          // Không fail nếu extract context lỗi
        }

        results.push({
          chapterId,
          status: 'success',
        });

        // Delay giữa các chương để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        await updateChapter(chapterId, { status: 'failed' });
        results.push({
          chapterId,
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
    console.error('Error in selected translate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to translate selected chapters',
      },
      { status: 500 }
    );
  }
}

