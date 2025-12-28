"use client";

import { useState, useRef, useCallback } from "react";
import { TaskLine } from "./task-line";
import type { TaskDTO } from "@/types";

interface DayColumnProps {
  date: Date;
  dateIso: string;
  isToday: boolean;
  isPast: boolean;
  tasks: TaskDTO[];
  onDragStart: (task: TaskDTO) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onCreateTask: (title: string, focusMinutesGoal?: number) => Promise<void>;
  onUpdateTask: (taskId: string, title: string, focusMinutesGoal?: number) => Promise<void>;
  onToggleComplete: (task: TaskDTO) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onReorderTasks: (taskIds: string[]) => Promise<void>;
}

export function DayColumn({
  date,
  isToday,
  isPast,
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  onCreateTask,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
  onReorderTasks,
}: DayColumnProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [internalDragTask, setInternalDragTask] = useState<TaskDTO | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNumber = date.getDate();

  // Separate incomplete and completed tasks, sort by order
  const incompleteTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  const completedTasks = tasks.filter((t) => t.completed);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set false if leaving the column entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDropTarget(false);
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    
    // Handle internal reorder
    if (internalDragTask && dragOverIndex !== null) {
      const currentIndex = incompleteTasks.findIndex((t) => t._id === internalDragTask._id);
      if (currentIndex !== -1 && currentIndex !== dragOverIndex) {
        const newOrder = [...incompleteTasks];
        const [removed] = newOrder.splice(currentIndex, 1);
        newOrder.splice(dragOverIndex, 0, removed);
        onReorderTasks(newOrder.map((t) => t._id));
      }
      setInternalDragTask(null);
      setDragOverIndex(null);
      return;
    }
    
    setDragOverIndex(null);
    onDrop();
  };

  const handleInternalDragStart = useCallback((task: TaskDTO) => {
    setInternalDragTask(task);
    onDragStart(task);
  }, [onDragStart]);

  const handleInternalDragEnd = useCallback(() => {
    setInternalDragTask(null);
    setDragOverIndex(null);
    onDragEnd();
  }, [onDragEnd]);

  const handleTaskDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleEmptyClick = () => {
    setIsCreating(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Parse "@30" or "@30m" suffix to extract focus minutes goal
  const parseTaskInput = (input: string): { title: string; focusMinutesGoal?: number } => {
    const match = input.match(/^(.+?)\s*@(\d+)m?\s*$/);
    if (match) {
      const title = match[1].trim();
      const minutes = parseInt(match[2], 10);
      if (title && minutes > 0 && minutes <= 600) {
        return { title, focusMinutesGoal: minutes };
      }
    }
    return { title: input.trim() };
  };

  const handleCreateSubmit = async () => {
    const { title, focusMinutesGoal } = parseTaskInput(newTaskTitle);
    if (title) {
      await onCreateTask(title, focusMinutesGoal);
    }
    setNewTaskTitle("");
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateSubmit();
    } else if (e.key === "Escape") {
      setNewTaskTitle("");
      setIsCreating(false);
    }
  };

  return (
    <div
      className={`day-column ${isDropTarget ? "day-column--drop-target" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Day Header */}
      <div className={`day-header ${isToday ? "day-header--today" : ""}`}>
        <span className="day-name">{dayName}</span>
        <span className={`day-number ${isToday ? "day-number--today" : ""}`}>
          {dayNumber}
        </span>
      </div>

      {/* Task List */}
      <div className="day-tasks">
        {incompleteTasks.map((task, index) => (
          <TaskLine
            key={task._id}
            task={task}
            isPast={isPast}
            isDragOver={dragOverIndex === index && internalDragTask?._id !== task._id}
            onDragStart={() => handleInternalDragStart(task)}
            onDragEnd={handleInternalDragEnd}
            onDragOver={() => handleTaskDragOver(index)}
            onUpdate={(title: string, focusMinutesGoal?: number) => onUpdateTask(task._id, title, focusMinutesGoal)}
            onToggleComplete={() => onToggleComplete(task)}
            onDelete={() => onDeleteTask(task._id)}
          />
        ))}

        {/* Inline Create */}
        {isCreating ? (
          <div className="task-line task-line--creating">
            <input
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={handleKeyDown}
              className="task-input"
              placeholder="Task name @25 for 25min goal"
            />
          </div>
        ) : (
          <button
            className="add-task-zone"
            onClick={handleEmptyClick}
            aria-label="Add task"
          >
            <span className="add-task-hint">+ Add task</span>
          </button>
        )}

        {/* Completed tasks at bottom, faded */}
        {completedTasks.map((task) => (
          <TaskLine
            key={task._id}
            task={task}
            isPast={isPast}
            onDragStart={() => handleInternalDragStart(task)}
            onDragEnd={handleInternalDragEnd}
            onUpdate={(title: string, focusMinutesGoal?: number) => onUpdateTask(task._id, title, focusMinutesGoal)}
            onToggleComplete={() => onToggleComplete(task)}
            onDelete={() => onDeleteTask(task._id)}
          />
        ))}
      </div>
    </div>
  );
}
