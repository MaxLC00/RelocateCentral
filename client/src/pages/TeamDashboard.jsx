import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  listUnits,
  updateUnit,
  downloadUnitsCsv,
  listContacts,
  updateContactStatus,
  listUsers,
  createUser,
  deleteUser,
} from "../api.js";
import { formatDate, statusClass } from "../utils.js";

const CATEGORIES = ["general", "repair", "relocation", "urgent"];
const STATUSES = ["Not Started", "Scheduled", "In Progress", "Awaiting Inspection", "Completed"];
const EMPTY_ANNOUNCEMENT = { title: "", body: "", category: "general", pinned: false, author: "Relocation Team" };

// ─── Announcements panel ──────────────────────────────────────────────────────
function AnnouncementsPanel() {
  const { canEdit, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_ANNOUNCEMENT);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setItems(await getAnnouncements()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function update(field) {
    return (e) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      }));
  }

  async function handlePost(e) {
    e.preventDefault();
    setStatus({ state: "submitting", message: "" });
    try {
      await createAnnouncement(form);
      setStatus({ state: "success", message: "Announcement posted." });
      setForm(EMPTY_ANNOUNCEMENT);
      load();
    } catch (err) {
      setStatus({ state: "error", message: err.response?.data?.message || "Failed to post." });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      load();
    } catch { /* silent */ }
  }

  return (
    <div>
      {canEdit && (
        <>
          <h2 className="section-title">Post Announcement</h2>
          <p className="section-sub">New announcements appear on the resident portal immediately.</p>

          <form className="form-card" style={{ marginBottom: "2.5rem" }} onSubmit={handlePost}>
            {status.state === "success" && <div className="alert alert-success">{status.message}</div>}
            {status.state === "error" && <div className="alert alert-error">{status.message}</div>}

            <div className="field">
              <label htmlFor="ann-title">Title *</label>
              <input id="ann-title" type="text" required value={form.title} onChange={update("title")} />
            </div>

            <div className="field">
              <label htmlFor="ann-body">Body *</label>
              <textarea id="ann-body" required value={form.body} onChange={update("body")} />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="ann-category">Category</label>
                <select id="ann-category" value={form.category} onChange={update("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ann-author">Author</label>
                <input id="ann-author" type="text" value={form.author} onChange={update("author")} />
              </div>
            </div>

            <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input id="ann-pinned" type="checkbox" checked={form.pinned} onChange={update("pinned")} style={{ width: "auto" }} />
              <label htmlFor="ann-pinned" style={{ margin: 0 }}>Pin to top</label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={status.state === "submitting"}>
              {status.state === "submitting" ? "Posting…" : "Post announcement"}
            </button>
          </form>
        </>
      )}

      <h2 className="section-title">Existing Announcements</h2>
      <p className="section-sub">
        {isAdmin
          ? "Click delete to remove an announcement from the resident portal."
          : "Announcements currently shown on the resident portal."}
      </p>

      {loading && <div className="loading-state">Loading…</div>}
      {!loading && items.length === 0 && <div className="empty-state">No announcements yet.</div>}
      {!loading && items.map((a) => (
        <div key={a._id} className={`announcement cat-${a.category}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div className="announcement-head">
              <strong>{a.title}</strong>
              <span className="badge badge-pin" style={{ visibility: a.pinned ? "visible" : "hidden" }}>📌 Pinned</span>
            </div>
            <p className="announcement-body" style={{ margin: "0.35rem 0 0" }}>{a.body}</p>
            <div className="announcement-meta">{a.author} · {formatDate(a.createdAt)}</div>
          </div>
          {isAdmin && (
            <button
              className="btn btn-outline"
              style={{ color: "var(--danger)", borderColor: "var(--danger)", flexShrink: 0 }}
              onClick={() => handleDelete(a._id)}
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Units panel ──────────────────────────────────────────────────────────────
function UnitsPanel() {
  const { canEditUnits } = useAuth();
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [saveStatus, setSaveStatus] = useState({ state: "idle", message: "" });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    listUnits()
      .then(setUnits)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = units
    .filter((u) => {
      const q = search.toUpperCase();
      return (
        u.unitNumber.includes(q) ||
        (u.residentName && u.residentName.toUpperCase().includes(q))
      );
    })
    .slice()
    .sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber));

  function selectUnit(u) {
    setSelected(u);
    setForm({
      residentName: u.residentName || "",
      status: u.status || "Not Started",
      moveInDate: u.moveInDate ? u.moveInDate.slice(0, 10) : "",
      storageLocation: u.storageLocation || "",
      temporaryHousingLocation: u.temporaryHousingLocation || "",
      notes: u.notes || "",
      updateNote: "",
    });
    setSaveStatus({ state: "idle", message: "" });
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveStatus({ state: "saving", message: "" });
    try {
      const updated = await updateUnit(selected.unitNumber, form);
      setSaveStatus({ state: "success", message: "Unit updated." });
      setUnits((prev) => prev.map((u) => u.unitNumber === updated.unitNumber ? { ...u, ...updated } : u));
      setSelected(updated);
      setForm((f) => ({ ...f, updateNote: "" }));
    } catch (err) {
      setSaveStatus({ state: "error", message: err.response?.data?.message || "Failed to save." });
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadUnitsCsv();
    } catch {
      /* silent */
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
      <div>
        <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Units</h2>
        <p className="section-sub" style={{ margin: 0 }}>Select a unit to view its details, or download the full list.</p>
      </div>
      <button className="btn btn-outline" onClick={handleDownload} disabled={downloading}>
        {downloading ? "Preparing…" : "⬇ Download spreadsheet (CSV)"}
      </button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem", alignItems: "start" }}>
      {/* Unit list */}
      <div>
        <div className="field" style={{ marginBottom: "0.75rem" }}>
          <input
            type="text"
            placeholder="Search unit # or resident name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading && <div className="loading-state">Loading…</div>}
        <div style={{ maxHeight: "70vh", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
          {filtered.map((u) => (
            <button
              key={u.unitNumber}
              onClick={() => selectUnit(u)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "0.65rem 0.9rem",
                background: selected?.unitNumber === u.unitNumber ? "var(--primary-soft)" : "#fff",
                border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.92rem",
              }}
            >
              <span>
                <span style={{ fontWeight: 600 }}>Unit {u.unitNumber}</span>
                {u.residentName && (
                  <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {u.residentName}
                  </span>
                )}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>Grp {u.group}</span>
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="empty-state" style={{ padding: "1rem" }}>No units found.</div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      <div>
        {!selected && (
          <div className="empty-state">Select a unit on the left to edit its details.</div>
        )}
        {selected && (
          <form className="form-card" onSubmit={handleSave}>
            <h3 style={{ marginTop: 0 }}>Unit {selected.unitNumber} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>— Group {selected.group}</span></h3>

            {!canEditUnits && (
              <div className="alert" style={{ background: "var(--primary-soft)", marginBottom: "1rem" }}>
                You have read-only access to unit details.
              </div>
            )}
            {saveStatus.state === "success" && <div className="alert alert-success">{saveStatus.message}</div>}
            {saveStatus.state === "error" && <div className="alert alert-error">{saveStatus.message}</div>}

            <fieldset disabled={!canEditUnits} style={{ border: "none", padding: 0, margin: 0 }}>
              <div className="field">
                <label>Resident name</label>
                <input type="text" value={form.residentName} onChange={update("residentName")} placeholder="Full name" />
              </div>

              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={update("status")}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Return Week</label>
                <input type="date" value={form.moveInDate} onChange={update("moveInDate")} />
              </div>

              <div className="field">
                <label>Storage location</label>
                <input type="text" value={form.storageLocation} onChange={update("storageLocation")} placeholder="e.g. Floor 2 storage room" />
              </div>

              <div className="field">
                <label>Temporary housing location</label>
                <input type="text" value={form.temporaryHousingLocation} onChange={update("temporaryHousingLocation")} placeholder="e.g. Hotel, address" />
              </div>

              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={update("notes")} placeholder="Internal notes about this unit" />
              </div>

              {canEditUnits && (
                <div className="field">
                  <label>Add update (optional)</label>
                  <input type="text" value={form.updateNote} onChange={update("updateNote")} placeholder="Short note for the timeline, e.g. 'Drywall repairs started'" />
                  <span className="hint">This will be added to the unit's update timeline.</span>
                </div>
              )}
            </fieldset>

            {canEditUnits && (
              <button type="submit" className="btn btn-primary" disabled={saveStatus.state === "saving"}>
                {saveStatus.state === "saving" ? "Saving…" : "Save changes"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
    </>
  );
}

// ─── Messages panel ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["new", "in-review", "resolved"];
const STATUS_LABELS = { new: "New", "in-review": "In Review", resolved: "Resolved" };
const STATUS_STYLES = {
  new: { background: "#fee2e2", color: "#b91c1c" },
  "in-review": { background: "#fef3c7", color: "#b45309" },
  resolved: { background: "#dcfce7", color: "#166534" },
};

function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try { setMessages(await listContacts()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateContactStatus(id, status);
      setMessages((prev) => prev.map((m) => m._id === updated._id ? updated : m));
    } catch { /* silent */ }
  }

  const visible = filter === "all"
    ? messages
    : messages.filter((m) => m.status === filter);

  return (
    <div>
      <h2 className="section-title">Contact Messages</h2>
      <p className="section-sub">All messages submitted through the resident contact form.</p>

      <div className="filter-bar" style={{ marginBottom: "1.5rem" }}>
        {["all", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            className={`pill ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state">Loading…</div>}
      {!loading && visible.length === 0 && (
        <div className="empty-state">No messages to show.</div>
      )}

      {!loading && visible.map((m) => (
        <div
          key={m._id}
          className="card"
          style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
              <strong>{m.name}</strong>
              {m.unitNumber && (
                <span className="badge badge-general">Unit {m.unitNumber}</span>
              )}
              <span
                className="badge"
                style={STATUS_STYLES[m.status] || STATUS_STYLES.new}
              >
                {STATUS_LABELS[m.status] || m.status}
              </span>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              {m.contactInfo} &middot; {m.subject} &middot; {formatDate(m.createdAt)}
            </div>
            <p style={{ margin: 0 }}>{m.message}</p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <select
              value={m.status}
              onChange={(e) => handleStatusChange(m._id, e.target.value)}
              style={{
                padding: "0.4rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Users panel (Admin only) ─────────────────────────────────────────────────
const ROLES = ["Admin", "Member", "3rd Party"];
const EMPTY_USER = { username: "", password: "", role: "Member", displayName: "" };
const ROLE_BADGE = {
  Admin: { background: "#dbeafe", color: "#1e40af" },
  Member: { background: "#dcfce7", color: "#166534" },
  "3rd Party": { background: "#fef3c7", color: "#b45309" },
};

function UsersPanel() {
  const { username: currentUsername } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_USER);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setUsers(await listUsers()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setStatus({ state: "submitting", message: "" });
    try {
      await createUser(form);
      setStatus({ state: "success", message: `User "${form.username}" added.` });
      setForm(EMPTY_USER);
      load();
    } catch (err) {
      setStatus({ state: "error", message: err.response?.data?.message || "Failed to add user." });
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove user "${name}"? They will no longer be able to sign in.`)) return;
    try {
      await deleteUser(id);
      load();
    } catch { /* silent */ }
  }

  return (
    <div>
      <h2 className="section-title">Add User</h2>
      <p className="section-sub">Create a login for a team member or third party.</p>

      <form className="form-card" style={{ marginBottom: "2.5rem" }} onSubmit={handleCreate}>
        {status.state === "success" && <div className="alert alert-success">{status.message}</div>}
        {status.state === "error" && <div className="alert alert-error">{status.message}</div>}

        <div className="form-row">
          <div className="field">
            <label htmlFor="user-username">Username *</label>
            <input id="user-username" type="text" required value={form.username} onChange={update("username")} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="user-displayname">Display name</label>
            <input id="user-displayname" type="text" value={form.displayName} onChange={update("displayName")} placeholder="Full name (optional)" />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="user-password">Password *</label>
            <input id="user-password" type="text" required value={form.password} onChange={update("password")} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="user-role">Role *</label>
            <select id="user-role" value={form.role} onChange={update("role")}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={status.state === "submitting"}>
          {status.state === "submitting" ? "Adding…" : "Add user"}
        </button>
      </form>

      <h2 className="section-title">Existing Users</h2>
      <p className="section-sub">All accounts that can sign in to the dashboard.</p>

      {loading && <div className="loading-state">Loading…</div>}
      {!loading && users.length === 0 && <div className="empty-state">No users yet.</div>}
      {!loading && users.map((u) => (
        <div key={u._id} className="card" style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <strong>{u.username}</strong>
            {u.displayName && <span style={{ color: "var(--text-muted)" }}>{u.displayName}</span>}
            <span className="badge" style={ROLE_BADGE[u.role] || {}}>{u.role}</span>
          </div>
          {u.username !== currentUsername && (
            <button
              className="btn btn-outline"
              style={{ color: "var(--danger)", borderColor: "var(--danger)", flexShrink: 0 }}
              onClick={() => handleDelete(u._id, u.username)}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────
const ALL_TABS = [
  { key: "announcements", label: "📢 Announcements", roles: ["Admin", "Member", "3rd Party"] },
  { key: "units", label: "🏠 Units", roles: ["Admin", "Member", "3rd Party"] },
  { key: "messages", label: "✉️ Messages", roles: ["Admin", "Member"] },
  { key: "users", label: "👤 Users", roles: ["Admin"] },
];

export default function TeamDashboard() {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();

  const tabs = ALL_TABS.filter((t) => t.roles.includes(role));
  const [tab, setTab] = useState(tabs[0]?.key || "announcements");

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Team Dashboard</h1>
          <p>
            Signed in as <strong>{username}</strong>
            {role && (
              <span className="badge" style={{ marginLeft: "0.5rem", ...(ROLE_BADGE[role] || {}) }}>{role}</span>
            )}
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
      </div>

      {/* Tab bar */}
      <div className="filter-bar" style={{ marginBottom: "2rem" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`pill ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "announcements" && <AnnouncementsPanel />}
      {tab === "units" && <UnitsPanel />}
      {tab === "messages" && <MessagesPanel />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}
