import { Event } from "@/database/event.model";
import { connectToDatabase } from "@/lib/mongodb";
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
