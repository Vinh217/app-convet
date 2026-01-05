export default function ReadChapterLoading() {
  return (
    <div className="min-h-screen bg-amber-50 dark:bg-zinc-900">
      {/* Header Skeleton */}
      <div className="border-b shadow-sm bg-amber-50 dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>
          <div className="h-6 w-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-5 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="h-5 w-4/5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 border-t shadow-lg bg-amber-50/90 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            <div className="h-12 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            <div className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

