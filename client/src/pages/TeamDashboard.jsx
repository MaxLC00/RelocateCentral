import { useState, useEffect, Fragment } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  listUnits,
  getUnitStatus,
  updateUnit,
  downloadUnitsCsv,
  listContacts,
  updateContactStatus,
  listUsers,
  createUser,
  deleteUser,
  listFiles,
  uploadFile,
  deleteFile,
  downloadFile,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listTaskAttachments,
  uploadTaskAttachment,
  deleteTaskAttachment,
  downloadTaskAttachment,
} from "../api.js";
import { formatDate, statusClass } from "../utils.js";

const CATEGORIES = ["general", "repair", "relocation", "urgent"];
const STATUSES = ["Not Started", "Scheduled", "In Progress", "Awaiting Inspection", "Completed"];
const EMPTY_ANNOUNCEMENT = { title: "", body: "", category: "general", pinned: false, author: "Relocation Team" };

// ─── Announcements panel ──────────────────────────────────────────────────────
function AnnouncementsPanel() {
  const { canPostAnnouncements, isAdmin } = useAuth();
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
      {canPostAnnouncements && (
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

  function formFromUnit(u) {
    return {
      residentName: u.residentName || "",
      status: u.status || "Not Started",
      moveInDate: u.moveInDate ? u.moveInDate.slice(0, 10) : "",
      storageLocation: u.storageLocation || "",
      temporaryHousingLocation: u.temporaryHousingLocation || "",
      notes: u.notes || "",
      updateNote: "",
    };
  }

  async function selectUnit(u) {
    // The list endpoint only returns a few fields, so fetch the full record to
    // populate every saved field (storage, temp housing, notes, return week, …).
    setSelected(u);
    setForm(formFromUnit(u));
    setSaveStatus({ state: "idle", message: "" });
    try {
      const full = await getUnitStatus(u.unitNumber);
      setSelected(full);
      setForm(formFromUnit(full));
    } catch {
      /* keep the partial list data if the full fetch fails */
    }
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

            {Array.isArray(selected.updates) && selected.updates.length > 0 && (
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <label style={{ fontWeight: 600 }}>Update history</label>
                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selected.updates.map((up, i) => (
                    <div key={i} style={{ fontSize: "0.88rem" }}>
                      <div>{up.note}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {up.status ? `${up.status} · ` : ""}{formatDate(up.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
  const { canEdit } = useAuth();
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

          {canEdit && (
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
          )}
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

// ─── Files panel ──────────────────────────────────────────────────────────────
const ACCEPTED_FILE_TYPES =
  ".jpg,.jpeg,.pdf,.xls,.xlsx,image/jpeg,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType) {
  if (!mimeType) return "📄";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📕";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  return "📄";
}

function downloadNameFor(f) {
  const name = (f.title || "").trim();
  if (!name) return f.filename;
  const dot = f.filename.lastIndexOf(".");
  const ext = dot > -1 ? f.filename.slice(dot) : "";
  return name.toLowerCase().endsWith(ext.toLowerCase()) ? name : name + ext;
}

function FilesPanel() {
  const { canEdit } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try { setFiles(await listFiles()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!selected) return;
    setStatus({ state: "uploading", message: "" });
    try {
      await uploadFile(selected, { title, description });
      setStatus({ state: "success", message: `"${title.trim() || selected.name}" uploaded.` });
      setSelected(null);
      setTitle("");
      setDescription("");
      e.target.reset();
      load();
    } catch (err) {
      setStatus({ state: "error", message: err.response?.data?.message || "Upload failed." });
    }
  }

  async function handleDownload(f) {
    setBusyId(f.id);
    try { await downloadFile(f.id, downloadNameFor(f)); }
    catch { /* silent */ }
    finally { setBusyId(null); }
  }

  async function handleDelete(f) {
    if (!window.confirm(`Delete "${f.filename}"? This cannot be undone.`)) return;
    try {
      await deleteFile(f.id);
      load();
    } catch { /* silent */ }
  }

  return (
    <div>
      {canEdit && (
        <>
          <h2 className="section-title">Upload File</h2>
          <p className="section-sub">Accepted types: JPEG, PDF, and Excel (.xls / .xlsx). Max 25 MB.</p>

          <form className="form-card" style={{ marginBottom: "2.5rem" }} onSubmit={handleUpload}>
            {status.state === "success" && <div className="alert alert-success">{status.message}</div>}
            {status.state === "error" && <div className="alert alert-error">{status.message}</div>}

            <div className="field">
              <label htmlFor="file-input">Choose a file *</label>
              <input
                id="file-input"
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => setSelected(e.target.files[0] || null)}
              />
            </div>

            <div className="field">
              <label htmlFor="file-title">Name</label>
              <input
                id="file-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selected ? selected.name : "Display name (optional)"}
              />
              <span className="hint">Leave blank to use the original file name.</span>
            </div>

            <div className="field">
              <label htmlFor="file-description">Description</label>
              <textarea
                id="file-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this file? (optional)"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={!selected || status.state === "uploading"}>
              {status.state === "uploading" ? "Uploading…" : "Upload file"}
            </button>
          </form>
        </>
      )}

      <h2 className="section-title">Shared Files</h2>
      <p className="section-sub">Files uploaded by the team. Click download to save a copy.</p>

      {loading && <div className="loading-state">Loading…</div>}
      {!loading && files.length === 0 && <div className="empty-state">No files have been uploaded yet.</div>}
      {!loading && files.map((f) => (
        <div key={f.id} className="card" style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <span style={{ fontSize: "1.5rem" }}>{fileIcon(f.mimeType)}</span>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                {f.title || f.filename}
              </strong>
              {f.description && (
                <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text)", margin: "0.15rem 0" }}>
                  {f.description}
                </span>
              )}
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {f.title ? `${f.filename} · ` : ""}{formatBytes(f.size)}
                {f.uploadedBy ? ` · ${f.uploadedBy}` : ""} · {formatDate(f.uploadedAt)}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button className="btn btn-outline" onClick={() => handleDownload(f)} disabled={busyId === f.id}>
              {busyId === f.id ? "…" : "⬇ Download"}
            </button>
            {canEdit && (
              <button
                className="btn btn-outline"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={() => handleDelete(f)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tasks (Kanban) panel ───────────────────────────────────────────────────
const KANBAN_COLUMNS = ["To Do", "In Progress", "Done"];
const COLUMN_ACCENT = {
  "To Do": "#64748b",
  "In Progress": "#b45309",
  Done: "#166534",
};
const EMPTY_TASK = { title: "", description: "", assignee: "", status: "To Do", dueDate: "" };

// A task counts as "new" for 24 hours after it's created.
const NEW_TASK_WINDOW_MS = 24 * 60 * 60 * 1000;
// A due date is "approaching" when it's within this many days.
const DUE_SOON_DAYS = 3;
const ACCEPTED_ATTACHMENT_TYPES =
  "image/*,.pdf,.xls,.xlsx,.doc,.docx,.csv,.txt";

function isNewTask(task) {
  if (!task?.createdAt) return false;
  return Date.now() - new Date(task.createdAt).getTime() < NEW_TASK_WINDOW_MS;
}

// Returns { level: "overdue" | "soon" | "upcoming", days, label } or null.
function dueInfo(task) {
  if (!task?.dueDate) return null;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const days = Math.round((dueUTC - todayUTC) / 86400000);

  const dateLabel = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  let level = "upcoming";
  if (days < 0) level = "overdue";
  else if (days <= DUE_SOON_DAYS) level = "soon";

  return { level, days, dateLabel };
}

const DUE_STYLES = {
  overdue: { background: "#fee2e2", color: "#b91c1c" },
  soon: { background: "#fef3c7", color: "#b45309" },
  upcoming: { background: "#eef2ff", color: "#3730a3" },
};

function KanbanPanel() {
  const { canEdit } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { id, before }
  const [attachments, setAttachments] = useState([]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachBusy, setAttachBusy] = useState(false);

  async function load() {
    setLoading(true);
    try { setTasks(await listTasks()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate(status) {
    setEditing(null);
    setForm({ ...EMPTY_TASK, status });
    setAttachments([]);
    setError("");
    setModalOpen(true);
  }

  async function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignee: task.assignee || "",
      status: task.status || "To Do",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setAttachments([]);
    setError("");
    setModalOpen(true);
    setAttachLoading(true);
    try {
      setAttachments(await listTaskAttachments(task._id));
    } catch {
      /* silent */
    } finally {
      setAttachLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_TASK);
    setAttachments([]);
  }

  function bumpAttachmentCount(taskId, delta) {
    setTasks((cur) =>
      cur.map((t) =>
        t._id === taskId
          ? { ...t, attachmentCount: Math.max(0, (t.attachmentCount || 0) + delta) }
          : t
      )
    );
  }

  async function handleAttachmentUpload(e) {
    const file = e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !editing) return;
    setAttachBusy(true);
    setError("");
    try {
      const att = await uploadTaskAttachment(editing._id, file);
      setAttachments((prev) => [...prev, att]);
      bumpAttachmentCount(editing._id, 1);
    } catch (err) {
      setError(err.response?.data?.message || "Attachment upload failed.");
    } finally {
      setAttachBusy(false);
    }
  }

  async function handleAttachmentDelete(att) {
    if (!editing) return;
    if (!window.confirm(`Remove "${att.filename}"?`)) return;
    try {
      await deleteTaskAttachment(editing._id, att.id);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      bumpAttachmentCount(editing._id, -1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove attachment.");
    }
  }

  async function handleAttachmentDownload(att) {
    if (!editing) return;
    try {
      await downloadTaskAttachment(editing._id, att.id, att.filename);
    } catch {
      /* silent */
    }
  }

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const updated = await updateTask(editing._id, form);
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      } else {
        const created = await createTask(form);
        setTasks((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!window.confirm(`Delete task "${editing.title}"?`)) return;
    try {
      await deleteTask(editing._id);
      setTasks((prev) => prev.filter((t) => t._id !== editing._id));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  }

  // Move the dragged task into `column` at the position relative to `targetId`.
  // Uses fractional ordering so only the moved task needs to be saved.
  async function performMove(column, targetId, before) {
    const id = dragId;
    setDragId(null);
    setDropTarget(null);
    setDragOverCol(null);
    if (!id || id === targetId) return;

    const dragged = tasks.find((t) => t._id === id);
    if (!dragged) return;

    const list = tasks
      .filter((t) => t.status === column && t._id !== id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    let index;
    if (!targetId) {
      index = list.length;
    } else {
      const ti = list.findIndex((t) => t._id === targetId);
      index = ti < 0 ? list.length : before ? ti : ti + 1;
    }

    const prevOrder = index > 0 ? list[index - 1].order || 0 : null;
    const nextOrder = index < list.length ? list[index].order || 0 : null;

    let newOrder;
    if (prevOrder == null && nextOrder == null) newOrder = Date.now();
    else if (prevOrder == null) newOrder = nextOrder - 1000;
    else if (nextOrder == null) newOrder = prevOrder + 1000;
    else newOrder = (prevOrder + nextOrder) / 2;

    if (dragged.status === column && dragged.order === newOrder) return;

    setTasks((cur) =>
      cur.map((t) => (t._id === id ? { ...t, status: column, order: newOrder } : t))
    );
    try {
      await updateTask(id, { status: column, order: newOrder });
    } catch {
      load(); // revert to server state on failure
    }
  }

  const byColumn = (col) =>
    tasks
      .filter((t) => t.status === col)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Task Board</h2>
          <p className="section-sub" style={{ margin: 0 }}>Drag cards to reorder within a column or move them between columns.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openCreate("To Do")}>+ New task</button>
      </div>

      {loading && <div className="loading-state">Loading…</div>}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", alignItems: "start" }}>
          {KANBAN_COLUMNS.map((col) => {
            const items = byColumn(col);
            return (
              <div
                key={col}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); setDropTarget(null); }}
                onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
                onDrop={() => performMove(col, null, false)}
                style={{
                  background: dragOverCol === col ? "var(--primary-soft)" : "#f8fafc",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "0.75rem",
                  minHeight: "120px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLUMN_ACCENT[col] }} />
                    {col}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({items.length})</span>
                  </span>
                  <button
                    className="pill"
                    onClick={() => openCreate(col)}
                    title={`Add task to ${col}`}
                    style={{ padding: "0.1rem 0.5rem" }}
                  >
                    +
                  </button>
                </div>

                {items.length === 0 && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", padding: "0.5rem 0.25rem" }}>
                    No tasks.
                  </div>
                )}

                {items.map((t) => {
                  const showLine = dragId && dragId !== t._id && dropTarget?.id === t._id;
                  const dropLine = (
                    <div style={{ height: "3px", background: "var(--primary)", borderRadius: "2px", margin: "2px 0" }} />
                  );
                  return (
                    <Fragment key={t._id}>
                      {showLine && dropTarget.before && dropLine}
                      <div
                        draggable
                        onDragStart={(e) => { setDragId(t._id); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragId(null); setDragOverCol(null); setDropTarget(null); }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!dragId || dragId === t._id) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const before = e.clientY < rect.top + rect.height / 2;
                          setDragOverCol(col);
                          setDropTarget({ id: t._id, before });
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const before = e.clientY < rect.top + rect.height / 2;
                          performMove(col, t._id, before);
                        }}
                        onClick={() => openEdit(t)}
                        style={{
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderLeft: `3px solid ${COLUMN_ACCENT[col]}`,
                          borderRadius: "8px",
                          padding: "0.6rem 0.7rem",
                          marginBottom: "0.5rem",
                          cursor: "pointer",
                          opacity: dragId === t._id ? 0.5 : 1,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", flex: 1 }}>{t.title}</div>
                          {isNewTask(t) && (
                            <span
                              className="badge"
                              style={{ background: "#dcfce7", color: "#166534", fontSize: "0.65rem", flexShrink: 0 }}
                            >
                              NEW
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
                            {t.description}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                          {t.assignee && (
                            <span className="badge badge-general" style={{ fontSize: "0.72rem" }}>👤 {t.assignee}</span>
                          )}
                          {(() => {
                            const due = dueInfo(t);
                            if (!due) return null;
                            // Completed tasks don't raise overdue/approaching warnings.
                            const level = col === "Done" ? "upcoming" : due.level;
                            const prefix =
                              level === "overdue" ? "⚠ Overdue " : level === "soon" ? "⏳ Due " : "📅 Due ";
                            return (
                              <span className="badge" style={{ fontSize: "0.72rem", ...DUE_STYLES[level] }}>
                                {prefix}{due.dateLabel}
                              </span>
                            );
                          })()}
                          {t.attachmentCount > 0 && (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              📎 {t.attachmentCount}
                            </span>
                          )}
                        </div>
                      </div>
                      {showLine && !dropTarget.before && dropLine}
                    </Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
        >
          <form
            className="form-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            style={{ width: "min(520px, 95vw)", maxHeight: "90vh", overflowY: "auto", margin: 0 }}
          >
            <h3 style={{ marginTop: 0 }}>{editing ? "Edit Task" : "New Task"}</h3>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="task-title">Title *</label>
              <input id="task-title" type="text" required value={form.title} onChange={updateField("title")} autoFocus />
            </div>

            <div className="field">
              <label htmlFor="task-desc">Description</label>
              <textarea id="task-desc" value={form.description} onChange={updateField("description")} placeholder="Details (optional)" />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="task-assignee">Assignee</label>
                <input id="task-assignee" type="text" value={form.assignee} onChange={updateField("assignee")} placeholder="Who's responsible? (optional)" />
              </div>
              <div className="field">
                <label htmlFor="task-status">Column</label>
                <select id="task-status" value={form.status} onChange={updateField("status")}>
                  {KANBAN_COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="task-due">Due date</label>
              <input id="task-due" type="date" value={form.dueDate} onChange={updateField("dueDate")} />
              <span className="hint">Leave blank for no due date.</span>
            </div>

            {editing && (
              <div className="field" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <label>Attachments</label>
                <p className="hint" style={{ marginTop: 0 }}>Pictures and documents (images, PDF, Excel, Word, CSV, text). Max 25 MB.</p>

                {attachLoading && <div className="loading-state">Loading…</div>}
                {!attachLoading && attachments.length === 0 && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    No attachments yet.
                  </div>
                )}
                {attachments.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                      <span>{fileIcon(a.mimeType)}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.filename}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>{formatBytes(a.size)}</span>
                    </span>
                    <span style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                      <button type="button" className="pill" onClick={() => handleAttachmentDownload(a)}>⬇</button>
                      {canEdit && (
                        <button
                          type="button"
                          className="pill"
                          style={{ color: "var(--danger)" }}
                          onClick={() => handleAttachmentDelete(a)}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  </div>
                ))}

                <div style={{ marginTop: "0.6rem" }}>
                  <input
                    type="file"
                    accept={ACCEPTED_ATTACHMENT_TYPES}
                    onChange={handleAttachmentUpload}
                    disabled={attachBusy}
                  />
                  {attachBusy && <span className="hint"> Uploading…</span>}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              <div>
                {editing && canEdit && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !form.title.trim()}>
                  {saving ? "Saving…" : editing ? "Save" : "Add task"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────
const ALL_TABS = [
  { key: "announcements", label: "📢 Announcements", roles: ["Admin", "Member", "3rd Party"] },
  { key: "units", label: "🏠 Units", roles: ["Admin", "Member", "3rd Party"] },
  { key: "tasks", label: "🗂️ Tasks", roles: ["Admin", "Member", "3rd Party"] },
  { key: "files", label: "📁 Files", roles: ["Admin", "Member", "3rd Party"] },
  { key: "messages", label: "✉️ Messages", roles: ["Admin", "Member", "3rd Party"] },
  { key: "users", label: "👤 Users", roles: ["Admin"] },
];

export default function TeamDashboard() {
  const { username, role, isThirdParty, logout } = useAuth();
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
            {role && !isThirdParty && (
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
      {tab === "tasks" && <KanbanPanel />}
      {tab === "files" && <FilesPanel />}
      {tab === "messages" && <MessagesPanel />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}
