"use server";

import { Booking } from "@/database/booking.model";
import connectDB from "@/lib/mongodb";

export const createBooking = async ({
  eventId,
  email,
}: {
  eventId: string;
  email: string;
}) => {
  try {
    await connectDB();

    await Booking.create({ eventId, email });

    return { success: true };
  } catch (e: unknown) {
    console.error("Create booking failed!", e);

    if (e != null && typeof e === "object" && "code" in e && e.code === 11000) {
      return { success: false, error: "You have already booked this event." };
    }

    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
};

export const getBookingCount = async (eventId: string): Promise<number> => {
  try {
    await connectDB();
    return await Booking.countDocuments({ eventId });
  } catch (e: unknown) {
    console.error("Get booking count failed!", e);
    return 0;
  }
};
