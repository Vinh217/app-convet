'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  translatedContent: string;
}

interface Story {
  _id: string;
  title: string;
}

interface ChapterListItem {
  chapterNumber: number;
  title: string;
}

interface ReadChapterClientProps {
  chapter: Chapter;
  story: Story;
  allChapters: ChapterListItem[];
  storyId: string;
}

// Preset colors
const BACKGROUND_PRESETS = [
  { name: 'Vàng nhạt', value: '#fef9e7', dark: '#1c1917' },
  { name: 'Trắng', value: '#ffffff', dark: '#0a0a0a' },
  { name: 'Xám nhạt', value: '#f5f5f5', dark: '#18181b' },
  { name: 'Xanh lá nhạt', value: '#f0fdf4', dark: '#052e16' },
  { name: 'Xanh dương nhạt', value: '#eff6ff', dark: '#1e3a8a' },
  { name: 'Hồng nhạt', value: '#fdf2f8', dark: '#831843' },
];

const TEXT_PRESETS = [
  { name: 'Đen', value: '#27272a', dark: '#fafafa' },
  { name: 'Xám đậm', value: '#3f3f46', dark: '#e4e4e7' },
  { name: 'Nâu', value: '#451a03', dark: '#fef3c7' },
  { name: 'Xanh đậm', value: '#1e3a8a', dark: '#dbeafe' },
  { name: 'Xanh lá đậm', value: '#14532d', dark: '#dcfce7' },
];

export default function ReadChapterClient({
  chapter,
  story,
  allChapters,
  storyId,
}: ReadChapterClientProps) {
  const router = useRouter();
  
  // Initialize với giá trị mặc định (tránh hydration mismatch)
  const [fontSize, setFontSize] = useState(18);
  const [backgroundColor, setBackgroundColor] = useState('#fef9e7');
  const [textColor, setTextColor] = useState('#27272a');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showFooter, setShowFooter] = useState(true); // Show by default
  const lastScrollYRef = useRef(0);
  const lineHeight = 1.8;

  // Load từ localStorage sau khi component mount (chỉ trên client)
  // Điều này tránh hydration mismatch giữa server và client render
  // Pattern này được chấp nhận trong Next.js để sync localStorage với state
  // Note: React Compiler warning về setState trong effect có thể bỏ qua ở đây
  // vì đây là pattern hợp lý để sync localStorage với React state
  useEffect(() => {
    const savedFontSize = localStorage.getItem('readFontSize');
    const savedBackgroundColor = localStorage.getItem('readBackgroundColor');
    const savedTextColor = localStorage.getItem('readTextColor');
    
    if (savedFontSize) {
      const parsed = parseInt(savedFontSize, 10);
      if (!isNaN(parsed) && parsed !== 18) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFontSize(parsed);
      }
    }
    
    if (savedBackgroundColor && savedBackgroundColor !== '#fef9e7') {
      setBackgroundColor(savedBackgroundColor);
    }
    
    if (savedTextColor && savedTextColor !== '#27272a') {
      setTextColor(savedTextColor);
    }
  }, []);

  // Detect scroll direction để ẩn/hiện footer
  useEffect(() => {
    // Tìm main element (scroll container từ layout)
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    
    // Khởi tạo giá trị ban đầu
    lastScrollYRef.current = mainElement.scrollTop;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = mainElement.scrollTop;
          const scrollDifference = currentScrollY - lastScrollYRef.current;
          
          // Scroll xuống thì ẩn, scroll lên thì hiện
          if (scrollDifference > 5) {
            // Scrolling down - hide footer
            setShowFooter(false);
          } else if (scrollDifference < -5) {
            // Scrolling up - show footer
            setShowFooter(true);
          }
          
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Save settings to localStorage
  const saveFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem('readFontSize', size.toString());
  };

  const saveBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('readBackgroundColor', color);
  };

  const saveTextColor = (color: string) => {
    setTextColor(color);
    localStorage.setItem('readTextColor', color);
  };

  const currentIndex = allChapters.findIndex(ch => ch.chapterNumber === chapter.chapterNumber);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const navigateChapter = (targetChapterNumber: number) => {
    router.push(`/read/${storyId}/${targetChapterNumber}`);
  };


  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <div 
        className="z-20 border-b shadow-sm"
        style={{ 
          backgroundColor: backgroundColor,
          borderColor: `${textColor}20`
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/read')}
              className="hover:opacity-70 transition-opacity"
              style={{ color: textColor }}
            >
              ← Về danh sách
            </button>
            <div className="flex items-center gap-3">
              {/* Hamburger Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
                style={{ 
                  backgroundColor: `${textColor}15`,
                  color: textColor 
                }}
                aria-label="Cài đặt"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: textColor }}>
            {story.title}
          </h1>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-30 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Cài Đặt Đọc
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Font Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Cỡ chữ: {fontSize}px
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => saveFontSize(Math.max(14, fontSize - 2))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    A−
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="14"
                      max="24"
                      value={fontSize}
                      onChange={(e) => saveFontSize(parseInt(e.target.value, 10))}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => saveFontSize(Math.min(24, fontSize + 2))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Background Color */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Màu nền
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => saveBackgroundColor(preset.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        backgroundColor === preset.value
                          ? 'border-zinc-900 dark:border-zinc-100'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    >
                      <div className="text-xs text-center mt-1" style={{ color: textColor }}>
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => saveBackgroundColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Text Color */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Màu chữ
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {TEXT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => saveTextColor(preset.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        textColor === preset.value
                          ? 'border-zinc-100'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                      style={{ 
                        backgroundColor: preset.value,
                        color: backgroundColor
                      }}
                      title={preset.name}
                    >
                      <div className="text-xs text-center mt-1 font-medium">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => saveTextColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  saveFontSize(18);
                  saveBackgroundColor('#fef9e7');
                  saveTextColor('#27272a');
                }}
                className="w-full px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium"
              >
                Đặt lại mặc định
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <div 
          className="leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontFamily: '"Noto Sans", "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif',
            color: textColor,
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
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t shadow-2xl transition-transform duration-300 ease-in-out ${
          showFooter ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          backgroundColor: `${backgroundColor}f5`,
          borderColor: `${textColor}25`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Mobile: 2 icon buttons + dropdown */}
        <div className="sm:hidden px-3 py-3">
          <div className="flex items-center gap-2">
            {/* Previous Chapter Button - Mobile (icon only) */}
            <button
              onClick={() => prevChapter && navigateChapter(prevChapter.chapterNumber)}
              disabled={!prevChapter}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.95] shadow-sm"
              style={{ 
                backgroundColor: `${textColor}18`,
                color: textColor,
                border: `1.5px solid ${textColor}25`,
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Chapter Selector - Mobile */}
            <div className="flex-1 relative min-w-0">
              <div className="relative">
                <select
                  value={chapter.chapterNumber}
                  onChange={(e) => navigateChapter(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
                  style={{ 
                    backgroundColor: `${textColor}20`,
                    color: textColor,
                    border: `2px solid ${textColor}30`,
                  }}
                >
                  {allChapters && allChapters.length > 0 ? (
                    allChapters.map((ch) => (
                      <option 
                        key={ch.chapterNumber} 
                        value={ch.chapterNumber}
                        style={{
                          backgroundColor: backgroundColor,
                          color: textColor,
                        }}
                      >
                        {ch.title ? `${ch.title}` : ''}
                      </option>
                    ))
                  ) : (
                    <option value={chapter.chapterNumber}>
                      Chương {chapter.chapterNumber}
                    </option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: textColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Next Chapter Button - Mobile (icon only) */}
            <button
              onClick={() => nextChapter && navigateChapter(nextChapter.chapterNumber)}
              disabled={!nextChapter}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.95] shadow-sm"
              style={{ 
                backgroundColor: `${textColor}18`,
                color: textColor,
                border: `1.5px solid ${textColor}25`,
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop: Full layout with dropdown */}
        <div className="hidden sm:block max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            {/* Previous Chapter Button */}
            <button
              onClick={() => prevChapter && navigateChapter(prevChapter.chapterNumber)}
              disabled={!prevChapter}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              style={{ 
                backgroundColor: `${textColor}18`,
                color: textColor,
                border: `1.5px solid ${textColor}25`,
              }}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm whitespace-nowrap">Chương trước</span>
              {prevChapter && (
                <span className="text-xs opacity-70 font-normal">({prevChapter.chapterNumber})</span>
              )}
            </button>

            {/* Chapter Selector - Desktop only */}
            <div className="flex-1 relative min-w-0">
              <div className="relative">
                <select
                  value={chapter.chapterNumber}
                  onChange={(e) => navigateChapter(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl text-base font-medium appearance-none cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
                  style={{ 
                    backgroundColor: `${textColor}20`,
                    color: textColor,
                    border: `2px solid ${textColor}30`,
                  }}
                >
                  {allChapters && allChapters.length > 0 ? (
                    allChapters.map((ch) => (
                      <option 
                        key={ch.chapterNumber} 
                        value={ch.chapterNumber}
                        style={{
                          backgroundColor: backgroundColor,
                          color: textColor,
                        }}
                      >
                        {ch.title ? `${ch.title}` : ''}
                      </option>
                    ))
                  ) : (
                    <option value={chapter.chapterNumber}>
                      Chương {chapter.chapterNumber}
                    </option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5" style={{ color: textColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Next Chapter Button */}
            <button
              onClick={() => nextChapter && navigateChapter(nextChapter.chapterNumber)}
              disabled={!nextChapter}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              style={{ 
                backgroundColor: `${textColor}18`,
                color: textColor,
                border: `1.5px solid ${textColor}25`,
              }}
            >
              <span className="text-sm whitespace-nowrap">Chương sau</span>
              {nextChapter && (
                <span className="text-xs opacity-70 font-normal">({nextChapter.chapterNumber})</span>
              )}
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

