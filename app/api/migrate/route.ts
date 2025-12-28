import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { TaskModel } from "@/models/task";

/**
 * One-time migration endpoint to update existing tasks with new fields:
 * - scheduledDate: set from createdAt date (or "someday" if too old)
 * - focusMinutesGoal: copied from focusMinutes if not already set
 *
 * Call this once via: GET /api/migrate
 * Protected: requires authenticated user
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
    userId: session.user.id,
    $or: [
      { scheduledDate: { $exists: false } },
      { scheduledDate: null },
    ],
  });

  let migratedToWeek = 0;
  let migratedToSomeday = 0;
  const errors: string[] = [];

  // Determine scheduling logic:
  // - Tasks created in the last 14 days: schedule on their createdAt date
  // - Older tasks or tasks without createdAt: move to "someday"
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  for (const task of tasksToMigrate) {
    try {
      const createdAt = task.createdAt as Date | undefined;
      let scheduledDate: string;

      if (createdAt && createdAt >= twoWeeksAgo) {
        // Recent task: schedule on creation date
        scheduledDate = createdAt.toISOString().slice(0, 10);
        migratedToWeek++;
      } else {
        // Old or undated task: move to someday
        scheduledDate = "someday";
        migratedToSomeday++;
      }

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
    } catch (err) {
      const taskId = task._id?.toString() ?? "unknown";
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      errors.push(`Task ${taskId}: ${errorMessage}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Migration complete. Migrated ${migratedToWeek} tasks to weekly grid, ${migratedToSomeday} to Someday.`,
    totalFound: tasksToMigrate.length,
    migratedToWeek,
    migratedToSomeday,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * POST version for explicit migration trigger
 */
export async function POST() {
  return GET();
}
