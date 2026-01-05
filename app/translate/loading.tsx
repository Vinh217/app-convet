import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function TranslatePageLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Control Panel Skeleton */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  <div className="flex-1 h-10 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
                <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Chapter List Skeleton */}
        <div className="xl:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  <div className="h-10 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

