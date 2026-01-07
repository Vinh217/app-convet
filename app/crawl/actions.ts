'use server';

import { getStories } from '@/lib/models';
import { 
  getChaptersByStoryId, 
  getChaptersByRange as getChaptersByRangeModel,
  getChaptersByNumbers as getChaptersByNumbersModel,
  getChaptersFrom as getChaptersFromModel
} from '@/lib/models';

export async function getStoriesList() {
  try {
    const stories = await getStories();
    return {
      success: true as const,
      data: stories.map((story) => ({
        _id: story._id?.toString() || '',
        title: story.title,
      })),
    };
  } catch (error) {
    console.error('Error fetching stories:', error);
    return {
      success: false as const,
      error: 'Failed to fetch stories',
      data: [],
    };
  }
}

export interface PaginatedChaptersParams {
  storyId: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getChaptersPaginated(params: PaginatedChaptersParams) {
  const { storyId, page = 1, limit = 50, status, search } = params;

  try {
    // Parse search query for smart search patterns
    const rangeMatch = search?.match(/^(\d+)\s*-\s*(\d+)$/);
    const listMatch = search?.match(/^(\d+(?:\s*,\s*\d+)+)$/);
    const fromMatch = search?.match(/^(\d+)\s*\+$/);

    let result;

    if (rangeMatch) {
      // Range search
      const from = parseInt(rangeMatch[1], 10);
      const to = parseInt(rangeMatch[2], 10);
      const rangeResult = await getChaptersByRangeModel(storyId, { from, to, status });
      result = {
        chapters: rangeResult.chapters,
        total: rangeResult.count,
        totalPages: 1,
        currentPage: 1,
      };
    } else if (listMatch) {
      // List search
      const numbers = search?.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0) || [];
      const listResult = await getChaptersByNumbersModel(storyId, { numbers, status });
      result = {
        chapters: listResult.chapters,
        total: listResult.count,
        totalPages: 1,
        currentPage: 1,
      };
    } else if (fromMatch) {
      // From onwards search
      const from = parseInt(fromMatch[1], 10);
      const fromResult = await getChaptersFromModel(storyId, { from, status });
      result = {
        chapters: fromResult.chapters,
        total: fromResult.count,
        totalPages: 1,
        currentPage: 1,
      };
    } else {
      // Normal paginated search
      result = await getChaptersByStoryId(storyId, { page, limit, status, search });
    }

    return {
      success: true as const,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          url: ch.url,
          status: ch.status,
        })),
        pagination: {
          page: result.currentPage || 1,
          limit,
          total: result.total,
          totalPages: result.totalPages || 1,
          hasMore: (result.currentPage || 1) < (result.totalPages || 1),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching paginated chapters:', error);
    return {
      success: false as const,
      error: 'Failed to fetch chapters',
      data: null,
    };
  }
}

export interface RangeChaptersParams {
  storyId: string;
  from: number;
  to: number;
  status?: string;
}

export async function getChaptersByRange(params: RangeChaptersParams) {
  const { storyId, from, to, status } = params;

  try {
    const result = await getChaptersByRangeModel(storyId, { from, to, status });

    return {
      success: true as const,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          url: ch.url,
          status: ch.status,
        })),
        count: result.count,
      },
    };
  } catch (error) {
    console.error('Error fetching chapters by range:', error);
    return {
      success: false as const,
      error: 'Failed to fetch chapters by range',
      data: null,
    };
  }
}

export interface ListChaptersParams {
  storyId: string;
  numbers: number[];
  status?: string;
}

export async function getChaptersByNumbers(params: ListChaptersParams) {
  const { storyId, numbers, status } = params;

  try {
    const result = await getChaptersByNumbersModel(storyId, { numbers, status });

    return {
      success: true as const,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          url: ch.url,
          status: ch.status,
        })),
        count: result.count,
      },
    };
  } catch (error) {
    console.error('Error fetching chapters by list:', error);
    return {
      success: false as const,
      error: 'Failed to fetch chapters by list',
      data: null,
    };
  }
}

export interface FromChaptersParams {
  storyId: string;
  from: number;
  status?: string;
}

export async function getChaptersFrom(params: FromChaptersParams) {
  const { storyId, from, status } = params;

  try {
    const result = await getChaptersFromModel(storyId, { from, status });

    return {
      success: true as const,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          url: ch.url,
          status: ch.status,
        })),
        count: result.count,
      },
    };
  } catch (error) {
    console.error('Error fetching chapters from:', error);
    return {
      success: false as const,
      error: 'Failed to fetch chapters from',
      data: null,
    };
  }
}

