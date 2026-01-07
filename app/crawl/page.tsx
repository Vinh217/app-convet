import { getStoriesList, getChaptersPaginated, getChaptersByRange, getChaptersByNumbers, getChaptersFrom } from './actions';
import CrawlPageClient from './components/CrawlPageClient';
import { parseSearchQuery } from '@/app/translate/utils/searchParser';

interface CrawlPageProps {
  searchParams: Promise<{ 
    storyId?: string;
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function CrawlPage(props: CrawlPageProps) {
  const searchParams = await props.searchParams;
  const storyId = searchParams.storyId || null;
  const page = parseInt(searchParams.page || '1', 10);
  const search = searchParams.search || '';
  const status = searchParams.status || 'all';

  // Fetch stories
  const storiesResult = await getStoriesList();
  const stories = storiesResult.success ? storiesResult.data : [];

  // Fetch chapters if storyId is provided
  let chapters: Array<{
    _id: string;
    chapterNumber: number;
    title: string;
    originalContent: string;
    url: string;
    status: string;
  }> = [];
  let pagination = {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };

  if (storyId) {
    // Parse search query for smart search patterns
    const parsed = parseSearchQuery(search);
    const effectiveStatus = parsed.status || (status === 'all' ? undefined : status);

    let chaptersResult;

    // Handle smart search patterns
    if (parsed.type === 'range' && parsed.from && parsed.to) {
      // Range search: fetch all chapters in range (no pagination)
      chaptersResult = await getChaptersByRange({
        storyId,
        from: parsed.from,
        to: parsed.to,
        status: effectiveStatus,
      });
      if (chaptersResult.success && chaptersResult.data) {
        chapters = chaptersResult.data.chapters;
        pagination = {
          page: 1,
          limit: chapters.length,
          total: chaptersResult.data.count,
          totalPages: 1,
          hasMore: false,
        };
      }
    } else if (parsed.type === 'list' && parsed.numbers && parsed.numbers.length > 0) {
      // List search: fetch specific chapters
      chaptersResult = await getChaptersByNumbers({
        storyId,
        numbers: parsed.numbers,
        status: effectiveStatus,
      });
      if (chaptersResult.success && chaptersResult.data) {
        chapters = chaptersResult.data.chapters;
        pagination = {
          page: 1,
          limit: chapters.length,
          total: chaptersResult.data.count,
          totalPages: 1,
          hasMore: false,
        };
      }
    } else if (parsed.type === 'from' && parsed.from) {
      // From onwards: fetch all chapters from number (no pagination)
      chaptersResult = await getChaptersFrom({
        storyId,
        from: parsed.from,
        status: effectiveStatus,
      });
      if (chaptersResult.success && chaptersResult.data) {
        chapters = chaptersResult.data.chapters;
        pagination = {
          page: 1,
          limit: chapters.length,
          total: chaptersResult.data.count,
          totalPages: 1,
          hasMore: false,
        };
      }
    } else {
      // Normal paginated search
      chaptersResult = await getChaptersPaginated({
        storyId,
        page,
        limit: 100,
        status: effectiveStatus,
        search: parsed.originalQuery,
      });
      if (chaptersResult.success && chaptersResult.data) {
        chapters = chaptersResult.data.chapters;
        pagination = chaptersResult.data.pagination;
      }
    }
  }

  return (
    <CrawlPageClient 
      initialStories={stories}
      initialChapters={chapters}
      initialPagination={pagination}
      initialSearch={search}
      initialStatus={status}
    />
  );
}
