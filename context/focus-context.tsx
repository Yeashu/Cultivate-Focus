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

import {
  type CreateTaskPayload,
  type FocusStats,
  type LogSessionPayload,
  type SessionDTO,
  type TaskDTO,
  type UpdateTaskPayload,
} from "@/types";
import { getPastDates, getTodayIso } from "@/lib/dates";

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
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const response = await fetch("/api/tasks", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const data = await readJson<{ tasks?: TaskDTO[] }>(response);
    setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
  }, []);

  const fetchSessions = useCallback(async () => {
    const response = await fetch("/api/sessions?rangeDays=14", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
    const data = await readJson<{ sessions?: SessionDTO[] }>(response);
    setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchTasks(), fetchSessions()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [fetchSessions, fetchTasks]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      setError(null);
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
    [refresh]
  );

  const updateTask = useCallback(async (payload: UpdateTaskPayload) => {
    setError(null);
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
  }, [refresh]);

  const deleteTask = useCallback(async (id: string) => {
    setError(null);
    const response = await fetch(`/api/tasks?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      setError(message);
      throw new Error(message);
    }

    setTasks((prev) => prev.filter((task) => task._id !== id));
  }, []);

  const logSession = useCallback(async (payload: LogSessionPayload) => {
    setError(null);
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
        prev.map((existing) => (existing._id === task._id ? task : existing))
      );
    }
  }, [refresh]);

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

    return {
      todayPoints,
      todayMinutes,
      todaySessions: todaySessions.length,
      weekly: weeklyDates.map((date) => ({
        date,
        points: weeklyMap.get(date) ?? 0,
      })),
    } satisfies FocusStats;
  }, [sessions]);

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
