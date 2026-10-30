import { useState } from "react";
import { getUnitByResident } from "../api.js";
import { weekRange } from "../utils.js";

const MANAGEMENT_MESSAGE =
  "We are currently working on your unit and do not yet have a confirmed return date, please check back regularly. Thank you, Management.";

export default function StatusChecker() {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [result, setResult] = useState({ state: "idle", data: null });

  async function handleSubmit(e) {
    e.preventDefault();
    const value = name.trim().replace(/\s+/g, " ");
    if (!value) return;
    setSubmittedName(value);
    setResult({ state: "loading", data: null });
    try {
      const data = await getUnitByResident(value);
      setResult({ state: "found", data });
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ state: "notfound", data: null });
      } else {
        setResult({
          state: "error",
          data: null,
          message: err.response?.data?.message || "Something went wrong. Please try again.",
        });
      }
    }
  }

  const data = result.data;
  const hasMoveIn = !!data?.moveInDate;
  const latestNote =
    Array.isArray(data?.updates) && data.updates.length ? data.updates[0].note : "";

  return (
    <div>
      <form className="status-search" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name (e.g. J Doe)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="First initial and last name"
        />
        <button type="submit" className="btn btn-primary">
          Check status
        </button>
      </form>

      {result.state === "loading" && (
        <div className="loading-state" style={{ marginTop: "1.5rem" }}>Checking…</div>
      )}

      {result.state === "error" && (
        <div className="alert alert-error" style={{ marginTop: "1.5rem" }}>
          {result.message || "Something went wrong. Please try again."}
        </div>
      )}

      {/* No match, or matched a unit that has no confirmed return date yet. */}
      {(result.state === "notfound" || (result.state === "found" && !hasMoveIn)) && (
        <div className="status-result">
          <div className="alert alert-info">{MANAGEMENT_MESSAGE}</div>
        </div>
      )}

      {/* Matched a unit that has a confirmed return week. */}
      {result.state === "found" && hasMoveIn && (
        <div className="status-result">
          <div className="status-result-head">
            <h3>{data.residentName || submittedName}</h3>
            {data.unitNumber && (
              <span style={{ color: "var(--text-muted)" }}>Unit {data.unitNumber}</span>
            )}
          </div>

          <div className="meta-grid">
            <div className="meta-item">
              <div className="label">Return Week</div>
              <div className="value">{weekRange(data.moveInDate)}</div>
            </div>
          </div>

          {latestNote && (
            <div className="alert alert-info" style={{ marginTop: "1rem" }}>
              {latestNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
