interface SessionOverviewProps {
  mode: "focus" | "break";
  isOverflow: boolean;
  focusDuration: number;
  overflowSeconds: number;
  totalSeconds: number;
  expectedPoints: number;
  selectedTaskTitle: string | null;
}

export function SessionOverview({
  mode,
  isOverflow,
  focusDuration,
  overflowSeconds,
  totalSeconds,
  expectedPoints,
  selectedTaskTitle,
}: SessionOverviewProps) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Session overview
      </h2>
      <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
        <div className="flex items-center justify-between">
          <span>Mode</span>
          <span className="font-medium text-[var(--foreground)]">
            {mode === "focus" ? (isOverflow ? "Flow State 🌿" : "Focus") : "Break"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{isOverflow ? "Base + overflow" : "Duration"}</span>
          <span className="font-medium text-[var(--foreground)]">
            {isOverflow
              ? `${focusDuration} + ${Math.floor(overflowSeconds / 60)} min`
              : `${totalSeconds / 60} min`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Expected points</span>
          <span className="font-medium text-[var(--foreground)]">
            {expectedPoints}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Task</span>
          <span className="max-w-[60%] truncate font-medium text-[var(--foreground)]">
            {selectedTaskTitle ?? "🌿 General Focus"}
          </span>
        </div>
      </div>
    </div>
  );
}
