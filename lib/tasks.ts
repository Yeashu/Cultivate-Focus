/**
 * Check whether a task's focus goal has been met.
 * Supports both the new `focusMinutesGoal` and legacy `focusMinutes` field.
 */
export function isTaskGoalMet(task: {
  completed: boolean;
  earnedPoints: number;
  focusMinutesGoal?: number | null;
  focusMinutes?: number;
}): boolean {
  if (task.completed) return true;
  const goal = task.focusMinutesGoal ?? task.focusMinutes ?? null;
  return goal !== null && goal > 0 && task.earnedPoints >= goal;
}

/**
 * Parse "@30" or "@30m" suffix from task input to extract focus minutes goal.
 * Example: "Read chapter 3 @25m" → { title: "Read chapter 3", focusMinutesGoal: 25 }
 */
export function parseTaskInput(input: string): { title: string; focusMinutesGoal?: number } {
  const match = input.match(/^(.+?)\s*@(\d+)m?\s*$/);
  if (match) {
    const title = match[1].trim();
    const minutes = parseInt(match[2], 10);
    if (title && minutes > 0 && minutes <= 600) {
      return { title, focusMinutesGoal: minutes };
    }
  }
  return { title: input.trim() };
}
