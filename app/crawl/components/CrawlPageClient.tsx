'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CrawlListForm from './CrawlListForm';
import ChapterList from './ChapterList';
import { getChaptersPaginated } from '../actions';

interface Story {
  _id: string;
  title: string;
}

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  originalContent: string;
  url: string;
  status: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface CrawlPageClientProps {
  initialStories: Story[];
  initialChapters?: Chapter[];
  initialPagination?: Pagination;
  initialSearch?: string;
  initialStatus?: string;
}

export default function CrawlPageClient({
  initialStories,
  initialChapters = [],
  initialPagination = { page: 1, limit: 100, total: 0, totalPages: 1, hasMore: false },
}: CrawlPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stories] = useState<Story[]>(initialStories);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [crawling, setCrawling] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get current storyId from URL (source of truth)
  const selectedStoryId = searchParams.get('storyId') || '';
  
  // Use props directly - they come from server and update when searchParams change
  const chapters = initialChapters;
  const pagination = initialPagination;
  
  // Track previous storyId to reset selectedChapters when it changes
  const prevStoryIdRef = useRef(selectedStoryId);
  const shouldResetSelection = prevStoryIdRef.current !== selectedStoryId;
  if (shouldResetSelection) {
    prevStoryIdRef.current = selectedStoryId;
    // Reset in next tick to avoid render issues
    setTimeout(() => setSelectedChapters([]), 0);
  }

  // Update URL searchParams and trigger server-side re-render
  const updateSearchParams = useCallback((updates: {
    storyId?: string | null;
    page?: number;
    search?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.storyId !== undefined) {
      if (updates.storyId) {
        params.set('storyId', updates.storyId);
        // Reset page when story changes
        params.delete('page');
      } else {
        params.delete('storyId');
        params.delete('page');
        params.delete('search');
        params.delete('status');
      }
    }
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set('page', updates.page.toString());
      } else {
        params.delete('page');
      }
    }
    
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search);
        // Reset page when search changes
        params.delete('page');
      } else {
        params.delete('search');
      }
    }
    
    if (updates.status !== undefined) {
      if (updates.status && updates.status !== 'all') {
        params.set('status', updates.status);
        // Reset page when status changes
        params.delete('page');
      } else {
        params.delete('status');
      }
    }

    router.push(`/crawl?${params.toString()}`);
  }, [router, searchParams]);

  const handleStoryChange = (storyId: string) => {
    setSelectedChapters([]);
    updateSearchParams({ storyId: storyId || null });
  };

  const handleSearchChange = (searchValue: string) => {
    updateSearchParams({ search: searchValue });
  };

  const handleStatusChange = (status: string) => {
    updateSearchParams({ status });
  };

  // For load more, we need to maintain loaded chapters in state
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([]);
  const [loadedPagination, setLoadedPagination] = useState<Pagination>(initialPagination);
  
  // Track searchParams to detect when to reset loaded chapters
  const searchParamsKey = `${selectedStoryId}-${searchParams.get('search') || ''}-${searchParams.get('status') || 'all'}`;
  const prevSearchParamsKeyRef = useRef(searchParamsKey);
  const shouldResetLoaded = searchParamsKey !== prevSearchParamsKeyRef.current;
  
  if (shouldResetLoaded) {
    prevSearchParamsKeyRef.current = searchParamsKey;
    // Reset in next tick to avoid render issues
    setTimeout(() => {
      setLoadedChapters([]);
      setLoadedPagination(initialPagination);
    }, 0);
  }

  const handleLoadMore = useCallback(async () => {
    if (!selectedStoryId || loadingMore || !loadedPagination.hasMore) return;

    const nextPage = loadedPagination.page + 1;
    setLoadingMore(true);

    try {
      // Get current search and status from URL
      const currentSearch = searchParams.get('search') || '';
      const currentStatus = searchParams.get('status') || 'all';
      
      // Fetch next page client-side and append
      const result = await getChaptersPaginated({
        storyId: selectedStoryId,
        page: nextPage,
        limit: 100,
        status: currentStatus === 'all' ? undefined : currentStatus,
        search: currentSearch,
      });

      if (result.success && result.data) {
        const newChapters = result.data.chapters.map((ch: Chapter) => ({
          ...ch,
          _id: ch._id.toString(),
        }));
        setLoadedChapters(prev => [...prev, ...newChapters]);
        setLoadedPagination(result.data.pagination);
        // Update URL to reflect current page
        updateSearchParams({ page: nextPage });
      }
    } catch (error) {
      console.error('Error loading more chapters:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedStoryId, loadedPagination, loadingMore, searchParams, updateSearchParams]);

  // Use loaded chapters if we have them, otherwise use initial chapters
  const displayChapters = loadedChapters.length > 0 ? loadedChapters : chapters;
  const displayPagination = loadedChapters.length > 0 ? loadedPagination : pagination;

  const handleCrawlSelected = async () => {
    if (selectedChapters.length === 0) {
      return;
    }

    setCrawling(true);
    try {
      const response = await fetch('/api/crawl/chapters/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterIds: selectedChapters }),
      });

      const data = await response.json();

      if (data.success) {
        const successCount = data.data.summary.success;
        alert(`Đã crawl ${successCount}/${selectedChapters.length} chương thành công!`);
        setSelectedChapters([]);
        // Refresh page to get updated data from server
        router.refresh();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setCrawling(false);
    }
  };

  const handleCrawlAll = async () => {
    // Get all pending chapters from API
    const result = await getChaptersPaginated({
      storyId: selectedStoryId,
      page: 1,
      limit: 10000, // Large limit to get all
      status: 'pending',
    });

    if (!result.success || !result.data) {
      alert('Không thể lấy danh sách chương');
      return;
    }

    const pendingChapters = result.data.chapters.filter(
      ch => !ch.originalContent || ch.originalContent.trim() === ''
    );

    if (pendingChapters.length === 0) {
      return;
    }

    setCrawling(true);
    try {
      const response = await fetch('/api/crawl/chapters/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterIds: pendingChapters.map(ch => ch._id),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successCount = data.data.summary.success;
        alert(`Đã crawl ${successCount}/${pendingChapters.length} chương thành công!`);
        // Refresh page to get updated data from server
        router.refresh();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-2xl">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Crawl Truyện</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Step 1 - Crawl List */}
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bước 1: Crawl Danh sách Chương</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Chọn Truyện
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {selectedStoryId && (
                  <CrawlListForm
                    storyId={selectedStoryId}
                    onCrawlSuccess={() => {
                      // Refresh page to get updated data from server
                      router.refresh();
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Step 2 - Crawl Content */}
        <div className="xl:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Bước 2: Crawl Nội dung Chương</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {!selectedStoryId ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60 py-12">
                  <p>Chọn truyện và crawl danh sách chương trước</p>
                </div>
              ) : (
                <ChapterList
                  chapters={displayChapters}
                  selectedChapters={selectedChapters}
                  onSelectionChange={setSelectedChapters}
                  onCrawlSelected={handleCrawlSelected}
                  onCrawlAll={handleCrawlAll}
                  onSearchChange={handleSearchChange}
                  onStatusChange={handleStatusChange}
                  onLoadMore={displayPagination.hasMore ? handleLoadMore : undefined}
                  loading={false}
                  loadingMore={loadingMore}
                  crawling={crawling}
                  initialSearch={searchParams.get('search') || ''}
                  initialStatus={searchParams.get('status') || 'all'}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

