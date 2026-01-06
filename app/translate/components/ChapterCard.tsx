'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chapter } from './types';

interface ChapterCardProps {
  chapter: Chapter;
  isSelected: boolean;
  onToggle: () => void;
  selectedStoryId: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'error' | 'outline' | 'default' }
> = {
  completed: { label: 'Đã dịch', variant: 'success' },
  translating: { label: 'Đang dịch', variant: 'warning' },
  failed: { label: 'Lỗi', variant: 'error' },
  pending: { label: 'Chờ dịch', variant: 'outline' },
};

export default function ChapterCard({
  chapter,
  isSelected,
  onToggle,
  selectedStoryId,
}: ChapterCardProps) {
  const router = useRouter();
  const canSelect = !!chapter.originalContent && !!chapter.originalContent.trim();
  const status = statusConfig[chapter.status] || statusConfig.pending;

  return (
    <div
      onClick={() => canSelect && onToggle()}
      className={`
        mt-2 rounded-2xl border px-4 py-3 flex items-center justify-between cursor-pointer
        transition-all duration-200 group
        ${
          isSelected
            ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-md shadow-blue-500/10'
            : 'bg-white/90 dark:bg-zinc-900/80 border-zinc-100/80 dark:border-zinc-800/80 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className={`
            w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold
            ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-500'
            }
          `}
        >
          {chapter.chapterNumber}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-xs md:max-w-md">
              {chapter.title || `Chương ${chapter.chapterNumber}`}
            </p>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
            {chapter.originalContent
              ? chapter.originalContent.slice(0, 80) + (chapter.originalContent.length > 80 ? '…' : '')
              : 'Chưa có nội dung crawl'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          disabled={!canSelect}
          className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />

        {chapter.status === 'completed' && (
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:inline-flex text-xs"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/compare/${selectedStoryId}/${chapter.chapterNumber}`);
            }}
          >
            Xem
          </Button>
        )}
      </div>
    </div>
  );
}


