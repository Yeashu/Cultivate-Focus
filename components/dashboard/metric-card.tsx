import type { ReactNode } from "react";

export function MetricCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  accent: "focus" | "break" | "muted";
}) {
  const accentClass = {
    focus: "bg-[var(--focus-soft)] text-[var(--focus)]",
    break: "bg-[var(--break-soft)] text-[var(--break)]",
    muted: "bg-[var(--surface-muted)] text-[var(--muted)]",
  }[accent];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/80 p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
        <p className="text-3xl font-semibold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}
