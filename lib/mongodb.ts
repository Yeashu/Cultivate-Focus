import mongoose from "mongoose";

const globalForMongoose = globalThis as unknown as {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

globalForMongoose.mongoose = globalForMongoose.mongoose || {
  conn: null,
  promise: null,
};

export async function connectToDatabase() {
  if (globalForMongoose.mongoose.conn) {
    return globalForMongoose.mongoose.conn;
  }

  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!globalForMongoose.mongoose.promise) {
    globalForMongoose.mongoose.promise = mongoose
      .connect(connectionString, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  globalForMongoose.mongoose.conn = await globalForMongoose.mongoose.promise;

  return globalForMongoose.mongoose.conn;
}
