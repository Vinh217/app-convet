import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { translateChapterFn } from '@/inngest/translateChapter';
import { crawlChaptersFn } from '@/inngest/crawlChapters';

// Inngest route handler cho Next.js (Vercel)
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [translateChapterFn, crawlChaptersFn],
});


