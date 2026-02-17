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
  type LogSessionPayload,
  type SessionDTO,
  type TaskDTO,
  type UpdateSessionPayload,
  type UpdateTaskPayload,
} from "@/types";
import { getPastDates, getTodayIso } from "@/lib/dates";
import { calculateGrowthStage } from "@/lib/points";
import { calculateStreak } from "@/lib/stats";
import { isTaskGoalMet } from "@/lib/tasks";
import { readJson, readErrorMessage } from "@/lib/fetch-helpers";
import {
  generateLocalId,
  readLocalState,
  persistLocalTasks,
  persistLocalSessions,
  LOCAL_USER_ID,
} from "@/lib/local-storage";

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

export function FocusProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isSessionLoading = status === "loading";

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageInitialized, setStorageInitialized] = useState(false);

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
    [isAuthenticated, loadLocalState, refresh, storageInitialized]
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
    [isAuthenticated, loadLocalState, refresh, storageInitialized]
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
    [isAuthenticated, loadLocalState, storageInitialized]
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
    [isAuthenticated, loadLocalState, refresh, storageInitialized]
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
    [isAuthenticated, loadLocalState, sessions, storageInitialized]
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

/** Read-only data (dashboard) */
export function useFocusData() {
  const { tasks, sessions, stats, loading, error } = useFocus();
  return { tasks, sessions, stats, loading, error };
}

/** Task CRUD (planner) */
export function useTaskActions() {
  const { tasks, createTask, updateTask, deleteTask, loading } = useFocus();
  return { tasks, createTask, updateTask, deleteTask, loading };
}

/** Session operations (timer) */
export function useSessionActions() {
  const { tasks, sessions, logSession, updateSession } = useFocus();
  return { tasks, sessions, logSession, updateSession };
}
