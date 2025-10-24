import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TaskModel } from "@/models/task";
import type { TaskDTO } from "@/types";

type TaskLike = {
  _id: { toString(): string };
  userId: { toString(): string };
  title: string;
  description?: string;
  focusMinutes: number;
  completed: boolean;
  earnedPoints: number;
  createdAt?: Date;
};

function serializeTask(task: TaskLike): TaskDTO {
  return {
    _id: task._id.toString(),
    userId: task.userId.toString(),
    title: task.title,
    description: task.description ?? "",
    focusMinutes: task.focusMinutes,
    completed: task.completed,
    earnedPoints: task.earnedPoints,
    createdAt: task.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to load tasks." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const userObjectId = new Types.ObjectId(session.user.id);

  const tasks = (await TaskModel.find({ userId: userObjectId })
    .sort({ createdAt: -1 })
    .lean()) as unknown as TaskLike[];

  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to create tasks." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const payload = await request.json();
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const focusMinutes = Number(payload.focusMinutes);

  if (!title) {
    return NextResponse.json(
      { message: "Task title is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(focusMinutes) || focusMinutes <= 0) {
    return NextResponse.json(
      { message: "Focus minutes must be a positive number." },
      { status: 400 }
    );
  }

  const task = await TaskModel.create({
    userId: new Types.ObjectId(session.user.id),
    title,
    description,
    focusMinutes,
  });

  return NextResponse.json(
    { task: serializeTask(task as TaskLike) },
    { status: 201 }
  );
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to update tasks." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const payload = await request.json();
  const { id } = payload ?? {};

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { message: "Task id is required." },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};

  if (typeof payload.title === "string") {
    updates.title = payload.title.trim();
  }

  if (typeof payload.description === "string") {
    updates.description = payload.description.trim();
  }

  if (payload.focusMinutes !== undefined) {
    const minutes = Number(payload.focusMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return NextResponse.json(
        { message: "Focus minutes must be a positive number." },
        { status: 400 }
      );
    }
    updates.focusMinutes = minutes;
  }

  if (payload.completed !== undefined) {
    updates.completed = Boolean(payload.completed);
  }

  const updatedTask = await TaskModel.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    updates,
    {
    new: true,
    runValidators: true,
    }
  );

  if (!updatedTask) {
    return NextResponse.json(
      { message: "Task not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ task: serializeTask(updatedTask as TaskLike) });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to delete tasks." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { message: "Task id is required." },
      { status: 400 }
    );
  }

  const task = await TaskModel.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  });

  if (!task) {
    return NextResponse.json(
      { message: "Task not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
