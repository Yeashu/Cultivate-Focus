"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSessionActions } from "@/context/focus-context";
import { calculateFocusPoints } from "@/lib/points";
import { getTodayIso } from "@/lib/dates";
import { useChime } from "@/hooks/use-chime";
import { useNotifications } from "@/hooks/use-notifications";

export type TimerMode = "focus" | "break";

export interface CompletedSessionInfo {
  duration: number;
  points: number;
  sessionId: string;
}

export interface TimerState {
  mode: TimerMode;
  focusDuration: number;
  breakDuration: number;
  selectedTaskId: string;
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  isOverflow: boolean;
  overflowSeconds: number;
  showCompletionScreen: boolean;
  completedSessionInfo: CompletedSessionInfo | null;
  statusMessage: string | null;
  mindfulMessage: string;
}

export interface TimerActions {
  startTimer: (taskId?: string, durationMinutes?: number, mode?: TimerMode) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  toggleTimer: () => void;
  wrapUpSession: () => Promise<void>;
  resetTimer: () => void;
  switchTask: (taskId: string) => void;
  setFocusDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  setMode: (mode: TimerMode) => void;
  setSelectedTaskId: (taskId: string) => void;
  setShowCompletionScreen: (show: boolean) => void;
  setStatusMessage: (msg: string | null) => void;
  handleAssignFromCompletion: (taskId: string) => Promise<void>;
}

const MINDFUL_MESSAGES = [
  "Cultivating Focus...",
  "Stay with your breath.",
  "Present moment awareness.",
  "One thing at a time.",
  "Nurturing concentration.",
  "Growing inner stillness.",
];

const SESSION_STORAGE_KEY = "cultivate-focus:timer-state";

interface PersistedTimerState {
  isRunning: boolean;
  mode: TimerMode;
  selectedTaskId: string;
  focusDuration: number;
  breakDuration: number;
  timeLeft: number;
  isOverflow: boolean;
  overflowSeconds: number;
  startedAtMs: number | null; // wall-clock ms when timer was last started
}

function loadPersistedState(): PersistedTimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimerState;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedTimerState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearPersistedState() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useTimer(): TimerState & TimerActions {
  const { tasks, sessions, logSession, updateSession } = useSessionActions();
  const playChime = useChime();
  const { showNotification } = useNotifications();

  // Restore from sessionStorage on first mount
  const getInitialState = (): Omit<TimerState, "mindfulMessage"> => {
    const persisted = loadPersistedState();
    if (persisted) {
      let timeLeft = persisted.timeLeft;
      let overflowSeconds = persisted.overflowSeconds;

      // If it was running when persisted, account for elapsed time
      if (persisted.isRunning && persisted.startedAtMs) {
        const elapsedSecs = Math.floor((Date.now() - persisted.startedAtMs) / 1000);
        if (persisted.isOverflow) {
          overflowSeconds = persisted.overflowSeconds + elapsedSecs;
          timeLeft = 0;
        } else {
          timeLeft = Math.max(0, persisted.timeLeft - elapsedSecs);
          if (timeLeft === 0) {
            // Crossed into overflow during the away period
            const overflowElapsed = elapsedSecs - persisted.timeLeft;
            overflowSeconds = overflowElapsed;
            timeLeft = 0;
          }
        }
      }

      return {
        mode: persisted.mode,
        focusDuration: persisted.focusDuration,
        breakDuration: persisted.breakDuration,
        selectedTaskId: persisted.selectedTaskId,
        isRunning: persisted.isRunning,
        isPaused: !persisted.isRunning && persisted.timeLeft < persisted.focusDuration * 60,
        timeLeft,
        isOverflow: persisted.isOverflow || (persisted.isRunning && timeLeft === 0),
        overflowSeconds,
        showCompletionScreen: false,
        completedSessionInfo: null,
        statusMessage: null,
      };
    }
    return {
      mode: "focus",
      focusDuration: 25,
      breakDuration: 5,
      selectedTaskId: "",
      isRunning: false,
      isPaused: false,
      timeLeft: 25 * 60,
      isOverflow: false,
      overflowSeconds: 0,
      showCompletionScreen: false,
      completedSessionInfo: null,
      statusMessage: null,
    };
  };

  const initialState = useRef(getInitialState());

  const [mode, setModeState] = useState<TimerMode>(initialState.current.mode);
  const [focusDuration, setFocusDurationState] = useState(initialState.current.focusDuration);
  const [breakDuration, setBreakDurationState] = useState(initialState.current.breakDuration);
  const [selectedTaskId, setSelectedTaskIdState] = useState(initialState.current.selectedTaskId);
  const [isRunning, setIsRunning] = useState(initialState.current.isRunning);
  const [isPaused, setIsPaused] = useState(initialState.current.isPaused);
  const [timeLeft, setTimeLeft] = useState(initialState.current.timeLeft);
  const [isOverflow, setIsOverflow] = useState(initialState.current.isOverflow);
  const [overflowSeconds, setOverflowSeconds] = useState(initialState.current.overflowSeconds);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completedSessionInfo, setCompletedSessionInfo] = useState<CompletedSessionInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mindfulMessage] = useState(
    () => MINDFUL_MESSAGES[Math.floor(Math.random() * MINDFUL_MESSAGES.length)]
  );

  // Track when timer started (for sessionStorage persistence)
  const startedAtRef = useRef<number | null>(
    initialState.current.isRunning ? Date.now() : null
  );

  // Persist state to sessionStorage whenever relevant state changes
  useEffect(() => {
    const state: PersistedTimerState = {
      isRunning,
      mode,
      selectedTaskId,
      focusDuration,
      breakDuration,
      timeLeft,
      isOverflow,
      overflowSeconds,
      startedAtMs: startedAtRef.current,
    };
    savePersistedState(state);
  }, [isRunning, mode, selectedTaskId, focusDuration, breakDuration, timeLeft, isOverflow, overflowSeconds]);

  const totalSeconds = mode === "focus" ? focusDuration * 60 : breakDuration * 60;

  // Sync timeLeft when durations change while timer is idle
  useEffect(() => {
    if (!isRunning && !isOverflow && !isPaused) {
      setTimeLeft((mode === "focus" ? focusDuration : breakDuration) * 60);
    }
  }, [focusDuration, breakDuration, mode, isRunning, isOverflow, isPaused]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning || isOverflow) return undefined;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          playChime();
          setIsOverflow(true);
          setOverflowSeconds(0);

          const taskTitle = selectedTaskId
            ? tasks.find((t) => t._id === selectedTaskId)?.title ?? "Focus"
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

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isOverflow, mode, totalSeconds]);

  // Overflow counting up
  useEffect(() => {
    if (!isRunning || !isOverflow) return undefined;

    const interval = window.setInterval(() => {
      setOverflowSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, isOverflow]);

  const getActualDuration = useCallback(() => {
    const baseDuration = totalSeconds / 60;
    const overflowMinutes = Math.floor(overflowSeconds / 60);
    return baseDuration + overflowMinutes;
  }, [totalSeconds, overflowSeconds]);

  const handleCompletion = useCallback(async () => {
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
          ? tasks.find((t) => t._id === selectedTaskId)?.title ?? "Task"
          : null;

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
      } catch (err) {
        setStatusMessage(
          err instanceof Error ? err.message : "Unable to log session right now."
        );
      }
    } else {
      setStatusMessage("Break finished. Ready to refocus when you are.");
      showNotification("Break Complete! ☕", "Feeling refreshed? Ready to start another focus session.");
      playChime(false);
    }

    if (!isOverflow) {
      setModeState((prev) => (prev === "focus" ? "break" : "focus"));
    }
  }, [mode, selectedTaskId, tasks, sessions, logSession, showNotification, playChime, getActualDuration, isOverflow]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const startTimer = useCallback((taskId?: string, durationMinutes?: number, timerMode: TimerMode = "focus") => {
    setModeState(timerMode);
    setIsOverflow(false);
    setOverflowSeconds(0);
    if (taskId !== undefined) setSelectedTaskIdState(taskId);
    if (durationMinutes !== undefined) {
      if (timerMode === "focus") {
        setFocusDurationState(durationMinutes);
      } else {
        setBreakDurationState(durationMinutes);
      }
      setTimeLeft(durationMinutes * 60);
    }
    setStatusMessage(null);
    setShowCompletionScreen(false);
    setIsPaused(false);
    setIsRunning(true);
    startedAtRef.current = Date.now();
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    startedAtRef.current = null;
  }, []);

  const resumeTimer = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    startedAtRef.current = Date.now();
  }, []);

  const toggleTimer = useCallback(() => {
    setStatusMessage(null);
    setShowCompletionScreen(false);
    if (isRunning) {
      setIsPaused(true);
      setIsRunning(false);
      startedAtRef.current = null;
    } else {
      setIsPaused(false);
      setIsRunning(true);
      startedAtRef.current = Date.now();
    }
  }, [isRunning]);

  const wrapUpSession = useCallback(async () => {
    setIsRunning(false);
    setIsPaused(false);
    startedAtRef.current = null;
    await handleCompletion();
    setIsOverflow(false);
    setOverflowSeconds(0);
    clearPersistedState();
  }, [handleCompletion]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(totalSeconds);
    setStatusMessage(null);
    setIsOverflow(false);
    setOverflowSeconds(0);
    setShowCompletionScreen(false);
    setCompletedSessionInfo(null);
    startedAtRef.current = null;
    clearPersistedState();
  }, [totalSeconds]);

  const switchTask = useCallback((taskId: string) => {
    setSelectedTaskIdState(taskId);
  }, []);

  const setFocusDuration = useCallback((minutes: number) => {
    setFocusDurationState(minutes);
    if (mode === "focus" && !isRunning) {
      setTimeLeft(minutes * 60);
    }
  }, [mode, isRunning]);

  const setBreakDuration = useCallback((minutes: number) => {
    setBreakDurationState(minutes);
    if (mode === "break" && !isRunning) {
      setTimeLeft(minutes * 60);
    }
  }, [mode, isRunning]);

  const setMode = useCallback((newMode: TimerMode) => {
    setModeState(newMode);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const handleAssignFromCompletion = useCallback(async (taskId: string) => {
    if (!completedSessionInfo) return;
    try {
      await updateSession({ id: completedSessionInfo.sessionId, taskId });
      const taskTitle = tasks.find((t) => t._id === taskId)?.title ?? "Task";
      setStatusMessage(`Session linked to "${taskTitle}"! +${completedSessionInfo.points} FP`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Unable to link session to task.");
    }
    setShowCompletionScreen(false);
    setCompletedSessionInfo(null);
  }, [completedSessionInfo, updateSession, tasks]);

  // Derived progress (float 0–1)
  const progress = useMemo(
    () => isOverflow ? 1 : Math.min(1, Math.max(0, 1 - timeLeft / totalSeconds)),
    [isOverflow, timeLeft, totalSeconds]
  );

  // Expose progress as part of the returned state for convenience
  void progress; // used by consumers; declared here for completeness

  return {
    // State
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
    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    toggleTimer,
    wrapUpSession,
    resetTimer,
    switchTask,
    setFocusDuration,
    setBreakDuration,
    setMode,
    setSelectedTaskId: setSelectedTaskIdState,
    setShowCompletionScreen,
    setStatusMessage,
    handleAssignFromCompletion,
  };
}
