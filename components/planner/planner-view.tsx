"use client";

import { useMemo, useState, useCallback } from "react";
import { useTaskActions } from "@/context/focus-context";
import { PlannerHeader } from "./planner-header";
import { WeekGrid } from "./week-grid";
import { SomedaySidebar } from "./someday-sidebar";
import type { TaskDTO } from "@/types";

function getWeekDates(weekOffset: number): { date: Date; iso: string }[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + diff + weekOffset * 7);

  const days: { date: Date; iso: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push({ date: d, iso: d.toISOString().slice(0, 10) });
  }
  return days;
}

function formatMonthYear(dates: { date: Date }[]): string {
  if (dates.length === 0) return "";
  const first = dates[0].date;
  const last = dates[dates.length - 1].date;
  const opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  if (first.getMonth() === last.getMonth()) {
    return first.toLocaleDateString("en-US", opts);
  }
  return `${first.toLocaleDateString("en-US", { month: "short" })} – ${last.toLocaleDateString("en-US", opts)}`;
}

const SIDEBAR_KEY = "cultivate-focus:someday-sidebar";

export function PlannerView() {
  const { tasks, createTask, updateTask, deleteTask, loading } =
    useTaskActions();
  const [weekOffset, setWeekOffset] = useState(0);
  const [draggedTask, setDraggedTask] = useState<TaskDTO | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(SIDEBAR_KEY) !== "closed";
  });

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskDTO[]> = {};
    weekDates.forEach(({ iso }) => {
      map[iso] = [];
    });
    tasks.forEach((task) => {
      const scheduled = task.scheduledDate;
      if (scheduled && map[scheduled]) {
        map[scheduled].push(task);
      }
    });
    return map;
  }, [tasks, weekDates]);

  const somedayTasks = useMemo(
    () => tasks.filter((t) => !t.scheduledDate || t.scheduledDate === "someday"),
    [tasks]
  );

  // --- Drag handlers ---
  const handleDragStart = useCallback((task: TaskDTO) => {
    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDropOnDay = useCallback(
    async (dateIso: string) => {
      if (!draggedTask) return;
      if (draggedTask.scheduledDate === dateIso) {
        setDraggedTask(null);
        return;
      }
      await updateTask({ id: draggedTask._id, scheduledDate: dateIso });
      setDraggedTask(null);
    },
    [draggedTask, updateTask]
  );

  const handleDropOnSomeday = useCallback(async () => {
    if (!draggedTask) return;
    await updateTask({ id: draggedTask._id, scheduledDate: "someday" });
    setDraggedTask(null);
  }, [draggedTask, updateTask]);

  // --- Task CRUD handlers ---
  const handleCreateTask = useCallback(
    async (title: string, scheduledDate: string, focusMinutesGoal?: number) => {
      await createTask({
        title,
        scheduledDate,
        focusMinutesGoal: focusMinutesGoal ?? null,
      });
    },
    [createTask]
  );

  const handleCreateSomedayTask = useCallback(
    async (title: string, focusMinutesGoal?: number) => {
      await createTask({
        title,
        scheduledDate: "someday",
        focusMinutesGoal: focusMinutesGoal ?? null,
      });
    },
    [createTask]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, title: string, focusMinutesGoal?: number) => {
      await updateTask({
        id: taskId,
        title,
        focusMinutesGoal: focusMinutesGoal ?? null,
      });
    },
    [updateTask]
  );

  const handleToggleComplete = useCallback(
    async (task: TaskDTO) => {
      await updateTask({ id: task._id, completed: !task.completed });
    },
    [updateTask]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
    },
    [deleteTask]
  );

  const handleReorderTasks = useCallback(
    async (taskIds: string[]) => {
      await Promise.all(
        taskIds.map((id, index) => updateTask({ id, order: index }))
      );
    },
    [updateTask]
  );

  // --- Sidebar toggle ---
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "open" : "closed");
      return next;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    localStorage.setItem(SIDEBAR_KEY, "closed");
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--focus)]" />
      </div>
    );
  }

  return (
    <div className="planner-view">
      <PlannerHeader
        monthYearLabel={formatMonthYear(weekDates)}
        weekOffset={weekOffset}
        onPrev={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => o + 1)}
        onToday={() => setWeekOffset(0)}
        somedayCount={somedayTasks.filter((t) => !t.completed).length}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <div className="planner-content">
        <div className="planner-main">
          <WeekGrid
            weekDates={weekDates}
            tasksByDate={tasksByDate}
            todayIso={todayIso}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropOnDay={handleDropOnDay}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
          />
        </div>

        <SomedaySidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          tasks={somedayTasks}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDropOnSomeday}
          onCreateTask={handleCreateSomedayTask}
          onUpdateTask={handleUpdateTask}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
}
