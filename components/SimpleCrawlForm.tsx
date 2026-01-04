'use client';

import { useState } from 'react';

interface SimpleCrawlFormProps {
  storyId: string | null;
  onSuccess: () => void;
}

export default function SimpleCrawlForm({ storyId, onSuccess }: SimpleCrawlFormProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [totalPages, setTotalPages] = useState(13);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCrawlList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn một truyện trước' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          apiUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã crawl ${data.data.total} chương!`,
        });
        setApiUrl('');
        onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  const handleCrawlAllPages = async () => {
    if (!storyId || !apiUrl) {
      setMessage({ type: 'error', text: 'Vui lòng nhập API URL trước' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/list/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          baseApiUrl: apiUrl,
          totalPages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã crawl ${data.data.total} chương từ ${data.data.pagesCrawled} trang!`,
        });
        setApiUrl('');
        onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  const handleCrawlChapters = async () => {
    if (!storyId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn một truyện trước' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/chapters/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
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
        onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
        Crawl Truyện
      </h2>
      <div className="space-y-4">
        <form onSubmit={handleCrawlList} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              API URL (trang 1)
            </label>
            <input
              type="url"
              required
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              placeholder="https://metruyenchu.com.vn/get/listchap/102298?page=1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tổng số trang (mặc định: 13)
            </label>
            <input
              type="number"
              min="1"
              value={totalPages}
              onChange={(e) => setTotalPages(parseInt(e.target.value) || 13)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !storyId}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Đang crawl...' : 'Crawl Trang 1'}
            </button>
            <button
              type="button"
              onClick={handleCrawlAllPages}
              disabled={loading || !storyId || !apiUrl}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Đang crawl...' : `Crawl Tất Cả (${totalPages} trang)`}
            </button>
          </div>
        </form>

        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <button
            onClick={handleCrawlChapters}
            disabled={loading || !storyId}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang crawl...' : 'Crawl Nội Dung Chương (10 chương/lần)'}
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
  );
}

