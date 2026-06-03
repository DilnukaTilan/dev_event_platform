"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/actions/booking.actions";

const BookEvent = ({ eventId }: { eventId: string }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { success, error } = await createBooking({
        eventId,
        email: trimmed,
      });

      if (success) {
        setSubmitted(true);
        router.refresh();
      } else {
        setError(error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="book-event">
      {submitted ? (
        <p className="text-sm">Thank you for signing up!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Enter your email to book your spot:</label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              className="button-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Booking..." : "Book Your Spot"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookEvent;
