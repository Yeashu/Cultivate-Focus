import { formatDateLabel } from "@/lib/dates";
import type { SessionDTO, TaskDTO } from "@/types";

interface RecentSessionsProps {
  sessions: SessionDTO[];
  tasks: TaskDTO[];
}

export function RecentSessions({ sessions, tasks }: RecentSessionsProps) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Recent sessions
      </h2>
      <div className="mt-4 space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Sessions you complete will appear here.
          </p>
        ) : (
          sessions.map((session) => {
            const taskTitle = session.taskId
              ? tasks.find((task) => task._id === session.taskId)?.title ?? "Task"
              : "General Focus";
            return (
              <div
                key={session._id}
                className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/40 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {session.taskId ? (
                      taskTitle
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="text-[var(--focus)]">🌿</span>
                        {taskTitle}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateLabel(session.date)} · {session.duration} min
                  </p>
                </div>
                <span className="font-semibold text-[var(--focus)]">
                  +{session.pointsEarned} FP
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
