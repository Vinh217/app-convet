'use server'

import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface Chapter {
  _id?: ObjectId;
  storyId: string;
  chapterNumber: number;
  title: string;
  originalContent: string;
  translatedContent?: string;
  url: string;
  status: 'pending' | 'translating' | 'completed' | 'failed';
  translationLogs?: Array<{
    timestamp: Date;
    level: 'info' | 'error' | 'success';
    message: string;
    data?: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  _id?: ObjectId;
  title: string;
  originalTitle?: string;
  url: string;
  description?: string;
  author?: string;
  totalChapters?: number;
  crawledChapters?: number;
  status: 'crawling' | 'translating' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export async function getStories() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Story>('stories').find({}).sort({ createdAt: -1 }).toArray();
}

export async function getStoryById(id: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Story>('stories').findOne({ _id: new ObjectId(id) });
}

export async function createStory(story: Omit<Story, '_id' | 'createdAt' | 'updatedAt'>) {
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const result = await db.collection<Story>('stories').insertOne({
    ...story,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId;
}

export async function updateStory(id: string, updates: Partial<Story>) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Story>('stories').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}

export async function getChaptersByStoryId(
  storyId: string, 
  options: { page?: number; limit?: number; status?: string; search?: string } = {}
) {
  const client = await clientPromise;
  const db = client.db();
  
  const { page = 1, limit = 100, status, search } = options;
  const skip = (page - 1) * limit;

  const query: any = { storyId };
  if (status) {
    query.status = status;
  }

  // Add search filter at MongoDB level
  if (search && search.trim()) {
    const searchTrimmed = search.trim();
    // Try to parse as number first (for chapter number search)
    const searchNumber = parseInt(searchTrimmed, 10);
    const isNumberSearch = !isNaN(searchNumber) && searchNumber.toString() === searchTrimmed;

    if (isNumberSearch) {
      // Exact match for chapter number
      query.chapterNumber = searchNumber;
    } else {
      // Text search in title using regex (case-insensitive)
      query.$or = [
        { title: { $regex: searchTrimmed, $options: 'i' } },
        { chapterNumber: { $regex: searchTrimmed, $options: 'i' } },
      ];
    }
  }

  const [chapters, total] = await Promise.all([
    db.collection<Chapter>('chapters')
      .find(query)
      .sort({ chapterNumber: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection<Chapter>('chapters').countDocuments(query)
  ]);

  return {
    chapters,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function getChaptersByRange(
  storyId: string,
  options: { from: number; to: number; status?: string } = { from: 1, to: 1 }
) {
  const client = await clientPromise;
  const db = client.db();
  
  const { from, to, status } = options;

  const query: any = { 
    storyId,
    chapterNumber: { $gte: from, $lte: to }
  };
  
  if (status) {
    query.status = status;
  }

  const chapters = await db.collection<Chapter>('chapters')
    .find(query)
    .sort({ chapterNumber: 1 })
    .toArray();

  return {
    chapters,
    count: chapters.length,
  };
}

export async function getChaptersByNumbers(
  storyId: string,
  options: { numbers: number[]; status?: string } = { numbers: [] }
) {
  const client = await clientPromise;
  const db = client.db();
  
  const { numbers, status } = options;

  if (numbers.length === 0) {
    return { chapters: [], count: 0 };
  }

  const query: any = { 
    storyId,
    chapterNumber: { $in: numbers }
  };
  
  if (status) {
    query.status = status;
  }

  const chapters = await db.collection<Chapter>('chapters')
    .find(query)
    .sort({ chapterNumber: 1 })
    .toArray();

  return {
    chapters,
    count: chapters.length,
  };
}

export async function getChaptersFrom(
  storyId: string,
  options: { from: number; status?: string } = { from: 1 }
) {
  const client = await clientPromise;
  const db = client.db();
  
  const { from, status } = options;

  const query: any = { 
    storyId,
    chapterNumber: { $gte: from }
  };
  
  if (status) {
    query.status = status;
  }

  const chapters = await db.collection<Chapter>('chapters')
    .find(query)
    .sort({ chapterNumber: 1 })
    .toArray();

  return {
    chapters,
    count: chapters.length,
  };
}

// Lấy tất cả chương đã dịch (không phân trang)
export async function getAllTranslatedChapters(storyId: string) {
  const client = await clientPromise;
  const db = client.db();

  const query: any = {
    storyId,
    status: 'completed',
    translatedContent: { $exists: true, $ne: '' },
  };

  const chapters = await db.collection<Chapter>('chapters')
    .find(query)
    .sort({ chapterNumber: 1 })
    .toArray();

  return chapters;
}

export async function getChapterById(id: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Chapter>('chapters').findOne({ _id: new ObjectId(id) });
}

export async function createChapter(chapter: Omit<Chapter, '_id' | 'createdAt' | 'updatedAt'>) {
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const result = await db.collection<Chapter>('chapters').insertOne({
    ...chapter,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId;
}

export async function updateChapter(id: string, updates: Partial<Chapter>) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Chapter>('chapters').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}

// Append log to chapter
export async function appendChapterLog(
  chapterId: string,
  level: 'info' | 'error' | 'success',
  message: string,
  data?: Record<string, unknown>
) {
  const client = await clientPromise;
  const db = client.db();
  const logEntry = {
    timestamp: new Date(),
    level,
    message,
    ...(data && { data }),
  };
  
  return db.collection<Chapter>('chapters').updateOne(
    { _id: new ObjectId(chapterId) },
    {
      $push: { translationLogs: logEntry },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function getPendingChapters(limit: number = 10) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Chapter>('chapters')
    .find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
}

export async function getChapterByNumber(storyId: string, chapterNumber: number) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Chapter>('chapters').findOne({ 
    storyId,
    chapterNumber: Number(chapterNumber)
  });
}

export async function getLatestChapter(storyId: string) {
  const client = await clientPromise;
  const db = client.db();
  const chapters = await db.collection<Chapter>('chapters')
    .find({ storyId, status: 'completed' })
    .sort({ chapterNumber: -1 })
    .limit(1)
    .toArray();
  return chapters[0];
}

export async function getChapterByUrl(storyId: string, url: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Chapter>('chapters').findOne({ 
    storyId,
    url
  });
}

export async function getChaptersWithoutContent(storyId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<Chapter>('chapters')
    .find({ 
      storyId,
      $or: [
        { originalContent: { $exists: false } },
        { originalContent: '' },
        { originalContent: { $regex: /^\s*$/ } }
      ]
    })
    .sort({ chapterNumber: 1 })
    .toArray();
}

export interface StoryContext {
  _id?: ObjectId;
  storyId: string;
  characters: Array<{ name: string; description: string; personality?: string }>;
  terms: Array<{ term: string; meaning: string }>;
  settings: Array<{ location: string; description: string }>;
  plotPoints: Array<{ point: string; description: string }>;
  updatedAt: Date;
}

export async function getStoryContext(storyId: string) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection<StoryContext>('storyContexts').findOne({ storyId });
}

export async function updateStoryContext(storyId: string, context: Partial<StoryContext>) {
  const client = await clientPromise;
  const db = client.db();
  const existing = await db.collection<StoryContext>('storyContexts').findOne({ storyId });
  
  if (existing) {
    return db.collection<StoryContext>('storyContexts').updateOne(
      { storyId },
      { $set: { ...context, updatedAt: new Date() } }
    );
  } else {
    return db.collection<StoryContext>('storyContexts').insertOne({
      storyId,
      characters: [],
      terms: [],
      settings: [],
      plotPoints: [],
      ...context,
      updatedAt: new Date(),
    });
  }
}

