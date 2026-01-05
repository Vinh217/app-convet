'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import StoryCard from '@/components/StoryCard';

interface Story {
  _id: string;
  title: string;
  url: string;
  status: string;
  totalChapters?: number;
  crawledChapters?: number;
  createdAt: string | Date;
  author?: string;
  description?: string;
}

export default function Home() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stories');
      const data = await response.json();
      if (data.success) {
        // Convert ObjectId to string for UI
        const storiesWithStringId = data.data.map((story: Story) => ({
          ...story,
          _id: story._id.toString(),
        }));
        setStories(storiesWithStringId);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
             Truyện Của Tôi
           </h1>
           <p className="text-zinc-500 dark:text-zinc-400 mt-1">
             Quản lý và theo dõi tiến độ các bộ truyện convert
           </p>
        </div>
        <Button onClick={() => router.push('/stories/add')}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Thêm Truyện Mới
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
           ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
           <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <PlusIcon className="w-8 h-8 text-zinc-400" />
           </div>
           <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Chưa có truyện nào</h3>
           <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
             Bắt đầu bằng cách thêm một bộ truyện mới vào hệ thống để crawl và dịch.
           </p>
           <Button onClick={() => router.push('/stories/add')}>
             Thêm Truyện Ngay
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
