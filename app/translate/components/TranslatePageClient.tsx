'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { 
  getChaptersPaginated, 
  getChaptersByRange,
  getChaptersByList,
  getChaptersFrom
} from '../actions';
import { parseSearchQuery } from '../utils/searchParser';
import type { Chapter } from './types';
import VirtualChapterList from './VirtualChapterList';
import ChapterFilters from './ChapterFilters';

interface Story {
  _id: string;
  title: string;
  totalChapters?: number;
}

interface TranslatePageClientProps {
  initialStories: Story[];
  initialStoryId?: string | null;
  initialChapters?: Chapter[];
}

export default function TranslatePageClient({
  initialStories,
  initialStoryId = null,
  initialChapters = [],
}: TranslatePageClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [stories] = useState<Story[]>(initialStories);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(initialStoryId || '');
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangePendingOnly, setRangePendingOnly] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);

  const resetChaptersState = () => {
    setChapters([]);
    setPage(1);
    setHasMore(true);
    setSelectedChapters(new Set());
  };

  const fetchChapters = async (opts?: { append?: boolean; nextPage?: number }) => {
    if (!selectedStoryId) return;

    const isAppend = opts?.append ?? false;
    const targetPage = opts?.nextPage ?? 1;

    // Parse search query for smart search patterns
    const parsed = parseSearchQuery(search);
    const effectiveStatus = parsed.status || (statusFilter === 'all' ? undefined : statusFilter);

    // Handle smart search patterns
    if (parsed.type === 'range' && parsed.from && parsed.to) {
      // Range search: fetch all chapters in range (no pagination)
      if (!isAppend) {
        setLoading(true);
        try {
          const result = await getChaptersByRange({
            storyId: selectedStoryId,
            from: parsed.from,
            to: parsed.to,
            status: effectiveStatus,
          });
          if (result.success && result.data) {
            setChapters(result.data.chapters);
            setPage(1);
            setHasMore(false);
          }
        } catch (error) {
          console.error('Error fetching chapters by range:', error);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    if (parsed.type === 'list' && parsed.numbers && parsed.numbers.length > 0) {
      // List search: fetch specific chapters
      if (!isAppend) {
        setLoading(true);
        try {
          const result = await getChaptersByList({
            storyId: selectedStoryId,
            numbers: parsed.numbers,
            status: effectiveStatus,
          });
          if (result.success && result.data) {
            setChapters(result.data.chapters);
            setPage(1);
            setHasMore(false);
          }
        } catch (error) {
          console.error('Error fetching chapters by list:', error);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    if (parsed.type === 'from' && parsed.from) {
      // From onwards: fetch all chapters from number onwards
      if (!isAppend) {
        setLoading(true);
        try {
          const result = await getChaptersFrom({
            storyId: selectedStoryId,
            from: parsed.from,
            status: effectiveStatus,
          });
          if (result.success && result.data) {
            setChapters(result.data.chapters);
            setPage(1);
            setHasMore(false);
          }
        } catch (error) {
          console.error('Error fetching chapters from:', error);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    // Normal paginated search
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getChaptersPaginated({
        storyId: selectedStoryId,
        page: targetPage,
        limit: 50,
        status: effectiveStatus,
        search: parsed.type === 'normal' ? parsed.originalQuery : undefined,
      });

      if (result.success && result.data) {
        const { chapters: newChapters, pagination } = result.data;
        setChapters((prev) => (isAppend ? [...prev, ...newChapters] : newChapters));
        setPage(pagination.page);
        setHasMore(pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      if (isAppend) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Initial fetch when story or filters change
  useEffect(() => {
    if (!selectedStoryId) return;
    resetChaptersState();
    fetchChapters({ append: false, nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoryId, statusFilter, search]);

  const handleStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    resetChaptersState();

    // Update URL với searchParams
    startTransition(() => {
      const params = new URLSearchParams();
      if (storyId) {
        params.set('storyId', storyId);
      }
      const url = params.toString() ? `/translate?${params.toString()}` : '/translate';
      router.push(url);
    });
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
          text: `Đã bắt đầu dịch ${finalChapterIds.length} chương trong background. Vui lòng refresh để xem cập nhật.`,
        });
        setSelectedChapters(new Set());
        // Refresh chapters after a delay
        setTimeout(() => {
          if (selectedStoryId) {
            fetchChapters({ append: false, nextPage: 1 });
          }
        }, 2000);
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

  const pendingChapters = chapters.filter(
    (ch) => ch.status === 'pending' && ch.originalContent && ch.originalContent.trim()
  );
  const translatedChapters = chapters.filter((ch) => ch.status === 'completed');
  const chaptersWithContent = chapters.filter(
    (ch) => ch.originalContent && ch.originalContent.trim()
  );

  const stats = {
    pending: pendingChapters.length,
    completed: translatedChapters.length,
    translating: chapters.filter((ch) => ch.status === 'translating').length,
    failed: chapters.filter((ch) => ch.status === 'failed').length,
    total: chapters.length,
  };

  const handleSelectRange = async () => {
    if (!selectedStoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện trước khi chọn dải chương' });
      return;
    }

    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);

    if (isNaN(from) || isNaN(to)) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số chương hợp lệ' });
      return;
    }

    if (from <= 0 || to <= 0) {
      setMessage({ type: 'error', text: 'Số chương phải lớn hơn 0' });
      return;
    }

    if (to < from) {
      setMessage({ type: 'error', text: 'Chương kết thúc phải lớn hơn hoặc bằng chương bắt đầu' });
      return;
    }

    setRangeLoading(true);
    setMessage(null);

    try {
      const result = await getChaptersByRange({
        storyId: selectedStoryId,
        from,
        to,
        status: rangePendingOnly ? 'pending' : undefined,
      });

      if (!result.success || !result.data) {
        setMessage({ type: 'error', text: 'Không lấy được danh sách chương trong dải' });
        return;
      }

      const rangeChapters: Chapter[] = result.data.chapters;

      if (rangeChapters.length === 0) {
        setMessage({
          type: 'error',
          text: 'Không có chương nào trong dải (hoặc không khớp trạng thái lọc)',
        });
        return;
      }

      // Cập nhật danh sách chương để hiển thị đầy đủ dải
      setChapters((prev) => {
        const byId = new Map<string, Chapter>();
        prev.forEach((ch) => byId.set(ch._id, ch));
        rangeChapters.forEach((ch) => {
          byId.set(ch._id, ch);
        });
        const merged = Array.from(byId.values());
        merged.sort((a, b) => a.chapterNumber - b.chapterNumber);
        return merged;
      });

      // Chọn tất cả chương trong dải
      setSelectedChapters((prev) => {
        const next = new Set(prev);
        rangeChapters.forEach((ch) => next.add(ch._id));
        return next;
      });

      setMessage({
        type: 'success',
        text: `Đã chọn ${rangeChapters.length} chương từ ${from} đến ${to}${
          rangePendingOnly ? ' (chỉ chương chờ dịch)' : ''
        }`,
      });
    } catch (error) {
      console.error('Error selecting range:', error);
      setMessage({ type: 'error', text: 'Lỗi khi chọn dải chương' });
    } finally {
      setRangeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dịch Truyện</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Chọn truyện, lọc chương và dịch hàng loạt với giao diện hiện đại.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-gradient-to-b from-zinc-50/90 to-white dark:from-zinc-900/80 dark:to-zinc-950 shadow-lg shadow-zinc-900/5 rounded-3xl border-zinc-100/80 dark:border-zinc-800/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Chọn Truyện & Dịch</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                  Inngest background
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Truyện cần dịch
                </label>
                <div className="relative">
                  <select
                    value={selectedStoryId}
                    onChange={(e) => handleStoryChange(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 pr-10 text-base text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none cursor-pointer shadow-sm transition-all"
                  >
                    <option value="">-- Chọn truyện --</option>
                    {stories.map((story) => (
                      <option key={story._id} value={story._id}>
                        {story.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {selectedStoryId && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Chờ dịch</p>
                      <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                        {stats.pending}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-green-50/80 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                      <p className="text-xs text-green-700 mb-1 dark:text-green-300">Đã dịch</p>
                      <p className="font-bold text-lg text-green-800 dark:text-green-200">
                        {stats.completed}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Chọn dải chương nhanh
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Từ (vd: 146)"
                        value={rangeFrom}
                        onChange={(e) => setRangeFrom(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Đến (vd: 150)"
                        value={rangeTo}
                        onChange={(e) => setRangeTo(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={rangePendingOnly}
                        onChange={(e) => setRangePendingOnly(e.target.checked)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      Chỉ chọn chương đang chờ dịch
                    </label>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleSelectRange}
                      isLoading={rangeLoading}
                      className="w-full rounded-2xl text-xs"
                    >
                      Chọn dải chương
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-2xl"
                      onClick={() => {
                        const newSelected = new Set(selectedChapters);
                        chaptersWithContent.forEach((ch) => newSelected.add(ch._id));
                        setSelectedChapters(newSelected);
                      }}
                      disabled={chaptersWithContent.length === 0}
                    >
                      Chọn Tất Cả
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-2xl"
                      onClick={() => setSelectedChapters(new Set())}
                      disabled={selectedChapters.size === 0}
                    >
                      Bỏ Chọn
                    </Button>
                  </div>

                  <Button
                    className="w-full rounded-2xl"
                    onClick={handleBatchTranslate}
                    isLoading={translating}
                    disabled={
                      translating ||
                      !selectedStoryId ||
                      (selectedChapters.size === 0 && pendingChapters.length === 0)
                    }
                  >
                    <GlobeAltIcon className="w-5 h-5 mr-2" />
                    {selectedChapters.size > 0
                      ? `Dịch ${selectedChapters.size} Chương`
                      : 'Dịch Tiếp 5 Chương'}
                  </Button>

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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Chapter List */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="rounded-3xl border-zinc-100/80 dark:border-zinc-800/80 bg-gradient-to-b from-zinc-50/80 to-white dark:from-zinc-900/80 dark:to-zinc-950 shadow-lg shadow-zinc-900/5">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Danh Sách Chương</CardTitle>
                {selectedStoryId && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Đã chọn {selectedChapters.size} chương
                  </span>
                )}
              </div>
              {selectedStoryId && (
                <ChapterFilters
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  onSearchChange={setSearch}
                  onRefresh={() => fetchChapters({ append: false, nextPage: 1 })}
                  loading={loading}
                />
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {!selectedStoryId ? (
                <div className="h-[360px] flex flex-col items-center justify-center text-zinc-500">
                  <GlobeAltIcon className="w-16 h-16 mb-4 opacity-70" />
                  <p>Chọn truyện để bắt đầu xem và dịch chương.</p>
                </div>
              ) : loading && chapters.length === 0 ? (
                <div className="h-[360px] flex flex-col items-center justify-center text-zinc-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50 mb-4" />
                  <p>Đang tải chương...</p>
                </div>
              ) : chapters.length === 0 ? (
                <div className="h-[360px] flex flex-col items-center justify-center text-zinc-500">
                  <GlobeAltIcon className="w-16 h-16 mb-4 opacity-70" />
                  <p>Không tìm thấy chương nào với bộ lọc hiện tại.</p>
                </div>
              ) : (
                <VirtualChapterList
                  chapters={chapters}
                  hasMore={hasMore}
                  isLoadingMore={loadingMore}
                  onLoadMore={() =>
                    hasMore && !loadingMore && fetchChapters({ append: true, nextPage: page + 1 })
                  }
                  selectedChapters={selectedChapters}
                  onToggleChapter={toggleChapterSelection}
                  selectedStoryId={selectedStoryId}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
