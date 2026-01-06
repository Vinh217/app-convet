'use server';

import { 
  getStories, 
  getChaptersByStoryId, 
  getChaptersByRange as getChaptersByRangeModel,
  getChaptersByNumbers,
  getChaptersFrom as getChaptersFromModel
} from '@/lib/models';

export async function getStoriesList() {
  try {
    const stories = await getStories();
    return {
      success: true,
      data: stories.map(story => ({
        _id: story._id?.toString() || '',
        title: story.title,
        totalChapters: story.totalChapters,
      })),
    };
  } catch (error) {
    console.error('Error fetching stories:', error);
    return {
      success: false,
      error: 'Failed to fetch stories',
      data: [],
    };
  }
}

export async function getChaptersList(storyId: string) {
  try {
    // Giữ lại API cũ cho backward-compat (nếu nơi khác đang dùng)
    const result = await getChaptersByStoryId(storyId, {
      page: 1,
      limit: 50,
    });

    const chapters = result.chapters.map((ch) => ({
      _id: ch._id?.toString() || '',
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      originalContent: ch.originalContent,
      translatedContent: ch.translatedContent,
      status: ch.status,
    }));

    return {
      success: true,
      data: chapters,
    };
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return {
      success: false,
      error: 'Failed to fetch chapters',
      data: [],
    };
  }
}

// New paginated + searchable fetch for translate page
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
    // Search is now handled at MongoDB level in getChaptersByStoryId
    const result = await getChaptersByStoryId(storyId, {
      page,
      limit,
      status,
      search, // Pass search to backend
    });

    return {
      success: true as const,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          translatedContent: ch.translatedContent,
          status: ch.status,
        })),
        pagination: {
          page: result.currentPage,
          limit,
          total: result.total, // This now reflects the filtered total
          totalPages: result.totalPages,
          hasMore: result.currentPage < result.totalPages,
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
          translatedContent: ch.translatedContent,
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

export async function getChaptersByList(params: ListChaptersParams) {
  const { storyId, numbers, status } = params;

  try {
    const result = await getChaptersByNumbers(storyId, { numbers, status });

    return {
      success: true as const,
      data: {
        chapters: result.chapters.map((ch) => ({
          _id: ch._id?.toString() || '',
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalContent: ch.originalContent,
          translatedContent: ch.translatedContent,
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
          translatedContent: ch.translatedContent,
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


