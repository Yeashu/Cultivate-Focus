"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Pause,
  Play,
  RefreshCw,
  TimerIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { useFocus } from "@/context/focus-context";
import { calculateFocusPoints } from "@/lib/points";
import { formatDateLabel, getTodayIso } from "@/lib/dates";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = Math.max(seconds % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function useChime() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const triggerTone = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.2);
  };

  const play = () => {
    try {
      const existing = audioContextRef.current;
      if (existing) {
        triggerTone(existing);
        return;
      }

      const extendedWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };

      const AudioContextClass = extendedWindow.AudioContext || extendedWindow.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const context = new AudioContextClass();
      audioContextRef.current = context;
      triggerTone(context);
    } catch (error) {
      console.warn("Unable to play chime", error);
    }
  };

  return play;
}

export default function TimerPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { tasks, logSession, sessions } = useFocus();
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    tasks.find((task) => !task.completed)?._id ?? ""
  );
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const playChime = useChime();

  const totalSeconds = mode === "focus" ? focusDuration * 60 : breakDuration * 60;
  const progress = Math.min(1, Math.max(0, 1 - timeLeft / totalSeconds));

  useEffect(() => {
    setTimeLeft((mode === "focus" ? focusDuration : breakDuration) * 60);
  }, [focusDuration, breakDuration, mode]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          handleCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, totalSeconds]);

  useEffect(() => {
    if (!selectedTaskId && tasks.length > 0) {
      const nextTask = tasks.find((task) => !task.completed) ?? tasks[0];
      setSelectedTaskId(nextTask?._id ?? "");
    }
  }, [tasks, selectedTaskId]);

  const handleCompletion = async () => {
    playChime();
    const todayIso = getTodayIso();

    if (mode === "focus") {
      if (!selectedTaskId) {
        setStatusMessage("Focus session ended. Select a task to log progress.");
        return;
      }

      try {
        await logSession({
          taskId: selectedTaskId,
          duration: totalSeconds / 60,
          pointsEarned: calculateFocusPoints(totalSeconds / 60),
          date: todayIso,
        });
        setStatusMessage("Session logged and Focus Points added! Remember to take a mindful break.");
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Unable to log session right now."
        );
      }
    } else {
      setStatusMessage("Break finished. Ready to refocus when you are.");
    }

    setMode((prev) => (prev === "focus" ? "break" : "focus"));
  };

  const toggleTimer = () => {
    if (mode === "focus" && !selectedTaskId) {
      setStatusMessage("Choose a task before starting a focus session.");
      return;
    }
    setStatusMessage(null);
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setStatusMessage(null);
  };

  const recentSessions = useMemo(() => sessions.slice(0, 4), [sessions]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Sign in to start focus sessions
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Use your account to time focus and break blocks, earn Focus Points, and keep a session history.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/register"
            className="rounded-full bg-[var(--focus)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--focus)]/90"
          >
            Create account
          </a>
          <a
            href="/login"
            className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

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
            }}
          >
            Break Mode
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg" style={{ boxShadow: "var(--shadow)" }}>
          <div
            className="relative flex h-64 w-64 items-center justify-center rounded-full bg-[var(--surface-muted)]"
            style={{
              background: `conic-gradient(var(--focus) ${progress * 360}deg, rgba(148, 163, 184, 0.35) 0deg)`
            }}
          >
            <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-full bg-[var(--surface)] text-[var(--foreground)] shadow-inner">
              <TimerIcon className="h-6 w-6 text-[var(--muted)]" />
              <span className="text-5xl font-semibold tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {mode === "focus" ? "Stay with your breath" : "Release and recharge"}
              </span>
            </div>
          </div>

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
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={resetTimer}
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
          </div>

          {statusMessage ? (
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
            Focus task
          </label>
          <select
            value={selectedTaskId}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
          >
            <option value="">Select a task to earn Focus Points</option>
            {tasks.map((task) => (
              <option key={task._id} value={task._id}>
                {task.title} {task.completed ? "(completed)" : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Session overview
          </h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Mode</span>
              <span className="font-medium text-[var(--foreground)]">
                {mode === "focus" ? "Focus" : "Break"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total minutes</span>
              <span className="font-medium text-[var(--foreground)]">
                {totalSeconds / 60}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Expected points</span>
              <span className="font-medium text-[var(--foreground)]">
                {mode === "focus"
                  ? calculateFocusPoints(totalSeconds / 60)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Task selected</span>
              <span className="max-w-[60%] truncate font-medium text-[var(--foreground)]">
                {selectedTaskId
                  ? tasks.find((task) => task._id === selectedTaskId)?.title ?? "Task removed"
                  : "No task"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent sessions
          </h2>
          <div className="mt-4 space-y-3">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Sessions you complete will appear here.
              </p>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/40 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {tasks.find((task) => task._id === session.taskId)?.title ?? "Task"}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDateLabel(session.date)} · {session.duration} min
                    </p>
                  </div>
                  <span className="font-semibold text-[var(--focus)]">
                    +{session.pointsEarned} FP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
