"use client";

import { useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTaskActions } from "@/context/focus-context";
import { DayColumn } from "./day-column";
import { SomedayHorizon } from "./someday-horizon";
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

export function WeeklyPlanner() {
  const { tasks, createTask, updateTask, deleteTask, loading } = useTaskActions();
  const [weekOffset, setWeekOffset] = useState(0);
  const [draggedTask, setDraggedTask] = useState<TaskDTO | null>(null);

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

  const handleCreateTask = useCallback(
    async (title: string, scheduledDate: string, focusMinutesGoal?: number) => {
      await createTask({ title, scheduledDate, focusMinutesGoal: focusMinutesGoal ?? null });
    },
    [createTask]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, title: string, focusMinutesGoal?: number) => {
      await updateTask({ id: taskId, title, focusMinutesGoal: focusMinutesGoal ?? null });
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
      // Update order for each task
      await Promise.all(
        taskIds.map((id, index) => updateTask({ id, order: index }))
      );
    },
    [updateTask]
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--focus)]" />
      </div>
    );
  }

  return (
    <div className="weekly-planner">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-light tracking-tight text-[var(--foreground)]">
          {formatMonthYear(weekDates)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
            disabled={weekOffset === 0}
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Week Grid */}
      <div className="week-grid">
        {weekDates.map(({ date, iso }) => (
          <DayColumn
            key={iso}
            date={date}
            dateIso={iso}
            isToday={iso === todayIso}
            isPast={iso < todayIso}
            tasks={tasksByDate[iso] || []}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={() => handleDropOnDay(iso)}
            onCreateTask={(title: string, focusMinutesGoal?: number) => handleCreateTask(title, iso, focusMinutesGoal)}
            onUpdateTask={handleUpdateTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
          />
        ))}
      </div>

      {/* Someday Horizon */}
      <SomedayHorizon
        tasks={somedayTasks}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrop={handleDropOnSomeday}
        onCreateTask={(title: string, focusMinutesGoal?: number) => handleCreateTask(title, "someday", focusMinutesGoal)}
        onUpdateTask={handleUpdateTask}
        onToggleComplete={handleToggleComplete}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
