export interface TaskDTO {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  /** @deprecated Use focusMinutesGoal instead */
  focusMinutes?: number;
  /** Optional focus goal in minutes (null/undefined means no goal) */
  focusMinutesGoal?: number | null;
  /** Scheduled date for weekly view (YYYY-MM-DD) or "someday" for backlog */
  scheduledDate: string;
  /** Order within the day (lower = higher in list) */
  order?: number;
  completed: boolean;
  earnedPoints: number;
  createdAt: string;
}

export interface SessionDTO {
  _id: string;
  userId: string;
  /** Optional: null for "quick timer" sessions without a task */
  taskId: string | null;
  duration: number;
  pointsEarned: number;
  date: string;
  createdAt: string;
}

export interface FocusStats {
  todayPoints: number;
  todayMinutes: number;
  todaySessions: number;
  totalPoints: number;
  weekly: Array<{
    date: string;
    points: number;
  }>;
  /** Current growth stage based on total focus points */
  growthStage: GrowthStage;
  /** Garden streak - consecutive days with at least one session */
  streak: StreakInfo;
}

export type GrowthStageName = "seed" | "sprout" | "sapling" | "bloom";

export interface GrowthStage {
  name: GrowthStageName;
  label: string;
  threshold: number;
  nextThreshold: number | null;
  progress: number; // 0-1 progress to next stage
}

export interface StreakInfo {
  /** Current streak count */
  current: number;
  /** Longest streak ever */
  longest: number;
  /** Whether today has a session */
  todayComplete: boolean;
  /** Array of last 7 days with boolean for each day having a session */
  weeklyLeaves: boolean[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  /** Optional focus goal in minutes */
  focusMinutesGoal?: number | null;
  /** Optional scheduled date (defaults to today) */
  scheduledDate?: string;
}

export interface UpdateTaskPayload {
  id: string;
  title?: string;
  description?: string;
  focusMinutesGoal?: number | null;
  scheduledDate?: string;
  order?: number;
  completed?: boolean;
}

export interface LogSessionPayload {
  /** Optional: null for quick timer sessions */
  taskId?: string | null;
  duration: number;
  pointsEarned: number;
  date: string;
}

export interface UpdateSessionPayload {
  id: string;
  /** Link session to a task retroactively */
  taskId?: string | null;
}
