import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getChapterData, getStoryData, getTranslatedChaptersList } from './actions';
import ReadChapterClient from './components/ReadChapterClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ReadChapterPageProps {
  params: Promise<{ storyId: string; chapterNumber: string }>;
}

export default async function ReadChapterPage(props: ReadChapterPageProps) {
  const params = await props.params;
  const storyId = params.storyId;
  const chapterNumber = parseInt(params.chapterNumber, 10);

  if (!storyId || isNaN(chapterNumber)) {
    redirect('/read');
  }

  // Fetch data trên server
  const [chapterResult, storyResult, chaptersResult] = await Promise.all([
    getChapterData(storyId, chapterNumber),
    getStoryData(storyId),
    getTranslatedChaptersList(storyId),
  ]);

  const chapter = chapterResult.success ? chapterResult.data : null;
  const story = storyResult.success ? storyResult.data : null;
  const allChapters = chaptersResult.success ? chaptersResult.data : [];

  // Nếu không tìm thấy chương hoặc chưa có bản dịch
  if (!chapter || !chapter.translatedContent) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Chương này chưa có bản dịch</p>
          <Link
            href="/read"
            className="inline-block px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-md"
          >
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  // Nếu không tìm thấy story
  if (!story) {
    redirect('/read');
  }

  // Đảm bảo translatedContent không phải undefined
  if (!chapter.translatedContent) {
    redirect('/read');
  }

  return (
    <ReadChapterClient
      chapter={{
        _id: chapter._id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        translatedContent: chapter.translatedContent,
      }}
      story={story}
      allChapters={allChapters}
      storyId={storyId}
    />
  );
}
