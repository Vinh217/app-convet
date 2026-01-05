export default function ReadPageLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>

        {/* Story Selector Skeleton */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 mb-6">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4 animate-pulse" />
          <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>

        {/* Chapters List Skeleton */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-16 sm:w-20">
                    <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                  <div className="shrink-0">
                    <div className="h-5 w-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

