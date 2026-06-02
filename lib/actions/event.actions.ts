"use server";

import Event from "@/database/event.model";
import connectToDatabase from "@/lib/mongodb";

export const getSimilarEventsBySlug = async (slug: string) => {
  if (!slug || typeof slug !== "string") return [];

  try {
    await connectToDatabase();
    const event = await Event.findOne({ slug });
    if (!event) return [];

    const events = await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags },
    })
      .limit(3)
      .lean();

    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    console.error("Failed to fetch similar events:", error);
    return [];
  }
};
