import { Schema, model, models, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const UserModel = models.User || model("User", UserSchema);
