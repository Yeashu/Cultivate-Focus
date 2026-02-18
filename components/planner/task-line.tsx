"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { Play, Trash2, GripVertical, Check, Timer } from "lucide-react";
import type { TaskDTO } from "@/types";
import { parseTaskInput } from "@/lib/tasks";
import { useTimerState, useTimerActions } from "@/context/timer-context";

interface TaskLineProps {
  task: TaskDTO;
  isPast?: boolean;
  isDragOver?: boolean;
  dragPosition?: 'above' | 'below' | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver?: (position: 'above' | 'below') => void;
  onUpdate: (title: string, focusMinutesGoal?: number) => Promise<void>;
  onToggleComplete: () => Promise<void>;
  onDelete: () => Promise<void>;
}

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
  dragPosition = null,
  onDragStart,
  onDragEnd,
  onDragOver,
  onUpdate,
  onToggleComplete,
  onDelete,
}: TaskLineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [showCompletionGlow, setShowCompletionGlow] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCompletedRef = useRef(task.completed);

  const timerState = useTimerState();
  const { startTimer, switchTask } = useTimerActions();

  const isTimerActiveElsewhere =
    (timerState.isRunning || timerState.isPaused) &&
    timerState.selectedTaskId !== task._id;
  const isThisTaskTimed =
    (timerState.isRunning || timerState.isPaused) &&
    timerState.selectedTaskId === task._id;

  const QUICK_DURATIONS = [15, 25, 45, 60];
  const defaultDuration = task.focusMinutesGoal ?? 25;

  const handleStartTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTimerActiveElsewhere) {
      setShowSwitchConfirm(true);
      return;
    }
    setShowDurationPicker(true);
  };

  const handlePickDuration = (minutes: number) => {
    setShowDurationPicker(false);
    startTimer(task._id, minutes);
  };

  const handleConfirmSwitch = () => {
    setShowSwitchConfirm(false);
    switchTask(task._id);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Trigger completion glow animation when task becomes completed.
  // setState in effect is intentional: we need to react to prop transitions
  // (completed going false→true) which can originate from multiple sources
  // (user toggle, auto-completion on reaching point goal).
  useEffect(() => {
    if (task.completed && !prevCompletedRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!onDragOver) return;
    
    // Determine if we're in the top or bottom half of the element
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'above' : 'below';
    onDragOver(position);
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

  // Progress bar: earnedPoints (1pt = 1 min) vs focusMinutesGoal
  const goal = task.focusMinutesGoal ?? (task.focusMinutes ?? null);
  const progressRatio = isCompleted
    ? 1
    : goal && goal > 0
    ? Math.min(1, (task.earnedPoints ?? 0) / goal)
    : null; // null = no goal, show faint track only

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
      className={`task-line group ${isCompleted ? "task-line--completed" : ""} ${isOverdue ? "task-line--overdue" : ""} ${isDragOver && dragPosition === 'above' ? "task-line--drag-above" : ""} ${isDragOver && dragPosition === 'below' ? "task-line--drag-below" : ""}`}
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
      <span className="task-handle">
        <GripVertical className="h-3 w-3" />
      </span>

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

      {/* Active timer pulsing indicator */}
      <AnimatePresence>
        {isThisTaskTimed && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex-shrink-0 flex items-center gap-1 rounded-full bg-[var(--focus-soft)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--focus)]"
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--focus)]" />
            {timerState.isRunning ? "focusing" : "paused"}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Actions - only visible on hover */}
      <div className="task-actions" style={{ position: "relative" }}>
        {/* Duration picker popover */}
        <AnimatePresence>
          {showDurationPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 z-50 mb-1.5 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl"
              onMouseLeave={() => setShowDurationPicker(false)}
            >
              {QUICK_DURATIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => handlePickDuration(min)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    min === defaultDuration
                      ? "bg-[var(--focus)] text-white"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {min}m
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Switch confirm popover */}
        <AnimatePresence>
          {showSwitchConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 z-50 mb-1.5 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl"
            >
              <p className="mb-2 text-xs text-[var(--muted)]">
                Timer is running for another task. Switch to this one?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmSwitch}
                  className="flex-1 rounded-lg bg-[var(--focus)] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--focus)]/90"
                >
                  Switch
                </button>
                <button
                  type="button"
                  onClick={() => setShowSwitchConfirm(false)}
                  className="flex-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          className="task-action task-action--play"
          aria-label="Start focus session"
          onClick={handleStartTimerClick}
        >
          {isThisTaskTimed ? (
            <Timer className="h-3.5 w-3.5" style={{ color: "var(--focus)" }} />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          className="task-action task-action--delete"
          onClick={onDelete}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar underline */}
      <div className="task-progress-track">
        {progressRatio !== null && (
          <motion.div
            className="task-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressRatio * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              backgroundColor: isCompleted
                ? "var(--focus)"
                : isOverdue
                ? "var(--break)"
                : "var(--focus)",
              opacity: isCompleted ? 0.5 : 0.75,
            }}
          />
        )}
      </div>
    </DraggableMotionDiv>
  );
}
