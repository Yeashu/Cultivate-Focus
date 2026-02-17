import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/models/session";
import { TaskModel } from "@/models/task";
import {
  serializeSession,
  serializeTask,
  type SessionLike,
  type TaskLike,
} from "@/lib/serialize";
import { isTaskGoalMet } from "@/lib/tasks";

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

    if (isTaskGoalMet(task)) {
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

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to update sessions." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const payload = await request.json();
  const { id, taskId } = payload ?? {};

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { message: "Session ID is required." },
      { status: 400 }
    );
  }

  // Find the session
  const sessionDoc = await SessionModel.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!sessionDoc) {
    return NextResponse.json(
      { message: "Session not found." },
      { status: 404 }
    );
  }

  // If linking to a task, validate the task exists
  let task = null;
  if (taskId && typeof taskId === "string") {
    task = await TaskModel.findOne({ _id: taskId, userId: session.user.id });
    if (!task) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }
  }

  const oldTaskId = sessionDoc.taskId;
  
  // Update the session's taskId
  sessionDoc.taskId = taskId ?? null;
  await sessionDoc.save();

  // If we're linking to a new task, update its earned points
  if (task && (!oldTaskId || oldTaskId.toString() !== taskId)) {
    task.earnedPoints += sessionDoc.pointsEarned;

    if (isTaskGoalMet(task)) {
      task.completed = true;
    }

    await task.save();

    return NextResponse.json({
      session: serializeSession(sessionDoc as SessionLike),
      task: serializeTask(task as TaskLike),
    });
  }

  return NextResponse.json({
    session: serializeSession(sessionDoc as SessionLike),
  });
}
