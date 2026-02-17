import type { SessionDTO, StreakInfo } from "@/types";
import { getTodayIso } from "@/lib/dates";

export function calculateStreak(sessions: SessionDTO[], weeklyDates: string[]): StreakInfo {
  const today = getTodayIso();
  const sessionDates = new Set(sessions.map(s => s.date));
  const todayComplete = sessionDates.has(today);

  // Calculate weekly leaves (last 7 days)
  const weeklyLeaves = weeklyDates.map(date => sessionDates.has(date));

  // Calculate current streak - count consecutive days backwards from today (or yesterday if today has no session)
  let currentStreak = 0;
  const sortedDates = Array.from(sessionDates).sort().reverse();

  if (sortedDates.length > 0) {
    // Start from today or yesterday
    const startDate = new Date(today);
    if (!todayComplete) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const checkDate = startDate;
    while (sessionDates.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Calculate longest streak (simplified - just use current for now)
  const longestStreak = Math.max(currentStreak, 0);

  return {
    current: currentStreak,
    longest: longestStreak,
    todayComplete,
    weeklyLeaves,
  };
}
