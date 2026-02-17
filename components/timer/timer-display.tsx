import { TimerIcon } from "lucide-react";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = Math.max(seconds % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

interface TimerDisplayProps {
  progress: number;
  isOverflow: boolean;
  overflowSeconds: number;
  timeLeft: number;
  mode: "focus" | "break";
  selectedTaskTitle: string | null;
  mindfulMessage: string;
}

export function TimerDisplay({
  progress,
  isOverflow,
  overflowSeconds,
  timeLeft,
  mode,
  selectedTaskTitle,
  mindfulMessage,
}: TimerDisplayProps) {
  return (
    <div
      className={`relative flex h-64 w-64 items-center justify-center rounded-full bg-[var(--surface-muted)] ${isOverflow ? "animate-pulse" : ""}`}
      style={{
        background: isOverflow
          ? `conic-gradient(var(--focus) 360deg, var(--focus) 0deg)`
          : `conic-gradient(var(--focus) ${progress * 360}deg, rgba(148, 163, 184, 0.35) 0deg)`,
      }}
    >
      <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-full bg-[var(--surface)] text-[var(--foreground)] shadow-inner">
        <TimerIcon className="h-6 w-6 text-[var(--muted)]" />
        {isOverflow ? (
          <>
            <span className="text-5xl font-semibold tracking-tight text-[var(--focus)]">
              +{formatTime(overflowSeconds)}
            </span>
            <span className="text-xs font-medium text-[var(--focus)]">
              Flow State 🌿
            </span>
          </>
        ) : (
          <span className="text-5xl font-semibold tracking-tight">
            {formatTime(timeLeft)}
          </span>
        )}
        <span className="max-w-[180px] text-sm text-[var(--muted)]">
          {mode === "focus"
            ? (selectedTaskTitle ?? mindfulMessage)
            : "Release and recharge"}
        </span>
      </div>
    </div>
  );
}
