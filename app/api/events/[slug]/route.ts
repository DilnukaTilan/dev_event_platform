import { Event } from "@/database/event.model";
import { connectToDatabase } from "@/lib/mongodb";
import { isAdminRequest } from "@/lib/admin";
import { uploadImage } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

interface EventRouteContext {
  params: Promise<{
    slug?: string;
  }>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

function validateSlug(slug: string | undefined): string {
  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    throw new ApiError(400, "Event slug is required.");
  }

  if (!SLUG_PATTERN.test(trimmedSlug)) {
    throw new ApiError(400, "Event slug is invalid.");
  }

  return trimmedSlug;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function parseStringList(value: FormDataEntryValue | null, fieldName: string) {
  try {
    const parsed = JSON.parse(String(value));

    if (
      !Array.isArray(parsed) ||
      !parsed.every((item) => typeof item === "string" && item.trim())
    ) {
      throw new Error();
    }

    return parsed.map((item) => item.trim());
  } catch {
    throw new ApiError(400, `Invalid JSON format for ${fieldName}.`);
  }
}

function assertAdmin(req: NextRequest) {
  if (!isAdminRequest(req)) {
    throw new ApiError(403, "Administrator access is required.");
  }
}

export async function GET(_request: NextRequest, context: EventRouteContext) {
  try {
    const { slug: rawSlug } = await context.params;
    const slug = validateSlug(rawSlug);

    await connectToDatabase();

    const event = await Event.findOne({ slug }).lean();

    if (!event) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Event fetched successfully.", event },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to fetch event.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: EventRouteContext) {
  try {
    assertAdmin(req);

    const { slug: rawSlug } = await context.params;
    const slug = validateSlug(rawSlug);
    const formData = await req.formData();

    await connectToDatabase();

    const event = await Event.findOne({ slug });

    if (!event) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }

    for (const field of ALLOWED_FIELDS) {
      const value = formData.get(field);
      if (typeof value === "string") {
        event.set(field, value);
      }
    }

    const agendaValue = formData.get("agenda");
    const tagsValue = formData.get("tags");

    if (agendaValue !== null) {
      event.agenda = parseStringList(agendaValue, "agenda");
    }

    if (tagsValue !== null) {
      event.tags = parseStringList(tagsValue, "tags");
    }

    const file = formData.get("image") as File | null;

    if (file && file.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new ApiError(
          400,
          `Invalid image type "${file.type}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}.`,
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new ApiError(
          400,
          `Image exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB size limit.`,
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadImage(buffer);
      event.image = uploadResult.secure_url;
    }

    await event.save();

    return NextResponse.json(
      { message: "Event updated successfully.", event },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development"
            ? `Failed to update event: ${errorMessage}`
            : "Failed to update event.",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: EventRouteContext) {
  try {
    assertAdmin(req);

    const { slug: rawSlug } = await context.params;
    const slug = validateSlug(rawSlug);

    await connectToDatabase();

    const deletedEvent = await Event.findOneAndDelete({ slug });

    if (!deletedEvent) {
      return NextResponse.json(
        { message: "Event not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Event deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to delete event.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
