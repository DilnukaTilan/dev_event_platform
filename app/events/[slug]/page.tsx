import { notFound } from "next/navigation";
import Image from "next/image";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

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

const EventDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const response = await fetch(`${BASE_URL}/api/events/${slug}`);
  const {
    event: {
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
    },
  } = await response.json();

  if (!description) {
    return notFound();
  }

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
          <p className="text-lg font-semibold">Book your spot</p>
        </aside>
      </div>
    </section>
  );
};

export default EventDetailsPage;
