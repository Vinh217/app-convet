import { NextRequest, NextResponse } from 'next/server';
import { getChapterById, getStoryContext, updateStoryContext, updateChapter } from '@/lib/models';
import { translateLongText } from '@/lib/translator';
import { extractContextFromChapter, mergeContexts } from '@/lib/context-extractor';

// Chạy dịch ngầm, không block response
async function translateChapterInBackground(
  chapterId: string,
  apiKey: string,
  model: string
) {
  const chapterStartTime = Date.now();
  console.log(`[BACKGROUND] Starting translation for chapter ${chapterId}`);
  
  try {
    const chapter = await getChapterById(chapterId);
    if (!chapter || !chapter.originalContent || !chapter.originalContent.trim()) {
      console.error(`[BACKGROUND] Chapter ${chapterId}: No content found`);
      await updateChapter(chapterId, { status: 'failed' });
      return;
    }

    console.log(`[BACKGROUND] Chapter ${chapterId}: Content length ${chapter.originalContent.length} chars, Chapter ${chapter.chapterNumber}: ${chapter.title}`);

    // Cập nhật status thành translating
    await updateChapter(chapterId, { status: 'translating' });

    // Lấy context từ các chương trước
    const contextStartTime = Date.now();
    const existingContext = await getStoryContext(chapter.storyId);
    const contextDuration = ((Date.now() - contextStartTime) / 1000).toFixed(2);
    console.log(`[BACKGROUND] Chapter ${chapterId}: Context loaded in ${contextDuration}s`);

    // Dịch nội dung với context
    const translateStartTime = Date.now();
    const translatedText = await translateLongText(
      chapter.originalContent,
      apiKey,
      model || 'deepseek-chat',
      existingContext
    );
    const translateDuration = ((Date.now() - translateStartTime) / 1000).toFixed(2);
    console.log(`[BACKGROUND] Chapter ${chapterId}: Translation completed in ${translateDuration}s, output length: ${translatedText.length} chars`);

    // Cập nhật chapter với nội dung đã dịch
    await updateChapter(chapterId, {
      translatedContent: translatedText,
      status: 'completed',
    });

    // Extract context từ chương vừa dịch và cập nhật
    try {
      const extractStartTime = Date.now();
      console.log(`[BACKGROUND] Chapter ${chapterId}: Extracting context...`);
      const extractedContext = await extractContextFromChapter(
        translatedText,
        apiKey,
        model || 'deepseek-chat'
      );
      const extractDuration = ((Date.now() - extractStartTime) / 1000).toFixed(2);
      console.log(`[BACKGROUND] Chapter ${chapterId}: Context extracted in ${extractDuration}s`);
      
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
      console.error(`[BACKGROUND] Chapter ${chapterId}: Error extracting context:`, error);
      // Không fail nếu extract context lỗi
    }

    const totalDuration = ((Date.now() - chapterStartTime) / 1000).toFixed(2);
    console.log(`[BACKGROUND] Chapter ${chapterId}: ✅ Completed successfully in ${totalDuration}s total`);
  } catch (error) {
    const totalDuration = ((Date.now() - chapterStartTime) / 1000).toFixed(2);
    console.error(`[BACKGROUND] Chapter ${chapterId}: ❌ Failed after ${totalDuration}s:`, error);
    await updateChapter(chapterId, { status: 'failed' });
  }
}

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

    // Trả về response ngay, dịch chạy ngầm
    const response = NextResponse.json({
      success: true,
      message: `Đã bắt đầu dịch ${chapterIds.length} chương trong background`,
      data: {
        chapterIds,
        count: chapterIds.length,
      },
    });

    // Chạy dịch ngầm (không await)
    Promise.all(
      chapterIds.map((chapterId: string, index: number) => {
        // Delay giữa các chương để tránh rate limit
        return new Promise(resolve => {
          setTimeout(async () => {
            await translateChapterInBackground(chapterId, apiKey, model || 'deepseek-chat');
            resolve(null);
          }, index * 2000); // 2s delay giữa mỗi chương
        });
      })
    ).catch(error => {
      console.error('Error in background translation:', error);
    });

    return response;
  } catch (error) {
    console.error('Error starting background translation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start background translation',
      },
      { status: 500 }
    );
  }
}

