"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import type { TaskDTO } from "@/types";

interface TaskLineProps {
  task: TaskDTO;
  isPast?: boolean;
  isDragOver?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver?: () => void;
  onUpdate: (title: string) => Promise<void>;
  onToggleComplete: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TaskLine({
  task,
  isPast = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onUpdate,
  onToggleComplete,
  onDelete,
}: TaskLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task._id);
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.();
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditValue(task.title);
    }
  };

  const handleBlur = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      await onUpdate(trimmed);
    } else {
      setEditValue(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  // Visual states
  const isCompleted = task.completed;
  const isOverdue = isPast && !isCompleted;

  return (
    <div
      className={`task-line ${isCompleted ? "task-line--completed" : ""} ${isOverdue ? "task-line--overdue" : ""} ${isDragOver ? "task-line--drag-over" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
    >
      {/* Drag Handle - only visible on hover */}
      <span className={`task-handle ${isHovered ? "task-handle--visible" : ""}`}>
        <GripVertical className="h-3 w-3" />
      </span>

      {/* Completion Checkbox */}
      <button
        className="task-checkbox"
        onClick={onToggleComplete}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        <span className={`task-checkbox-inner ${isCompleted ? "task-checkbox-inner--checked" : ""}`} />
      </button>

      {/* Task Title */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="task-input task-input--inline"
        />
      ) : (
        <span className="task-title" onClick={handleClick}>
          {task.title}
        </span>
      )}

      {/* Actions - only visible on hover */}
      <div className={`task-actions ${isHovered ? "task-actions--visible" : ""}`}>
        <Link
          href={`/timer?taskId=${task._id}`}
          className="task-action task-action--play"
          aria-label="Start focus session"
        >
          <Play className="h-3.5 w-3.5" />
        </Link>
        <button
          className="task-action task-action--delete"
          onClick={onDelete}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
