import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createChapter, updateStory } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, baseApiUrl, totalPages } = body;

    if (!storyId || !baseApiUrl) {
      return NextResponse.json(
        { success: false, error: 'Story ID and Base API URL are required' },
        { status: 400 }
      );
    }

    // Parse base URL để lấy story ID và base URL
    // Ví dụ: https://metruyenchu.com.vn/get/listchap/102298?page=1
    const urlMatch = baseApiUrl.match(/\/get\/listchap\/(\d+)/);
    if (!urlMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid API URL format' },
        { status: 400 }
      );
    }

    const storyIdFromUrl = urlMatch[1];
    const pages = totalPages || 13; // Mặc định 13 trang
    const allChapters: Array<{ title: string; url: string; chapterNumber: number }> = [];
    const seenUrls = new Set<string>();

    // Crawl từng trang
    for (let page = 1; page <= pages; page++) {
      try {
        const apiUrl = `https://metruyenchu.com.vn/get/listchap/${storyIdFromUrl}?page=${page}`;
        console.log(`Crawling page ${page}/${pages}...`);

        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 30000,
        });

        const jsonData = response.data;
        const htmlContent = jsonData.data;

        if (!htmlContent) {
          console.warn(`No HTML content found in page ${page}`);
          continue;
        }

        // Parse HTML để lấy danh sách chương
        const $ = cheerio.load(htmlContent);

        $('a[href*="/chuong-"]').each((_, el) => {
          const link = $(el).attr('href');
          const title = $(el).text().trim();

          if (link && title) {
            const fullUrl = link.startsWith('http') ? link : `https://metruyenchu.com.vn${link}`;

            // Extract chapter number from URL: chuong-{number}-
            const chapterMatch = link.match(/chuong-(\d+)-/);
            const chapterNumber = chapterMatch ? parseInt(chapterMatch[1], 10) : 0;

            if (!seenUrls.has(fullUrl) && chapterNumber > 0) {
              seenUrls.add(fullUrl);
              allChapters.push({
                title,
                url: fullUrl,
                chapterNumber,
              });
            }
          }
        });

        // Delay nhỏ giữa các request
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error crawling page ${page}:`, error);
        // Tiếp tục với trang tiếp theo
        continue;
      }
    }

    if (allChapters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy chương nào' },
        { status: 400 }
      );
    }

    // Sắp xếp chương theo chapterNumber
    allChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    // Lưu vào MongoDB
    const createdChapters = [];
    for (const chapter of allChapters) {
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
      totalChapters: allChapters.length,
      crawledChapters: allChapters.length,
      status: 'crawling',
    });

    return NextResponse.json({
      success: true,
      data: {
        chapters: createdChapters,
        total: allChapters.length,
        pagesCrawled: pages,
      },
    });
  } catch (error) {
    console.error('Error crawling all pages:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl all pages',
      },
      { status: 500 }
    );
  }
}

