import { Schema, model, models, type InferSchemaType } from "mongoose";

const SessionSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
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
