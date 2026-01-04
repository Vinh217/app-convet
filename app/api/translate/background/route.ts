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
  try {
    const chapter = await getChapterById(chapterId);
    if (!chapter || !chapter.originalContent || !chapter.originalContent.trim()) {
      await updateChapter(chapterId, { status: 'failed' });
      return;
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
  } catch (error) {
    console.error(`Error translating chapter ${chapterId}:`, error);
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

