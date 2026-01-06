'use client';

import React from 'react';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/Button';

interface ChapterFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function ChapterFilters({
  statusFilter,
  onStatusChange,
  onSearchChange,
  onRefresh,
  loading,
}: ChapterFiltersProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const [debouncedSearch] = useDebounce(searchInput, 300);

  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm chương: 146-150, 146,147,148, 146+, hoặc text..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-all"
              />
              {searchInput && (
                <div className="absolute -bottom-6 left-0 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  💡 Thử: 146-150, 146,147,148, 146+, hoặc 146-150 pending
                </div>
              )}
            </div>
          </div>
          <div className="relative min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 pr-10 text-base text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none cursor-pointer shadow-sm transition-all"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ dịch</option>
              <option value="translating">Đang dịch</option>
              <option value="completed">Đã dịch</option>
              <option value="failed">Lỗi</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <Button
          size="md"
          variant="secondary"
          onClick={onRefresh}
          isLoading={loading}
          className="rounded-2xl px-6 whitespace-nowrap"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}


