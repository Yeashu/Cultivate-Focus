"use client";

import { Suspense, useState } from "react";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useSessionActions } from "@/context/focus-context";
import { useTimerFull } from "@/context/timer-context";
import { useNotifications } from "@/hooks/use-notifications";
import { calculateFocusPoints } from "@/lib/points";
import { getTodayIso } from "@/lib/dates";

import { TimerDisplay } from "@/components/timer/timer-display";
import { TaskLinkDropdown } from "@/components/timer/task-link-dropdown";
import { CompletionScreen } from "@/components/timer/completion-screen";
import { SessionOverview } from "@/components/timer/session-overview";
import { RecentSessions } from "@/components/timer/recent-sessions";

function TimerContent() {
  const { tasks, sessions } = useSessionActions();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");
  const { permission, requestPermission } = useNotifications();

  const {
    mode,
    focusDuration,
    breakDuration,
    selectedTaskId,
    isRunning,
    isPaused,
    timeLeft,
    isOverflow,
    overflowSeconds,
    showCompletionScreen,
    completedSessionInfo,
    statusMessage,
    mindfulMessage,
    progress,
    totalSeconds,
    setMode,
    setFocusDuration,
    setBreakDuration,
    setSelectedTaskId,
    toggleTimer,
    wrapUpSession,
    resetTimer,
    setShowCompletionScreen,
    setStatusMessage,
    handleAssignFromCompletion,
    switchTask,
  } = useTimerFull();

  // Local UI toggle for mid-flow task dropdown (not shared state)
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  const todayIso = getTodayIso();

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === todayIso && !t.completed),
    [tasks, todayIso]
  );
  const otherTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.scheduledDate !== todayIso),
    [tasks, todayIso]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed),
    [tasks]
  );

  const selectedTaskTitle = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t._id === selectedTaskId)?.title ?? null : null),
    [selectedTaskId, tasks]
  );

  // Set selected task from URL if provided
  useEffect(() => {
    if (taskIdFromUrl) {
      const taskExists = tasks.some((t) => t._id === taskIdFromUrl);
      if (taskExists) {
        switchTask(taskIdFromUrl);
      }
    }
  }, [taskIdFromUrl, tasks, switchTask]);

  const handleLinkTask = (taskId: string) => {
    switchTask(taskId);
    setShowTaskDropdown(false);
  };

  const recentSessions = useMemo(() => sessions.slice(0, 4), [sessions]);

  const getActualDuration = () => {
    const baseDuration = totalSeconds / 60;
    const overflowMinutes = Math.floor(overflowSeconds / 60);
    return baseDuration + overflowMinutes;
  };

  const expectedPoints = mode === "focus" ? calculateFocusPoints(getActualDuration()) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              mode === "focus"
                ? "bg-[var(--focus)] text-white shadow-md"
                : "bg-[var(--surface-muted)] text-[var(--muted)]"
            }`}
            onClick={() => setMode("focus")}
          >
            Focus Mode
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              mode === "break"
                ? "bg-[var(--break)] text-white shadow-md"
                : "bg-[var(--surface-muted)] text-[var(--muted)]"
            }`}
            onClick={() => setMode("break")}
          >
            Break Mode
          </button>
          {permission !== "granted" && (
            <button
              type="button"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--focus)] hover:text-[var(--focus)]"
              onClick={requestPermission}
            >
              🔔 Enable Notifications
            </button>
          )}
        </div>

        <div
          className="flex flex-col items-center gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <TimerDisplay
            progress={progress}
            isOverflow={isOverflow}
            overflowSeconds={overflowSeconds}
            timeLeft={timeLeft}
            mode={mode}
            selectedTaskTitle={selectedTaskTitle}
            mindfulMessage={mindfulMessage}
          />

          {/* Mid-flow task linking - only show when running without a task */}
          {isRunning && !selectedTaskId && mode === "focus" && (
            <TaskLinkDropdown
              isOpen={showTaskDropdown}
              onToggle={() => setShowTaskDropdown(!showTaskDropdown)}
              onSelect={handleLinkTask}
              todayTasks={todayTasks}
              otherTasks={otherTasks}
              completedTasks={completedTasks}
            />
          )}

          {/* Show linked task indicator when running with a task */}
          {isRunning && selectedTaskId && mode === "focus" && (
            <div className="flex items-center gap-2 rounded-full bg-[var(--focus-soft)]/40 px-4 py-2 text-sm text-[var(--focus)]">
              <Check className="h-4 w-4" />
              <span className="max-w-[200px] truncate">
                {selectedTaskTitle}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors ${
                isRunning
                  ? "bg-[var(--break)] hover:bg-[var(--break)]/90"
                  : "bg-[var(--focus)] hover:bg-[var(--focus)]/90"
              }`}
              onClick={toggleTimer}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> {isPaused ? "Resume" : "Start"}
                </>
              )}
            </button>

            {isOverflow && isRunning && (
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-[var(--focus)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--focus)]/90"
                onClick={wrapUpSession}
              >
                <Sparkles className="h-4 w-4" /> Wrap Up
              </button>
            )}

            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={resetTimer}
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
          </div>

          {showCompletionScreen && completedSessionInfo && (
            <CompletionScreen
              info={completedSessionInfo}
              tasks={tasks}
              todayTasks={todayTasks}
              todayIso={todayIso}
              onAssign={handleAssignFromCompletion}
              onDismiss={() => {
                setShowCompletionScreen(false);
                setStatusMessage(`Session logged! +${completedSessionInfo.points} FP`);
              }}
            />
          )}

          {statusMessage && !showCompletionScreen ? (
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-muted)]/60 px-4 py-2 text-sm text-[var(--muted)]">
              <AlertCircle className="h-4 w-4" />
              <span>{statusMessage}</span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--muted)]">
              Focus duration (minutes)
            </label>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={focusDuration}
              aria-label="Focus duration"
              onChange={(event) => setFocusDuration(Number(event.target.value))}
              className="w-full"
            />
            <p className="text-sm text-[var(--muted)]">{focusDuration} minutes</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--muted)]">
              Break duration (minutes)
            </label>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={breakDuration}
              aria-label="Break duration"
              onChange={(event) => setBreakDuration(Number(event.target.value))}
              className="w-full"
            />
            <p className="text-sm text-[var(--muted)]">{breakDuration} minutes</p>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <label className="block text-sm font-medium text-[var(--muted)]">
            Focus task (optional)
          </label>
          <select
            value={selectedTaskId}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            disabled={isRunning}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none disabled:opacity-50"
          >
            <option value="">🌿 General Focus (no task)</option>
            {tasks.map((task) => (
              <option key={task._id} value={task._id}>
                {task.title} {task.completed ? "✓" : ""}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Start anytime — you can link a task while focusing
          </p>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <SessionOverview
          mode={mode}
          isOverflow={isOverflow}
          focusDuration={focusDuration}
          overflowSeconds={overflowSeconds}
          totalSeconds={totalSeconds}
          expectedPoints={expectedPoints}
          selectedTaskTitle={selectedTaskTitle}
        />
        <RecentSessions sessions={recentSessions} tasks={tasks} />
      </aside>
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--focus)]" />
        </div>
      }
    >
      <TimerContent />
    </Suspense>
  );
}
