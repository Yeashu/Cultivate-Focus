import { Sparkles, X } from "lucide-react";
import type { TaskDTO } from "@/types";

interface CompletionScreenProps {
  info: { duration: number; points: number; sessionId: string };
  tasks: TaskDTO[];
  todayTasks: TaskDTO[];
  todayIso: string;
  onAssign: (taskId: string) => void;
  onDismiss: () => void;
}

export function CompletionScreen({
  info,
  tasks,
  todayTasks,
  todayIso,
  onAssign,
  onDismiss,
}: CompletionScreenProps) {
  return (
    <div className="w-full rounded-2xl border border-[var(--focus)]/30 bg-[var(--focus-soft)]/20 p-6 text-left">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--focus)]/10">
          <Sparkles className="h-6 w-6 text-[var(--focus)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Session Complete! 🌱
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            You focused for {info.duration} minutes and earned{" "}
            <span className="font-semibold text-[var(--focus)]">
              +{info.points} FP
            </span>
          </p>

          {tasks.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Link this session to a task?
              </p>

              {todayTasks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {todayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task._id}
                      type="button"
                      onClick={() => onAssign(task._id)}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--focus)] hover:bg-[var(--focus-soft)]/30"
                    >
                      {task.title.length > 20 ? `${task.title.slice(0, 20)}...` : task.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssign(e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--focus)] focus:outline-none"
                >
                  <option value="" disabled>
                    {todayTasks.length > 0 ? "Or choose another task..." : "Choose a task..."}
                  </option>
                  {tasks.filter((t) => !t.completed).map((task) => (
                    <option key={task._id} value={task._id}>
                      {task.title} {task.scheduledDate === todayIso ? "(today)" : `(${task.scheduledDate})`}
                    </option>
                  ))}
                  {tasks.filter((t) => t.completed).length > 0 && (
                    <optgroup label="Completed">
                      {tasks.filter((t) => t.completed).map((task) => (
                        <option key={task._id} value={task._id}>
                          {task.title} ✓
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                <X className="h-3 w-3" />
                Keep as General Focus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
