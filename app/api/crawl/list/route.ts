import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createChapter, updateStory, getChapterByUrl, getChaptersByStoryId } from '@/lib/models';
import { getPresetByUrl } from '@/lib/website-presets';
import { crawlStoryList } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, url, storyIdFromUrl, totalPages, selectors, preview } = body;

    // Validate required fields
    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Check if it's metruyenchu.com.vn (preset)
    // Also check if URL is the API endpoint itself
    let extractedStoryId = storyIdFromUrl;
    let isMetruyenchu = false;
    
    if (url) {
      // Check if URL is metruyenchu API endpoint
      const apiMatch = url.match(/metruyenchu\.com\.vn\/get\/listchap\/(\d+)/);
      if (apiMatch) {
        isMetruyenchu = true;
        extractedStoryId = apiMatch[1];
      } else {
        // Check if it's metruyenchu domain
        const preset = getPresetByUrl(url);
        isMetruyenchu = preset?.domain === 'metruyenchu.com.vn';
      }
    } else if (storyIdFromUrl) {
      // If no URL but has storyIdFromUrl, assume metruyenchu
      isMetruyenchu = true;
      extractedStoryId = storyIdFromUrl;
    }

    const chapters: Array<{ title: string; url: string; chapterNumber: number }> = [];
    const seenUrls = new Set<string>();

    if (isMetruyenchu && extractedStoryId) {
      // Metruyenchu.com.vn: Use API endpoint
      const pages = totalPages || 1;
      
      for (let page = 1; page <= pages; page++) {
        try {
          const apiUrl = `https://metruyenchu.com.vn/get/listchap/${extractedStoryId}?page=${page}`;
          const response = await axios.get(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 30000,
          });

          const jsonData = response.data;
          let htmlContent = '';
          
          if (jsonData.data) {
            htmlContent = jsonData.data;
          } else if (typeof jsonData === 'string') {
            htmlContent = jsonData;
          }

          if (!htmlContent) {
            console.warn(`No HTML content found in page ${page}`);
            continue;
          }

          // Unescape HTML entities
          htmlContent = htmlContent
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&amp;/g, '&');

          const $ = cheerio.load(htmlContent);

          // Extract chapters from <ul><li><a> structure
          $('a[href*="/chuong-"]').each((_, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim().replace(/\s+/g, ' '); // Normalize whitespace
            
            if (link && title) {
              const fullUrl = link.startsWith('http') ? link : `https://metruyenchu.com.vn${link}`;
              
              // Try to extract chapter number from URL first: chuong-{number}-
              let chapterNumber = 0;
              const urlMatch = link.match(/chuong-(\d+)-/);
              if (urlMatch) {
                chapterNumber = parseInt(urlMatch[1], 10);
              } else {
                // If not found in URL, extract from title
                // Match patterns like: "Chương 153:", "Chương 153", "Chương153:", etc.
                const titleMatch = title.match(/chương\s*:?\s*(\d+)/i) || title.match(/^chương\s*(\d+)/i);
                if (titleMatch) {
                  chapterNumber = parseInt(titleMatch[1], 10);
                } else {
                  // Fallback: try to find any number at the start of title
                  const numberMatch = title.match(/^[^\d]*(\d+)/);
                  if (numberMatch) {
                    chapterNumber = parseInt(numberMatch[1], 10);
                  }
                }
              }
              
              // Only skip if chapterNumber is 0 (couldn't extract) or duplicate URL
              if (!seenUrls.has(fullUrl)) {
                seenUrls.add(fullUrl);
                // If chapterNumber is 0, use a fallback (index-based or last chapter + 1)
                if (chapterNumber === 0) {
                  // Use the last chapter number + 1, or use index if no chapters yet
                  if (chapters.length > 0) {
                    const lastChapter = chapters[chapters.length - 1];
                    chapterNumber = lastChapter.chapterNumber + 1;
                  } else {
                    chapterNumber = 1;
                  }
                  console.warn(`Could not extract chapter number from URL or title, using fallback: ${chapterNumber}`, { link, title });
                }
                chapters.push({
                  title,
                  url: fullUrl,
                  chapterNumber,
                });
              }
            }
          });

          // Small delay between pages
          if (page < pages) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error crawling page ${page}:`, error);
          continue;
        }
      }
    } else if (url && selectors) {
      // Generic website: Use selectors
      const crawledChapters = await crawlStoryList(url, selectors);
      
      // Extract chapter numbers from URLs or titles
      for (let i = 0; i < crawledChapters.length; i++) {
        const chapter = crawledChapters[i];
        let chapterNumber = i + 1; // Default to index + 1
        
        // Try to extract from URL
        const urlMatch = chapter.url.match(/chuong-(\d+)|chapter-(\d+)|ch-(\d+)|(\d+)/i);
        if (urlMatch) {
          chapterNumber = parseInt(urlMatch[1] || urlMatch[2] || urlMatch[3] || urlMatch[4], 10);
        } else {
          // Try to extract from title
          const titleMatch = chapter.title.match(/chương\s*(\d+)|chapter\s*(\d+)|ch\.?\s*(\d+)|(\d+)/i);
          if (titleMatch) {
            chapterNumber = parseInt(titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4], 10);
          }
        }

        if (!seenUrls.has(chapter.url)) {
          seenUrls.add(chapter.url);
          chapters.push({
            title: chapter.title,
            url: chapter.url,
            chapterNumber,
          });
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'URL and selectors are required for generic websites, or storyIdFromUrl/metruyenchu API URL for metruyenchu' },
        { status: 400 }
      );
    }

    if (chapters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy chương nào' },
        { status: 400 }
      );
    }

    // Sort by chapter number
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    // If preview mode, return without saving
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          chapters: chapters.map(ch => ({ ...ch, preview: true })),
          total: chapters.length,
          preview: true,
        },
      });
    }

    // Check for duplicates and save to MongoDB
    const createdChapters = [];
    const skippedChapters = [];
    
    for (const chapter of chapters) {
      console.log('chapter', chapter.chapterNumber);
      // Check if chapter with same URL already exists
      const existing = await getChapterByUrl(storyId, chapter.url);
      
      if (existing) {
        skippedChapters.push({ ...chapter, reason: 'duplicate' });
        continue;
      }

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

    // Update story
    const chaptersData = await getChaptersByStoryId(storyId);
    await updateStory(storyId, {
      totalChapters: chaptersData.total,
      crawledChapters: createdChapters.length,
      status: 'crawling',
    });

    return NextResponse.json({
      success: true,
      data: {
        chapters: createdChapters,
        total: createdChapters.length,
        skipped: skippedChapters.length,
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

