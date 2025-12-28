"use client";

import { useState, useRef } from "react";
import { Inbox } from "lucide-react";
import { TaskLine } from "./task-line";
import type { TaskDTO } from "@/types";

interface SomedayHorizonProps {
  tasks: TaskDTO[];
  onDragStart: (task: TaskDTO) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onCreateTask: (title: string) => Promise<void>;
  onUpdateTask: (taskId: string, title: string) => Promise<void>;
  onToggleComplete: (task: TaskDTO) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function SomedayHorizon({
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  onCreateTask,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
}: SomedayHorizonProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    onDrop();
  };

  const handleEmptyClick = () => {
    setIsCreating(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCreateSubmit = async () => {
    const trimmed = newTaskTitle.trim();
    if (trimmed) {
      await onCreateTask(trimmed);
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

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div
      className={`someday-horizon ${isDropTarget ? "someday-horizon--drop-target" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="someday-header">
        <Inbox className="h-4 w-4 text-[var(--muted)]" />
        <span className="someday-title">Someday</span>
        <span className="someday-hint">Drag tasks here for later</span>
      </div>

      <div className="someday-tasks">
        {incompleteTasks.map((task) => (
          <TaskLine
            key={task._id}
            task={task}
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
            onUpdate={(title: string) => onUpdateTask(task._id, title)}
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
              placeholder="New idea..."
            />
          </div>
        ) : (
          <button
            className="add-task-zone add-task-zone--someday"
            onClick={handleEmptyClick}
            aria-label="Add idea"
          >
            <span className="add-task-hint">+ Add idea</span>
          </button>
        )}

        {completedTasks.map((task) => (
          <TaskLine
            key={task._id}
            task={task}
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
            onUpdate={(title: string) => onUpdateTask(task._id, title)}
            onToggleComplete={() => onToggleComplete(task)}
            onDelete={() => onDeleteTask(task._id)}
          />
        ))}
      </div>
    </div>
  );
}
