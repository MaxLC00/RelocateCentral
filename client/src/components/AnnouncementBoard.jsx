import { useEffect, useState } from "react";
import { getAnnouncements } from "../api.js";
import { formatDate } from "../utils.js";

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "repair", label: "Repairs" },
  { key: "relocation", label: "Relocation" },
  { key: "general", label: "General" },
];

export default function AnnouncementBoard({ limit, showFilters = true }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getAnnouncements(category)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(() => {
        if (active) setError("Could not load announcements. Please try again later.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category]);

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div>
      {showFilters && (
        <div className="filter-bar">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`pill ${category === c.key ? "active" : ""}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading-state">Loading announcements…</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && visible.length === 0 && (
        <div className="empty-state">No announcements to show right now.</div>
      )}

      {!loading &&
        !error &&
        visible.map((a) => (
          <article
            key={a._id}
            className={`announcement cat-${a.category} ${a.pinned ? "pinned" : ""}`}
          >
            <div className="announcement-head">
              <h3>{a.title}</h3>
              <span style={{ display: "flex", gap: "0.4rem" }}>
                {a.pinned && <span className="badge badge-pin">📌 Pinned</span>}
                <span className={`badge badge-${a.category}`}>{a.category}</span>
              </span>
            </div>
            <p className="announcement-body">{a.body}</p>
            <div className="announcement-meta">
              {a.author} &middot; {formatDate(a.createdAt)}
            </div>
          </article>
        ))}
    </div>
  );
}
