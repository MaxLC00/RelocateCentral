import { useState } from "react";
import { submitContact } from "../api.js";

const EMPTY = {
  name: "",
  contactInfo: "",
  unitNumber: "",
  subject: "General inquiry",
  message: "",
};

const SUBJECTS = [
  "General inquiry",
  "Repair question",
  "Relocation assistance",
  "Report an issue",
  "Storage Access Request",
  "Other",
];

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ state: "submitting", message: "" });

    try {
      const res = await submitContact(form);
      setStatus({
        state: "success",
        message: res.message || "Your message has been received.",
      });
      setForm(EMPTY);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Could not send your message. Please try again.";
      setStatus({ state: "error", message: msg });
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {status.state === "success" && (
        <div className="alert alert-success">{status.message}</div>
      )}
      {status.state === "error" && (
        <div className="alert alert-error">{status.message}</div>
      )}

      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={update("name")}
          />
        </div>
        <div className="field">
          <label htmlFor="contactInfo">Email or phone number *</label>
          <input
            id="contactInfo"
            type="text"
            required
            value={form.contactInfo}
            onChange={update("contactInfo")}
            placeholder="email@example.com or (555) 000-0000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="unitNumber">Unit number</label>
          <input
            id="unitNumber"
            type="text"
            value={form.unitNumber}
            onChange={update("unitNumber")}
          />
        </div>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <select id="subject" value={form.subject} onChange={update("subject")}>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          required
          value={form.message}
          onChange={update("message")}
          placeholder="How can the property team help?"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status.state === "submitting"}
      >
        {status.state === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
