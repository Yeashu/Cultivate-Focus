import type { TaskDTO, SessionDTO } from "@/types";

export type TaskLike = {
  _id: { toString(): string };
  userId: { toString(): string };
  title: string;
  description?: string;
  focusMinutes?: number;
  focusMinutesGoal?: number | null;
  scheduledDate?: string | null;
  completed: boolean;
  earnedPoints: number;
  createdAt?: Date;
};

export type SessionLike = {
  _id: { toString(): string };
  userId: { toString(): string };
  taskId: { toString(): string } | string | null;
  duration: number;
  pointsEarned: number;
  date: string;
  createdAt?: Date;
};

export function serializeTask(task: TaskLike): TaskDTO {
  const createdAt = task.createdAt?.toISOString?.() ?? new Date().toISOString();
  // Support both legacy focusMinutes and new focusMinutesGoal
  const focusMinutesGoal =
    task.focusMinutesGoal !== undefined && task.focusMinutesGoal !== null
      ? task.focusMinutesGoal
      : task.focusMinutes ?? null;
  // Default scheduledDate to "someday" if missing/empty (ensures visibility in planner)
  const scheduledDate =
    task.scheduledDate !== undefined &&
    task.scheduledDate !== null &&
    task.scheduledDate !== ""
      ? task.scheduledDate
      : "someday";

  return {
    _id: task._id.toString(),
    userId: task.userId.toString(),
    title: task.title,
    description: task.description ?? "",
    focusMinutesGoal,
    scheduledDate,
    completed: task.completed,
    earnedPoints: task.earnedPoints,
    createdAt,
  };
}

export function serializeSession(session: SessionLike): SessionDTO {
  const taskIdValue = session.taskId;
  return {
    _id: session._id.toString(),
    userId: session.userId.toString(),
    taskId: taskIdValue
      ? typeof taskIdValue === "string"
        ? taskIdValue
        : taskIdValue.toString()
      : null,
    duration: session.duration,
    pointsEarned: session.pointsEarned,
    date: session.date,
    createdAt: session.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}
