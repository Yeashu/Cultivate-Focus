"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Coffee,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";

import { useTimerState, useTimerActions } from "@/context/timer-context";
import { useSessionActions } from "@/context/focus-context";
import { getTodayIso } from "@/lib/dates";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.max(seconds % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ── Compact task switcher pill ────────────────────────────────────────────

function TaskSwitcher({
  todayTasks,
  otherTasks,
  currentTaskId,
  onSelect,
  onClose,
}: {
  todayTasks: { _id: string; title: string }[];
  otherTasks: { _id: string; title: string }[];
  currentTaskId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const allTasks = [
    ...todayTasks.filter((t) => t._id !== currentTaskId),
    ...otherTasks.filter((t) => t._id !== currentTaskId),
  ];

  if (allTasks.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--muted)]">
        No other tasks to switch to.
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-[var(--focus)] hover:underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
      <div className="px-3 py-2 text-xs font-medium text-[var(--muted)]">Switch task</div>
      {allTasks.slice(0, 8).map((t) => (
        <button
          key={t._id}
          type="button"
          onClick={() => { onSelect(t._id); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          <span className="flex-1 truncate">{t.title}</span>
        </button>
      ))}
    </div>
  );
}

// ── Break prompt shown after a focus session in the widget ───────────────

function BreakPrompt({
  breakDuration,
  onStartBreak,
  onDismiss,
}: {
  breakDuration: number;
  onStartBreak: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-xs text-[var(--muted)]">Ready for a {breakDuration}-min break?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onStartBreak}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--break)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--break)]/90"
        >
          <Coffee className="h-3 w-3" /> Start Break
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--focus)] hover:text-[var(--focus)]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Main FloatingTimerWidget ──────────────────────────────────────────────

export function FloatingTimerWidget() {
  const pathname = usePathname();

  const {
    mode,
    isRunning,
    isPaused,
    timeLeft,
    isOverflow,
    overflowSeconds,
    showCompletionScreen,
    completedSessionInfo,
    statusMessage,
    progress,
    breakDuration,
    selectedTaskId,
    mindfulMessage,
  } = useTimerState();

  const {
    toggleTimer,
    wrapUpSession,
    resetTimer,
    switchTask,
    startTimer,
    setMode,
    setShowCompletionScreen,
    setStatusMessage,
    handleAssignFromCompletion,
  } = useTimerActions();

  const { tasks } = useSessionActions();
  const todayIso = getTodayIso();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showTaskSwitcher, setShowTaskSwitcher] = useState(false);
  // local flag to show the break prompt after a focus wrap-up
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);

  const selectedTaskTitle = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t._id === selectedTaskId)?.title ?? null : null),
    [selectedTaskId, tasks]
  );

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === todayIso && !t.completed),
    [tasks, todayIso]
  );
  const otherTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.scheduledDate !== todayIso),
    [tasks, todayIso]
  );

  // Hide widget on the /timer page — the full timer page takes over there
  const isOnTimerPage = pathname === "/timer";

  // Show widget when the timer is in an active state
  const isActive =
    isRunning ||
    isPaused ||
    showCompletionScreen ||
    showBreakPrompt ||
    (!!statusMessage && !showCompletionScreen);

  if (isOnTimerPage || !isActive) return null;

  // ── Derived display values ──────────────────────────────────────────────

  const modeColor =
    mode === "focus" ? "var(--focus)" : "var(--break)";

  const displayLabel =
    mode === "focus"
      ? (selectedTaskTitle ?? mindfulMessage)
      : "Break time 🍵";

  const circumference = 2 * Math.PI * 28; // r=28 in the mini ring
  const strokeDashoffset = isOverflow
    ? 0
    : circumference * (1 - progress);

  const handleWrapUp = async () => {
    await wrapUpSession();
    // Show break prompt only after focus sessions
    if (mode === "focus") {
      setShowBreakPrompt(true);
    }
  };

  const handleStartBreak = () => {
    setShowBreakPrompt(false);
    setMode("break");
    startTimer(selectedTaskId || undefined, breakDuration);
  };

  const handleDone = () => {
    setShowBreakPrompt(false);
    setStatusMessage(null);
  };

  // ── Minimized pill view ─────────────────────────────────────────────────

  if (isMinimized) {
    return (
      <motion.div
        key="minimized"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold shadow-lg transition-shadow hover:shadow-xl"
          style={{ color: modeColor }}
        >
          {/* Pulsing dot */}
          <span
            className={`inline-block h-2 w-2 rounded-full ${isRunning ? "animate-pulse" : ""}`}
            style={{ backgroundColor: modeColor }}
          />
          {isOverflow ? `+${formatTime(overflowSeconds)}` : formatTime(timeLeft)}
          <ChevronUp className="h-3.5 w-3.5 text-[var(--muted)]" />
        </button>
      </motion.div>
    );
  }

  // ── Expanded widget ─────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        key="expanded"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="floating-timer-mobile fixed bottom-4 right-4 z-50 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-4 py-2.5"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${modeColor} 15%, transparent), color-mix(in srgb, ${modeColor} 5%, transparent))`,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${isRunning ? "animate-pulse" : ""}`}
              style={{ backgroundColor: modeColor }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: modeColor }}
            >
              {mode === "focus" ? "Focus" : "Break"}
            </span>
            <span className="truncate text-xs text-[var(--muted)] max-w-[110px]">
              {displayLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Task switcher */}
            {mode === "focus" && (isRunning || isPaused) && (
              <button
                type="button"
                onClick={() => setShowTaskSwitcher(!showTaskSwitcher)}
                className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                title="Switch task"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Open full timer */}
            <Link
              href="/timer"
              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              title="Open full timer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            {/* Minimize */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              title="Minimize"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {/* Close / reset */}
            {!isRunning && (
              <button
                type="button"
                onClick={() => { resetTimer(); setShowBreakPrompt(false); }}
                className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-red-400"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Task switcher dropdown ──────────────────────────────────── */}
        {showTaskSwitcher && (
          <div className="px-3 pt-2">
            <TaskSwitcher
              todayTasks={todayTasks}
              otherTasks={otherTasks}
              currentTaskId={selectedTaskId}
              onSelect={switchTask}
              onClose={() => setShowTaskSwitcher(false)}
            />
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Mini progress ring */}
          <div className="relative flex-shrink-0 h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--border)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={modeColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={isOverflow ? "animate-pulse" : ""}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: modeColor }}
              >
                {isOverflow
                  ? `+${formatTime(overflowSeconds)}`
                  : formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-1 flex-col gap-2">
            {/* Break prompt */}
            {showBreakPrompt && (
              <BreakPrompt
                breakDuration={breakDuration}
                onStartBreak={handleStartBreak}
                onDismiss={handleDone}
              />
            )}

            {/* Completion screen (compact) */}
            {showCompletionScreen && completedSessionInfo && !showBreakPrompt && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[var(--muted)]">
                  Session saved!{" "}
                  <span className="font-semibold text-[var(--focus)]">
                    +{completedSessionInfo.points} FP
                  </span>
                </p>
                {/* Quick assign to currently-selected task if none */}
                {!selectedTaskId && todayTasks.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {todayTasks.slice(0, 2).map((t) => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => handleAssignFromCompletion(t._id)}
                        className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--foreground)] transition-colors hover:border-[var(--focus)] hover:bg-[var(--focus-soft)]/20"
                      >
                        {t.title.length > 16 ? `${t.title.slice(0, 16)}…` : t.title}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowCompletionScreen(false);
                    setStatusMessage(null);
                    if (mode === "focus") setShowBreakPrompt(true);
                  }}
                  className="text-xs text-[var(--muted)] underline-offset-2 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Status message */}
            {statusMessage && !showCompletionScreen && !showBreakPrompt && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--muted)] line-clamp-2">{statusMessage}</p>
                <button
                  type="button"
                  onClick={() => { setStatusMessage(null); resetTimer(); }}
                  className="flex-shrink-0 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Primary controls — shown when running or paused */}
            {(isRunning || isPaused) && !showBreakPrompt && (
              <div className="flex gap-2">
                {/* Pause / Resume */}
                <button
                  type="button"
                  onClick={toggleTimer}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                  style={{ backgroundColor: isRunning ? "var(--break)" : "var(--focus)" }}
                >
                  {isRunning ? (
                    <><Pause className="h-3 w-3" /> Pause</>
                  ) : (
                    <><Play className="h-3 w-3" /> Resume</>
                  )}
                </button>

                {/* Wrap Up (overflow) or Stop */}
                {isOverflow && isRunning ? (
                  <button
                    type="button"
                    onClick={handleWrapUp}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    style={{ backgroundColor: "var(--focus)" }}
                  >
                    <Sparkles className="h-3 w-3" /> Wrap Up
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { resetTimer(); setShowBreakPrompt(false); }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
