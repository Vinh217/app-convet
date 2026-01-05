import { NextRequest, NextResponse } from 'next/server';
import { getChapterById, getStoryContext, updateStoryContext, updateChapter, appendChapterLog } from '@/lib/models';
import { translateLongText } from '@/lib/translator';
import { extractContextFromChapter, mergeContexts } from '@/lib/context-extractor';

// Helper function để log vào cả console và database
async function logToChapter(
  chapterId: string,
  level: 'info' | 'error' | 'success',
  message: string,
  data?: Record<string, unknown>
) {
  // Log vào console (cho local dev)
  const logMessage = `[BACKGROUND] Chapter ${chapterId}: ${message}`;
  if (level === 'error') {
    console.error(logMessage, data || '');
  } else if (level === 'success') {
    console.log(logMessage, data || '');
  } else {
    console.log(logMessage, data || '');
  }
  
  // Lưu vào database (cho production)
  // try {
  //   await appendChapterLog(chapterId, level, message, data);
  // } catch (error) {
  //   console.error(`Failed to save log for chapter ${chapterId}:`, error);
  // }
}

// Chạy dịch ngầm, không block response
async function translateChapterInBackground(
  chapterId: string,
  apiKey: string,
  model: string
) {
  const chapterStartTime = Date.now();
  await logToChapter(chapterId, 'info', 'Starting translation');
  
  try {
    const chapter = await getChapterById(chapterId);
    if (!chapter || !chapter.originalContent || !chapter.originalContent.trim()) {
      await logToChapter(chapterId, 'error', 'No content found');
      await updateChapter(chapterId, { status: 'failed' });
      return;
    }

    await logToChapter(chapterId, 'info', `Content loaded`, {
      contentLength: chapter.originalContent.length,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
    });

    // Cập nhật status thành translating
    await updateChapter(chapterId, { status: 'translating' });
    await logToChapter(chapterId, 'info', 'Status updated to translating');

    // Lấy context từ các chương trước
    const contextStartTime = Date.now();
    const existingContext = await getStoryContext(chapter.storyId);
    const contextDuration = ((Date.now() - contextStartTime) / 1000).toFixed(2);
    await logToChapter(chapterId, 'info', `Context loaded`, { duration: `${contextDuration}s` });

    // Dịch nội dung với context
    const translateStartTime = Date.now();
    const translatedText = await translateLongText(
      chapter.originalContent,
      apiKey,
      model || 'deepseek-chat',
      existingContext,
      chapterId,
      logToChapter
    );
    const translateDuration = ((Date.now() - translateStartTime) / 1000).toFixed(2);
    await logToChapter(chapterId, 'info', `Translation completed`, {
      duration: `${translateDuration}s`,
      outputLength: translatedText.length,
    });

    // Cập nhật chapter với nội dung đã dịch
    await updateChapter(chapterId, {
      translatedContent: translatedText,
      status: 'completed',
    });
    await logToChapter(chapterId, 'info', 'Chapter updated with translated content');

    // Extract context từ chương vừa dịch và cập nhật
    try {
      const extractStartTime = Date.now();
      await logToChapter(chapterId, 'info', 'Extracting context...');
      const extractedContext = await extractContextFromChapter(
        translatedText,
        apiKey,
        model || 'deepseek-chat'
      );
      const extractDuration = ((Date.now() - extractStartTime) / 1000).toFixed(2);
      await logToChapter(chapterId, 'info', `Context extracted`, {
        duration: `${extractDuration}s`,
        charactersCount: extractedContext.characters.length,
        termsCount: extractedContext.terms.length,
        settingsCount: extractedContext.settings.length,
        plotPointsCount: extractedContext.plotPoints.length,
      });
      
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
      await logToChapter(chapterId, 'info', 'Story context updated');
    } catch (error) {
      await logToChapter(chapterId, 'error', 'Error extracting context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Không fail nếu extract context lỗi
    }

    const totalDuration = ((Date.now() - chapterStartTime) / 1000).toFixed(2);
    await logToChapter(chapterId, 'success', `Completed successfully`, {
      totalDuration: `${totalDuration}s`,
    });
  } catch (error) {
    const totalDuration = ((Date.now() - chapterStartTime) / 1000).toFixed(2);
    await logToChapter(chapterId, 'error', `Failed after ${totalDuration}s`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
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

    // Trên Vercel, cần đợi ít nhất job đầu tiên bắt đầu để đảm bảo nó chạy
    // Xử lý tuần tự với delay để tránh rate limit và đảm bảo jobs chạy trên Vercel
    const processTranslations = async () => {
      for (let i = 0; i < chapterIds.length; i++) {
        const chapterId = chapterIds[i];
        try {
          // Delay giữa các chương (trừ chương đầu tiên)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
          }
          
          console.log(`[BACKGROUND] Processing chapter ${i + 1}/${chapterIds.length}: ${chapterId}`);
          await translateChapterInBackground(chapterId, apiKey, model || 'deepseek-chat');
          console.log(`[BACKGROUND] Completed chapter ${i + 1}/${chapterIds.length}: ${chapterId}`);
        } catch (error) {
          console.error(`[BACKGROUND] Error translating chapter ${chapterId}:`, error);
        }
      }
    };

    // Bắt đầu job đầu tiên và đợi nó bắt đầu chạy (ít nhất update status)
    // Điều này đảm bảo Vercel không terminate function ngay
    const firstChapterId = chapterIds[0];
    if (firstChapterId) {
      // Bắt đầu job đầu tiên và đợi nó update status
      const firstJob = translateChapterInBackground(firstChapterId, apiKey, model || 'deepseek-chat');
      
      // Đợi ít nhất 2 giây để job đầu tiên bắt đầu chạy
      await Promise.race([
        firstJob,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    }

    // Trả về response sau khi job đầu tiên đã bắt đầu
    const response = NextResponse.json({
      success: true,
      message: `Đã bắt đầu dịch ${chapterIds.length} chương trong background`,
      data: {
        chapterIds,
        count: chapterIds.length,
      },
    });

    // Tiếp tục xử lý các job còn lại trong background
    // Không await để trả response ngay
    processTranslations().catch(error => {
      console.error('[BACKGROUND] Error in background translation process:', error);
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

