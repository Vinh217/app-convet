'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Chapter } from './types';
import ChapterCard from './ChapterCard';

interface VirtualChapterListProps {
  chapters: Chapter[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  selectedChapters: Set<string>;
  onToggleChapter: (id: string) => void;
  selectedStoryId: string;
}

const ITEM_SIZE = 80;

export default function VirtualChapterList({
  chapters,
  hasMore,
  isLoadingMore,
  onLoadMore,
  selectedChapters,
  onToggleChapter,
  selectedStoryId,
}: VirtualChapterListProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasMore ? chapters.length + 1 : chapters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_SIZE,
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto rounded-2xl bg-gradient-to-b from-zinc-50/60 to-white dark:from-zinc-900/60 dark:to-zinc-950 border border-zinc-100/60 dark:border-zinc-800/60 shadow-inner min-h-[500px] max-h-[800px]"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index > chapters.length - 1;
          const chapter = chapters[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 right-0 px-3"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                hasMore ? (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                    {isLoadingMore ? (
                      'Đang tải thêm chương...'
                    ) : (
                      <button
                        type="button"
                        onClick={onLoadMore}
                        className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-500 hover:text-blue-600 transition-colors text-xs font-medium"
                      >
                        Tải thêm chương
                      </button>
                    )}
                  </div>
                ) : null
              ) : (
                <ChapterCard
                  chapter={chapter}
                  isSelected={selectedChapters.has(chapter._id)}
                  onToggle={() => onToggleChapter(chapter._id)}
                  selectedStoryId={selectedStoryId}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


