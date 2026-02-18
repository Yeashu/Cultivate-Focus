import { Schema, model, models, type InferSchemaType } from "mongoose";

const TaskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
    // Legacy field kept for backward compatibility during migration
    focusMinutes: {
      type: Number,
      required: false,
      min: 1,
    },
    // New optional field: focus goal in minutes (null means no goal)
    focusMinutesGoal: {
      type: Number,
      required: false,
      default: null,
      min: 1,
    },
    // Scheduled date for Tweek-style weekly view (YYYY-MM-DD)
    scheduledDate: {
      type: String,
      required: false,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    earnedPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: Number,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export type TaskDocument = InferSchemaType<typeof TaskSchema>;

export const TaskModel = models.Task || model("Task", TaskSchema);
