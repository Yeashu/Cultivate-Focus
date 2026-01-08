import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        {[...Array(7)].map((_, idx) => (
          <div key={idx} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <Skeleton className="h-4 w-24" />
            {[...Array(3)].map((__, jdx) => (
              <Skeleton key={jdx} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 p-4 shadow-sm">
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
