import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getChapterById, updateChapter } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId } = body;

    if (!chapterId) {
      return NextResponse.json(
        { success: false, error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // Lấy chapter từ DB
    const chapter = await getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Crawl nội dung chương
    const response = await axios.get(chapter.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);

    // Lấy title từ h1.current-book
    const bookTitle = $('h1.current-book').text().trim();

    // Lấy chapter info từ h2.current-chapter
    const chapterInfo = $('h2.current-chapter').text().trim();

    // Lấy nội dung từ div.truyen
    const content = $('div.truyen')
      .map((_, el) => $(el).text().trim())
      .get()
      .join('\n\n')
      .trim();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy nội dung chương' },
        { status: 400 }
      );
    }

    // Cập nhật chapter
    await updateChapter(chapterId, {
      title: `${bookTitle} - ${chapterInfo}`,
      originalContent: content,
      status: 'pending', // Sẵn sàng để dịch
    });

    return NextResponse.json({
      success: true,
      data: {
        bookTitle,
        chapterInfo,
        contentLength: content.length,
      },
    });
  } catch (error) {
    console.error('Error crawling chapter:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl chapter',
      },
      { status: 500 }
    );
  }
}

