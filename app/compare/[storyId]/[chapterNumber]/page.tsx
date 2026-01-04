'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  originalContent: string;
  translatedContent?: string;
}

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;
  const chapterNumber = params.chapterNumber as string;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storyId && chapterNumber) {
      fetchChapter();
    }
  }, [storyId, chapterNumber]);

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chapters/${storyId}/${chapterNumber}`);
      const data = await response.json();
      if (data.success) {
        const chapterWithStringId = {
          ...data.data,
          _id: typeof data.data._id === 'object' && data.data._id !== null && 'toString' in data.data._id 
            ? data.data._id.toString() 
            : String(data.data._id),
        };
        setChapter(chapterWithStringId as Chapter);
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-zinc-600 dark:text-zinc-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-zinc-600 dark:text-zinc-400">Không tìm thấy chương</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            So Sánh: Chương {chapter.chapterNumber}. {chapter.title}
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md"
          >
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bản Convert */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4 border-b pb-2">
              Bản Convert (Gốc)
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {chapter.originalContent || 'Chưa có nội dung'}
              </pre>
            </div>
          </div>

          {/* Bản Dịch */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4 border-b pb-2">
              Bản Dịch (Đã xử lý)
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {chapter.translatedContent || 'Chưa có bản dịch'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

