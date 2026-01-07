import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryById, getChaptersByStoryId, getLatestChapter } from '@/lib/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeftIcon, 
  BookOpenIcon, 
  ClockIcon, 
  GlobeAltIcon,
  PlayIcon,
  ForwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{
    storyId: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function StoryDetailPage({ params, searchParams }: PageProps) {
  const { storyId } = await params;
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const limit = 100;
  
  const [story, chaptersData, latestChapter] = await Promise.all([
    getStoryById(storyId),
    getChaptersByStoryId(storyId, { page: currentPage, limit, status: 'completed' }),
    getLatestChapter(storyId)
  ]);

  if (!story) {
    notFound();
  }

  const { chapters, totalPages } = chaptersData;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'translating': return 'warning';
      case 'crawling': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Navigation */}
      <Link 
        href="/" 
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Quay lại tủ truyện
      </Link>

      {/* Story Info Card */}
      <Card>
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Cover Placeholder / Icon */}
          <div className="w-full md:w-48 h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
             <BookOpenIcon className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={getStatusVariant(story.status)} className="uppercase tracking-wider text-[10px]">
                  {story.status}
                </Badge>
                {story.crawledChapters && (
                   <Badge variant="outline" className="text-zinc-500">
                      {story.crawledChapters} Chương
                   </Badge>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                {story.title}
              </h1>
              
              {story.author && (
                <p className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                  <span>Tác giả: <span className="text-zinc-900 dark:text-zinc-200">{story.author}</span></span>
                </p>
              )}
            </div>

            {/* Stats / Info */}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400 border-y border-zinc-100 dark:border-zinc-800 py-4">
              <div className="flex items-center gap-1.5" title="Ngày cập nhật">
                 <ClockIcon className="w-4 h-4" />
                 <span>Cập nhật: {new Date(story.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Nguồn">
                 <GlobeAltIcon className="w-4 h-4" />
                 <Link href={story.url} target="_blank" className="hover:underline text-blue-500">
                    Nguồn gốc
                 </Link>
              </div>
            </div>

            {/* Description */}
            {story.description && (
              <div className="prose prose-zinc dark:prose-invert text-sm max-w-none line-clamp-4 hover:line-clamp-none transition-all">
                <p>{story.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {latestChapter ? (
                <>
                  <Link href={`/read/${storyId}/${chapters.length > 0 && currentPage === 1 ? chapters[0].chapterNumber : 1}`} className="flex-1 sm:flex-none">
                    <Button className="w-full sm:w-auto">
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Đọc từ đầu
                    </Button>
                  </Link>
                  <Link href={`/read/${storyId}/${latestChapter.chapterNumber}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <ForwardIcon className="w-4 h-4 mr-2" />
                      Đọc mới nhất
                    </Button>
                  </Link>
                </>
              ) : (
                <Button disabled variant="outline">Chưa có chương nào</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>Danh Sách Chương</CardTitle>
           <span className="text-sm text-zinc-500 dark:text-zinc-400">
             {chaptersData.total} chương
           </span>
        </CardHeader>
        <CardContent>
           {chapters.length > 0 ? (
             <>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                 {chapters.map((chapter) => (
                   <Link 
                     key={chapter._id?.toString()} 
                     href={`/read/${storyId}/${chapter.chapterNumber}`}
                     className="group p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-sm"
                   >
                     <div className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        Chương {chapter.chapterNumber}
                     </div>
                     <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 truncate">
                        {chapter.title || 'Không có tiêu đề'}
                     </div>
                   </Link>
                 ))}
               </div>

               {/* Pagination */}
               {totalPages > 1 && (
                 <div className="flex justify-center gap-2">
                   <Link href={`/read/${storyId}?page=${Math.max(1, currentPage - 1)}`} 
                     className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                   >
                     <Button variant="outline" size="sm" disabled={currentPage <= 1}>
                       <ChevronLeftIcon className="w-4 h-4" />
                     </Button>
                   </Link>
                   
                   <div className="flex items-center px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                     Trang {currentPage} / {totalPages}
                   </div>

                   <Link href={`/read/${storyId}?page=${Math.min(totalPages, currentPage + 1)}`}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                   >
                     <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
                       <ChevronRightIcon className="w-4 h-4" />
                     </Button>
                   </Link>
                 </div>
               )}
             </>
           ) : (
             <div className="text-center py-10 text-zinc-500 dark:text-zinc-400">
                Chưa có chương nào hoàn thiện.
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
