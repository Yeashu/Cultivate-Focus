"use client";

import {
  Flame,
  Clock3,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PlantGrowth } from "@/components/dashboard/plant-growth";
import { WeeklyProgress } from "@/components/dashboard/weekly-progress";
import { useFocus } from "@/context/focus-context";
import { formatDateLabel, getTodayIso } from "@/lib/dates";

export default function DashboardPage() {
  const { stats, tasks, loading, error } = useFocus();

  const totalPoints = tasks.reduce((sum, task) => sum + task.earnedPoints, 0);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const activeTasks = tasks.length - completedTasks;
  const topTasks = [...tasks]
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, 3);
  const todayIso = getTodayIso();

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Focus Points Today"
          value={loading ? "—" : stats.todayPoints}
          icon={<Flame className="h-5 w-5" />}
          accent="focus"
        />
        <MetricCard
          title="Focused Minutes"
          value={loading ? "—" : stats.todayMinutes}
          icon={<Clock3 className="h-5 w-5" />}
          accent="muted"
        />
        <MetricCard
          title="Sessions Completed"
          value={loading ? "—" : stats.todaySessions}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="focus"
        />
        <MetricCard
          title="Active Tasks"
          value={loading ? "—" : activeTasks}
          icon={<ClipboardList className="h-5 w-5" />}
          accent="break"
        />
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-300/60 bg-red-50/60 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyProgress data={stats.weekly} />
        </div>
        <PlantGrowth points={totalPoints} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)]/60 bg-[var(--surface)]/80 p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Today&apos;s Focus Sessions
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Keep your streak alive by completing at least one more focus
            session today.
          </p>
          <div className="mt-4 space-y-3">
            {stats.weekly
              .filter((day) => day.date === todayIso)
              .map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/40 p-3 text-sm"
                >
                  <span className="font-medium text-[var(--foreground)]">
                    {formatDateLabel(day.date)}
                  </span>
                  <span className="text-[var(--muted)]">
                    {day.points} Focus Points earned
                  </span>
                </div>
              ))}
            {!stats.weekly.some((day) => day.date === todayIso) ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)]/60 p-4 text-sm text-[var(--muted)]">
                No sessions logged yet today. Start one from the timer page to
                grow your plant.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)]/60 bg-[var(--surface)]/80 p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Top Focus Tasks
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tasks with the highest cumulative Focus Points so far.
          </p>
          <div className="mt-4 space-y-4">
            {topTasks.map((task) => {
              const progress = Math.min(
                task.focusMinutes === 0
                  ? 0
                  : Math.round((task.earnedPoints / task.focusMinutes) * 100),
                100
              );
              return (
                <div
                  key={task._id}
                  className="rounded-2xl bg-[var(--surface-muted)]/40 p-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--foreground)]">
                      {task.title}
                    </span>
                    <span className="text-[var(--muted)]">
                      {task.earnedPoints} FP
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-[var(--surface)]/60">
                    <div
                      className="h-full rounded-full bg-[var(--focus)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {progress}% of {task.focusMinutes} planned minutes
                  </p>
                </div>
              );
            })}

            {topTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)]/60 p-4 text-sm text-[var(--muted)]">
                Create a task to start tracking your Focus Points journey.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
