import { NextRequest, NextResponse } from 'next/server';
import { getPresetByUrl } from '@/lib/website-presets';
import { crawlStoryList, crawlChapter } from '@/lib/crawler';
import { createChapter, updateStory, getStoryById } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, storyUrl } = body;

    if (!storyId || !storyUrl) {
      return NextResponse.json(
        { success: false, error: 'Story ID and URL are required' },
        { status: 400 }
      );
    }

    // Lấy preset hoặc trả về lỗi
    const preset = getPresetByUrl(storyUrl);
    if (!preset) {
      return NextResponse.json(
        { success: false, error: 'Website không được hỗ trợ tự động crawl. Vui lòng dùng chức năng crawl thủ công.' },
        { status: 400 }
      );
    }

    // Cập nhật status
    await updateStory(storyId, { status: 'crawling' });

    try {
      // Crawl danh sách chương
      const chapters = await crawlStoryList(storyUrl, preset.listSelectors);

      if (chapters.length === 0) {
        await updateStory(storyId, { status: 'paused' });
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy chương nào' },
          { status: 400 }
        );
      }

      // Tạo các chapter records
      const createdChapters = [];
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterId = await createChapter({
          storyId,
          chapterNumber: i + 1,
          title: chapter.title,
          originalContent: '',
          url: chapter.url,
          status: 'pending',
        });
        createdChapters.push({ id: chapterId.toString(), ...chapter });
      }

      // Cập nhật story
      await updateStory(storyId, {
        totalChapters: chapters.length,
        crawledChapters: chapters.length,
        status: 'paused', // Tạm dừng để có thể crawl nội dung sau
      });

      return NextResponse.json({
        success: true,
        data: {
          chapters: createdChapters,
          total: chapters.length,
          message: `Đã crawl ${chapters.length} chương. Bạn có thể crawl nội dung từng chương sau.`,
        },
      });
    } catch (error) {
      await updateStory(storyId, { status: 'paused' });
      throw error;
    }
  } catch (error) {
    console.error('Error in auto crawl:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to auto crawl',
      },
      { status: 500 }
    );
  }
}

