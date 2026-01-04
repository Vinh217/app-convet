import * as cheerio from 'cheerio';
import axios from 'axios';

export interface CrawlResult {
  title: string;
  content: string;
  nextUrl?: string;
}

export async function crawlChapter(url: string, selectors: {
  titleSelector?: string;
  contentSelector: string;
  nextSelector?: string;
}): Promise<CrawlResult> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    
    // Lấy title (nếu có selector) - hỗ trợ nhiều selector
    let title = '';
    if (selectors.titleSelector) {
      const titleSelectors = selectors.titleSelector.split(',').map(s => s.trim());
      for (const selector of titleSelectors) {
        const found = $(selector).first().text().trim();
        if (found) {
          title = found;
          break;
        }
      }
    }

    // Lấy nội dung - hỗ trợ nhiều selector
    let content = '';
    const contentSelectors = selectors.contentSelector.split(',').map(s => s.trim());
    for (const selector of contentSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        content = elements
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(text => text.length > 0)
          .join('\n\n')
          .trim();
        if (content) break;
      }
    }

    // Lấy link chương tiếp theo (nếu có) - hỗ trợ nhiều selector
    let nextUrl: string | undefined;
    if (selectors.nextSelector) {
      const nextSelectors = selectors.nextSelector.split(',').map(s => s.trim());
      for (const selector of nextSelectors) {
        // Xử lý selector có :contains (cheerio không hỗ trợ, cần filter thủ công)
        if (selector.includes(':contains(')) {
          const baseSelector = selector.split(':contains')[0].trim();
          const containsText = selector.match(/contains\("([^"]+)"\)/)?.[1];
          if (containsText) {
            $(baseSelector).each((_, el) => {
              const text = $(el).text();
              if (text.includes(containsText)) {
                const link = $(el).attr('href');
                if (link) {
                  nextUrl = new URL(link, url).href;
                  return false; // break
                }
              }
            });
            if (nextUrl) break;
          }
        } else {
          const nextLink = $(selector).first().attr('href');
          if (nextLink) {
            nextUrl = new URL(nextLink, url).href;
            break;
          }
        }
      }
    }

    return {
      title,
      content,
      nextUrl,
    };
  } catch (error) {
    console.error('Error crawling chapter:', error);
    throw new Error(`Failed to crawl chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function crawlStoryList(url: string, selectors: {
  listSelector: string;
  titleSelector: string;
  linkSelector: string;
}): Promise<Array<{ title: string; url: string }>> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const chapters: Array<{ title: string; url: string }> = [];

    // Hỗ trợ nhiều list selector (fallback)
    const listSelectors = selectors.listSelector.split(',').map(s => s.trim());
    let foundList = false;

    for (const listSelector of listSelectors) {
      const listElements = $(listSelector);
      if (listElements.length > 0) {
        listElements.each((_, el) => {
          const title = $(el).find(selectors.titleSelector).text().trim();
          const link = $(el).find(selectors.linkSelector).attr('href');
          
          if (title && link) {
            chapters.push({
              title,
              url: new URL(link, url).href,
            });
          }
        });
        if (chapters.length > 0) {
          foundList = true;
          break;
        }
      }
    }

    if (!foundList && chapters.length === 0) {
      throw new Error('Không tìm thấy danh sách chương với các selector đã cho');
    }

    return chapters;
  } catch (error) {
    console.error('Error crawling story list:', error);
    throw new Error(`Failed to crawl story list: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

