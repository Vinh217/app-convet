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
  url: string;
  status: string;
}

export default function CrawlPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleBatchCrawl = async () => {
    if (!selectedStoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện' });
      return;
    }

    setCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/chapters/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: selectedStoryId,
          limit: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successCount = data.data.results.filter((r: { status: string }) => r.status === 'success').length;
        setMessage({
          type: 'success',
          text: `Đã crawl ${successCount}/${data.data.processed} chương!`,
        });
        fetchChapters(selectedStoryId);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setCrawling(false);
    }
  };

  const handleCrawlAll = async () => {
    if (!selectedStoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện' });
      return;
    }

    if (pendingChapters.length === 0) {
      setMessage({ type: 'error', text: 'Không còn chương nào cần crawl' });
      return;
    }

    if (!confirm(`Bạn có chắc muốn crawl tất cả ${pendingChapters.length} chương? Quá trình này có thể mất nhiều thời gian.`)) {
      return;
    }

    setCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/chapters/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: selectedStoryId,
          batchSize: 10, // Xử lý 10 chương/batch
          delay: 1000, // Delay 1s giữa các batch
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã crawl ${data.data.success}/${data.data.total} chương thành công! (${data.data.failed} thất bại)`,
        });
        fetchChapters(selectedStoryId);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setCrawling(false);
    }
  };

  const handleCrawlSingle = async (chapterId: string) => {
    setCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã crawl chương thành công!`,
        });
        if (selectedStoryId) {
          fetchChapters(selectedStoryId);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setCrawling(false);
    }
  };

  const pendingChapters = chapters.filter(ch => !ch.originalContent || ch.originalContent.trim() === '');
  const crawledChapters = chapters.filter(ch => ch.originalContent && ch.originalContent.trim() !== '');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Crawl Nội Dung Chương
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
                  Crawl Hàng Loạt
                </h2>
                <div className="space-y-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <p>Chương chưa crawl: {pendingChapters.length}</p>
                    <p>Chương đã crawl: {crawledChapters.length}</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleBatchCrawl}
                      disabled={crawling || pendingChapters.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {crawling ? 'Đang crawl...' : 'Crawl Hàng Loạt (10 chương/lần)'}
                    </button>
                    <button
                      onClick={handleCrawlAll}
                      disabled={crawling || pendingChapters.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {crawling ? 'Đang crawl tất cả...' : `Crawl Tất Cả (${pendingChapters.length} chương)`}
                    </button>
                  </div>
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
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Danh Sách Chương ({chapters.length})
              </h2>
              {loading ? (
                <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
              ) : chapters.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  {selectedStoryId ? 'Chưa có chương nào' : 'Vui lòng chọn truyện'}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter._id}
                      className={`p-3 rounded border ${
                        chapter.originalContent && chapter.originalContent.trim() !== ''
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-black dark:text-zinc-50">
                            {chapter.chapterNumber}. {chapter.title}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            {chapter.originalContent 
                              ? `${chapter.originalContent.length} ký tự` 
                              : 'Chưa có nội dung'}
                          </p>
                          <a
                            href={chapter.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                          >
                            {chapter.url}
                          </a>
                        </div>
                        <div className="flex gap-2">
                          {!chapter.originalContent && (
                            <button
                              onClick={() => handleCrawlSingle(chapter._id)}
                              disabled={crawling}
                              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                            >
                              Crawl
                            </button>
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              chapter.originalContent
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {chapter.originalContent ? 'Đã crawl' : 'Chưa crawl'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

