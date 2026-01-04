'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  translatedContent?: string;
}

interface Story {
  _id: string;
  title: string;
}

export default function ReadChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;
  const chapterNumber = parseInt(params.chapterNumber as string, 10);
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [allChapters, setAllChapters] = useState<Array<{ chapterNumber: number; title: string }>>([]);
  const [fontSize, setFontSize] = useState(18); // px
  const [lineHeight, setLineHeight] = useState(1.8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storyId && chapterNumber) {
      fetchData();
    }
  }, [storyId, chapterNumber]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch chapter
      const chapterResponse = await fetch(`/api/chapters/${storyId}/${chapterNumber}`);
      const chapterData = await chapterResponse.json();
      if (chapterData.success) {
        const chapterWithStringId = {
          ...chapterData.data,
          _id: typeof chapterData.data._id === 'object' && chapterData.data._id !== null && 'toString' in chapterData.data._id 
            ? chapterData.data._id.toString() 
            : String(chapterData.data._id),
        };
        setChapter(chapterWithStringId as Chapter);
      }

      // Fetch story
      const storyResponse = await fetch(`/api/stories/${storyId}`);
      const storyData = await storyResponse.json();
      if (storyData.success) {
        const storyWithStringId = {
          ...storyData.data,
          _id: typeof storyData.data._id === 'object' && storyData.data._id !== null && 'toString' in storyData.data._id 
            ? storyData.data._id.toString() 
            : String(storyData.data._id),
        };
        setStory(storyWithStringId as Story);
      }

      // Fetch chỉ các chương đã dịch để navigation
      const chaptersResponse = await fetch(`/api/stories/${storyId}/chapters/translated`);
      const chaptersData = await chaptersResponse.json();
      if (chaptersData.success) {
        setAllChapters(chaptersData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = allChapters.findIndex(ch => ch.chapterNumber === chapterNumber);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const navigateChapter = (targetChapterNumber: number) => {
    router.push(`/read/${storyId}/${targetChapterNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
      </div>
    );
  }

  if (!chapter || !chapter.translatedContent) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Chương này chưa có bản dịch</p>
          <button
            onClick={() => router.push('/read')}
            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-amber-50/98 dark:bg-zinc-950/98 backdrop-blur-md border-b border-amber-200/50 dark:border-zinc-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/read')}
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Về danh sách
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                aria-label="Giảm cỡ chữ"
              >
                A−
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[3rem] text-center">
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                aria-label="Tăng cỡ chữ"
              >
                A+
              </button>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {story?.title}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chương {chapter.chapterNumber}: {chapter.title}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div 
          className="text-zinc-800 dark:text-zinc-100 leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontFamily: '"Noto Sans", "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif',
            color: 'rgb(39, 39, 42)', // zinc-800 for light mode
          }}
        >
          {chapter.translatedContent.split('\n\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return <br key={index} className="h-4" />;
            
            return (
              <p 
                key={index} 
                className="mb-5 sm:mb-6 text-justify sm:text-left"
                style={{
                  textIndent: '2em',
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                {trimmed}
              </p>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-amber-50/98 dark:bg-zinc-950/98 backdrop-blur-md border-t border-amber-200/50 dark:border-zinc-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={() => prevChapter && navigateChapter(prevChapter.chapterNumber)}
              disabled={!prevChapter}
              className="flex-1 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-zinc-900 dark:text-zinc-50 font-medium transition-colors"
            >
              ← Chương trước
            </button>
            <select
              value={chapterNumber}
              onChange={(e) => navigateChapter(parseInt(e.target.value, 10))}
              className="px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-50 text-sm"
            >
              {allChapters.map((ch) => (
                <option key={ch.chapterNumber} value={ch.chapterNumber}>
                  Chương {ch.chapterNumber}
                </option>
              ))}
            </select>
            <button
              onClick={() => nextChapter && navigateChapter(nextChapter.chapterNumber)}
              disabled={!nextChapter}
              className="flex-1 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-zinc-900 dark:text-zinc-50 font-medium transition-colors"
            >
              Chương sau →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

