'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { BoltIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

interface CrawlListFormProps {
  storyId: string;
  onCrawlSuccess: () => void;
}

interface PreviewChapter {
  title: string;
  url: string;
  chapterNumber: number;
}

export default function CrawlListForm({ storyId, onCrawlSuccess }: CrawlListFormProps) {
  const [url, setUrl] = useState('');
  const [storyIdFromUrl, setStoryIdFromUrl] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [detecting, setDetecting] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewChapters, setPreviewChapters] = useState<PreviewChapter[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detectedPreset, setDetectedPreset] = useState<string | null>(null);
  const [selectors, setSelectors] = useState({
    listSelector: '',
    titleSelector: '',
    linkSelector: '',
  });

  const handleDetect = async () => {
    if (!url) {
      setMessage({ type: 'error', text: 'Vui lòng nhập URL trước' });
      return;
    }

    // Check if URL is metruyenchu API endpoint
    const apiMatch = url.match(/metruyenchu\.com\.vn\/get\/listchap\/(\d+)/);
    if (apiMatch) {
      setStoryIdFromUrl(apiMatch[1]);
      setDetectedPreset('Metruyenchu.com.vn');
      setMessage({ type: 'success', text: `Đã phát hiện: Metruyenchu.com.vn (Story ID: ${apiMatch[1]})` });
      return;
    }

    setDetecting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode: 'list' }),
      });

      const data = await response.json();

      if (data.success && data.data.selectors) {
        const newSelectors = data.data.selectors;
        setSelectors(prev => ({
          listSelector: newSelectors.listSelector || prev.listSelector,
          titleSelector: newSelectors.titleSelector || prev.titleSelector,
          linkSelector: newSelectors.linkSelector || prev.linkSelector,
        }));
        
        if (data.data.preset) {
          setDetectedPreset(data.data.preset);
          setMessage({ type: 'success', text: `Đã phát hiện: ${data.data.preset}` });
          
          // For metruyenchu, try to extract story ID from URL
          if (data.data.preset === 'Metruyenchu.com.vn') {
            const urlMatch = url.match(/\/truyen\/(\d+)/) || url.match(/storyId=(\d+)/);
            if (urlMatch) {
              setStoryIdFromUrl(urlMatch[1]);
            }
          }
        } else {
          setDetectedPreset(null);
          setMessage({ type: 'success', text: 'Đã tự động phát hiện selectors!' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể phát hiện selectors' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setDetecting(false);
    }
  };

  const handlePreview = async () => {
    if (!storyId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện trước' });
      return;
    }

    // Check if URL is metruyenchu API endpoint or regular metruyenchu URL
    const apiMatch = url.match(/metruyenchu\.com\.vn\/get\/listchap\/(\d+)/);
    const isMetruyenchu = apiMatch || url.includes('metruyenchu.com.vn');
    const finalStoryIdFromUrl = apiMatch ? apiMatch[1] : storyIdFromUrl;

    if (isMetruyenchu && !finalStoryIdFromUrl) {
      setMessage({ type: 'error', text: 'Vui lòng nhập Story ID (từ URL truyện) hoặc URL API' });
      return;
    }

    if (!isMetruyenchu && (!selectors.listSelector || !selectors.titleSelector || !selectors.linkSelector)) {
      setMessage({ type: 'error', text: 'Vui lòng detect selectors trước' });
      return;
    }

    setPreviewing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          url: isMetruyenchu ? (apiMatch ? url : undefined) : url,
          storyIdFromUrl: isMetruyenchu ? finalStoryIdFromUrl : undefined,
          totalPages: isMetruyenchu ? totalPages : undefined,
          selectors: isMetruyenchu ? undefined : selectors,
          preview: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewChapters(data.data.chapters || []);
        setMessage({
          type: 'success',
          text: `Tìm thấy ${data.data.total} chương`,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setPreviewing(false);
    }
  };

  const handleCrawl = async () => {
    if (!storyId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện trước' });
      return;
    }

    // Check if URL is metruyenchu API endpoint or regular metruyenchu URL
    const apiMatch = url.match(/metruyenchu\.com\.vn\/get\/listchap\/(\d+)/);
    const isMetruyenchu = apiMatch || url.includes('metruyenchu.com.vn');
    const finalStoryIdFromUrl = apiMatch ? apiMatch[1] : storyIdFromUrl;

    if (isMetruyenchu && !finalStoryIdFromUrl) {
      setMessage({ type: 'error', text: 'Vui lòng nhập Story ID (từ URL truyện) hoặc URL API' });
      return;
    }

    if (!isMetruyenchu && (!selectors.listSelector || !selectors.titleSelector || !selectors.linkSelector)) {
      setMessage({ type: 'error', text: 'Vui lòng detect selectors trước' });
      return;
    }

    setCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          url: isMetruyenchu ? (apiMatch ? url : undefined) : url,
          storyIdFromUrl: isMetruyenchu ? finalStoryIdFromUrl : undefined,
          totalPages: isMetruyenchu ? totalPages : undefined,
          selectors: isMetruyenchu ? undefined : selectors,
          preview: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã crawl ${data.data.total} chương!${data.data.skipped ? ` (Bỏ qua ${data.data.skipped} chương trùng)` : ''}`,
        });
        setPreviewChapters([]);
        onCrawlSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setCrawling(false);
    }
  };

  // Check if URL is metruyenchu API endpoint or regular metruyenchu URL
  const apiMatch = url.match(/metruyenchu\.com\.vn\/get\/listchap\/(\d+)/);
  const isMetruyenchu = apiMatch || url.includes('metruyenchu.com.vn');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          URL Trang Danh sách Chương
        </label>
        <div className="flex gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setDetectedPreset(null);
              setPreviewChapters([]);
            }}
            placeholder="https://metruyenchu.com.vn/truyen/..."
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={handleDetect}
            disabled={detecting || !url}
            className="rounded-2xl"
          >
            {detecting ? (
              <div className="animate-spin h-5 w-5 border-2 border-zinc-500 rounded-full border-t-transparent"></div>
            ) : (
              <BoltIcon className="w-5 h-5" />
            )}
          </Button>
        </div>
        {detectedPreset && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            ✓ Đã phát hiện: {detectedPreset}
          </p>
        )}
      </div>

      {isMetruyenchu && (
        <>
          {!apiMatch && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Story ID (từ URL truyện)
              </label>
              <Input
                type="text"
                value={storyIdFromUrl}
                onChange={(e) => setStoryIdFromUrl(e.target.value)}
                placeholder="102298"
                className="rounded-2xl"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Story ID từ web gốc (metruyenchu), lấy từ URL: https://metruyenchu.com.vn/truyen/102298/...
                <br />
                Hoặc nhập URL API trực tiếp: https://metruyenchu.com.vn/get/listchap/102298?page=1
              </p>
            </div>
          )}
          {apiMatch && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                ✓ Đã tự động phát hiện Story ID từ web gốc: <strong>{apiMatch[1]}</strong>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                (Dùng để call API metruyenchu, chapters sẽ được lưu vào Story ID MongoDB của bạn)
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Số Trang (nếu có nhiều trang)
            </label>
            <Input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(parseInt(e.target.value) || 1)}
              min="1"
              className="rounded-2xl"
            />
          </div>
        </>
      )}

      {!isMetruyenchu && (
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 uppercase">Selectors (CSS)</p>
          <Input
            label="List Item *"
            value={selectors.listSelector}
            onChange={(e) => setSelectors({ ...selectors, listSelector: e.target.value })}
            placeholder="ul.list-chapter li"
            className="rounded-2xl"
          />
          <Input
            label="Chapter Title *"
            value={selectors.titleSelector}
            onChange={(e) => setSelectors({ ...selectors, titleSelector: e.target.value })}
            placeholder="a"
            className="rounded-2xl"
          />
          <Input
            label="Chapter Link *"
            value={selectors.linkSelector}
            onChange={(e) => setSelectors({ ...selectors, linkSelector: e.target.value })}
            placeholder="a"
            className="rounded-2xl"
          />
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-2xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {previewChapters.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Preview ({previewChapters.length} chương):
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {previewChapters.slice(0, 10).map((ch, idx) => (
              <div key={idx} className="text-xs text-zinc-600 dark:text-zinc-400">
                Chương {ch.chapterNumber}: {ch.title}
              </div>
            ))}
            {previewChapters.length > 10 && (
              <div className="text-xs text-zinc-500">... và {previewChapters.length - 10} chương khác</div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={handlePreview}
          isLoading={previewing}
          disabled={!storyId || crawling}
          className="flex-1 rounded-2xl"
        >
          Preview
        </Button>
        <Button
          onClick={handleCrawl}
          isLoading={crawling}
          disabled={!storyId || previewing}
          className="flex-1 rounded-2xl"
        >
          <CloudArrowDownIcon className="w-5 h-5 mr-2" />
          Crawl Danh sách
        </Button>
      </div>
    </div>
  );
}

