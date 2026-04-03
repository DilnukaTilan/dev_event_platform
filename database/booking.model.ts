import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

bookingSchema.pre("save", async function () {
  if (!EMAIL_RE.test(this.email)) {
    throw new Error(`"${this.email}" is not a valid email address.`);
  }
  if (this.isModified("eventId")) {
    const exists = await mongoose.models.Event?.exists({ _id: this.eventId });
    if (!exists) {
      throw new Error(`No Event found with id "${this.eventId.toString()}".`);
    }
  }
});

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ??
  mongoose.model<IBooking>("Booking", bookingSchema);
