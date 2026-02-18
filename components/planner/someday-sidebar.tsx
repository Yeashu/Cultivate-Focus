"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { SomedayHorizon } from "./someday-horizon";
import type { TaskDTO } from "@/types";

interface SomedaySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskDTO[];
  onDragStart: (task: TaskDTO) => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onCreateTask: (title: string, focusMinutesGoal?: number) => Promise<void>;
  onUpdateTask: (taskId: string, title: string, focusMinutesGoal?: number) => Promise<void>;
  onToggleComplete: (task: TaskDTO) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function SomedaySidebar({
  isOpen,
  onClose,
  tasks,
  onDragStart,
  onDragEnd,
  onDrop,
  onCreateTask,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
}: SomedaySidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const horizonProps = {
    tasks,
    onDragStart,
    onDragEnd,
    onDrop,
    onCreateTask,
    onUpdateTask,
    onToggleComplete,
    onDeleteTask,
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        ref={sidebarRef}
        className={`someday-sidebar ${isOpen ? "" : "someday-sidebar--collapsed"}`}
      >
        <SomedayHorizon {...horizonProps} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="someday-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <motion.aside
              className="someday-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Someday
                </span>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SomedayHorizon {...horizonProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
