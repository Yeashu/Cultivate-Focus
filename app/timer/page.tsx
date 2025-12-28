"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Link2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  TimerIcon,
  X,
} from "lucide-react";

import { useFocus } from "@/context/focus-context";
import { calculateFocusPoints } from "@/lib/points";
import { formatDateLabel, getTodayIso } from "@/lib/dates";

// Mindful placeholders for unassigned focus sessions
const MINDFUL_MESSAGES = [
  "Cultivating Focus...",
  "Stay with your breath.",
  "Present moment awareness.",
  "One thing at a time.",
  "Nurturing concentration.",
  "Growing inner stillness.",
];

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
  const { tasks, logSession, sessions, updateSession } = useFocus();
  const searchParams = useSearchParams();
  const taskIdFromUrl = searchParams.get("taskId");
  
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
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
  const todayTasks = useMemo(() => 
    tasks.filter(t => t.scheduledDate === todayIso && !t.completed),
    [tasks, todayIso]
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
    if (!isRunning && !isOverflow) {
      setTimeLeft((mode === "focus" ? focusDuration : breakDuration) * 60);
    }
  }, [focusDuration, breakDuration, mode, isRunning, isOverflow]);

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
          // Get the most recently added session (should be the one we just logged)
          // We'll use a timeout to let the state update, then grab the latest session
          setTimeout(() => {
            // Find sessions array will have updated by now
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
          "Focus Session Complete! 🎯",
          `${taskTitle ?? "Focus"}: +${pointsEarned} Focus Points earned! Time for a mindful break.`
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
    setIsOverflow(false);
    setOverflowSeconds(0);
  };

  // Handle mid-flow task linking
  const handleLinkTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskDropdown(false);
  };

  // Handle assigning task from completion screen
  const handleAssignFromCompletion = async (taskId: string) => {
    if (!completedSessionInfo) return;
    
    try {
      // Update the session to link it to the selected task
      await updateSession({
        id: completedSessionInfo.sessionId,
        taskId,
      });
      
      const taskTitle = tasks.find(t => t._id === taskId)?.title ?? "Task";
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
    setIsRunning((prev) => !prev);
  };

  // Stop and complete the session (wrap up)
  const wrapUpSession = async () => {
    setIsRunning(false);
    await handleCompletion();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setStatusMessage(null);
    setIsOverflow(false);
    setOverflowSeconds(0);
    setShowCompletionScreen(false);
    setCompletedSessionInfo(null);
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
            className={`relative flex h-64 w-64 items-center justify-center rounded-full bg-[var(--surface-muted)] ${isOverflow ? "animate-pulse" : ""}`}
            style={{
              background: isOverflow
                ? `conic-gradient(var(--focus) 360deg, var(--focus) 0deg)`
                : `conic-gradient(var(--focus) ${progress * 360}deg, rgba(148, 163, 184, 0.35) 0deg)`
            }}
          >
            <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-full bg-[var(--surface)] text-[var(--foreground)] shadow-inner">
              <TimerIcon className="h-6 w-6 text-[var(--muted)]" />
              {isOverflow ? (
                <>
                  <span className="text-5xl font-semibold tracking-tight text-[var(--focus)]">
                    +{formatTime(overflowSeconds)}
                  </span>
                  <span className="text-xs font-medium text-[var(--focus)]">
                    Flow State 🌿
                  </span>
                </>
              ) : (
                <span className="text-5xl font-semibold tracking-tight">
                  {formatTime(timeLeft)}
                </span>
              )}
              <span className="max-w-[180px] text-sm text-[var(--muted)]">
                {mode === "focus" 
                  ? (selectedTaskId 
                      ? tasks.find(t => t._id === selectedTaskId)?.title ?? "Stay focused"
                      : mindfulMessage)
                  : "Release and recharge"}
              </span>
            </div>
          </div>

          {/* Mid-flow task linking - only show when running without a task */}
          {isRunning && !selectedTaskId && mode === "focus" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)]/60 px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--focus)] hover:text-[var(--focus)]"
              >
                <Link2 className="h-4 w-4" />
                Link to task
                <ChevronDown className={`h-4 w-4 transition-transform ${showTaskDropdown ? "rotate-180" : ""}`} />
              </button>
              
              {showTaskDropdown && tasks.length > 0 && (
                <div className="absolute left-1/2 top-full z-10 mt-2 max-h-64 w-80 -translate-x-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
                  {/* Show today's tasks first */}
                  {todayTasks.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                        Today
                      </div>
                      {todayTasks.map((task) => (
                        <button
                          key={task._id}
                          type="button"
                          onClick={() => handleLinkTask(task._id)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                        >
                          <span className="flex-1 truncate">{task.title}</span>
                          {task.focusMinutesGoal && (
                            <span className="text-xs text-[var(--muted)]">
                              {task.focusMinutesGoal}m
                            </span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                  
                  {/* Show other incomplete tasks */}
                  {tasks.filter(t => !t.completed && t.scheduledDate !== todayIso).length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                        Other Days
                      </div>
                      {tasks
                        .filter(t => !t.completed && t.scheduledDate !== todayIso)
                        .map((task) => (
                          <button
                            key={task._id}
                            type="button"
                            onClick={() => handleLinkTask(task._id)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                          >
                            <span className="flex-1 truncate">{task.title}</span>
                            <span className="text-xs text-[var(--muted)]">
                              {task.scheduledDate}
                            </span>
                          </button>
                        ))}
                    </>
                  )}
                  
                  {/* Show completed tasks */}
                  {tasks.filter(t => t.completed).length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                        Completed
                      </div>
                      {tasks
                        .filter(t => t.completed)
                        .map((task) => (
                          <button
                            key={task._id}
                            type="button"
                            onClick={() => handleLinkTask(task._id)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
                          >
                            <span className="flex-1 truncate">{task.title}</span>
                            <span className="text-xs">✓</span>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show linked task indicator when running with a task */}
          {isRunning && selectedTaskId && mode === "focus" && (
            <div className="flex items-center gap-2 rounded-full bg-[var(--focus-soft)]/40 px-4 py-2 text-sm text-[var(--focus)]">
              <Check className="h-4 w-4" />
              <span className="max-w-[200px] truncate">
                {tasks.find(t => t._id === selectedTaskId)?.title}
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
            
            {/* Wrap Up button - only show when in overflow mode */}
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

          {/* Completion Screen - Gentle prompt to assign task */}
          {showCompletionScreen && completedSessionInfo && (
            <div className="w-full rounded-2xl border border-[var(--focus)]/30 bg-[var(--focus-soft)]/20 p-6 text-left">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--focus)]/10">
                  <Sparkles className="h-6 w-6 text-[var(--focus)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    Session Complete! 🌱
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    You focused for {completedSessionInfo.duration} minutes and earned{" "}
                    <span className="font-semibold text-[var(--focus)]">
                      +{completedSessionInfo.points} FP
                    </span>
                  </p>
                  
                  {tasks.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Link this session to a task?
                      </p>
                      
                      {/* Quick picks from today's tasks */}
                      {todayTasks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {todayTasks.slice(0, 3).map((task) => (
                            <button
                              key={task._id}
                              type="button"
                              onClick={() => handleAssignFromCompletion(task._id)}
                              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--focus)] hover:bg-[var(--focus-soft)]/30"
                            >
                              {task.title.length > 20 ? `${task.title.slice(0, 20)}...` : task.title}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Full task dropdown for all tasks */}
                      <div className="mt-3">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignFromCompletion(e.target.value);
                            }
                          }}
                          defaultValue=""
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--focus)] focus:outline-none"
                        >
                          <option value="" disabled>
                            {todayTasks.length > 0 ? "Or choose another task..." : "Choose a task..."}
                          </option>
                          {tasks.filter(t => !t.completed).map((task) => (
                            <option key={task._id} value={task._id}>
                              {task.title} {task.scheduledDate === todayIso ? "(today)" : `(${task.scheduledDate})`}
                            </option>
                          ))}
                          {tasks.filter(t => t.completed).length > 0 && (
                            <optgroup label="Completed">
                              {tasks.filter(t => t.completed).map((task) => (
                                <option key={task._id} value={task._id}>
                                  {task.title} ✓
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setShowCompletionScreen(false);
                          setStatusMessage(`Session logged! +${completedSessionInfo.points} FP`);
                        }}
                        className="mt-3 flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                      >
                        <X className="h-3 w-3" />
                        Keep as General Focus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Session overview
          </h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Mode</span>
              <span className="font-medium text-[var(--foreground)]">
                {mode === "focus" ? (isOverflow ? "Flow State 🌿" : "Focus") : "Break"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isOverflow ? "Base + overflow" : "Duration"}</span>
              <span className="font-medium text-[var(--foreground)]">
                {isOverflow 
                  ? `${focusDuration} + ${Math.floor(overflowSeconds / 60)} min`
                  : `${totalSeconds / 60} min`
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Expected points</span>
              <span className="font-medium text-[var(--foreground)]">
                {mode === "focus"
                  ? calculateFocusPoints(getActualDuration())
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Task</span>
              <span className="max-w-[60%] truncate font-medium text-[var(--foreground)]">
                {selectedTaskId
                  ? tasks.find((task) => task._id === selectedTaskId)?.title ?? "—"
                  : "🌿 General Focus"}
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
              recentSessions.map((session) => {
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
                        {session.taskId ? taskTitle : (
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
