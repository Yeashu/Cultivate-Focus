import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/models/session";
import { TaskModel } from "@/models/task";
import type { SessionDTO, TaskDTO } from "@/types";

type SessionLike = {
  _id: { toString(): string };
  taskId: { toString(): string } | string;
  duration: number;
  pointsEarned: number;
  date: string;
  createdAt?: Date;
};

type TaskLike = {
  _id: { toString(): string };
  title: string;
  description?: string;
  focusMinutes: number;
  completed: boolean;
  earnedPoints: number;
  createdAt?: Date;
};

function serializeSession(session: SessionLike): SessionDTO {
  return {
    _id: session._id.toString(),
    taskId:
      typeof session.taskId === "string" ? session.taskId : session.taskId.toString(),
    duration: session.duration,
    pointsEarned: session.pointsEarned,
    date: session.date,
    createdAt: session.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function serializeTask(task: TaskLike): TaskDTO {
  return {
    _id: task._id.toString(),
    title: task.title,
    description: task.description ?? "",
    focusMinutes: task.focusMinutes,
    completed: task.completed,
    earnedPoints: task.earnedPoints,
    createdAt: task.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function GET(request: Request) {
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
    date: { $gte: startIso },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean()) as unknown as SessionLike[];

  return NextResponse.json({ sessions: sessions.map(serializeSession) });
}

export async function POST(request: Request) {
  await connectToDatabase();

  const payload = await request.json();
  const { taskId, duration, pointsEarned, date } = payload ?? {};

  if (!taskId || typeof taskId !== "string") {
    return NextResponse.json(
      { message: "taskId is required." },
      { status: 400 }
    );
  }

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

  const task = await TaskModel.findById(taskId);

  if (!task) {
    return NextResponse.json(
      { message: "Task not found." },
      { status: 404 }
    );
  }

  const session = await SessionModel.create({
    taskId,
    duration: durationMinutes,
    pointsEarned: points,
    date: sessionDate,
  });

  task.earnedPoints += points;

  if (!task.completed && task.earnedPoints >= task.focusMinutes) {
    task.completed = true;
  }

  await task.save();

  return NextResponse.json(
    {
      session: serializeSession(session as SessionLike),
      task: serializeTask(task as TaskLike),
    },
    { status: 201 }
  );
}
