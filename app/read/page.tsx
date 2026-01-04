'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Story {
  _id: string;
  title: string;
  totalChapters?: number;
}

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  translatedContent?: string;
  status: string;
}

export default function ReadPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (selectedStoryId) {
      fetchChapters(selectedStoryId);
    }
  }, [selectedStoryId]);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      const data = await response.json();
      if (data.success) {
        const storiesWithStringId = data.data.map((story: { _id: { toString: () => string } | string; [key: string]: unknown }) => ({
          ...story,
          _id: typeof story._id === 'object' && story._id !== null && 'toString' in story._id 
            ? story._id.toString() 
            : String(story._id),
        }));
        setStories(storiesWithStringId as Story[]);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchChapters = async (storyId: string) => {
    setLoading(true);
    try {
      // Chỉ lấy các chương đã dịch (API tối ưu)
      const response = await fetch(`/api/stories/${storyId}/chapters/translated`);
      const data = await response.json();
      if (data.success) {
        // Convert sang format Chapter với _id giả (không cần thật)
        const chaptersWithStringId = data.data.map((ch: { chapterNumber: number; title: string }, index: number) => ({
          _id: `temp-${index}`,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          translatedContent: '', // Không cần load content ở đây
          status: 'completed',
        }));
        setChapters(chaptersWithStringId as Chapter[]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Đọc Truyện
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md text-sm"
          >
            Về trang chủ
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Chọn Truyện
          </h2>
          <select
            value={selectedStoryId || ''}
            onChange={(e) => setSelectedStoryId(e.target.value || null)}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 text-base"
          >
            <option value="">-- Chọn truyện --</option>
            {stories.map((story) => (
              <option key={story._id} value={story._id}>
                {story.title}
              </option>
            ))}
          </select>
        </div>

        {selectedStoryId && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Danh Sách Chương ({chapters.length} chương đã dịch)
            </h2>
            {loading ? (
              <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
            ) : chapters.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">Chưa có chương nào đã dịch</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {chapters.map((chapter) => (
                  <button
                    key={chapter._id}
                    onClick={() => router.push(`/read/${selectedStoryId}/${chapter.chapterNumber}`)}
                    className="p-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg text-left transition-colors"
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Chương {chapter.chapterNumber}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                      {chapter.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

