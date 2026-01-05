'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeftIcon, CloudArrowDownIcon, BoltIcon, PlayIcon } from '@heroicons/react/24/outline';

interface Story {
  _id: string;
  title: string;
}

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  originalContent: string;
  url: string;
  status: string;
}

export default function CrawlPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Crawl Form State
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlMode, setCrawlMode] = useState<'single' | 'list'>('single');
  const [selectors, setSelectors] = useState({
    titleSelector: '',
    contentSelector: '',
    nextSelector: '',
    listSelector: '',
    linkSelector: '',
  });
  const [detecting, setDetecting] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [autoCrawling, setAutoCrawling] = useState(false);
  const [detectedPreset, setDetectedPreset] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (selectedStoryId) {
      fetchChapters(selectedStoryId);
    } else {
      setChapters([]);
    }
  }, [selectedStoryId]);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      const data = await response.json();
      if (data.success) {
        const storiesWithStringId = data.data.map((story: any) => ({
          ...story,
          _id: story._id.toString(),
        }));
        setStories(storiesWithStringId);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchChapters = async (storyId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stories/${storyId}/chapters`);
      const data = await response.json();
      if (data.success) {
        const chaptersWithStringId = data.data.map((chapter: any) => ({
          ...chapter,
          _id: chapter._id.toString(),
        }));
        setChapters(chaptersWithStringId);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async () => {
    if (!crawlUrl) {
      setMessage({ type: 'error', text: 'Vui lòng nhập URL trước' });
      return;
    }

    setDetecting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl, mode: crawlMode }),
      });

      const data = await response.json();

      if (data.success && data.data.selectors) {
        const newSelectors = data.data.selectors;
        setSelectors(prev => ({
          titleSelector: newSelectors.titleSelector || prev.titleSelector,
          contentSelector: newSelectors.contentSelector || prev.contentSelector,
          nextSelector: newSelectors.nextSelector || prev.nextSelector,
          listSelector: newSelectors.listSelector || prev.listSelector,
          linkSelector: newSelectors.linkSelector || prev.linkSelector,
        }));
        
        if (data.data.preset) {
          setDetectedPreset(data.data.preset);
          setMessage({ type: 'success', text: `Đã phát hiện: ${data.data.preset}` });
        } else {
          setDetectedPreset(null);
          setMessage({ type: 'success', text: 'Đã tự động phát hiện selectors!' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể phát hiện selectors' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setDetecting(false);
    }
  };

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn một truyện trước' });
      return;
    }

    setCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: selectedStoryId,
          url: crawlUrl,
          mode: crawlMode,
          selectors: selectors,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: crawlMode === 'list' 
            ? `Đã crawl ${data.data.total} chương!`
            : 'Crawl chương thành công!',
        });
        fetchChapters(selectedStoryId);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setCrawling(false);
    }
  };

  const handleAutoCrawl = async () => {
    if (!selectedStoryId || !crawlUrl) {
      setMessage({ type: 'error', text: 'Vui lòng chọn truyện và nhập URL' });
      return;
    }

    setAutoCrawling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/crawl/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: selectedStoryId, storyUrl: crawlUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.data.message || `Đã crawl ${data.data.total} chương!`,
        });
        fetchChapters(selectedStoryId);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setAutoCrawling(false);
    }
  };

  const pendingChapters = chapters.filter(ch => !ch.originalContent || ch.originalContent.trim() === '');
  const crawledChapters = chapters.filter(ch => ch.originalContent && ch.originalContent.trim() !== '');

  const handleBatchCrawl = async () => {
      setCrawling(true);
      setMessage(null);
      try {
        const response = await fetch('/api/crawl/chapters/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: selectedStoryId, limit: 10 }),
        });
        const data = await response.json();
        if (data.success) {
          const successCount = data.data.results.filter((r: { status: string }) => r.status === 'success').length;
          setMessage({ type: 'success', text: `Đã crawl ${successCount}/${data.data.processed} chương!` });
          fetchChapters(selectedStoryId);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      } catch {
        setMessage({ type: 'error', text: 'Lỗi kết nối' });
      } finally {
        setCrawling(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Crawl Truyện</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Crawl</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Chọn Truyện"
                value={selectedStoryId}
                onChange={(e) => setSelectedStoryId(e.target.value)}
              >
                <option value="">-- Chọn truyện --</option>
                {stories.map((story) => (
                  <option key={story._id} value={story._id}>{story.title}</option>
                ))}
              </Select>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  URL Nguồn
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => {
                      setCrawlUrl(e.target.value);
                      setDetectedPreset(null);
                    }}
                    placeholder="https://metruyenchu.com.vn/..."
                    className="flex-1"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleDetect}
                    disabled={detecting || !crawlUrl}
                    title="Tự động phát hiện"
                  >
                   {detecting ? <div className="animate-spin h-5 w-5 border-2 border-zinc-500 rounded-full border-t-transparent"></div> : <BoltIcon className="w-5 h-5" />}
                  </Button>
                </div>
                 {detectedPreset && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Đã phát hiện: {detectedPreset}
                  </p>
                )}
              </div>

              <Select
                label="Chế độ"
                value={crawlMode}
                onChange={(e) => setCrawlMode(e.target.value as 'single' | 'list')}
              >
                <option value="single">Crawl một chương</option>
                <option value="list">Crawl danh sách chương</option>
              </Select>

              {/* Selectors Inputs */}
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                 <p className="text-xs font-semibold text-zinc-500 uppercase">Selectors (CSS)</p>
                 {crawlMode === 'single' ? (
                   <>
                     <Input label="Title" value={selectors.titleSelector} onChange={e => setSelectors({...selectors, titleSelector: e.target.value})} placeholder="h1.title" />
                     <Input label="Content *" value={selectors.contentSelector} onChange={e => setSelectors({...selectors, contentSelector: e.target.value})} placeholder="div.content" required />
                     <Input label="Next Chapter" value={selectors.nextSelector} onChange={e => setSelectors({...selectors, nextSelector: e.target.value})} placeholder="a.next" />
                   </>
                 ) : (
                   <>
                      <Input label="List Item *" value={selectors.listSelector} onChange={e => setSelectors({...selectors, listSelector: e.target.value})} placeholder="ul.list li" required />
                      <Input label="Chapter Title *" value={selectors.titleSelector} onChange={e => setSelectors({...selectors, titleSelector: e.target.value})} placeholder="a" required />
                      <Input label="Chapter Link *" value={selectors.linkSelector} onChange={e => setSelectors({...selectors, linkSelector: e.target.value})} placeholder="a" required />
                   </>
                 )}
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                 {detectedPreset && crawlMode === 'list' && (
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={handleAutoCrawl}
                    isLoading={autoCrawling}
                    disabled={!selectedStoryId}
                  >
                    Auto
                  </Button>
                 )}
                 <Button 
                   className="flex-1" 
                   onClick={handleCrawlSubmit}
                   isLoading={crawling}
                   disabled={!selectedStoryId}
                  >
                   <CloudArrowDownIcon className="w-5 h-5 mr-2" />
                   Crawl
                 </Button>
              </div>

            </CardContent>
          </Card>

           {/* Batch Actions for Existing Chapters */}
           {selectedStoryId && pendingChapters.length > 0 && (
             <Card>
               <CardHeader>
                 <CardTitle>Crawl Hàng Loạt</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                   <span>Chưa crawl: {pendingChapters.length}</span>
                   <span>Đã crawl: {crawledChapters.length}</span>
                 </div>
                 <Button 
                   variant="secondary" 
                   className="w-full" 
                   onClick={handleBatchCrawl}
                   isLoading={crawling}
                >
                   <PlayIcon className="w-4 h-4 mr-2" />
                   Crawl 10 Chương Tiếp Theo
                 </Button>
               </CardContent>
             </Card>
           )}
        </div>

        {/* Right Column: List */}
        <div className="xl:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Danh sách chương ({chapters.length})</CardTitle>
                <div className="text-sm text-zinc-500">{loading ? 'Đang tải...' : ''}</div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto min-h-[500px] max-h-[800px]">
                 {chapters.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60">
                     <CloudArrowDownIcon className="w-16 h-16 mb-4" />
                     <p>Chọn truyện để xem danh sách chương</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {chapters.map((chapter) => (
                       <div key={chapter._id} className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex justify-between items-center group">
                          <div>
                            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                              Chương {chapter.chapterNumber}: {chapter.title}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 truncate max-w-md">
                              {chapter.url}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                             <Badge variant={chapter.originalContent ? 'success' : 'default'}>
                               {chapter.originalContent ? 'Đã có nội dung' : 'Chưa crawl'}
                             </Badge>
                             {!chapter.originalContent && (
                               <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => {/* Handle single crawl */}}>
                                 <CloudArrowDownIcon className="w-4 h-4" />
                               </Button>
                             )}
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
