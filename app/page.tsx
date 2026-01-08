"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Flame,
  Clock3,
  CheckCircle2,
  Leaf,
} from "lucide-react";

import { useFocus } from "@/context/focus-context";
import { formatDateLabel, getTodayIso } from "@/lib/dates";
import { Skeleton } from "@/components/ui/skeleton";

const PlantLifecycle = dynamic(
  () => import("@/components/dashboard/plant-lifecycle").then((mod) => mod.PlantLifecycle),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-2xl" />,
  }
);

const GardenStreak = dynamic(
  () => import("@/components/dashboard/garden-streak").then((mod) => mod.GardenStreak),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-2xl" />,
  }
);

const WeeklyTrend = dynamic(
  () => import("@/components/dashboard/weekly-trend").then((mod) => mod.WeeklyTrend),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  }
);

// Simplified stat display without heavy card containers
function StatValue({
  label,
  value,
  icon,
  accent = "focus",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "focus" | "break" | "muted";
}) {
  const accentColors = {
    focus: "text-[var(--focus)]",
    break: "text-[var(--break)]",
    muted: "text-[var(--muted)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <div className={`${accentColors[accent]}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
        <p className="text-xl font-semibold text-[var(--foreground)]">{value}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { stats, tasks, sessions, loading, error } = useFocus();
  const todayIso = getTodayIso();

  const completedTasks = tasks.filter((task) => task.completed).length;
  const activeTasks = tasks.length - completedTasks;
  
  // Today's general focus sessions
  const todayGeneralSessions = sessions.filter(s => s.date === todayIso && !s.taskId);
  const todayGeneralPoints = todayGeneralSessions.reduce((sum, s) => sum + s.pointsEarned, 0);

  // Top focus tasks
  const topTasks = [...tasks]
    .filter(t => t.earnedPoints > 0)
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-10">
      {/* Today's Stats - Minimal inline display */}
      <section className="flex flex-wrap items-center gap-8 border-b border-[var(--border)]/40 pb-6">
        <StatValue
          label="Focus Points"
          value={loading ? "—" : stats.todayPoints}
          icon={<Flame className="h-5 w-5" />}
          accent="focus"
        />
        <StatValue
          label="Minutes"
          value={loading ? "—" : stats.todayMinutes}
          icon={<Clock3 className="h-5 w-5" />}
          accent="muted"
        />
        <StatValue
          label="Sessions"
          value={loading ? "—" : stats.todaySessions}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="focus"
        />
        <StatValue
          label="Active Tasks"
          value={loading ? "—" : activeTasks}
          icon={<Leaf className="h-5 w-5" />}
          accent="break"
        />
      </section>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-red-300/60 bg-red-50/60 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </motion.div>
      )}

      {/* Plant Growth & Streak */}
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <PlantLifecycle stage={stats.growthStage} totalPoints={stats.totalPoints} />
        <GardenStreak streak={stats.streak} />
      </section>

      {/* Weekly Trend - Line graph */}
      <section>
        <WeeklyTrend data={stats.weekly} />
      </section>

      {/* Today's Activity & Top Tasks */}
      <section className="grid gap-8 md:grid-cols-2">
        {/* Today's Sessions */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Today&apos;s Activity
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Keep your garden growing with consistent focus.
          </p>
          <div className="mt-4 space-y-3">
            {stats.todaySessions > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)]/40 p-3 text-sm"
              >
                <span className="font-medium text-[var(--foreground)]">
                  {formatDateLabel(todayIso)}
                </span>
                <span className="font-semibold text-[var(--focus)]">
                  {stats.todayPoints} FP earned
                </span>
              </motion.div>
            ) : null}
            
            {todayGeneralSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between rounded-xl bg-[var(--focus-soft)]/20 p-3 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                  <Leaf className="h-4 w-4 text-[var(--focus)]" />
                  General Focus
                </span>
                <span className="text-[var(--focus)]">
                  {todayGeneralSessions.length} session{todayGeneralSessions.length > 1 ? "s" : ""} · {todayGeneralPoints} FP
                </span>
              </motion.div>
            )}
            
            {stats.todaySessions === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border)]/50 p-4 text-sm text-[var(--muted)]">
                No sessions yet today. Start a timer to grow your garden.
              </div>
            )}
          </div>
        </div>

        {/* Top Tasks */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Focus Leaders
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tasks with the most earned Focus Points.
          </p>
          <div className="mt-4 space-y-3">
            {topTasks.map((task, index) => {
              const goal = task.focusMinutesGoal;
              const progress = goal && goal > 0 
                ? Math.min(Math.round((task.earnedPoints / goal) * 100), 100)
                : 0;
              
              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl bg-[var(--surface-muted)]/40 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--foreground)]">
                      {task.title}
                    </span>
                    <span className="font-semibold text-[var(--focus)]">
                      {task.earnedPoints} FP
                    </span>
                  </div>
                  {goal && goal > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]/60">
                        <motion.div
                          className="h-full rounded-full bg-[var(--focus)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {progress}% of {goal}m goal
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {topTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border)]/50 p-4 text-sm text-[var(--muted)]">
                Complete focus sessions to see your top tasks here.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
