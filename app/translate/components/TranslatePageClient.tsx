'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { getChaptersList } from '../actions';

interface Story {
  _id: string;
  title: string;
  totalChapters?: number;
}

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  originalContent: string;
  translatedContent?: string;
  status: string;
}

interface TranslatePageClientProps {
  initialStories: Story[];
  initialStoryId?: string | null;
  initialChapters?: Chapter[];
}

export default function TranslatePageClient({
  initialStories,
  initialStoryId = null,
  initialChapters = [],
}: TranslatePageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stories] = useState<Story[]>(initialStories);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(initialStoryId || '');
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchChapters = async (storyId: string) => {
    setLoading(true);
    try {
      const result = await getChaptersList(storyId);
      if (result.success) {
        setChapters(result.data);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedChapters(new Set());
    
    // Update URL với searchParams
    startTransition(() => {
      const params = new URLSearchParams();
      if (storyId) {
        params.set('storyId', storyId);
      }
      const url = params.toString() ? `/translate?${params.toString()}` : '/translate';
      router.push(url);
    });
    
    if (storyId) {
      fetchChapters(storyId);
    } else {
      setChapters([]);
    }
  };

  const handleBatchTranslate = async () => {
    if (!selectedStoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện' });
      return;
    }

    setTranslating(true);
    setMessage(null);

    try {
      const chapterIds = selectedChapters.size > 0
        ? Array.from(selectedChapters)
        : null;

      let finalChapterIds = chapterIds;
      if (!finalChapterIds || finalChapterIds.length === 0) {
        const pendingChapters = chapters.filter(ch => 
          ch.status === 'pending' && ch.originalContent && ch.originalContent.trim()
        ).slice(0, 5);
        finalChapterIds = pendingChapters.map(ch => ch._id);
      }

      if (!finalChapterIds || finalChapterIds.length === 0) {
        setMessage({ type: 'error', text: 'Không có chương nào để dịch' });
        setTranslating(false);
        return;
      }

      const response = await fetch('/api/translate/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterIds: finalChapterIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Đã bắt đầu dịch ${finalChapterIds.length} chương trong background. Vui lòng refresh để xem cập nhật.`,
        });
        setSelectedChapters(new Set());
        // Refresh chapters after a delay
        setTimeout(() => {
          if (selectedStoryId) {
            fetchChapters(selectedStoryId);
          }
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setTranslating(false);
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(chapterId)) {
      newSelected.delete(chapterId);
    } else {
      newSelected.add(chapterId);
    }
    setSelectedChapters(newSelected);
  };

  const pendingChapters = chapters.filter(ch => ch.status === 'pending' && ch.originalContent);
  const translatedChapters = chapters.filter(ch => ch.status === 'completed');
  const chaptersWithContent = chapters.filter(ch => ch.originalContent && ch.originalContent.trim());
  
  const filteredChapters = statusFilter === 'all' 
    ? chapters 
    : chapters.filter(ch => ch.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dịch Truyện</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chọn Truyện & Cấu Hình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                label="Truyện cần dịch"
                value={selectedStoryId}
                onChange={(e) => handleStoryChange(e.target.value)}
              >
                <option value="">-- Chọn truyện --</option>
                {stories.map((story) => (
                  <option key={story._id} value={story._id}>{story.title}</option>
                ))}
              </Select>
              
              {selectedStoryId && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-zinc-500 mb-1">Chờ dịch</p>
                      <p className="font-bold text-lg">{pendingChapters.length}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                       <p className="text-green-600 dark:text-green-400 mb-1">Đã dịch</p>
                       <p className="font-bold text-lg text-green-700 dark:text-green-300">{translatedChapters.length}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                     <Button 
                       variant="secondary" 
                       size="sm" 
                       className="flex-1"
                       onClick={() => {
                          const newSelected = new Set(selectedChapters);
                          chaptersWithContent.forEach(ch => newSelected.add(ch._id));
                          setSelectedChapters(newSelected);
                       }}
                       disabled={chaptersWithContent.length === 0}
                     >
                       Chọn Tất Cả
                     </Button>
                     <Button 
                       variant="secondary" 
                       size="sm" 
                       className="flex-1"
                       onClick={() => setSelectedChapters(new Set())}
                       disabled={selectedChapters.size === 0}
                     >
                       Bỏ Chọn
                     </Button>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleBatchTranslate}
                    isLoading={translating}
                    disabled={translating || (selectedChapters.size === 0 && pendingChapters.length === 0)}
                  >
                     <GlobeAltIcon className="w-5 h-5 mr-2" />
                     {selectedChapters.size > 0 ? `Dịch ${selectedChapters.size} Chương` : 'Dịch Tiếp 5 Chương'}
                  </Button>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                      {message.text}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Chapter List */}
        <div className="xl:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh Sách Chương</CardTitle>
              <div className="flex gap-2">
                 <Select 
                   value={statusFilter} 
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="!w-32 !py-1 !text-sm"
                 >
                   <option value="all">Tất cả</option>
                   <option value="pending">Chờ dịch</option>
                   <option value="translating">Đang Dịch</option>
                   <option value="completed">Đã dịch</option>
                   <option value="failed">Lỗi</option>
                 </Select>
                 <Button size="sm" variant="secondary" onClick={() => fetchChapters(selectedStoryId)} disabled={!selectedStoryId || loading}>
                   Refresh
                 </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-[500px] max-h-[800px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50 mb-4"></div>
                  <p>Đang tải...</p>
                </div>
              ) : chapters.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60">
                    <GlobeAltIcon className="w-16 h-16 mb-4" />
                    <p>Chọn truyện để xem danh sách</p>
                 </div>
              ) : (
                <div className="space-y-2">
                  {filteredChapters.map((chapter) => {
                     const isSelected = selectedChapters.has(chapter._id);
                     const canSelect = chapter.originalContent && chapter.originalContent.trim();
                     return (
                        <div 
                          key={chapter._id}
                          onClick={() => canSelect && toggleChapterSelection(chapter._id)}
                          className={`
                            p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group
                            ${isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                              : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                             <input 
                               type="checkbox" 
                               checked={isSelected} 
                               onChange={() => {}} 
                               className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" 
                               disabled={!canSelect}
                             />
                             <div>
                                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                  {chapter.chapterNumber}. {chapter.title}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  {chapter.status === 'completed' && <Badge variant="success">Đã dịch</Badge>}
                                  {chapter.status === 'translating' && <Badge variant="warning">Đang dịch</Badge>}
                                  {chapter.status === 'failed' && <Badge variant="error">Lỗi</Badge>}
                                  {chapter.status === 'pending' && <Badge variant="outline">Chờ dịch</Badge>}
                                </div>
                             </div>
                          </div>
                          
                          {chapter.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/compare/${selectedStoryId}/${chapter.chapterNumber}`);
                              }}
                            >
                              Xem
                            </Button>
                          )}
                        </div>
                     );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

