import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TaskModel } from "@/models/task";

/**
 * One-time migration endpoint to update existing tasks with new fields:
 * - scheduledDate: set from createdAt date
 * - focusMinutesGoal: copied from focusMinutes if not already set
 *
 * Call this once via: GET /api/migrate
 * Protected: requires authenticated admin user
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be signed in to run migrations." },
      { status: 401 }
    );
  }

  await connectToDatabase();

  // Find all tasks that need migration (missing scheduledDate)
  const tasksToMigrate = await TaskModel.find({
    $or: [
      { scheduledDate: { $exists: false } },
      { scheduledDate: null },
    ],
  });

  let migratedCount = 0;
  const errors: string[] = [];

  for (const task of tasksToMigrate) {
    try {
      // Set scheduledDate from createdAt (YYYY-MM-DD format)
      const createdAt = task.createdAt as Date | undefined;
      const scheduledDate = createdAt
        ? createdAt.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      // Copy focusMinutes to focusMinutesGoal if not already set
      const focusMinutes = task.focusMinutes as number | undefined;
      const existingGoal = task.focusMinutesGoal as number | undefined | null;
      const focusMinutesGoal =
        existingGoal !== undefined && existingGoal !== null
          ? existingGoal
          : focusMinutes ?? null;

      await TaskModel.updateOne(
        { _id: task._id },
        {
          $set: {
            scheduledDate,
            focusMinutesGoal,
          },
        }
      );

      migratedCount++;
    } catch (err) {
      const taskId = task._id?.toString() ?? "unknown";
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      errors.push(`Task ${taskId}: ${errorMessage}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Migration complete. Migrated ${migratedCount} tasks.`,
    totalFound: tasksToMigrate.length,
    migratedCount,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * POST version for explicit migration trigger
 */
export async function POST() {
  return GET();
}
