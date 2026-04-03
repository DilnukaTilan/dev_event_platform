import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: "online" | "offline" | "hybrid";
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-");
}

function normaliseDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date value: "${raw}"`);
  }
  return d.toISOString().slice(0, 10);
}

function normaliseTime(raw: string): string {
  const trimmed = raw.trim();

  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const mins = parseInt(h24[2], 10);
    if (hours > 23 || mins > 59)
      throw new Error(`Invalid time value: "${raw}"`);
    return `${String(hours).padStart(2, "0")}:${h24[2]}`;
  }

  const h12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (h12) {
    let hours = parseInt(h12[1], 10);
    const mins = parseInt(h12[2], 10);
    const period = h12[3].toUpperCase();
    if (hours === 12) hours = period === "AM" ? 0 : 12;
    else if (period === "PM") hours += 12;
    if (hours > 23 || mins > 59)
      throw new Error(`Invalid time value: "${raw}"`);
    return `${String(hours).padStart(2, "0")}:${h12[2]}`;
  }

  throw new Error(`Unrecognised time format: "${raw}"`);
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: {
      type: String,
      required: true,
      enum: ["online", "offline", "hybrid"],
    },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true },
  },
  { timestamps: true },
);

eventSchema.pre("save", async function () {
  const requiredStrings: (keyof IEvent)[] = [
    "title",
    "description",
    "overview",
    "image",
    "venue",
    "location",
    "date",
    "time",
    "mode",
    "audience",
    "organizer",
  ];
  for (const field of requiredStrings) {
    if (!(this[field] as string)?.trim()) {
      throw new Error(`Field "${field}" must be a non-empty string.`);
    }
  }

  if (!this.agenda?.length)
    throw new Error("agenda must contain at least one item.");
  if (!this.tags?.length)
    throw new Error("tags must contain at least one item.");

  if (this.isModified("title")) {
    this.slug = generateSlug(this.title);
  }
  if (this.isModified("date")) this.date = normaliseDate(this.date);
  if (this.isModified("time")) this.time = normaliseTime(this.time);
});

export const Event: Model<IEvent> =
  (mongoose.models.Event as Model<IEvent>) ??
  mongoose.model<IEvent>("Event", eventSchema);
