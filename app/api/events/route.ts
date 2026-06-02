import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { uploadImage } from "@/lib/cloudinary";
import Event from "@/database/event.model";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_FIELDS = [
  "title",
  "description",
  "overview",
  "venue",
  "location",
  "date",
  "time",
  "mode",
  "audience",
  "organizer",
] as const;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Invalid image type "${file.type}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `Image exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB size limit`,
        },
        { status: 400 },
      );
    }

    let tags: string[];
    let agenda: string[];
    try {
      tags = JSON.parse(formData.get("tags") as string);
      agenda = JSON.parse(formData.get("agenda") as string);
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON format for tags or agenda" },
        { status: 400 },
      );
    }

    const eventData: Record<string, string> = {};
    for (const field of ALLOWED_FIELDS) {
      const value = formData.get(field);
      if (typeof value === "string") {
        eventData[field] = value;
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadImage(buffer);

    const createdEvent = await Event.create({
      ...eventData,
      image: uploadResult.secure_url,
      tags,
      agenda,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;

    const page = Math.max(
      DEFAULT_PAGE,
      Number(searchParams.get("page")) || DEFAULT_PAGE,
    );
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(),
    ]);

    return NextResponse.json(
      {
        message: "Events fetched successfully",
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Failed to fetch events",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
