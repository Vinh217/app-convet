import { getStoriesList, getChaptersPaginated } from './actions';
import TranslatePageClient from './components/TranslatePageClient';

interface TranslatePageProps {
  searchParams: Promise<{ storyId?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function TranslatePage(props: TranslatePageProps) {
  const searchParams = await props.searchParams;
  const storyId = searchParams.storyId || null;

  // Fetch stories và chỉ trang đầu tiên của chapters (nếu có storyId)
  const [storiesResult, chaptersResult] = await Promise.all([
    getStoriesList(),
    storyId
      ? getChaptersPaginated({ storyId, page: 1, limit: 50 })
      : Promise.resolve({ success: true, data: null }),
  ]);

  const stories = storiesResult.success ? storiesResult.data : [];
  const chapters =
    chaptersResult.success && chaptersResult.data ? chaptersResult.data.chapters : [];

  return (
    <TranslatePageClient 
      initialStories={stories}
      initialStoryId={storyId}
      initialChapters={chapters}
    />
  );
}
