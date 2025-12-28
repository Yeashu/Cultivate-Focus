"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Pause,
  Play,
  RefreshCw,
  TimerIcon,
} from "lucide-react";

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

function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    // Create audio element for notification sound
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.warn("Unable to request notification permission", error);
    }
  };

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        // Create a pleasant notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        
        // Play a pleasant two-tone chime
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);

          gainNode.gain.setValueAtTime(0.001, audioContext.currentTime + startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime + startTime);
          oscillator.stop(audioContext.currentTime + startTime + duration);
        };

        // Play a pleasant melody: C5 -> E5 -> G5
        playTone(523.25, 0, 0.3);    // C5
        playTone(659.25, 0.15, 0.3); // E5
        playTone(783.99, 0.3, 0.5);  // G5
      }
    } catch (error) {
      console.warn("Unable to play notification sound", error);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    // Play sound regardless of notification permission
    playNotificationSound();

    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "cultivate-focus-timer",
          requireInteraction: false,
        });
      } catch (error) {
        console.warn("Unable to show notification", error);
      }
    }
  };

  return { permission, requestPermission, showNotification };
}

function TimerContent() {
  const { tasks, logSession, sessions } = useFocus();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");
  
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const playChime = useChime();
  const { permission, requestPermission, showNotification } = useNotifications();

  const totalSeconds = mode === "focus" ? focusDuration * 60 : breakDuration * 60;
  const progress = Math.min(1, Math.max(0, 1 - timeLeft / totalSeconds));

  // Set selected task from URL or find first incomplete task
  useEffect(() => {
    if (taskIdFromUrl) {
      // If taskId is in URL, use it (verify it exists in tasks)
      const taskExists = tasks.some((t) => t._id === taskIdFromUrl);
      if (taskExists) {
        setSelectedTaskId(taskIdFromUrl);
        return;
      }
    }
    // Fallback: select first incomplete task
    if (!selectedTaskId && tasks.length > 0) {
      const nextTask = tasks.find((task) => !task.completed) ?? tasks[0];
      setSelectedTaskId(nextTask?._id ?? "");
    }
  }, [taskIdFromUrl, tasks, selectedTaskId]);

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

  const handleCompletion = async () => {
    const todayIso = getTodayIso();

    if (mode === "focus") {
      try {
        await logSession({
          taskId: selectedTaskId || undefined,
          duration: totalSeconds / 60,
          pointsEarned: calculateFocusPoints(totalSeconds / 60),
          date: todayIso,
        });
        const pointsEarned = calculateFocusPoints(totalSeconds / 60);
        const taskTitle = selectedTaskId
          ? tasks.find((task) => task._id === selectedTaskId)?.title ?? "Task"
          : "Quick Focus";
        setStatusMessage("Session logged and Focus Points added! Remember to take a mindful break.");
        showNotification(
          "Focus Session Complete! 🎯",
          `${taskTitle}: +${pointsEarned} Focus Points earned! Time for a mindful break.`
        );
        playChime();
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
      playChime();
    }

    setMode((prev) => (prev === "focus" ? "break" : "focus"));
  };

  const toggleTimer = () => {
    setStatusMessage(null);
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setStatusMessage(null);
  };

  const recentSessions = useMemo(() => sessions.slice(0, 4), [sessions]);

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
            Focus task (optional)
          </label>
          <select
            value={selectedTaskId}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
          >
            <option value="">Quick timer (no task selected)</option>
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
