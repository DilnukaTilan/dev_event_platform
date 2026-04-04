import mongoose, { Connection } from "mongoose";

interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

global.mongoose = cached;

export async function connectToDatabase(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable in .env.local",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((m) => m.connection);
  }

  cached.conn = await cached.promise;

  return cached.conn;
}
