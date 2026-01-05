'use server';

import { getChapterByNumber, getStoryById, getChaptersByStoryId } from '@/lib/models';

export async function getChapterData(storyId: string, chapterNumber: number) {
  try {
    const chapter = await getChapterByNumber(storyId, chapterNumber);
    
    if (!chapter) {
      return {
        success: false,
        error: 'Chapter not found',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        _id: chapter._id?.toString() || '',
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        translatedContent: chapter.translatedContent,
      },
    };
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return {
      success: false,
      error: 'Failed to fetch chapter',
      data: null,
    };
  }
}

export async function getStoryData(storyId: string) {
  try {
    const story = await getStoryById(storyId);
    
    if (!story) {
      return {
        success: false,
        error: 'Story not found',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        _id: story._id?.toString() || '',
        title: story.title,
      },
    };
  } catch (error) {
    console.error('Error fetching story:', error);
    return {
      success: false,
      error: 'Failed to fetch story',
      data: null,
    };
  }
}

export async function getTranslatedChaptersList(storyId: string) {
  try {
    const chapters = await getChaptersByStoryId(storyId);
    
    // Chỉ lấy các chương đã dịch
    const translatedChapters = chapters.chapters.filter(ch => ch.translatedContent && ch.status === 'completed')
      .map(ch => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title,
      }))
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    return {
      success: true,
      data: translatedChapters,
    };
  } catch (error) {
    console.error('Error fetching translated chapters:', error);
    return {
      success: false,
      error: 'Failed to fetch chapters',
      data: [],
    };
  }
}

