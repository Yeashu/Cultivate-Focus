"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Leaf } from "lucide-react";
import { useFocusData } from "@/context/focus-context";
import { PlantSVGs } from "./plant-svgs";
import { formatDateLabel } from "@/lib/dates";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Mini Plant Widget ---
function MiniPlant({ isOpen }: { isOpen: boolean }) {
  const { stats, loading } = useFocusData();

  if (loading || !stats) {
    return (
      <div className="h-32 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
    );
  }

  const { growthStage, totalPoints } = stats;
  const PlantSVG = PlantSVGs[growthStage.name];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[var(--focus-soft)]/40 via-transparent to-[var(--accent)]/10 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        Focus Growth
      </p>
      <div className="flex items-center gap-4">
        {/* 80px plant illustration */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--surface)]/80 shadow-sm">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key={growthStage.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="h-16 w-16"
              >
                <PlantSVG className="h-full w-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stage info */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--foreground)]">
            {growthStage.label}
          </p>
          <p className="text-2xl font-semibold leading-tight text-[var(--focus)]">
            {totalPoints}
            <span className="ml-1 text-sm font-medium text-[var(--muted)]">FP</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>{growthStage.threshold} FP</span>
          {growthStage.nextThreshold ? (
            <span>{growthStage.nextThreshold} FP</span>
          ) : (
            <span className="text-[var(--focus)]">✨ Full Bloom</span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--focus)] to-[var(--focus)]/80"
            initial={{ width: 0 }}
            animate={{ width: `${growthStage.progress * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          />
        </div>
        {growthStage.nextThreshold && (
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            {growthStage.nextThreshold - totalPoints} FP to next stage
          </p>
        )}
      </div>
    </div>
  );
}

// --- Compact Streak Widget ---
function MiniStreak() {
  const { stats, loading } = useFocusData();

  if (loading || !stats) {
    return (
      <div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
    );
  }

  const { streak } = stats;
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="rounded-2xl bg-[var(--surface)]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Garden Streak
        </p>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={streak.current}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl font-semibold text-[var(--foreground)]"
          >
            {streak.current}
          </motion.span>
          <span className="text-xs text-[var(--muted)]">
            {streak.current === 1 ? "day" : "days"}
          </span>
        </div>
      </div>

      {/* 7-day leaf strip */}
      <div className="flex items-end justify-between">
        {streak.weeklyLeaves.map((hasSession, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <motion.svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 ${hasSession ? "text-[var(--focus)]" : "text-[var(--muted)]/25"}`}
              fill="currentColor"
              initial={hasSession ? { scale: 0, rotate: -30 } : { scale: 1 }}
              animate={hasSession ? { scale: 1, rotate: 0 } : { scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: "backOut" }}
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z" />
            </motion.svg>
            <span className="text-xs text-[var(--muted)]">{dayLabels[index]}</span>
          </div>
        ))}
      </div>

      {/* Today status pill */}
      <div className="mt-3">
        {streak.todayComplete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--focus-soft)]/60 px-2 py-1 text-xs font-medium text-[var(--focus)]">
            <span>🌱</span> Watered today
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--muted)]">
            <span>💧</span> Water your garden
          </span>
        )}
      </div>
    </div>
  );
}

// --- Mini Weekly Trend Widget ---
function MiniWeeklyTrend() {
  const { stats, loading } = useFocusData();

  if (loading || !stats) {
    return (
      <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
    );
  }

  const { weekly } = stats;
  const totalWeekPoints = weekly.reduce((sum, d) => sum + d.points, 0);

  const maxPoints = Math.max(...weekly.map((e) => e.points), 1);
  const width = 100;
  const height = 50;
  const padding = { top: 8, right: 4, bottom: 4, left: 4 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = weekly.map((entry, index) => {
    const x = padding.left + (index / (weekly.length - 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      (entry.points / maxPoints) * chartHeight;
    return { x, y, ...entry };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="rounded-2xl bg-[var(--surface)]/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          This Week
        </p>
        <motion.span
          key={totalWeekPoints}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-semibold text-[var(--focus)]"
        >
          {totalWeekPoints}
          <span className="ml-1 text-xs font-medium text-[var(--muted)]">FP</span>
        </motion.span>
      </div>

      {/* Compact chart */}
      <div className="relative h-20">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="statsSidebarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--focus)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--focus)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Subtle grid */}
          {[0.5].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + chartHeight * ratio}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight * ratio}
              stroke="var(--border)"
              strokeOpacity="0.3"
              strokeDasharray="2 4"
            />
          ))}

          {/* Area */}
          <motion.path
            d={areaPath}
            fill="url(#statsSidebarGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--focus)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />

          {/* Data dots */}
          {points.map((point, index) => (
            <motion.circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill="var(--surface)"
              stroke="var(--focus)"
              strokeWidth="1.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.5 + index * 0.05 }}
            />
          ))}
        </svg>
      </div>

      {/* Day labels */}
      <div className="mt-1 flex justify-between px-0.5">
        {weekly.map((entry) => (
          <span key={entry.date} className="text-xs text-[var(--muted)]">
            {formatDateLabel(entry.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Main Sidebar ---
export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="stats-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <motion.aside
            className="stats-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            aria-label="Stats panel"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[var(--focus)]" />
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Garden Stats
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                aria-label="Close stats panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Widgets */}
            <div className="flex flex-col gap-3">
              <MiniPlant isOpen={isOpen} />
              <MiniStreak />
              <MiniWeeklyTrend />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
