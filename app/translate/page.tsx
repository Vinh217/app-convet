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
  originalContent: string;
  translatedContent?: string;
  status: string;
}

export default function TranslatePage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      const response = await fetch(`/api/stories/${storyId}/chapters`);
      const data = await response.json();
      if (data.success) {
        const chaptersWithStringId = data.data.map((chapter: { _id: { toString: () => string } | string; [key: string]: unknown }) => ({
          ...chapter,
          _id: typeof chapter._id === 'object' && chapter._id !== null && 'toString' in chapter._id 
            ? chapter._id.toString() 
            : String(chapter._id),
        }));
        setChapters(chaptersWithStringId as Chapter[]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchTranslate = async () => {
    if (!selectedStoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện' });
      return;
    }

    setTranslating(true);
    setMessage(null);

    try {
      const chapterIds = selectedChapters.size > 0
        ? Array.from(selectedChapters)
        : null;

      // Nếu không có chương được chọn, lấy 5 chương pending
      let finalChapterIds = chapterIds;
      if (!finalChapterIds || finalChapterIds.length === 0) {
        const pendingChapters = chapters.filter(ch => 
          ch.status === 'pending' && ch.originalContent && ch.originalContent.trim()
        ).slice(0, 5);
        finalChapterIds = pendingChapters.map(ch => ch._id);
      }

      if (!finalChapterIds || finalChapterIds.length === 0) {
        setMessage({ type: 'error', text: 'Không có chương nào để dịch' });
        setTranslating(false);
        return;
      }

      // Gọi API background translation
      const response = await fetch('/api/translate/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterIds: finalChapterIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã bắt đầu dịch ${finalChapterIds.length} chương trong background. Vui lòng refresh sau vài phút.`,
        });
        setSelectedChapters(new Set());
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setTranslating(false);
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(chapterId)) {
      newSelected.delete(chapterId);
    } else {
      newSelected.add(chapterId);
    }
    setSelectedChapters(newSelected);
  };


  const clearSelection = () => {
    setSelectedChapters(new Set());
  };

  const pendingChapters = chapters.filter(ch => ch.status === 'pending' && ch.originalContent);
  const translatedChapters = chapters.filter(ch => ch.status === 'completed');
  const chaptersWithContent = chapters.filter(ch => ch.originalContent && ch.originalContent.trim());
  
  // Filter chapters theo status
  const filteredChapters = statusFilter === 'all' 
    ? chapters 
    : chapters.filter(ch => ch.status === statusFilter);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Dịch Truyện
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md"
          >
            Về trang chủ
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Chọn Truyện
              </h2>
              <select
                value={selectedStoryId || ''}
                onChange={(e) => setSelectedStoryId(e.target.value || null)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
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
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Dịch Hàng Loạt
                </h2>
                <div className="space-y-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <p>Chương chờ dịch: {pendingChapters.length}</p>
                    <p>Chương đã dịch: {translatedChapters.length}</p>
                    <p className="mt-2 font-medium text-zinc-700 dark:text-zinc-300">
                      Đã chọn: {selectedChapters.size} chương
                    </p>
                  </div>
                  {chaptersWithContent.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newSelected = new Set(selectedChapters);
                          chaptersWithContent.forEach(ch => newSelected.add(ch._id));
                          setSelectedChapters(newSelected);
                        }}
                        className="flex-1 px-3 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-sm rounded-md"
                      >
                        Chọn Tất Cả
                      </button>
                      <button
                        onClick={clearSelection}
                        className="flex-1 px-3 py-2 bg-zinc-500 hover:bg-zinc-600 text-white text-sm rounded-md"
                      >
                        Bỏ Chọn
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleBatchTranslate}
                    disabled={translating || (selectedChapters.size === 0 && chaptersWithContent.length === 0)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {translating 
                      ? 'Đang dịch...' 
                      : selectedChapters.size > 0
                        ? `Dịch ${selectedChapters.size} Chương Đã Chọn`
                        : 'Dịch Hàng Loạt (5 chương/lần)'}
                  </button>
                  {message && (
                    <div
                      className={`p-3 rounded-md text-sm ${
                        message.type === 'success'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Chapter List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                  Danh Sách Chương ({filteredChapters.length}/{chapters.length})
                </h2>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 text-sm"
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ dịch</option>
                    <option value="translating">Đang dịch</option>
                    <option value="completed">Đã dịch</option>
                    <option value="failed">Lỗi</option>
                  </select>
                  <button
                    onClick={() => selectedStoryId && fetchChapters(selectedStoryId)}
                    disabled={loading || !selectedStoryId}
                    className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              {loading ? (
                <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
              ) : filteredChapters.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  {selectedStoryId 
                    ? `Không có chương nào với status "${statusFilter}"` 
                    : 'Vui lòng chọn truyện'}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredChapters.map((chapter) => {
                    const isSelected = selectedChapters.has(chapter._id);
                    const canSelect = chapter.originalContent && chapter.originalContent.trim();
                    return (
                      <div
                        key={chapter._id}
                        className={`p-3 rounded border transition-colors ${
                          canSelect ? 'cursor-pointer' : ''
                        } ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                            : chapter.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : chapter.status === 'translating'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : chapter.status === 'failed'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        }`}
                        onClick={() => canSelect && toggleChapterSelection(chapter._id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            {canSelect && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleChapterSelection(chapter._id)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-black dark:text-zinc-50">
                                {chapter.chapterNumber}. {chapter.title}
                              </p>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                {chapter.originalContent ? `${chapter.originalContent.length} ký tự` : 'Chưa có nội dung'}
                              </p>
                              {chapter.status === 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/compare/${selectedStoryId}/${chapter.chapterNumber}`);
                                  }}
                                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Xem so sánh
                                </button>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              chapter.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : chapter.status === 'translating'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {chapter.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

