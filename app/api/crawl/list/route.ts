import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createChapter, updateStory } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, apiUrl } = body;

    if (!storyId || !apiUrl) {
      return NextResponse.json(
        { success: false, error: 'Story ID and API URL are required' },
        { status: 400 }
      );
    }

    // Lấy JSON từ API
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const jsonData = response.data;
    
    // Lấy HTML từ field 'data'
    let htmlContent = '';
    if (jsonData.data) {
      htmlContent = jsonData.data;
    } else if (typeof jsonData === 'string') {
      htmlContent = jsonData;
    } else if (jsonData.html) {
      htmlContent = jsonData.html;
    } else if (jsonData.content) {
      htmlContent = jsonData.content;
    }

    if (!htmlContent) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy HTML trong JSON response' },
        { status: 400 }
      );
    }

    // Parse HTML để lấy danh sách chương
    const $ = cheerio.load(htmlContent);
    const chapters: Array<{ title: string; url: string; chapterNumber: number }> = [];
    const seenUrls = new Set<string>(); // Để tránh trùng lặp

    // Tìm tất cả các link chương trong các thẻ <a>
    $('a[href*="/chuong-"]').each((_, el) => {
      const link = $(el).attr('href');
      const title = $(el).text().trim();
      
      if (link && title) {
        const fullUrl = link.startsWith('http') ? link : `https://metruyenchu.com.vn${link}`;
        
        // Extract chapter number from URL: chuong-{number}-
        const chapterMatch = link.match(/chuong-(\d+)-/);
        const chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : 0;
        
        // Chỉ thêm nếu chưa có trong set và có chapter number hợp lệ
        if (!seenUrls.has(fullUrl) && chapterNumber > 0) {
          seenUrls.add(fullUrl);
          chapters.push({
            title,
            url: fullUrl,
            chapterNumber,
          });
        }
      }
    });

    if (chapters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy chương nào trong HTML' },
        { status: 400 }
      );
    }

    // Sắp xếp chương theo chapterNumber
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    // Lưu vào MongoDB
    const createdChapters = [];
    for (const chapter of chapters) {
      const chapterId = await createChapter({
        storyId,
        chapterNumber: chapter.chapterNumber,
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
      status: 'crawling',
    });

    return NextResponse.json({
      success: true,
      data: {
        chapters: createdChapters,
        total: chapters.length,
      },
    });
  } catch (error) {
    console.error('Error crawling list:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl list',
      },
      { status: 500 }
    );
  }
}

