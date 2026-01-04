import * as cheerio from 'cheerio';

export interface WebsitePreset {
  name: string;
  domain: string;
  chapterSelectors: {
    titleSelector: string;
    contentSelector: string;
    nextSelector?: string;
  };
  listSelectors: {
    listSelector: string;
    titleSelector: string;
    linkSelector: string;
  };
}

export interface DetectedSelectors {
  titleSelector?: string;
  contentSelector?: string;
  nextSelector?: string;
  listSelector?: string;
  linkSelector?: string;
}

export const websitePresets: WebsitePreset[] = [
  {
    name: 'Metruyenchu.com.vn',
    domain: 'metruyenchu.com.vn',
    chapterSelectors: {
      titleSelector: 'h1.text-2xl.font-bold, h1.font-bold, .chapter-title, h1',
      contentSelector: 'div#chapter-content p, .chapter-content p, div[class*="chapter-content"] p',
      nextSelector: 'a[title*="tiếp"], a:contains("Chương tiếp"), .next-chapter a',
    },
    listSelectors: {
      listSelector: 'div.list-chapter ul li, ul.list-chapter li, .list-chapter li, div[class*="list-chapter"] li',
      titleSelector: 'a',
      linkSelector: 'a',
    },
  },
];

export function getPresetByUrl(url: string): WebsitePreset | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    return websitePresets.find(preset => hostname.includes(preset.domain)) || null;
  } catch {
    return null;
  }
}

export function detectSelectors(html: string, mode: 'chapter' | 'list'): DetectedSelectors {
  const $ = cheerio.load(html);
  
  const result: DetectedSelectors = {};

  if (mode === 'chapter') {
    // Tìm title - thường là h1 hoặc h2 lớn nhất
    const titleCandidates = ['h1', 'h2.chapter-title', '.chapter-title', 'h1.title'];
    for (const selector of titleCandidates) {
      if ($(selector).length > 0) {
        result.titleSelector = selector;
        break;
      }
    }

    // Tìm content - thường là div lớn chứa nhiều p tags
    const contentCandidates = [
      '#chapter-content',
      '.chapter-content',
      '.content',
      '#content',
      'div[class*="chapter"] p',
      'div[class*="content"] p',
    ];
    for (const selector of contentCandidates) {
      const elements = $(selector);
      if (elements.length > 3) { // Nếu có nhiều hơn 3 paragraph
        result.contentSelector = selector;
        break;
      }
    }

    // Tìm next button
    const nextCandidates = [
      'a[title*="tiếp"]',
      'a[title*="next"]',
      'a:contains("Chương tiếp")',
      '.next-chapter a',
      'a.next',
    ];
    for (const selector of nextCandidates) {
      if ($(selector).length > 0) {
        result.nextSelector = selector;
        break;
      }
    }
  } else {
    // List mode
    const listCandidates = [
      'ul.list-chapter li',
      '.list-chapter li',
      'div[class*="chapter-list"] li',
      'ul.chapter-list li',
      '.chapter-list li',
    ];
    for (const selector of listCandidates) {
      if ($(selector).length > 0) {
        result.listSelector = selector;
        result.titleSelector = 'a';
        result.linkSelector = 'a';
        break;
      }
    }
  }

  return result;
}

