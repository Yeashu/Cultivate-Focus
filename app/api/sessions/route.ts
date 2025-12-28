import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/models/session";
import { TaskModel } from "@/models/task";
import type { SessionDTO, TaskDTO } from "@/types";

type SessionLike = {
  _id: { toString(): string };
  userId: { toString(): string };
  taskId: { toString(): string } | string | null;
  duration: number;
  pointsEarned: number;
  date: string;
  createdAt?: Date;
};

type TaskLike = {
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

function serializeSession(session: SessionLike): SessionDTO {
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

function serializeTask(task: TaskLike): TaskDTO {
  const createdAt = task.createdAt?.toISOString?.() ?? new Date().toISOString();
  const focusMinutesGoal =
    task.focusMinutesGoal !== undefined && task.focusMinutesGoal !== null
      ? task.focusMinutesGoal
      : task.focusMinutes ?? null;
  const scheduledDate = task.scheduledDate ?? createdAt.slice(0, 10);

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

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to view sessions." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const rangeDaysParam = Number(searchParams.get("rangeDays"));
  const rangeDays = Number.isFinite(rangeDaysParam)
    ? Math.min(Math.max(rangeDaysParam, 1), 60)
    : 7;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (rangeDays - 1));
  const startIso = startDate.toISOString().slice(0, 10);

  const sessions = (await SessionModel.find({
    userId: session.user.id,
    date: { $gte: startIso },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean()) as unknown as SessionLike[];

  return NextResponse.json({ sessions: sessions.map(serializeSession) });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to log sessions." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const payload = await request.json();
  const { taskId, duration, pointsEarned, date } = payload ?? {};

  // taskId is now optional for "quick timer" sessions
  const hasTaskId = taskId && typeof taskId === "string";

  const durationMinutes = Number(duration);
  const points = Number(pointsEarned);
  const dateIso = typeof date === "string" ? date : undefined;

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json(
      { message: "Duration must be a positive number." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(points) || points < 0) {
    return NextResponse.json(
      { message: "Points earned must be zero or greater." },
      { status: 400 }
    );
  }

  const sessionDate = dateIso ?? new Date().toISOString().slice(0, 10);
  const userObjectId = new Types.ObjectId(session.user.id);

  // If taskId is provided, validate and update the task
  let task = null;
  if (hasTaskId) {
    task = await TaskModel.findOne({ _id: taskId, userId: session.user.id });

    if (!task) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }
  }

  const sessionDocument = await SessionModel.create({
    userId: userObjectId,
    taskId: hasTaskId ? taskId : null,
    duration: durationMinutes,
    pointsEarned: points,
    date: sessionDate,
  });

  // Update task progress if a task was linked
  if (task) {
    task.earnedPoints += points;

    // Check completion using focusMinutesGoal (new) or focusMinutes (legacy)
    const goal = task.focusMinutesGoal ?? task.focusMinutes;
    if (!task.completed && goal && task.earnedPoints >= goal) {
      task.completed = true;
    }

    await task.save();

    return NextResponse.json(
      {
        session: serializeSession(sessionDocument as SessionLike),
        task: serializeTask(task as TaskLike),
      },
      { status: 201 }
    );
  }

  // No task linked - return only the session
  return NextResponse.json(
    {
      session: serializeSession(sessionDocument as SessionLike),
    },
    { status: 201 }
  );
}
