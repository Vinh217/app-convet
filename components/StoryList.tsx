'use client';

import { useState, useEffect } from 'react';

interface Story {
  _id: string;
  title: string;
  url: string;
  status: string;
  totalChapters?: number;
  crawledChapters?: number;
  createdAt: string | Date;
}

interface StoryListProps {
  stories: Story[];
  loading: boolean;
  selectedStory: string | null;
  onSelectStory: (id: string) => void;
  onRefresh: () => void;
}

export default function StoryList({
  stories,
  loading,
  selectedStory,
  onSelectStory,
  onRefresh,
}: StoryListProps) {
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, any[]>>({});

  const loadChapters = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/chapters`);
      const data = await response.json();
      if (data.success) {
        setChapters((prev) => ({ ...prev, [storyId]: data.data }));
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const toggleStory = (storyId: string) => {
    if (expandedStory === storyId) {
      setExpandedStory(null);
    } else {
      setExpandedStory(storyId);
      if (!chapters[storyId]) {
        loadChapters(storyId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'translating':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'crawling':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Chưa có truyện nào. Hãy thêm truyện mới!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
          Danh Sách Truyện ({stories.length})
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
        >
          Làm mới
        </button>
      </div>
      <div className="space-y-4">
        {stories.map((story) => (
          <div
            key={story._id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedStory === story._id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
            onClick={() => onSelectStory(story._id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-black dark:text-zinc-50 mb-2">
                  {story.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      story.status
                    )}`}
                  >
                    {story.status}
                  </span>
                  {story.totalChapters && (
                    <span className="px-2 py-1 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {story.crawledChapters || 0}/{story.totalChapters} chương
                    </span>
                  )}
                </div>
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {story.url}
                </a>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStory(story._id);
                }}
                className="ml-4 px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300"
              >
                {expandedStory === story._id ? 'Thu gọn' : 'Xem chương'}
              </button>
            </div>

            {expandedStory === story._id && chapters[story._id] && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <h4 className="font-medium text-black dark:text-zinc-50 mb-2">
                  Chương ({chapters[story._id].length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {chapters[story._id].map((chapter) => (
                    <div
                      key={chapter._id}
                      className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded text-sm"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {chapter.chapterNumber}. {chapter.title}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          chapter.status
                        )}`}
                      >
                        {chapter.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

