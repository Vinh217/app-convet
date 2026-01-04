'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Story {
  _id: string;
  title: string;
  totalChapters?: number;
}

interface Chapter {
  chapterNumber: number;
  title: string;
}

interface ReadPageClientProps {
  initialStories: Story[];
  initialStoryId?: string | null;
  initialChapters: Chapter[];
}

export default function ReadPageClient({ 
  initialStories,
  initialStoryId = null,
  initialChapters,
}: ReadPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [stories] = useState<Story[]>(initialStories);
  
  // Dùng trực tiếp từ props, không cần state vì server component sẽ re-render khi URL thay đổi
  const selectedStoryId = initialStoryId;
  const chapters = initialChapters;

  const handleStoryChange = (storyId: string | null) => {
    // Update URL với searchParams và force server-side re-render
    const params = new URLSearchParams();
    if (storyId) {
      params.set('storyId', storyId);
    }
    
    startTransition(() => {
      const url = params.toString() ? `/read?${params.toString()}` : '/read';
      router.push(url);
      router.refresh();
    });
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
            onChange={(e) => handleStoryChange(e.target.value || null)}
            disabled={isPending}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 text-base disabled:opacity-50"
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
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Danh Sách Chương ({chapters.length} chương đã dịch)
              </h2>
            </div>
            {isPending ? (
              <div className="p-6">
                <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
              </div>
            ) : chapters.length === 0 ? (
              <div className="p-6">
                <p className="text-zinc-600 dark:text-zinc-400">Chưa có chương nào đã dịch</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.chapterNumber}
                    onClick={() => router.push(`/read/${selectedStoryId}/${chapter.chapterNumber}`)}
                    className="w-full px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-16 sm:w-20">
                        <span className="inline-block px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-sm font-medium">
                          Ch. {chapter.chapterNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-zinc-900 dark:text-zinc-50 leading-relaxed">
                          {chapter.title}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <svg 
                          className="w-5 h-5 text-zinc-400 dark:text-zinc-500" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
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

