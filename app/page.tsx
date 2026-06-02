import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { connectToDatabase } from "@/lib/mongodb";
import { Event } from "@/database/event.model";
import { cacheLife } from "next/cache";

const Home = async () => {
  "use cache";
  cacheLife("hours");

  await connectToDatabase();
  const events = await Event.find().sort({ createdAt: -1 }).lean();

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Can&apos;t Miss!
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences All in One Place.
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.length > 0 ? (
            events.map((event) => (
              <li key={String(event._id)} className="list-none">
                <EventCard
                  title={event.title}
                  image={event.image}
                  slug={event.slug}
                  location={event.location}
                  date={event.date}
                  time={event.time}
                />
              </li>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No events found. Check back soon!
            </p>
          )}
        </ul>
      </div>
    </section>
  );
};

export default Home;
