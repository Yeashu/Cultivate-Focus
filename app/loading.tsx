import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-48 w-full rounded-xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <Skeleton className="h-6 w-36" />
            <div className="mt-4 space-y-3">
              {[...Array(3)].map((__, jdx) => (
                <Skeleton key={jdx} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
