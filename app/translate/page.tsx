import { getStoriesList, getChaptersList } from './actions';
import TranslatePageClient from './components/TranslatePageClient';

interface TranslatePageProps {
  searchParams: Promise<{ storyId?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function TranslatePage(props: TranslatePageProps) {
  const searchParams = await props.searchParams;
  const storyId = searchParams.storyId || null;

  // Fetch stories và chapters (nếu có storyId) trên server
  const [storiesResult, chaptersResult] = await Promise.all([
    getStoriesList(),
    storyId ? getChaptersList(storyId) : Promise.resolve({ success: true, data: [] }),
  ]);

  const stories = storiesResult.success ? storiesResult.data : [];
  const chapters = chaptersResult.success ? chaptersResult.data : [];

  return (
    <TranslatePageClient 
      initialStories={stories}
      initialStoryId={storyId}
      initialChapters={chapters}
    />
  );
}
