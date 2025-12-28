export interface TaskDTO {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  /** @deprecated Use focusMinutesGoal instead */
  focusMinutes?: number;
  /** Optional focus goal in minutes (null/undefined means no goal) */
  focusMinutesGoal?: number | null;
  /** Scheduled date for weekly view (YYYY-MM-DD) */
  scheduledDate: string;
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
  weekly: Array<{
    date: string;
    points: number;
  }>;
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
  completed?: boolean;
}

export interface LogSessionPayload {
  /** Optional: null for quick timer sessions */
  taskId?: string | null;
  duration: number;
  pointsEarned: number;
  date: string;
}
