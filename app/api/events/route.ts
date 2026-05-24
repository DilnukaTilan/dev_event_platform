import { connectToDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/database/event.model";
import mongoose from "mongoose";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type EventMode = "online" | "offline" | "hybrid";

interface EventPayload {
  title: string;
  description: string;
  overview: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  image: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getRequiredString(formData: FormData, field: string): string {
  const value = formData.get(field);

  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `Field "${field}" is required.`);
  }

  return value.trim();
}

function parseStringArray(raw: string, field: string): string[] {
  const trimmed = raw.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (
        !Array.isArray(parsed) ||
        parsed.some((item) => typeof item !== "string")
      ) {
        throw new ApiError(
          400,
          `Field "${field}" must be an array of strings.`,
        );
      }

      return parsed.map((item) => item.trim()).filter(Boolean);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(400, `Field "${field}" contains invalid JSON.`);
    }
  }

  return trimmed
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStringArray(formData: FormData, field: string): string[] {
  const values = [...formData.getAll(field), ...formData.getAll(`${field}[]`)];
  const strings = values.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  const items =
    strings.length === 1
      ? parseStringArray(strings[0], field)
      : strings.map((value) => value.trim());

  if (!items.length) {
    throw new ApiError(400, `Field "${field}" must contain at least one item.`);
  }

  return items;
}

function getEventMode(formData: FormData): EventMode {
  const mode = getRequiredString(formData, "mode").toLowerCase();

  if (mode !== "online" && mode !== "offline" && mode !== "hybrid") {
    throw new ApiError(
      400,
      'Field "mode" must be "online", "offline", or "hybrid".',
    );
  }

  return mode;
}

function getRequiredImage(formData: FormData): File {
  const file = formData.get("image");

  if (!(file instanceof File)) {
    throw new ApiError(400, "Image is required.");
  }

  if (!file.size) {
    throw new ApiError(400, "Image cannot be empty.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ApiError(400, "Image must be 5MB or smaller.");
  }

  if (!file.type.startsWith("image/")) {
    throw new ApiError(400, "Uploaded file must be an image.");
  }

  return file;
}

function buildEventPayload(formData: FormData): Omit<EventPayload, "image"> {
  return {
    title: getRequiredString(formData, "title"),
    description: getRequiredString(formData, "description"),
    overview: getRequiredString(formData, "overview"),
    venue: getRequiredString(formData, "venue"),
    location: getRequiredString(formData, "location"),
    date: getRequiredString(formData, "date"),
    time: getRequiredString(formData, "time"),
    mode: getEventMode(formData),
    audience: getRequiredString(formData, "audience"),
    agenda: getStringArray(formData, "agenda"),
    organizer: getRequiredString(formData, "organizer"),
    tags: getStringArray(formData, "tags"),
  };
}

async function uploadImage(file: File): Promise<UploadApiResponse> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "DevEvent",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload did not return a secure URL."));
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;

    try {
      formData = await req.formData();
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { message: "Invalid form data" },
        { status: 400 },
      );
    }

    const event = buildEventPayload(formData);
    const file = getRequiredImage(formData);

    await connectToDatabase();
    const uploadResult = await uploadImage(file);

    const createdEvent = await Event.create({
      ...event,
      image: uploadResult.secure_url,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);

    if (e instanceof ApiError) {
      return NextResponse.json({ message: e.message }, { status: e.status });
    }

    if (e instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { message: "Event validation failed", error: e.message },
        { status: 400 },
      );
    }

    if (isDuplicateKeyError(e)) {
      return NextResponse.json(
        { message: "An event with this title already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Event creation failed",
        error: errorMessage(e),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch events", error: errorMessage(e) },
      { status: 500 },
    );
  }
}
