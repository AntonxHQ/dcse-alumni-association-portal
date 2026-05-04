export default function AlumniDirectoryLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Page header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-48 animate-pulse rounded bg-surface-300" />
        <div className="mt-1.5 h-4 w-56 animate-pulse rounded bg-surface-300" />
      </div>

      {/* Analytics banner skeleton */}
      <div className="mb-6 rounded-lg border border-default bg-surface-100 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-36 animate-pulse rounded bg-surface-300" />
          <div className="h-3 w-28 animate-pulse rounded bg-surface-300" />
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-100 px-4 py-3">
              <div className="h-6 w-12 animate-pulse rounded bg-surface-300" />
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-surface-300" />
            </div>
          ))}
        </div>
        <div className="mt-1 border-t border-muted pt-4">
          <div className="flex gap-8">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 animate-pulse rounded bg-surface-300" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-20 animate-pulse rounded bg-surface-300"
                  />
                ))}
              </div>
            </div>
            <div className="w-44 space-y-2">
              <div className="h-3 w-14 animate-pulse rounded bg-surface-300" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2.5 w-8 animate-pulse rounded bg-surface-300" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-surface-300" />
                  <div className="h-2.5 w-5 animate-pulse rounded bg-surface-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-4 h-10 animate-pulse rounded-md bg-surface-200" />

      {/* Count skeleton */}
      <div className="mb-4 h-3 w-24 animate-pulse rounded bg-surface-300" />

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-default bg-surface-100 p-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface-300" />
            <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-surface-300" />
            <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-surface-300" />
            <div className="mt-2 flex gap-1">
              <div className="h-4 w-8 animate-pulse rounded bg-surface-300" />
              <div className="h-4 w-8 animate-pulse rounded bg-surface-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
