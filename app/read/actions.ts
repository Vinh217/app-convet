'use server';

import { getStories, getChaptersByStoryId } from '@/lib/models';

export async function getStoriesList() {
  try {
    const stories = await getStories();
    return {
      success: true,
      data: stories.map(story => ({
        _id: story._id.toString(),
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

export async function getTranslatedChapters(storyId: string) {
  try {
    const chapters = await getChaptersByStoryId(storyId);
    
    // Chỉ lấy các chương đã dịch
    const translatedChapters = chapters
      .filter(ch => ch.translatedContent && ch.status === 'completed')
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

