"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useTimer, type TimerState, type TimerActions, type TimerMode, type CompletedSessionInfo } from "@/components/timer/hooks/use-timer";

// Re-export types for consumers
export type { TimerMode, CompletedSessionInfo };

type TimerContextValue = TimerState & TimerActions & {
  /** Derived: 0–1 progress fraction for the ring display */
  progress: number;
  /** All tasks from FocusContext, exposed here to avoid dual hook usage */
  totalSeconds: number;
};

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const timer = useTimer();

  const totalSeconds =
    timer.mode === "focus" ? timer.focusDuration * 60 : timer.breakDuration * 60;

  const progress = timer.isOverflow
    ? 1
    : Math.min(1, Math.max(0, 1 - timer.timeLeft / totalSeconds));

  const value = useMemo<TimerContextValue>(
    () => ({ ...timer, progress, totalSeconds }),
    [timer, progress, totalSeconds]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

// ── Selector hooks ────────────────────────────────────────────────────────

function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimerContext must be used inside <TimerProvider>");
  return ctx;
}

/** Full timer context — only use when you genuinely need everything */
export function useTimerFull() {
  return useTimerContext();
}

/** Read-only timer state for display components */
export function useTimerState(): TimerState & { progress: number; totalSeconds: number } {
  const ctx = useTimerContext();
  const {
    mode, focusDuration, breakDuration, selectedTaskId,
    isRunning, isPaused, timeLeft, isOverflow, overflowSeconds,
    showCompletionScreen, completedSessionInfo, statusMessage,
    mindfulMessage, progress, totalSeconds,
  } = ctx;
  return {
    mode, focusDuration, breakDuration, selectedTaskId,
    isRunning, isPaused, timeLeft, isOverflow, overflowSeconds,
    showCompletionScreen, completedSessionInfo, statusMessage,
    mindfulMessage, progress, totalSeconds,
  };
}

/** Timer actions only */
export function useTimerActions(): TimerActions {
  const ctx = useTimerContext();
  const {
    startTimer, pauseTimer, resumeTimer, toggleTimer,
    wrapUpSession, resetTimer, switchTask,
    setFocusDuration, setBreakDuration, setMode,
    setSelectedTaskId, setShowCompletionScreen, setStatusMessage,
    handleAssignFromCompletion,
  } = ctx;
  return {
    startTimer, pauseTimer, resumeTimer, toggleTimer,
    wrapUpSession, resetTimer, switchTask,
    setFocusDuration, setBreakDuration, setMode,
    setSelectedTaskId, setShowCompletionScreen, setStatusMessage,
    handleAssignFromCompletion,
  };
}
