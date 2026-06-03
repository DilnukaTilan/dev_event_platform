import { notFound } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import BookEvent from "@/components/BookEvent";
import {
  getEventBySlug,
  getSimilarEventsBySlug,
} from "@/lib/actions/event.actions";
import { getBookingCount } from "@/lib/actions/booking.actions";
import { IEvent } from "@/database/event.model";
import EventCard from "@/components/EventCard";

const RenderEventDetails = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <div className="agenda-timeline">
      {agendaItems.map((item, index) => (
        <div className="agenda-item" key={item}>
          <div className="agenda-indicator">
            <span className="agenda-step">{index + 1}</span>
            {index < agendaItems.length - 1 && <div className="agenda-line" />}
          </div>
          <div className="agenda-card">
            <p>{item}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
);

const EventDetailsContent = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return notFound();
  }

  const {
    description,
    image,
    overview,
    date,
    time,
    location,
    mode,
    agenda,
    audience,
    organizer,
    tags,
    _id: eventId,
  } = event;

  if (!description) {
    return notFound();
  }

  const bookings = await getBookingCount(eventId);

  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>

      <div className="details">
        <div className="content">
          <Image
            src={image}
            alt="Event Banner"
            width={800}
            height={800}
            className="banner"
            unoptimized
          />

          <section className="flex-col-gap-2">
            <h2>Event Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>
            <RenderEventDetails
              icon="/icons/calendar.svg"
              alt="calendar"
              label={date}
            />
            <RenderEventDetails
              icon="/icons/clock.svg"
              alt="clock"
              label={time}
            />
            <RenderEventDetails
              icon="/icons/pin.svg"
              alt="pin"
              label={location}
            />
            <RenderEventDetails
              icon="/icons/mode.svg"
              alt="mode"
              label={mode}
            />
            <RenderEventDetails
              icon="/icons/audience.svg"
              alt="audience"
              label={audience}
            />
          </section>

          <EventAgenda agendaItems={agenda} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags} />
        </div>

        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot!
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot!</p>
            )}

            <BookEvent eventId={eventId} />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 &&
            similarEvents.map((similarEvent: IEvent) => (
              <EventCard key={similarEvent.title} {...similarEvent} />
            ))}
        </div>
      </div>
    </section>
  );
};

const EventDetailsPage = ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  return (
    <Suspense
      fallback={
        <section id="event">
          <div className="header">
            <h1>Event Description</h1>
            <p>Loading event details...</p>
          </div>
        </section>
      }
    >
      <EventDetailsContent params={params} />
    </Suspense>
  );
};

export default EventDetailsPage;
