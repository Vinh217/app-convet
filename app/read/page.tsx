import { getStoriesList, getTranslatedChapters } from './actions';
import ReadPageClient from './components/ReadPageClient';

interface ReadPageProps {
  searchParams: Promise<{ storyId?: string }>;
}

export const dynamic = 'force-dynamic'; // Disable caching để luôn fetch từ server

export default async function ReadPage(props: ReadPageProps) {
  const searchParams = await props.searchParams;
  const storyId = searchParams.storyId || null;

  // Fetch stories và chapters (nếu có storyId) trên server
  const [storiesResult, chaptersResult] = await Promise.all([
    getStoriesList(),
    storyId ? getTranslatedChapters(storyId) : Promise.resolve({ success: true, data: [] }),
  ]);

  const stories = storiesResult.success ? storiesResult.data : [];
  const chapters = chaptersResult.success ? chaptersResult.data : [];

  return (
    <ReadPageClient 
      initialStories={stories}
      initialStoryId={storyId}
      initialChapters={chapters}
    />
  );
}

