'use client';

import { useState, useEffect } from 'react';
import StoryList from '@/components/StoryList';
import AddStoryForm from '@/components/AddStoryForm';
import SimpleCrawlForm from '@/components/SimpleCrawlForm';
import { useRouter } from 'next/navigation';

interface Story {
  _id: string;
  title: string;
  url: string;
  status: string;
  totalChapters?: number;
  crawledChapters?: number;
  createdAt: string | Date;
}

export default function Home() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stories');
      const data = await response.json();
      if (data.success) {
        // Convert ObjectId to string for UI
        const storiesWithStringId = data.data.map((story: { _id: { toString: () => string } | string; [key: string]: unknown }) => ({
          ...story,
          _id: typeof story._id === 'object' && story._id !== null && 'toString' in story._id 
            ? story._id.toString() 
            : String(story._id),
        }));
        setStories(storiesWithStringId as Story[]);
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-8">
          Quản lý Truyện Convert
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-1 space-y-6">
            <AddStoryForm onSuccess={fetchStories} />
            <SimpleCrawlForm 
              storyId={selectedStory} 
              onSuccess={fetchStories}
            />
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 space-y-3">
              <button
                onClick={() => router.push('/crawl')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Crawl Nội Dung Chương
              </button>
              <button
                onClick={() => router.push('/translate')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md"
            >
                Đến Trang Dịch
              </button>
              <button
                onClick={() => router.push('/read')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md"
            >
                Đọc Truyện
              </button>
            </div>
        </div>

          {/* Right Column - Story List */}
          <div className="lg:col-span-2">
            <StoryList
              stories={stories}
              loading={loading}
              selectedStory={selectedStory}
              onSelectStory={setSelectedStory}
              onRefresh={fetchStories}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
