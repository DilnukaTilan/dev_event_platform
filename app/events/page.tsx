import AdminEventsManager from "@/components/AdminEventsManager";

const EventsPage = () => {
  return (
    <section id="events-admin">
      <div className="events-admin-header">
        <p className="eyebrow">Administrator workspace</p>
        <h1>Manage Events</h1>
        <p>Review every published event, edit details, replace banners, or remove events.</p>
      </div>

      <AdminEventsManager />
    </section>
  );
};

export default EventsPage;
