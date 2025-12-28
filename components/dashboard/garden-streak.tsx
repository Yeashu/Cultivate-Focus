"use client";

import { motion } from "framer-motion";
import type { StreakInfo } from "@/types";

interface GardenStreakProps {
  streak: StreakInfo;
}

function LeafIcon({ filled, index }: { filled: boolean; index: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${filled ? "text-[var(--focus)]" : "text-[var(--muted)]/30"}`}
      fill="currentColor"
      initial={filled ? { scale: 0, rotate: -30 } : { scale: 1 }}
      animate={filled ? { scale: 1, rotate: 0 } : { scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: "backOut",
      }}
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z" />
    </motion.svg>
  );
}

export function GardenStreak({ streak }: GardenStreakProps) {
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  
  return (
    <div className="rounded-2xl bg-[var(--surface)]/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
            Garden Streak
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <motion.span
              key={streak.current}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-semibold text-[var(--foreground)]"
            >
              {streak.current}
            </motion.span>
            <span className="text-sm text-[var(--muted)]">
              {streak.current === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
        
        {/* Today's status */}
        {streak.todayComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-[var(--focus-soft)]/50 px-3 py-1.5 text-sm font-medium text-[var(--focus)]"
          >
            <span className="text-base">🌱</span>
            Watered today
          </motion.div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-sm text-[var(--muted)]">
            <span className="text-base">💧</span>
            Water your garden
          </div>
        )}
      </div>
      
      {/* Weekly leaves visualization */}
      <div className="mt-5 flex items-end justify-between">
        {streak.weeklyLeaves.map((hasSession, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <LeafIcon filled={hasSession} index={index} />
            <span className="text-xs font-medium text-[var(--muted)]">
              {dayLabels[index]}
            </span>
          </div>
        ))}
      </div>
      
      {/* Motivational message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-xs text-[var(--muted)]"
      >
        {streak.current === 0
          ? "Start a focus session to plant your first leaf"
          : streak.current >= 7
            ? "🌿 A full week of growth! Your garden flourishes"
            : streak.current >= 3
              ? "Your garden is growing beautifully"
              : "Keep nurturing your focus garden"}
      </motion.p>
    </div>
  );
}
