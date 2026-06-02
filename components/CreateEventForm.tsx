"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from "react";
import {
  Calendar,
  Clock,
  LoaderCircle,
  MapPin,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";

type Mode = "online" | "offline" | "hybrid";

const initialFields = {
  title: "",
  description: "",
  overview: "",
  venue: "",
  location: "",
  date: "",
  time: "",
  audience: "",
  organizer: "",
  agenda: "",
  tags: "",
};

type ScrollIndicators = {
  top: boolean;
  bottom: boolean;
};

function scrollIndicatorClass(baseClass: string, indicators: ScrollIndicators) {
  return [
    baseClass,
    "scroll-indicator",
    indicators.top ? "has-scroll-top" : "",
    indicators.bottom ? "has-scroll-bottom" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function useScrollIndicators<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);
  const [indicators, setIndicators] = useState<ScrollIndicators>({
    top: false,
    bottom: false,
  });

  const updateIndicators = useCallback(() => {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    const maxScrollTop = node.scrollHeight - node.clientHeight;
    const nextIndicators = {
      top: node.scrollTop > 2,
      bottom: maxScrollTop - node.scrollTop > 2,
    };

    setIndicators((current) =>
      current.top === nextIndicators.top &&
      current.bottom === nextIndicators.bottom
        ? current
        : nextIndicators,
    );
  }, []);

  useEffect(() => {
    updateIndicators();

    const node = scrollRef.current;

    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateIndicators);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  });

  return { indicators, scrollRef, updateIndicators };
}

function ScrollHintTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { indicators, scrollRef, updateIndicators } =
    useScrollIndicators<HTMLTextAreaElement>();
  const { onScroll, ...textareaProps } = props;

  return (
    <div className={scrollIndicatorClass("textarea-scroll-wrap", indicators)}>
      <textarea
        ref={scrollRef}
        onScroll={(event) => {
          updateIndicators();
          onScroll?.(event);
        }}
        {...textareaProps}
      />
    </div>
  );
}

function splitAgenda(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const CreateEventForm = () => {
  const router = useRouter();
  const [fields, setFields] = useState(initialFields);
  const [mode, setMode] = useState<Mode>("offline");
  const [adminKey, setAdminKey] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agendaItems = useMemo(
    () => splitAgenda(fields.agenda),
    [fields.agenda],
  );
  const tagItems = useMemo(() => splitTags(fields.tags), [fields.tags]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const updateField =
    (name: keyof typeof initialFields) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((current) => ({ ...current, [name]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!image) {
      setMessage("Add a banner image before publishing.");
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
    formData.append("mode", mode);
    formData.append("agenda", JSON.stringify(agendaItems));
    formData.append("tags", JSON.stringify(tagItems));
    formData.append("image", image);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "x-admin-token": adminKey,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create event.");
      }

      setMessage("Event created successfully.");
      router.push(`/events/${result.event.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create event.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="create-event-form" onSubmit={handleSubmit}>
      <section className="form-grid">
        <div className="form-main">
          <div className="field-group">
            <label htmlFor="title">Event title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={fields.title}
              onChange={updateField("title")}
              placeholder="React Summit Colombo"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="description">Short description</label>
            <ScrollHintTextarea
              id="description"
              name="description"
              rows={3}
              value={fields.description}
              onChange={updateField("description")}
              placeholder="A practical evening for frontend engineers and product builders."
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="overview">Overview</label>
            <ScrollHintTextarea
              id="overview"
              name="overview"
              rows={6}
              value={fields.overview}
              onChange={updateField("overview")}
              placeholder="Cover the event goals, format, speakers, and what attendees will leave with."
              required
            />
          </div>

          <div className="two-column">
            <div className="field-group">
              <label htmlFor="date">
                <Calendar size={16} aria-hidden="true" />
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={fields.date}
                onChange={updateField("date")}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="time">
                <Clock size={16} aria-hidden="true" />
                Time
              </label>
              <input
                id="time"
                name="time"
                type="time"
                value={fields.time}
                onChange={updateField("time")}
                required
              />
            </div>
          </div>

          <div className="two-column">
            <div className="field-group">
              <label htmlFor="venue">Venue</label>
              <input
                id="venue"
                name="venue"
                type="text"
                value={fields.venue}
                onChange={updateField("venue")}
                placeholder="Main Hall"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="location">
                <MapPin size={16} aria-hidden="true" />
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={fields.location}
                onChange={updateField("location")}
                placeholder="Colombo, Sri Lanka"
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
              {(["offline", "online", "hybrid"] as const).map((item) => (
                <label className="mode-option" key={item}>
                  <input
                    type="radio"
                    name="mode"
                    value={item}
                    checked={mode === item}
                    onChange={() => setMode(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="two-column">
            <div className="field-group">
              <label htmlFor="audience">Audience</label>
              <input
                id="audience"
                name="audience"
                type="text"
                value={fields.audience}
                onChange={updateField("audience")}
                placeholder="Frontend engineers"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="organizer">Organizer</label>
              <input
                id="organizer"
                name="organizer"
                type="text"
                value={fields.organizer}
                onChange={updateField("organizer")}
                placeholder="DevEvent Labs"
                required
              />
            </div>
          </div>

          <div className="two-column list-fields">
            <div className="field-group">
              <label htmlFor="agenda">Agenda</label>
              <ScrollHintTextarea
                id="agenda"
                name="agenda"
                rows={5}
                value={fields.agenda}
                onChange={updateField("agenda")}
                placeholder={"Opening keynote\nLive workshop\nPanel Q&A"}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="tags">Tags</label>
              <ScrollHintTextarea
                id="tags"
                name="tags"
                rows={5}
                value={fields.tags}
                onChange={updateField("tags")}
                placeholder="React, TypeScript, Community"
                required
              />
            </div>
          </div>
        </div>

        <aside className="form-side">
          <div className="image-field">
            <label htmlFor="image">
              <Upload size={16} aria-hidden="true" />
              Banner image
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              required
            />
            <div className="image-preview">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Selected event banner"
                  width={420}
                  height={260}
                  className="preview-image"
                  unoptimized
                />
              ) : (
                <Upload size={28} aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="admin-panel">
            <label htmlFor="admin-key">
              <ShieldCheck size={16} aria-hidden="true" />
              Admin access key
            </label>
            <input
              id="admin-key"
              name="adminKey"
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Required"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="summary-panel">
            <p>{agendaItems.length} agenda items</p>
            <p>{tagItems.length} tags</p>
          </div>

          {message && <p className="form-message">{message}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle
                className="animate-spin"
                size={18}
                aria-hidden="true"
              />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
            {isSubmitting ? "Publishing" : "Publish event"}
          </button>
        </aside>
      </section>
    </form>
  );
};

export default CreateEventForm;
