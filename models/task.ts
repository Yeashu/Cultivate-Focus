import { Schema, model, models, type InferSchemaType } from "mongoose";

const TaskSchema = new Schema(
  {
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
    focusMinutes: {
      type: Number,
      required: true,
      min: 1,
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
  },
  {
    timestamps: true,
  }
);

export type TaskDocument = InferSchemaType<typeof TaskSchema>;

export const TaskModel = models.Task || model("Task", TaskSchema);
