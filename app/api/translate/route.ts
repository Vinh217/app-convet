import { NextRequest, NextResponse } from 'next/server';
import { translateLongText } from '@/lib/translator';
import { getChapterById, updateChapter } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId, text, apiKey, model } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DeepSeek API key is required' },
        { status: 400 }
      );
    }

    const contentToTranslate = text || (chapterId ? (await getChapterById(chapterId))?.originalContent : null);

    if (!contentToTranslate) {
      return NextResponse.json(
        { success: false, error: 'No content to translate' },
        { status: 400 }
      );
    }

    // Cập nhật status nếu có chapterId
    if (chapterId) {
      await updateChapter(chapterId, { status: 'translating' });
    }

    try {
      const translatedText = await translateLongText(
        contentToTranslate,
        apiKey,
        model || 'deepseek-chat'
      );

      // Cập nhật chapter nếu có
      if (chapterId) {
        await updateChapter(chapterId, {
          translatedContent: translatedText,
          status: 'completed',
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          translated: translatedText,
        },
      });
    } catch (translateError) {
      // Cập nhật status failed nếu có chapterId
      if (chapterId) {
        await updateChapter(chapterId, { status: 'failed' });
      }
      throw translateError;
    }
  } catch (error) {
    console.error('Error translating:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to translate',
      },
      { status: 500 }
    );
  }
}

