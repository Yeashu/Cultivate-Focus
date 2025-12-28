import { Schema, model, models, type InferSchemaType } from "mongoose";

const SessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional: sessions can be logged without a task ("quick timer" mode)
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: false,
      default: null,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export type SessionDocument = InferSchemaType<typeof SessionSchema>;

export const SessionModel = models.Session || model("Session", SessionSchema);
