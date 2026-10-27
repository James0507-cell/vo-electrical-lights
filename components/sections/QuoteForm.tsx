"use client";

import { useMemo, useRef, useState } from "react";
import { site } from "@/content/site";

type Fields = {
  name: string;
  contact: string;
  projectType: string;
  location: string;
  message: string;
  company_website?: string; // honeypot
};

const projectTypes = [
  "Residential solar",
  "Commercial or industrial solar",
  "Farm or agricultural solar",
  "Solar-powered irrigation",
  "Solar street lighting",
  "Electrical supplies or works",
  "Government or institutional project",
  "Something else",
];

const initialFields: Fields = {
  name: "",
  contact: "",
  projectType: "",
  location: "",
  message: "",
  company_website: "",
};

type Status = "idle" | "ready" | "sending" | "sent" | "error";

export default function QuoteForm() {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const endpoint = process.env.NEXT_PUBLIC_QUOTE_ENDPOINT;

  const update = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (status === "ready") setStatus("idle");
  };

  const preparedMessage = useMemo(() => {
    const lines = [
      "Hello V.O Electrical Lights Trading,",
      "",
      "I would like to ask about a solar / electrical project.",
      "",
      `Name: ${fields.name.trim()}`,
      `Contact: ${fields.contact.trim()}`,
      fields.projectType ? `Project type: ${fields.projectType}` : null,
      fields.location.trim() ? `Location: ${fields.location.trim()}` : null,
      "",
      fields.message.trim(),
      "",
      `Sent from the V.O Electrical Lights Trading website`,
    ];
    return lines.filter((line) => line !== null).join("\n");
  }, [fields]);

  const mailtoHref = `mailto:${site.email}?subject=${encodeURIComponent(
    fields.projectType ? `Project inquiry — ${fields.projectType}` : "Project inquiry"
  )}&body=${encodeURIComponent(preparedMessage)}`;

  const validate = () => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (fields.name.trim().length < 2) next.name = "Please tell us your name.";
    const contact = fields.contact.trim();
    if (!contact) {
      next.contact = "Add a phone number or email so we can reply.";
    } else if (contact.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact)) next.contact = "That email address looks incomplete.";
    } else if (contact.replace(/\D/g, "").length < 7) {
      next.contact = "That phone number looks too short.";
    }
    if (fields.message.trim().length < 10) next.message = "Tell us a little about what you want to power (10+ characters).";
    if (fields.company_website) next.message = "Something went wrong. Please try again.";
    setErrors(next);
    return next;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validate();
    const firstError = Object.keys(next)[0];
    if (firstError) {
      document.getElementById(`quote-${firstError}`)?.focus();
      return;
    }
    if (endpoint) {
      setStatus("sending");
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...fields, message: preparedMessage, source: "website" }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setStatus("sent");
      } catch {
        setStatus("error");
      }
    } else {
      setStatus("ready");
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(preparedMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  const reset = () => {
    setStatus("idle");
    setCopied(false);
  };

  return (
    <div className="quote">
      {!endpoint ? (
        <p className="quote__notice" role="note">
          <span className="mono">How this works</span>
          This form prepares an email for you — nothing is sent automatically. You send it from
          your own email app, or call us directly.
        </p>
      ) : null}

      <form ref={formRef} className="quote__form" onSubmit={onSubmit} noValidate>
        <div className="quote__row">
          <div className="field">
            <label htmlFor="quote-name">Your name</label>
            <input
              id="quote-name"
              name="name"
              autoComplete="name"
              value={fields.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "quote-name-error" : undefined}
              placeholder="Juan dela Cruz"
            />
            {errors.name ? <p className="field__error" id="quote-name-error">{errors.name}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="quote-contact">Phone or email</label>
            <input
              id="quote-contact"
              name="contact"
              autoComplete="tel"
              value={fields.contact}
              onChange={(e) => update("contact", e.target.value)}
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? "quote-contact-error" : undefined}
              placeholder="09xx xxx xxxx"
            />
            {errors.contact ? <p className="field__error" id="quote-contact-error">{errors.contact}</p> : null}
          </div>
        </div>

        <div className="quote__row">
          <div className="field">
            <label htmlFor="quote-type">Project type</label>
            <select
              id="quote-type"
              name="projectType"
              value={fields.projectType}
              onChange={(e) => update("projectType", e.target.value)}
            >
              <option value="">Select one</option>
              {projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="quote-location">Site location</label>
            <input
              id="quote-location"
              name="location"
              autoComplete="address-level2"
              value={fields.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="City / municipality"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="quote-message">What do you want to power?</label>
          <textarea
            id="quote-message"
            name="message"
            rows={4}
            value={fields.message}
            onChange={(e) => update("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "quote-message-error" : undefined}
            placeholder="A house, a farm pump, a shop, street lights — tell us the basics."
          />
          {errors.message ? <p className="field__error" id="quote-message-error">{errors.message}</p> : null}
        </div>

        <div className="field field--trap" aria-hidden="true">
          <label htmlFor="quote-company">Company website</label>
          <input
            id="quote-company"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            value={fields.company_website}
            onChange={(e) => update("company_website", e.target.value)}
          />
        </div>

        <div className="quote__actions">
          <button type="submit" className="btn btn--yellow" disabled={status === "sending"}>
            <span>{status === "sending" ? "Sending…" : endpoint ? "Send inquiry" : "Prepare my message"}</span>
            <span className="arr" aria-hidden="true">↗</span>
          </button>
          <p className="quote__direct">
            or call <a href={`tel:${site.telephoneHref}`}>{site.telephoneDisplay}</a>
          </p>
        </div>
      </form>

      <div className="quote__status" aria-live="polite">
        {status === "sent" ? (
          <div className="quote__panel quote__panel--ok">
            <p className="mono">Sent</p>
            <h3>Thank you — your inquiry is in.</h3>
            <p>We will get back to you using the contact details you left. For anything urgent, call {site.telephoneDisplay}.</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="quote__panel quote__panel--error">
            <p className="mono">Not sent</p>
            <h3>We could not send that automatically.</h3>
            <p>Please call <a href={`tel:${site.telephoneHref}`}>{site.telephoneDisplay}</a> or email <a href={`mailto:${site.email}`}>{site.email}</a>. Nothing was submitted.</p>
            <button type="button" className="u-link" onClick={reset}>Back to the form</button>
          </div>
        ) : null}

        {status === "ready" ? (
          <div className="quote__panel">
            <p className="mono">Ready to send</p>
            <h3>Your message is ready.</h3>
            <p>Nothing has been sent yet. Open it in your email app and press send — or copy it into Messenger.</p>
            <pre className="quote__preview">{preparedMessage}</pre>
            <div className="quote__panel-actions">
              <a className="btn btn--sun" href={mailtoHref}>
                <span>Open email app</span>
                <span className="arr" aria-hidden="true">↗</span>
              </a>
              <button type="button" className="btn btn--ink" onClick={copyMessage}>
                <span>{copied ? "Copied" : "Copy message"}</span>
              </button>
              <a className="u-link" href={site.facebook} target="_blank" rel="noreferrer">
                Message on Facebook <span className="arr" aria-hidden="true">↗</span>
              </a>
              <button type="button" className="u-link" onClick={reset}>Edit details</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
