import CreateEventForm from "@/components/CreateEventForm";

const CreateEventPage = () => {
  return (
    <section id="create-event">
      <div className="create-header">
        <p className="eyebrow">Administrator workspace</p>
        <h1>Create Event</h1>
        <p>
          Publish a new developer event with a banner, schedule, audience, and
          agenda.
        </p>
      </div>

      <CreateEventForm />
    </section>
  );
};

export default CreateEventPage;
