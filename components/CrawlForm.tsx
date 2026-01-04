'use client';

import { useState } from 'react';

interface CrawlFormProps {
  storyId: string | null;
  onSuccess: () => void;
}

export default function CrawlForm({ storyId, onSuccess }: CrawlFormProps) {
  const [formData, setFormData] = useState({
    url: '',
    mode: 'single' as 'single' | 'list',
    selectors: {
      titleSelector: '',
      contentSelector: '',
      nextSelector: '',
      listSelector: '',
      linkSelector: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [autoCrawling, setAutoCrawling] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detectedPreset, setDetectedPreset] = useState<string | null>(null);

  const handleDetect = async () => {
    if (!formData.url) {
      setMessage({ type: 'error', text: 'Vui lòng nhập URL trước' });
      return;
    }

    setDetecting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url,
          mode: formData.mode,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.selectors) {
        const selectors = data.data.selectors;
        setFormData(prev => ({
          ...prev,
          selectors: {
            titleSelector: selectors.titleSelector || prev.selectors.titleSelector,
            contentSelector: selectors.contentSelector || prev.selectors.contentSelector,
            nextSelector: selectors.nextSelector || prev.selectors.nextSelector,
            listSelector: selectors.listSelector || prev.selectors.listSelector,
            linkSelector: selectors.linkSelector || prev.selectors.linkSelector,
          },
        }));
        
        if (data.data.preset) {
          setDetectedPreset(data.data.preset);
          setMessage({ type: 'success', text: `Đã phát hiện: ${data.data.preset}` });
        } else {
          setDetectedPreset(null);
          setMessage({ type: 'success', text: 'Đã tự động phát hiện selectors!' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể phát hiện selectors' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setDetecting(false);
    }
  };

  const handleAutoCrawl = async () => {
    if (!storyId || !formData.url) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện và nhập URL trang truyện' });
      return;
    }

    setAutoCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          storyUrl: formData.url,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.data.message || `Đã crawl ${data.data.total} chương!`,
        });
        onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setAutoCrawling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn một truyện trước' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          url: formData.url,
          mode: formData.mode,
          selectors: formData.selectors,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: formData.mode === 'list' 
            ? `Đã crawl ${data.data.total} chương!`
            : 'Crawl chương thành công!',
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => {
                setFormData({ ...formData, url: e.target.value });
                setDetectedPreset(null);
              }}
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
              placeholder="https://metruyenchu.com.vn/..."
            />
            <button
              type="button"
              onClick={handleDetect}
              disabled={detecting || !formData.url}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {detecting ? 'Đang tìm...' : 'Tự động phát hiện'}
            </button>
          </div>
          {detectedPreset && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Đã phát hiện: {detectedPreset}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Chế độ
          </label>
          <select
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'single' | 'list' })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
          >
            <option value="single">Crawl một chương</option>
            <option value="list">Crawl danh sách chương</option>
          </select>
        </div>

        {formData.mode === 'single' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title Selector (CSS)
              </label>
              <input
                type="text"
                value={formData.selectors.titleSelector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectors: { ...formData.selectors, titleSelector: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="h1.title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Content Selector (CSS) *
              </label>
              <input
                type="text"
                required
                value={formData.selectors.contentSelector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectors: { ...formData.selectors, contentSelector: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="div.content p"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Next Chapter Selector (CSS)
              </label>
              <input
                type="text"
                value={formData.selectors.nextSelector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectors: { ...formData.selectors, nextSelector: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="a.next"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                List Selector (CSS) *
              </label>
              <input
                type="text"
                required
                value={formData.selectors.listSelector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectors: { ...formData.selectors, listSelector: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="ul.chapter-list li"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title Selector (CSS) *
              </label>
              <input
                type="text"
                required
                value={formData.selectors.titleSelector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectors: { ...formData.selectors, titleSelector: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="a"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Link Selector (CSS) *
              </label>
              <input
                type="text"
                required
                value={formData.selectors.linkSelector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selectors: { ...formData.selectors, linkSelector: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                placeholder="a"
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          {detectedPreset && formData.mode === 'list' && (
            <button
              type="button"
              onClick={handleAutoCrawl}
              disabled={autoCrawling || !storyId}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {autoCrawling ? 'Đang crawl...' : 'Crawl Tự Động'}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !storyId}
            className={`${detectedPreset && formData.mode === 'list' ? 'flex-1' : 'w-full'} bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Đang crawl...' : 'Bắt đầu Crawl'}
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
      </form>
    </div>
  );
}

