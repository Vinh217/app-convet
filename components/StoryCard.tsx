'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookOpenIcon, ClockIcon, DocumentTextIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface Story {
  _id: string;
  title: string;
  author?: string; // Newly added field support
  description?: string; // Newly added field support
  url: string;
  status: string;
  totalChapters?: number;
  crawledChapters?: number;
  createdAt: string | Date;
}

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const router = useRouter();

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'outline' => {
    switch (status) {
      case 'completed': return 'success';
      case 'translating': return 'warning';
      case 'crawling': return 'default'; // Blue-ish
      default: return 'outline';
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer overflow-hidden flex flex-col h-full">
       <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 w-full" />
       <CardContent className="p-5 flex flex-col h-full" onClick={() => router.push(`/read/${story._id}`)}>
          <div className="flex justify-between items-start mb-3">
             <Badge variant={getStatusVariant(story.status)} className="uppercase text-[10px] tracking-wider">
               {story.status}
             </Badge>
             <div className="text-zinc-400 dark:text-zinc-500 text-xs flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" />
                {new Date(story.createdAt).toLocaleDateString()}
             </div>
          </div>
          
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {story.title}
          </h3>

          {story.author && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 font-medium">
               Tác giả: {story.author}
            </p>
          )}

          {story.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-3 flex-1">
              {story.description}
            </p>
          )}

          <div className="pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
             <div className="flex items-center gap-1.5" title="Số chương đã crawl">
                <DocumentTextIcon className="w-4 h-4 text-zinc-400" />
                <span>{story.crawledChapters || 0} chương</span>
             </div>
              <div className="flex items-center gap-1.5" title="Nguồn">
                 <GlobeAltIcon className="w-4 h-4 text-zinc-400" />
                 <span className="truncate max-w-[100px]">{new URL(story.url).hostname}</span>
              </div>
          </div>
       </CardContent>
    </Card>
  );
}
