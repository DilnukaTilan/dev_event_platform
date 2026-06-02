"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  LoaderCircle,
  MapPin,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type Mode = "online" | "offline" | "hybrid";

type EventRecord = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: Mode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
};

type EventFields = Omit<
  EventRecord,
  "_id" | "slug" | "image" | "agenda" | "tags"
> & {
  agenda: string;
  tags: string;
};

const emptyFields: EventFields = {
  title: "",
  description: "",
  overview: "",
  venue: "",
  location: "",
  date: "",
  time: "",
  mode: "offline",
  audience: "",
  organizer: "",
  agenda: "",
  tags: "",
};

function splitList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldsFromEvent(event: EventRecord): EventFields {
  return {
    title: event.title,
    description: event.description,
    overview: event.overview,
    venue: event.venue,
    location: event.location,
    date: event.date,
    time: event.time,
    mode: event.mode,
    audience: event.audience,
    organizer: event.organizer,
    agenda: event.agenda.join("\n"),
    tags: event.tags.join(", "),
  };
}

const AdminEventsManager = () => {
  const [adminKey, setAdminKey] = useState("");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [fields, setFields] = useState<EventFields>(emptyFields);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.slug === selectedSlug),
    [events, selectedSlug],
  );
  const agendaItems = useMemo(() => splitList(fields.agenda), [fields.agenda]);
  const tagItems = useMemo(() => splitList(fields.tags), [fields.tags]);

  const updateField =
    (name: keyof EventFields) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((current) => ({ ...current, [name]: event.target.value }));
    };

  const selectEvent = (event: EventRecord) => {
    setSelectedSlug(event.slug);
    setFields(fieldsFromEvent(event));
    setImage(null);
    setMessage("");
  };

  const loadEvents = async () => {
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/events?limit=100", {
        headers: { "x-admin-token": adminKey },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load events.");
      }

      setEvents(result.events);

      if (result.events.length > 0) {
        selectEvent(result.events[0]);
      } else {
        setSelectedSlug("");
        setFields(emptyFields);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load events.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEvent) {
      return;
    }

    if (!agendaItems.length || !tagItems.length) {
      setMessage("Add at least one agenda item and one tag.");
      return;
    }

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (key !== "agenda" && key !== "tags") {
        formData.append(key, value);
      }
    });
    formData.append("agenda", JSON.stringify(agendaItems));
    formData.append("tags", JSON.stringify(tagItems));

    if (image) {
      formData.append("image", image);
    }

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${selectedEvent.slug}`, {
        method: "PATCH",
        headers: { "x-admin-token": adminKey },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update event.");
      }

      const updatedEvent = result.event as EventRecord;

      setEvents((current) =>
        current.map((item) =>
          item._id === updatedEvent._id ? updatedEvent : item,
        ),
      );
      setSelectedSlug(updatedEvent.slug);
      setFields(fieldsFromEvent(updatedEvent));
      setImage(null);
      setMessage("Event updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to update event.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedEvent.title}" permanently?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/events/${selectedEvent.slug}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminKey },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete event.");
      }

      const remainingEvents = events.filter(
        (event) => event.slug !== selectedEvent.slug,
      );

      setEvents(remainingEvents);
      setMessage("Event deleted successfully.");

      if (remainingEvents.length > 0) {
        selectEvent(remainingEvents[0]);
      } else {
        setSelectedSlug("");
        setFields(emptyFields);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete event.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="events-admin-manager">
      <section className="admin-access">
        <div>
          <label htmlFor="events-admin-key">
            <ShieldCheck size={16} aria-hidden="true" />
            Admin access key
          </label>
          <input
            id="events-admin-key"
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Required"
            autoComplete="current-password"
          />
        </div>
        <button
          type="button"
          onClick={loadEvents}
          disabled={!adminKey || isLoading}
        >
          {isLoading ? (
            <LoaderCircle
              className="animate-spin"
              size={18}
              aria-hidden="true"
            />
          ) : (
            <RefreshCw size={18} aria-hidden="true" />
          )}
          {isLoading ? "Loading" : "Load events"}
        </button>
      </section>

      {message && <p className="admin-message">{message}</p>}

      <section className="events-workspace">
        <div className="events-list">
          <div className="list-heading">
            <h2>All Events</h2>
            <span>{events.length}</span>
          </div>

          {events.length > 0 ? (
            <ul>
              {events.map((event) => (
                <li key={event._id}>
                  <button
                    type="button"
                    className={event.slug === selectedSlug ? "active" : ""}
                    onClick={() => selectEvent(event)}
                  >
                    <Image
                      src={event.image}
                      alt=""
                      width={72}
                      height={52}
                      className="event-thumb"
                    />
                    <span>
                      <strong>{event.title}</strong>
                      <small>{event.date}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Enter the admin key to load events.</p>
          )}
        </div>

        <form className="event-editor" onSubmit={saveEvent}>
          {selectedEvent ? (
            <>
              <div className="editor-toolbar">
                <div>
                  <p className="eyebrow">Editing</p>
                  <h2>{selectedEvent.title}</h2>
                </div>
                <Link href={`/events/${selectedEvent.slug}`}>View</Link>
              </div>

              <div className="editor-layout">
                <div className="editor-fields">
                  <div className="field-group">
                    <label htmlFor="edit-title">Event title</label>
                    <input
                      id="edit-title"
                      type="text"
                      value={fields.title}
                      onChange={updateField("title")}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="edit-description">Short description</label>
                    <textarea
                      id="edit-description"
                      rows={3}
                      value={fields.description}
                      onChange={updateField("description")}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="edit-overview">Overview</label>
                    <textarea
                      id="edit-overview"
                      rows={5}
                      value={fields.overview}
                      onChange={updateField("overview")}
                      required
                    />
                  </div>

                  <div className="two-column">
                    <div className="field-group">
                      <label htmlFor="edit-date">
                        <Calendar size={16} aria-hidden="true" />
                        Date
                      </label>
                      <input
                        id="edit-date"
                        type="date"
                        value={fields.date}
                        onChange={updateField("date")}
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="edit-time">
                        <Clock size={16} aria-hidden="true" />
                        Time
                      </label>
                      <input
                        id="edit-time"
                        type="time"
                        value={fields.time}
                        onChange={updateField("time")}
                        required
                      />
                    </div>
                  </div>

                  <div className="two-column">
                    <div className="field-group">
                      <label htmlFor="edit-venue">Venue</label>
                      <input
                        id="edit-venue"
                        type="text"
                        value={fields.venue}
                        onChange={updateField("venue")}
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="edit-location">
                        <MapPin size={16} aria-hidden="true" />
                        Location
                      </label>
                      <input
                        id="edit-location"
                        type="text"
                        value={fields.location}
                        onChange={updateField("location")}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Mode</label>
                    <div
                      className="mode-options"
                      role="radiogroup"
                      aria-label="Event mode"
                    >
                      {(["offline", "online", "hybrid"] as const).map(
                        (mode) => (
                          <label className="mode-option" key={mode}>
                            <input
                              type="radio"
                              name="mode"
                              value={mode}
                              checked={fields.mode === mode}
                              onChange={() =>
                                setFields((current) => ({ ...current, mode }))
                              }
                            />
                            <span>{mode}</span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="two-column">
                    <div className="field-group">
                      <label htmlFor="edit-audience">Audience</label>
                      <input
                        id="edit-audience"
                        type="text"
                        value={fields.audience}
                        onChange={updateField("audience")}
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="edit-organizer">Organizer</label>
                      <input
                        id="edit-organizer"
                        type="text"
                        value={fields.organizer}
                        onChange={updateField("organizer")}
                        required
                      />
                    </div>
                  </div>

                  <div className="two-column">
                    <div className="field-group">
                      <label htmlFor="edit-agenda">Agenda</label>
                      <textarea
                        id="edit-agenda"
                        rows={5}
                        value={fields.agenda}
                        onChange={updateField("agenda")}
                        required
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="edit-tags">Tags</label>
                      <textarea
                        id="edit-tags"
                        rows={5}
                        value={fields.tags}
                        onChange={updateField("tags")}
                        required
                      />
                    </div>
                  </div>
                </div>

                <aside className="editor-side">
                  <Image
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    width={360}
                    height={240}
                    className="editor-image"
                  />
                  <div className="field-group">
                    <label htmlFor="edit-image">
                      <Pencil size={16} aria-hidden="true" />
                      Replace banner
                    </label>
                    <input
                      id="edit-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) =>
                        setImage(event.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <div className="summary-panel">
                    <p>{agendaItems.length} agenda items</p>
                    <p>{tagItems.length} tags</p>
                  </div>
                  <button type="submit" disabled={isSaving || isDeleting}>
                    {isSaving ? (
                      <LoaderCircle
                        className="animate-spin"
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <Save size={18} aria-hidden="true" />
                    )}
                    {isSaving ? "Saving" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={deleteEvent}
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? (
                      <LoaderCircle
                        className="animate-spin"
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 size={18} aria-hidden="true" />
                    )}
                    {isDeleting ? "Deleting" : "Delete event"}
                  </button>
                </aside>
              </div>
            </>
          ) : (
            <div className="editor-empty">
              <h2>No Event Selected</h2>
              <p>
                Load events with an administrator key, then choose one to edit.
              </p>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

export default AdminEventsManager;
