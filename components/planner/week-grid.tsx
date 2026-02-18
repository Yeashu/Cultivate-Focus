"use client";

import { DayColumn } from "./day-column";
import type { TaskDTO } from "@/types";

interface WeekGridProps {
  weekDates: { date: Date; iso: string }[];
  tasksByDate: Record<string, TaskDTO[]>;
  todayIso: string;
  onDragStart: (task: TaskDTO) => void;
  onDragEnd: () => void;
  onDropOnDay: (dateIso: string) => void;
  onCreateTask: (title: string, dateIso: string, focusMinutesGoal?: number) => Promise<void>;
  onUpdateTask: (taskId: string, title: string, focusMinutesGoal?: number) => Promise<void>;
  onToggleComplete: (task: TaskDTO) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onReorderTasks: (taskIds: string[]) => Promise<void>;
}

export function WeekGrid({
  weekDates,
  tasksByDate,
  todayIso,
  onDragStart,
  onDragEnd,
  onDropOnDay,
  onCreateTask,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
  onReorderTasks,
}: WeekGridProps) {
  return (
    <div className="week-grid">
      {weekDates.map(({ date, iso }) => (
        <DayColumn
          key={iso}
          date={date}
          dateIso={iso}
          isToday={iso === todayIso}
          isPast={iso < todayIso}
          tasks={tasksByDate[iso] || []}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={() => onDropOnDay(iso)}
          onCreateTask={(title: string, focusMinutesGoal?: number) =>
            onCreateTask(title, iso, focusMinutesGoal)
          }
          onUpdateTask={onUpdateTask}
          onToggleComplete={onToggleComplete}
          onDeleteTask={onDeleteTask}
          onReorderTasks={onReorderTasks}
        />
      ))}
    </div>
  );
}
