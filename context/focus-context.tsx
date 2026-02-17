"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

import {
  type CreateTaskPayload,
  type FocusStats,
  type GrowthStage,
  type LogSessionPayload,
  type SessionDTO,
  type StreakInfo,
  type TaskDTO,
  type UpdateSessionPayload,
  type UpdateTaskPayload,
} from "@/types";
import { getPastDates, getTodayIso } from "@/lib/dates";
import { GROWTH_STAGES } from "@/lib/points";
import { isTaskGoalMet } from "@/lib/tasks";

const LOCAL_TASKS_KEY = "cultivate-focus:tasks";
const LOCAL_SESSIONS_KEY = "cultivate-focus:sessions";
const LOCAL_USER_ID = "local-user";

function calculateGrowthStage(totalPoints: number): GrowthStage {
  let stageIndex = 0;
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (totalPoints >= GROWTH_STAGES[i].threshold) {
      stageIndex = i;
      break;
    }
  }
  
  const current = GROWTH_STAGES[stageIndex];
  const next = GROWTH_STAGES[stageIndex + 1] ?? null;
  
  let progress = 1;
  if (next) {
    const range = next.threshold - current.threshold;
    const earned = totalPoints - current.threshold;
    progress = Math.min(1, earned / range);
  }
  
  return {
    name: current.name,
    label: current.label,
    threshold: current.threshold,
    nextThreshold: next?.threshold ?? null,
    progress,
  };
}

function calculateStreak(sessions: SessionDTO[], weeklyDates: string[]): StreakInfo {
  const today = getTodayIso();
  const sessionDates = new Set(sessions.map(s => s.date));
  const todayComplete = sessionDates.has(today);
  
  // Calculate weekly leaves (last 7 days)
  const weeklyLeaves = weeklyDates.map(date => sessionDates.has(date));
  
  // Calculate current streak - count consecutive days backwards from today (or yesterday if today has no session)
  let currentStreak = 0;
  const sortedDates = Array.from(sessionDates).sort().reverse();
  
  if (sortedDates.length > 0) {
    // Start from today or yesterday
    const startDate = new Date(today);
    if (!todayComplete) {
      startDate.setDate(startDate.getDate() - 1);
    }
    
    const checkDate = startDate;
    while (sessionDates.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  // Calculate longest streak (simplified - just use current for now)
  const longestStreak = Math.max(currentStreak, 0);
  
  return {
    current: currentStreak,
    longest: longestStreak,
    todayComplete,
    weeklyLeaves,
  };
}

function generateLocalId(): string {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis as typeof globalThis & { crypto?: Crypto }).crypto
      : undefined;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  const random = Math.random().toString(16).slice(2);
  return `${Date.now()}-${random}`;
}

type StoredTask = Partial<TaskDTO> & Record<string, unknown>;
type StoredSession = Partial<SessionDTO> & Record<string, unknown>;

function parseLocalArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.warn("Unable to parse local storage entry", error);
    return [];
  }
}

function normalizeTask(raw: StoredTask): TaskDTO | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) {
    return null;
  }
  // Support both legacy focusMinutes and new focusMinutesGoal
  const legacyFocusMinutes = Number(raw.focusMinutes);
  const focusMinutesGoalRaw = raw.focusMinutesGoal;
  const focusMinutesGoal =
    focusMinutesGoalRaw !== undefined && focusMinutesGoalRaw !== null
      ? Number(focusMinutesGoalRaw)
      : Number.isFinite(legacyFocusMinutes) && legacyFocusMinutes > 0
        ? legacyFocusMinutes
        : null;
  const earnedPointsNumber = Number(raw.earnedPoints);
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString();
  // Auto-assign scheduledDate to today if missing (client-side migration)
  const scheduledDate =
    typeof raw.scheduledDate === "string" && raw.scheduledDate
      ? raw.scheduledDate
      : getTodayIso();

  return {
    _id:
      typeof raw._id === "string" && raw._id ? raw._id : generateLocalId(),
    userId:
      typeof raw.userId === "string" && raw.userId
        ? raw.userId
        : LOCAL_USER_ID,
    title,
    description: typeof raw.description === "string" ? raw.description : "",
    focusMinutesGoal:
      focusMinutesGoal !== null && Number.isFinite(focusMinutesGoal) && focusMinutesGoal > 0
        ? Math.round(focusMinutesGoal)
        : null,
    scheduledDate,
    order: typeof raw.order === "number" ? raw.order : undefined,
    completed: Boolean(raw.completed),
    earnedPoints:
      Number.isFinite(earnedPointsNumber) && earnedPointsNumber > 0
        ? Math.round(earnedPointsNumber)
        : 0,
    createdAt,
  };
}

function normalizeSession(raw: StoredSession): SessionDTO | null {
  // taskId is now optional - allow null for "quick timer" sessions
  const taskId =
    typeof raw.taskId === "string" && raw.taskId ? raw.taskId : null;
  const durationNumber = Number(raw.duration);
  const pointsNumber = Number(raw.pointsEarned);
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString();
  const isoDate =
    typeof raw.date === "string" && raw.date
      ? raw.date
      : createdAt.slice(0, 10);

  return {
    _id:
      typeof raw._id === "string" && raw._id ? raw._id : generateLocalId(),
    userId:
      typeof raw.userId === "string" && raw.userId
        ? raw.userId
        : LOCAL_USER_ID,
    taskId,
    duration:
      Number.isFinite(durationNumber) && durationNumber > 0
        ? Math.round(durationNumber)
        : 0,
    pointsEarned:
      Number.isFinite(pointsNumber) && pointsNumber > 0
        ? Math.round(pointsNumber)
        : 0,
    date: isoDate,
    createdAt,
  };
}

function readLocalState(): { tasks: TaskDTO[]; sessions: SessionDTO[] } {
  if (typeof window === "undefined") {
    return { tasks: [], sessions: [] };
  }

  const taskCandidates = parseLocalArray<StoredTask>(
    window.localStorage.getItem(LOCAL_TASKS_KEY)
  );
  const sessionCandidates = parseLocalArray<StoredSession>(
    window.localStorage.getItem(LOCAL_SESSIONS_KEY)
  );

  const normalizedTasks = taskCandidates
    .map(normalizeTask)
    .filter((task): task is TaskDTO => task !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const normalizedSessions = sessionCandidates
    .map(normalizeSession)
    .filter((session): session is SessionDTO => session !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    tasks: normalizedTasks,
    sessions: normalizedSessions,
  };
}

interface FocusContextValue {
  tasks: TaskDTO[];
  sessions: SessionDTO[];
  stats: FocusStats;
  loading: boolean;
  error: string | null;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (payload: UpdateTaskPayload) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  logSession: (payload: LogSessionPayload) => Promise<void>;
  updateSession: (payload: UpdateSessionPayload) => Promise<void>;
  refresh: () => Promise<void>;
}

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    if (response.status === 204) {
      return null;
    }
    console.warn("Failed to parse JSON response", error);
    return null;
  }
}

async function readErrorMessage(response: Response) {
  const data = await readJson<{ message?: string }>(response);
  const fallback = response.statusText || "Unexpected error";
  return data?.message ?? fallback;
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isSessionLoading = status === "loading";

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageInitialized, setStorageInitialized] = useState(false);

  const persistLocalTasks = useCallback((nextTasks: TaskDTO[]) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      LOCAL_TASKS_KEY,
      JSON.stringify(nextTasks)
    );
  }, []);

  const persistLocalSessions = useCallback((nextSessions: SessionDTO[]) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      LOCAL_SESSIONS_KEY,
      JSON.stringify(nextSessions)
    );
  }, []);

  const loadLocalState = useCallback(() => {
    const { tasks: storedTasks, sessions: storedSessions } = readLocalState();
    setTasks(storedTasks);
    setSessions(storedSessions);
    setStorageInitialized(true);
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    const response = await fetch("/api/tasks", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const data = await readJson<{ tasks?: TaskDTO[] }>(response);
    setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
  }, [isAuthenticated]);

  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    const response = await fetch("/api/sessions?rangeDays=14", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const data = await readJson<{ sessions?: SessionDTO[] }>(response);
    setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isAuthenticated) {
      loadLocalState();
      setLoading(false);
      return;
    }

    try {
      await Promise.all([fetchTasks(), fetchSessions()]);
    } catch (err) {
      console.error("Failed to refresh focus data:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [fetchSessions, fetchTasks, isAuthenticated, loadLocalState]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else if (!isSessionLoading) {
      loadLocalState();
      setLoading(false);
    }
  }, [isAuthenticated, isSessionLoading, loadLocalState, refresh]);

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      setError(null);

      if (!isAuthenticated) {
        if (!storageInitialized) {
          loadLocalState();
        }
        const createdAt = new Date().toISOString();
        const scheduledDate = payload.scheduledDate ?? getTodayIso();
        const newTask: TaskDTO = {
          _id: generateLocalId(),
          userId: LOCAL_USER_ID,
          title: payload.title.trim(),
          description: payload.description?.trim() ?? "",
          focusMinutesGoal: payload.focusMinutesGoal ?? null,
          scheduledDate,
          completed: false,
          earnedPoints: 0,
          createdAt,
        };
        setTasks((prev) => {
          const next = [newTask, ...prev];
          persistLocalTasks(next);
          return next;
        });
        return;
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message);
        throw new Error(message);
      }

      const data = await readJson<{ task?: TaskDTO }>(response);
      if (data?.task) {
        const task = data.task;
        setTasks((prev) => [task, ...prev]);
      } else {
        await refresh();
      }
    },
    [isAuthenticated, loadLocalState, persistLocalTasks, refresh, storageInitialized]
  );

  const updateTask = useCallback(
    async (payload: UpdateTaskPayload) => {
      setError(null);

      if (!isAuthenticated) {
        if (!storageInitialized) {
          loadLocalState();
        }
        setTasks((prev) => {
          const next = prev.map((task) => {
            if (task._id !== payload.id) {
              return task;
            }
            const updated: TaskDTO = {
              ...task,
              title:
                payload.title !== undefined
                  ? payload.title.trim()
                  : task.title,
              description:
                payload.description !== undefined
                  ? payload.description
                  : task.description,
              focusMinutesGoal:
                payload.focusMinutesGoal !== undefined
                  ? payload.focusMinutesGoal
                  : task.focusMinutesGoal,
              scheduledDate:
                payload.scheduledDate !== undefined
                  ? payload.scheduledDate
                  : task.scheduledDate,
              order:
                payload.order !== undefined
                  ? payload.order
                  : task.order,
              completed:
                payload.completed !== undefined
                  ? Boolean(payload.completed)
                  : task.completed,
            };
            return updated;
          });
          persistLocalTasks(next);
          return next;
        });
        return;
      }

      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message);
        throw new Error(message);
      }

      const data = await readJson<{ task?: TaskDTO }>(response);
      if (data?.task) {
        const updatedTask = data.task;
        setTasks((prev) =>
          prev.map((existing) =>
            existing._id === updatedTask._id ? updatedTask : existing
          )
        );
      } else {
        await refresh();
      }
    },
    [
      isAuthenticated,
      loadLocalState,
      persistLocalTasks,
      refresh,
      storageInitialized,
    ]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setError(null);

      if (!isAuthenticated) {
        if (!storageInitialized) {
          loadLocalState();
        }
        setTasks((prev) => {
          const nextTasks = prev.filter((task) => task._id !== id);
          persistLocalTasks(nextTasks);
          return nextTasks;
        });
        setSessions((prev) => {
          const nextSessions = prev.filter((session) => session.taskId !== id);
          persistLocalSessions(nextSessions);
          return nextSessions;
        });
        return;
      }

      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message);
        throw new Error(message);
      }

      setTasks((prev) => prev.filter((task) => task._id !== id));
    },
    [
      isAuthenticated,
      loadLocalState,
      persistLocalSessions,
      persistLocalTasks,
      storageInitialized,
    ]
  );

  const logSession = useCallback(
    async (payload: LogSessionPayload) => {
      setError(null);

      if (!isAuthenticated) {
        if (!storageInitialized) {
          loadLocalState();
        }
        const duration = Math.max(0, Math.round(payload.duration));
        const points = Math.max(0, Math.round(payload.pointsEarned));
        const sessionDate = payload.date ?? getTodayIso();
        const createdAt = new Date().toISOString();

        const newSession: SessionDTO = {
          _id: generateLocalId(),
          userId: LOCAL_USER_ID,
          taskId: payload.taskId ?? null,
          duration,
          pointsEarned: points,
          date: sessionDate,
          createdAt,
        };

        setSessions((prev) => {
          const next = [newSession, ...prev];
          persistLocalSessions(next);
          return next;
        });

        // Only update task if a taskId was provided
        if (payload.taskId) {
          setTasks((prev) => {
            const next = prev.map((task) => {
              if (task._id !== payload.taskId) {
                return task;
              }
              const updatedPoints = Math.max(0, task.earnedPoints + points);
              const completed = isTaskGoalMet({ ...task, earnedPoints: updatedPoints });
              return {
                ...task,
                earnedPoints: updatedPoints,
                completed,
              };
            });
            persistLocalTasks(next);
            return next;
          });
        }

        return;
      }

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message);
        throw new Error(message);
      }

      const data = await readJson<{ session?: SessionDTO; task?: TaskDTO }>(
        response
      );
      const session = data?.session;
      if (session) {
        setSessions((prev) => [session, ...prev]);
      } else {
        await refresh();
      }
      const task = data?.task;
      if (task) {
        setTasks((prev) =>
          prev.map((existing) =>
            existing._id === task._id ? task : existing
          )
        );
      }
    },
    [
      isAuthenticated,
      loadLocalState,
      persistLocalSessions,
      persistLocalTasks,
      refresh,
      storageInitialized,
    ]
  );

  const updateSession = useCallback(
    async (payload: UpdateSessionPayload) => {
      setError(null);

      if (!isAuthenticated) {
        if (!storageInitialized) {
          loadLocalState();
        }
        setSessions((prev) => {
          const next = prev.map((session) => {
            if (session._id !== payload.id) {
              return session;
            }
            const updated: SessionDTO = {
              ...session,
              taskId: payload.taskId !== undefined ? payload.taskId ?? null : session.taskId,
            };
            return updated;
          });
          persistLocalSessions(next);
          return next;
        });

        // If linking to a task, update the task's earned points
        if (payload.taskId) {
          const sessionToUpdate = sessions.find(s => s._id === payload.id);
          if (sessionToUpdate) {
            setTasks((prev) => {
              const next = prev.map((task) => {
                if (task._id !== payload.taskId) {
                  return task;
                }
                const updatedPoints = task.earnedPoints + sessionToUpdate.pointsEarned;
                const completed = isTaskGoalMet({ ...task, earnedPoints: updatedPoints });
                return {
                  ...task,
                  earnedPoints: updatedPoints,
                  completed,
                };
              });
              persistLocalTasks(next);
              return next;
            });
          }
        }
        return;
      }

      const response = await fetch("/api/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message);
        throw new Error(message);
      }

      const data = await readJson<{ session?: SessionDTO; task?: TaskDTO }>(response);
      if (data?.session) {
        const updatedSession = data.session;
        setSessions((prev) =>
          prev.map((existing) =>
            existing._id === updatedSession._id ? updatedSession : existing
          )
        );
      }
      if (data?.task) {
        const updatedTask = data.task;
        setTasks((prev) =>
          prev.map((existing) =>
            existing._id === updatedTask._id ? updatedTask : existing
          )
        );
      }
    },
    [
      isAuthenticated,
      loadLocalState,
      persistLocalSessions,
      persistLocalTasks,
      sessions,
      storageInitialized,
    ]
  );

  const stats: FocusStats = useMemo(() => {
    const today = getTodayIso();
    const todaySessions = sessions.filter((session) => session.date === today);
    const todayPoints = todaySessions.reduce(
      (total, session) => total + session.pointsEarned,
      0
    );
    const todayMinutes = todaySessions.reduce(
      (total, session) => total + session.duration,
      0
    );
    
    // Calculate total points from all sessions
    const totalSessionPoints = sessions.reduce(
      (total, session) => total + session.pointsEarned,
      0
    );
    // Also include points from tasks (for backwards compatibility)
    const totalTaskPoints = tasks.reduce(
      (total, task) => total + task.earnedPoints,
      0
    );
    // Use whichever is larger to avoid double counting
    const totalPoints = Math.max(totalSessionPoints, totalTaskPoints);
    
    const weeklyDates = getPastDates(7);
    const weeklyMap = new Map<string, number>(
      weeklyDates.map((date) => [date, 0])
    );

    sessions.forEach((session) => {
      if (weeklyMap.has(session.date)) {
        weeklyMap.set(
          session.date,
          (weeklyMap.get(session.date) ?? 0) + session.pointsEarned
        );
      }
    });

    // Calculate growth stage and streak
    const growthStage = calculateGrowthStage(totalPoints);
    const streak = calculateStreak(sessions, weeklyDates);

    return {
      todayPoints,
      todayMinutes,
      todaySessions: todaySessions.length,
      totalPoints,
      weekly: weeklyDates.map((date) => ({
        date,
        points: weeklyMap.get(date) ?? 0,
      })),
      growthStage,
      streak,
    } satisfies FocusStats;
  }, [sessions, tasks]);

  const value: FocusContextValue = {
    tasks,
    sessions,
    stats,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    logSession,
    updateSession,
    refresh,
  };

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
