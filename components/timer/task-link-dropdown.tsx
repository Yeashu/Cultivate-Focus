import { ChevronDown, Link2 } from "lucide-react";
import type { TaskDTO } from "@/types";

interface TaskLinkDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (taskId: string) => void;
  todayTasks: TaskDTO[];
  otherTasks: TaskDTO[];
  completedTasks: TaskDTO[];
}

export function TaskLinkDropdown({
  isOpen,
  onToggle,
  onSelect,
  todayTasks,
  otherTasks,
  completedTasks,
}: TaskLinkDropdownProps) {
  const hasAnyTasks = todayTasks.length > 0 || otherTasks.length > 0 || completedTasks.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)]/60 px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--focus)] hover:text-[var(--focus)]"
      >
        <Link2 className="h-4 w-4" />
        Link to task
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && hasAnyTasks && (
        <div className="absolute left-1/2 top-full z-10 mt-2 max-h-64 w-80 -translate-x-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
          {todayTasks.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Today
              </div>
              {todayTasks.map((task) => (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => onSelect(task._id)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <span className="flex-1 truncate">{task.title}</span>
                  {task.focusMinutesGoal && (
                    <span className="text-xs text-[var(--muted)]">
                      {task.focusMinutesGoal}m
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {otherTasks.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Other Days
              </div>
              {otherTasks.map((task) => (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => onSelect(task._id)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {task.scheduledDate}
                  </span>
                </button>
              ))}
            </>
          )}

          {completedTasks.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Completed
              </div>
              {completedTasks.map((task) => (
                <button
                  key={task._id}
                  type="button"
                  onClick={() => onSelect(task._id)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
                >
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-xs">✓</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
