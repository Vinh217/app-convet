'use server';

import { getStories, getChaptersByStoryId } from '@/lib/models';

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
    // Fetch all chapters (no pagination limit)
    const result = await getChaptersByStoryId(storyId, { 
      page: 1, 
      limit: 10000 // Large limit to get all chapters
    });
    
    const chapters = result.chapters.map(ch => ({
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

