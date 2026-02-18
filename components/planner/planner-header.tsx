"use client";

import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

interface PlannerHeaderProps {
  monthYearLabel: string;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  somedayCount: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function PlannerHeader({
  monthYearLabel,
  weekOffset,
  onPrev,
  onNext,
  onToday,
  somedayCount,
  sidebarOpen,
  onToggleSidebar,
}: PlannerHeaderProps) {
  return (
    <header className="planner-header">
      <h2 className="text-2xl font-light tracking-tight text-[var(--foreground)]">
        {monthYearLabel}
      </h2>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
          disabled={weekOffset === 0}
        >
          Today
        </button>
        <button
          onClick={onNext}
          className="p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="mx-2 h-5 w-px bg-[var(--border)]" />

        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
            sidebarOpen
              ? "bg-[var(--focus-soft)] text-[var(--focus)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          aria-label={sidebarOpen ? "Hide someday panel" : "Show someday panel"}
        >
          <Inbox className="h-4 w-4" />
          {somedayCount > 0 && (
            <span className="min-w-[1.25rem] rounded-full bg-[var(--muted)]/20 px-1.5 text-xs font-medium">
              {somedayCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
