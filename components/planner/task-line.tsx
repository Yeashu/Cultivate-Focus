"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { Play, Trash2, GripVertical, Check } from "lucide-react";
import Link from "next/link";
import type { TaskDTO } from "@/types";

interface TaskLineProps {
  task: TaskDTO;
  isPast?: boolean;
  isDragOver?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver?: () => void;
  onUpdate: (title: string, focusMinutesGoal?: number) => Promise<void>;
  onToggleComplete: () => Promise<void>;
  onDelete: () => Promise<void>;
}

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

// Custom motion div that properly handles native HTML5 drag events
interface DraggableMotionDivProps extends Omit<HTMLMotionProps<"div">, "onDragStart" | "onDragEnd" | "onDragOver"> {
  nativeDragStart?: React.DragEventHandler<HTMLDivElement>;
  nativeDragEnd?: React.DragEventHandler<HTMLDivElement>;
  nativeDragOver?: React.DragEventHandler<HTMLDivElement>;
  draggable?: boolean;
}

const DraggableMotionDiv = forwardRef<HTMLDivElement, DraggableMotionDivProps>(
  ({ nativeDragStart, nativeDragEnd, nativeDragOver, draggable, children, ...motionProps }, ref) => {
    // Cast to any to bypass Framer Motion's type conflicts with native HTML5 drag events
    const dragProps = {
      draggable,
      onDragStart: nativeDragStart,
      onDragEnd: nativeDragEnd,
      onDragOver: nativeDragOver,
    } as Record<string, unknown>;
    
    return (
      <motion.div
        ref={ref}
        {...motionProps}
        {...dragProps}
      >
        {children}
      </motion.div>
    );
  }
);
DraggableMotionDiv.displayName = "DraggableMotionDiv";

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
  const [showCompletionGlow, setShowCompletionGlow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCompletedRef = useRef(task.completed);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Trigger completion glow animation when task becomes completed
  useEffect(() => {
    if (task.completed && !prevCompletedRef.current) {
      setShowCompletionGlow(true);
      const timer = setTimeout(() => setShowCompletionGlow(false), 1500);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = task.completed;
  }, [task.completed]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task._id);
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragOver?.();
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  // Build display value with goal suffix
  const getEditDisplayValue = () => {
    if (task.focusMinutesGoal) {
      return `${task.title} @${task.focusMinutesGoal}m`;
    }
    return task.title;
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditValue(getEditDisplayValue());
    }
  };

  const handleBlur = async () => {
    const parsed = parseTaskInput(editValue);
    const originalDisplay = getEditDisplayValue();
    // Only update if something changed
    if (parsed.title && editValue.trim() !== originalDisplay) {
      await onUpdate(parsed.title, parsed.focusMinutesGoal);
    } else {
      setEditValue(getEditDisplayValue());
    }
    setIsEditing(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(getEditDisplayValue());
      setIsEditing(false);
    }
  };

  // Visual states
  const isCompleted = task.completed;
  const isOverdue = isPast && !isCompleted;

  return (
    <DraggableMotionDiv
      layout
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      }}
      className={`task-line ${isCompleted ? "task-line--completed" : ""} ${isOverdue ? "task-line--overdue" : ""} ${isDragOver ? "task-line--drag-over" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!isEditing}
      nativeDragStart={handleDragStart}
      nativeDragEnd={handleDragEnd}
      nativeDragOver={handleDragOver}
      style={{ position: "relative" }}
    >
      {/* Completion glow effect */}
      <AnimatePresence>
        {showCompletionGlow && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-lg bg-[var(--focus)]/20 blur-sm"
            style={{ zIndex: -1 }}
          />
        )}
      </AnimatePresence>

      {/* Drag Handle - only visible on hover */}
      <motion.span 
        className={`task-handle ${isHovered ? "task-handle--visible" : ""}`}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <GripVertical className="h-3 w-3" />
      </motion.span>

      {/* Completion Checkbox with animation */}
      <motion.button
        className="task-checkbox"
        onClick={onToggleComplete}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.span 
          className={`task-checkbox-inner ${isCompleted ? "task-checkbox-inner--checked" : ""}`}
          animate={isCompleted ? { 
            backgroundColor: "var(--focus)",
            borderColor: "var(--focus)",
          } : {
            backgroundColor: "transparent",
            borderColor: "var(--border)",
          }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.span>
      </motion.button>

      {/* Task Title with strikethrough animation */}
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
        <motion.span 
          className="task-title" 
          onClick={handleClick}
          animate={{
            opacity: isCompleted ? 0.6 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{
            textDecoration: isCompleted ? "line-through" : "none",
            textDecorationColor: isCompleted ? "var(--focus)" : "transparent",
          }}
        >
          {task.title}
          {task.focusMinutesGoal && (
            <span className="task-goal">@{task.focusMinutesGoal}m</span>
          )}
        </motion.span>
      )}

      {/* Actions - only visible on hover */}
      <motion.div 
        className={`task-actions ${isHovered ? "task-actions--visible" : ""}`}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <Link
          href={`/timer?taskId=${task._id}`}
          className="task-action task-action--play"
          aria-label="Start focus session"
        >
          <Play className="h-3.5 w-3.5" />
        </Link>
        <motion.button
          className="task-action task-action--delete"
          onClick={onDelete}
          aria-label="Delete task"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </motion.button>
      </motion.div>
    </DraggableMotionDiv>
  );
}
