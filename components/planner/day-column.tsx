"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskLine } from "./task-line";
import type { TaskDTO } from "@/types";
import { parseTaskInput } from "@/lib/tasks";

interface DragOverState {
  index: number;
  position: 'above' | 'below';
}

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
  const [dragOverState, setDragOverState] = useState<DragOverState | null>(null);
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
      setDragOverState(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    
    const draggedTaskId = e.dataTransfer.getData("text/plain");
    
    // Handle internal reorder - check if the dragged task belongs to this column
    const isInternalTask = incompleteTasks.some(t => t._id === draggedTaskId);
    
    if (isInternalTask && dragOverState !== null) {
      const currentIndex = incompleteTasks.findIndex((t) => t._id === draggedTaskId);
      if (currentIndex !== -1) {
        // Calculate the target index based on position
        let targetIndex = dragOverState.index;
        if (dragOverState.position === 'below') {
          targetIndex = targetIndex + 1;
        }
        
        // Adjust if moving from before the target
        if (currentIndex < targetIndex) {
          targetIndex = targetIndex - 1;
        }
        
        if (currentIndex !== targetIndex) {
          const newOrder = [...incompleteTasks];
          const [removed] = newOrder.splice(currentIndex, 1);
          newOrder.splice(targetIndex, 0, removed);
          onReorderTasks(newOrder.map((t) => t._id));
        }
      }
      setInternalDragTask(null);
      setDragOverState(null);
      return;
    }
    
    setDragOverState(null);
    setInternalDragTask(null);
    onDrop();
  };

  const handleInternalDragStart = useCallback((task: TaskDTO) => {
    setInternalDragTask(task);
    onDragStart(task);
  }, [onDragStart]);

  const handleInternalDragEnd = useCallback(() => {
    setInternalDragTask(null);
    setDragOverState(null);
    onDragEnd();
  }, [onDragEnd]);

  const handleTaskDragOver = useCallback((index: number, position: 'above' | 'below') => {
    setDragOverState({ index, position });
  }, []);

  const handleEmptyClick = () => {
    setIsCreating(true);
    setTimeout(() => inputRef.current?.focus(), 0);
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
        <AnimatePresence mode="popLayout">
          {incompleteTasks.map((task, index) => (
            <TaskLine
              key={task._id}
              task={task}
              isPast={isPast}
              isDragOver={dragOverState?.index === index && internalDragTask?._id !== task._id}
              dragPosition={dragOverState?.index === index ? dragOverState.position : null}
              onDragStart={() => handleInternalDragStart(task)}
              onDragEnd={handleInternalDragEnd}
              onDragOver={(position) => handleTaskDragOver(index, position)}
              onUpdate={(title: string, focusMinutesGoal?: number) => onUpdateTask(task._id, title, focusMinutesGoal)}
              onToggleComplete={() => onToggleComplete(task)}
              onDelete={() => onDeleteTask(task._id)}
            />
          ))}
        </AnimatePresence>

        {/* Inline Create */}
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div 
              key="creating"
              className="task-line task-line--creating"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          ) : (
            <motion.button
              key="add-button"
              className="add-task-zone"
              onClick={handleEmptyClick}
              aria-label="Add task"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="add-task-hint">+ Add task</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Completed tasks at bottom, faded */}
        <AnimatePresence mode="popLayout">
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
        </AnimatePresence>
      </div>
    </div>
  );
}
