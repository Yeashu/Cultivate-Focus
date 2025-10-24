import { formatDateLabel } from "@/lib/dates";
import type { FocusStats } from "@/types";

export function WeeklyProgress({ data }: { data: FocusStats["weekly"] }) {
  const maxPoints = Math.max(...data.map((entry) => entry.points), 1);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)]/60 bg-[var(--surface)]/80 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
          This week
        </p>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Focus Growth Trend
        </h2>
      </div>
      <div className="flex h-40 items-end gap-4">
        {data.map((entry) => {
          const height = Math.max((entry.points / maxPoints) * 100, 6);
          return (
            <div
              key={entry.date}
              className="flex flex-1 flex-col items-center justify-end gap-2 text-sm"
            >
              <div
                className="flex w-full flex-col justify-end rounded-2xl bg-[var(--focus-soft)]/80"
                style={{ height: `${height}%` }}
              >
                <div className="rounded-2xl bg-[var(--focus)]/90 p-2 text-xs font-semibold text-white">
                  {entry.points}
                </div>
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {formatDateLabel(entry.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
