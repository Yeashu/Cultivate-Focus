"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useFocus } from "@/context/focus-context";
import { calculateFocusPoints } from "@/lib/points";
import { getTodayIso } from "@/lib/dates";
import { useChime } from "@/hooks/use-chime";
import { useNotifications } from "@/hooks/use-notifications";

import { TimerDisplay } from "@/components/timer/timer-display";
import { TaskLinkDropdown } from "@/components/timer/task-link-dropdown";
import { CompletionScreen } from "@/components/timer/completion-screen";
import { SessionOverview } from "@/components/timer/session-overview";
import { RecentSessions } from "@/components/timer/recent-sessions";

// Mindful placeholders for unassigned focus sessions
const MINDFUL_MESSAGES = [
  "Cultivating Focus...",
  "Stay with your breath.",
  "Present moment awareness.",
  "One thing at a time.",
  "Nurturing concentration.",
  "Growing inner stillness.",
];

function TimerContent() {
  const { tasks, logSession, sessions, updateSession } = useFocus();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");

  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Flow state: track if timer has overflowed past the original goal
  const [isOverflow, setIsOverflow] = useState(false);
  const [overflowSeconds, setOverflowSeconds] = useState(0);

  // Completion screen state
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completedSessionInfo, setCompletedSessionInfo] = useState<{
    duration: number;
    points: number;
    sessionId: string;
  } | null>(null);

  // Mid-flow task linking dropdown state
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  // Mindful message for unassigned sessions
  const [mindfulMessage] = useState(() =>
    MINDFUL_MESSAGES[Math.floor(Math.random() * MINDFUL_MESSAGES.length)]
  );

  const playChime = useChime();
  const { permission, requestPermission, showNotification } = useNotifications();

  const totalSeconds = mode === "focus" ? focusDuration * 60 : breakDuration * 60;
  const progress = isOverflow
    ? 1
    : Math.min(1, Math.max(0, 1 - timeLeft / totalSeconds));

  // Get today's tasks for the "assign to task" dropdown
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
        setSelectedTaskId(taskIdFromUrl);
      }
    }
  }, [taskIdFromUrl, tasks]);

  useEffect(() => {
    if (!isRunning && !isOverflow && !isPaused) {
      setTimeLeft((mode === "focus" ? focusDuration : breakDuration) * 60);
    }
  }, [focusDuration, breakDuration, mode, isRunning, isOverflow, isPaused]);

  // Handle overflow timer counting up
  useEffect(() => {
    if (!isRunning || !isOverflow) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setOverflowSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRunning, isOverflow]);

  useEffect(() => {
    if (!isRunning || isOverflow) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          // Don't stop the timer - enter overflow mode for flow state
          playChime();
          setIsOverflow(true);
          setOverflowSeconds(0);

          // Show gentle notification that goal is reached
          const taskTitle = selectedTaskId
            ? tasks.find((task) => task._id === selectedTaskId)?.title ?? "Focus"
            : "Focus";
          showNotification(
            "Focus Goal Reached! 🌱",
            `${taskTitle}: Your ${focusDuration} minutes are complete. Keep going or wrap up when ready.`
          );

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
    // playChime, showNotification, focusDuration, selectedTaskId, and tasks
    // are intentionally excluded: including them would restart the timer interval
    // on every notification/task change, resetting the countdown mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isOverflow, mode, totalSeconds]);

  // Calculate actual duration including overflow time
  const getActualDuration = useCallback(() => {
    const baseDuration = totalSeconds / 60;
    const overflowMinutes = Math.floor(overflowSeconds / 60);
    return baseDuration + overflowMinutes;
  }, [totalSeconds, overflowSeconds]);

  const handleCompletion = async () => {
    const todayIso = getTodayIso();
    const actualDuration = getActualDuration();
    const isDeepSession = actualDuration >= 25;

    if (mode === "focus") {
      try {
        const pointsEarned = calculateFocusPoints(actualDuration);
        await logSession({
          taskId: selectedTaskId || undefined,
          duration: actualDuration,
          pointsEarned,
          date: todayIso,
        });

        const taskTitle = selectedTaskId
          ? tasks.find((task) => task._id === selectedTaskId)?.title ?? "Task"
          : null;

        // Show completion screen only if no task was assigned and there are tasks to assign
        if (!selectedTaskId && tasks.length > 0) {
          setTimeout(() => {
            const latestSession = sessions[0];
            if (latestSession && !latestSession.taskId) {
              setCompletedSessionInfo({
                duration: actualDuration,
                points: pointsEarned,
                sessionId: latestSession._id,
              });
              setShowCompletionScreen(true);
            } else {
              setStatusMessage(`Session logged! +${pointsEarned} Focus Points earned.`);
            }
          }, 100);
        } else {
          setStatusMessage(
            taskTitle
              ? `Session logged to "${taskTitle}"! +${pointsEarned} FP earned.`
              : `Session logged! +${pointsEarned} Focus Points earned.`
          );
        }

        showNotification(
          isDeepSession ? "Deep Focus Complete! 🌳" : "Focus Session Complete! 🎯",
          `${taskTitle ?? "Focus"}: +${pointsEarned} Focus Points earned! Time for a mindful break.`
        );
        playChime(isDeepSession);
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Unable to log session right now."
        );
      }
    } else {
      setStatusMessage("Break finished. Ready to refocus when you are.");
      showNotification(
        "Break Complete! ☕",
        "Feeling refreshed? Ready to start another focus session."
      );
      playChime(false);
    }

    if (!isOverflow) {
      setMode((prev) => (prev === "focus" ? "break" : "focus"));
    }
  };

  const handleLinkTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDropdown(false);
  };

  const handleAssignFromCompletion = async (taskId: string) => {
    if (!completedSessionInfo) return;

    try {
      await updateSession({
        id: completedSessionInfo.sessionId,
        taskId,
      });

      const taskTitle = tasks.find((t) => t._id === taskId)?.title ?? "Task";
      setStatusMessage(`Session linked to "${taskTitle}"! +${completedSessionInfo.points} FP`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to link session to task."
      );
    }

    setShowCompletionScreen(false);
    setCompletedSessionInfo(null);
  };

  const toggleTimer = () => {
    setStatusMessage(null);
    setShowCompletionScreen(false);
    if (isRunning) {
      setIsPaused(true);
      setIsRunning(false);
    } else {
      setIsPaused(false);
      setIsRunning(true);
    }
  };

  const wrapUpSession = async () => {
    setIsRunning(false);
    setIsPaused(false);
    await handleCompletion();
    setIsOverflow(false);
    setOverflowSeconds(0);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalSeconds);
    setStatusMessage(null);
    setIsOverflow(false);
    setOverflowSeconds(0);
    setShowCompletionScreen(false);
    setCompletedSessionInfo(null);
  };

  const recentSessions = useMemo(() => sessions.slice(0, 4), [sessions]);

  const expectedPoints =
    mode === "focus" ? calculateFocusPoints(getActualDuration()) : 0;

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
            onClick={() => {
              setMode("focus");
              setIsRunning(false);
              setIsPaused(false);
            }}
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
            onClick={() => {
              setMode("break");
              setIsRunning(false);
              setIsPaused(false);
            }}
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
                  <Play className="h-4 w-4" /> Start
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
              onChange={(event) => {
                const value = Number(event.target.value);
                setFocusDuration(value);
                if (mode === "focus" && !isRunning) {
                  setTimeLeft(value * 60);
                }
              }}
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
              onChange={(event) => {
                const value = Number(event.target.value);
                setBreakDuration(value);
                if (mode === "break" && !isRunning) {
                  setTimeLeft(value * 60);
                }
              }}
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
