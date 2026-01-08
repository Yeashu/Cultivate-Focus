import { Skeleton } from "@/components/ui/skeleton";

export default function TimerLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <Skeleton className="h-6 w-28" />
          {[...Array(6)].map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
