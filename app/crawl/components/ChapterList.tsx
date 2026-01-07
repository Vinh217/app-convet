'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  url: string;
  originalContent: string;
  status: string;
}

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapters: string[];
  onSelectionChange: (chapterIds: string[]) => void;
  onCrawlSelected: () => void;
  onCrawlAll: () => void;
  onSearchChange?: (search: string) => void;
  onStatusChange?: (status: string) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  loadingMore?: boolean;
  crawling?: boolean;
  initialSearch?: string;
  initialStatus?: string;
}

export default function ChapterList({
  chapters,
  selectedChapters,
  onSelectionChange,
  onCrawlSelected,
  onCrawlAll,
  onSearchChange,
  onStatusChange,
  onLoadMore,
  loading = false,
  loadingMore = false,
  crawling = false,
  initialSearch = '',
  initialStatus = 'all',
}: ChapterListProps) {
  // Map initialStatus to filter format
  const getInitialFilter = (status: string): 'all' | 'pending' | 'crawled' => {
    if (status === 'pending') return 'pending';
    if (status === 'completed') return 'crawled';
    return 'all';
  };

  // Initialize state from props - use key prop to force re-render when props change
  const [filter, setFilter] = useState<'all' | 'pending' | 'crawled'>(getInitialFilter(initialStatus));
  const [searchInput, setSearchInput] = useState(initialSearch);
  
  // Use debounce with callback to call onSearchChange
  const [debouncedSearch] = useDebounce(searchInput, 300);
  
  // Track previous debounced value to detect changes
  const [prevDebouncedSearch, setPrevDebouncedSearch] = useState(debouncedSearch);
  
  // Update previous value and call onSearchChange when debounced value changes
  // This runs during render but the actual call happens in setTimeout
  if (onSearchChange && debouncedSearch !== prevDebouncedSearch) {
    setPrevDebouncedSearch(debouncedSearch);
    // Schedule the callback for after render
    Promise.resolve().then(() => {
      onSearchChange(debouncedSearch);
    });
  }
  
  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  // Handle status filter change
  const handleFilterChange = (newFilter: 'all' | 'pending' | 'crawled') => {
    setFilter(newFilter);
    if (onStatusChange) {
      // Map to API status format
      const apiStatus = newFilter === 'all' ? 'all' : newFilter === 'pending' ? 'pending' : 'completed';
      onStatusChange(apiStatus);
    }
  };

  // Filter chapters - API already handles smart search, just apply local filter if needed
  const filteredChapters = useMemo(() => {
    // Since API handles search, we just need to sort
    return [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [chapters]);

  const pendingChapters = chapters.filter(ch => !ch.originalContent || ch.originalContent.trim() === '');
  const crawledChapters = chapters.filter(ch => ch.originalContent && ch.originalContent.trim() !== '');

  const handleToggleSelect = (chapterId: string) => {
    if (selectedChapters.includes(chapterId)) {
      onSelectionChange(selectedChapters.filter(id => id !== chapterId));
    } else {
      onSelectionChange([...selectedChapters, chapterId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredChapters.map(ch => ch._id);
    onSelectionChange(allIds);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleSelectPending = () => {
    const pendingIds = filteredChapters
      .filter(ch => !ch.originalContent || ch.originalContent.trim() === '')
      .map(ch => ch._id);
    onSelectionChange(pendingIds);
  };

  const isAllSelected = filteredChapters.length > 0 && filteredChapters.every(ch => selectedChapters.includes(ch._id));
  const selectedCount = selectedChapters.length;

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 min-w-0">
            <input
              key={`search-${initialSearch}`}
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="Tìm chương: 146-150, 146,147,148, 146+, hoặc text..."
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-all"
            />
            {searchInput && (
              <div className="absolute -bottom-6 left-0 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                💡 Thử: 146-150, 146,147,148, 146+, hoặc 146-150 pending
              </div>
            )}
          </div>
          <div className="relative min-w-[140px]">
            <select
              key={`filter-${initialStatus}`}
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'pending' | 'crawled')}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 pr-10 text-base text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none cursor-pointer shadow-sm transition-all"
            >
              <option value="all">Tất cả ({chapters.length})</option>
              <option value="pending">Chưa crawl ({pendingChapters.length})</option>
              <option value="crawled">Đã crawl ({crawledChapters.length})</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
            className="rounded-2xl whitespace-nowrap"
          >
            {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSelectPending}
            className="rounded-2xl whitespace-nowrap"
          >
            Chọn chưa crawl
          </Button>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Đã chọn: {selectedCount} chương
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onCrawlSelected}
              isLoading={crawling}
              disabled={crawling}
              className="rounded-2xl"
            >
              <CloudArrowDownIcon className="w-4 h-4 mr-2" />
              Crawl đã chọn
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {pendingChapters.length > 0 && (
        <div className="flex items-center justify-between p-3 mt-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Còn {pendingChapters.length} chương chưa crawl
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={onCrawlAll}
            isLoading={crawling}
            disabled={crawling}
            className="rounded-2xl"
          >
            <CloudArrowDownIcon className="w-4 h-4 mr-2" />
            Crawl tất cả chưa crawl
          </Button>
        </div>
      )}

      {/* Chapter List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-zinc-500">Đang tải...</div>
        ) : filteredChapters.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">Không tìm thấy chương nào</div>
        ) : (
          <>
            {filteredChapters.map((chapter) => {
              const hasContent = chapter.originalContent && chapter.originalContent.trim() !== '';
              const isSelected = selectedChapters.includes(chapter._id);

              return (
                <div
                  key={chapter._id}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                  onClick={() => handleToggleSelect(chapter._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                          Chương {chapter.chapterNumber}: {chapter.title}
                        </span>
                        <Badge variant={hasContent ? 'success' : 'default'}>
                          {hasContent ? 'Đã crawl' : 'Chưa crawl'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {chapter.url}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {onLoadMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="secondary"
                  onClick={onLoadMore}
                  isLoading={loadingMore}
                  disabled={loadingMore}
                  className="rounded-2xl"
                >
                  {loadingMore ? 'Đang tải...' : 'Tải thêm chương'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

