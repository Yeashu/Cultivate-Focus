export interface TaskDTO {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  focusMinutes: number;
  completed: boolean;
  earnedPoints: number;
  createdAt: string;
}

export interface SessionDTO {
  _id: string;
  userId: string;
  taskId: string;
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
  focusMinutes: number;
}

export interface UpdateTaskPayload {
  id: string;
  title?: string;
  description?: string;
  focusMinutes?: number;
  completed?: boolean;
}

export interface LogSessionPayload {
  taskId: string;
  duration: number;
  pointsEarned: number;
  date: string;
}
