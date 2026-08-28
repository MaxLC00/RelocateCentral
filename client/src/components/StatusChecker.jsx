import { useState } from "react";
import { getUnitStatus } from "../api.js";
import { formatDate } from "../utils.js";

// Placeholder data shown until a unit has real details in the database.
const PLACEHOLDER = {
  moveOut: "June 10 – June 12",
  moveIn: "August 24 – August 28",
};

export default function StatusChecker() {
  const [unit, setUnit] = useState("");
  const [submittedUnit, setSubmittedUnit] = useState("");
  const [result, setResult] = useState({ state: "idle", data: null });

  async function handleSubmit(e) {
    e.preventDefault();
    const value = unit.trim().toUpperCase();
    if (!value) return;
    setSubmittedUnit(value);
    setResult({ state: "loading", data: null });
    try {
      const data = await getUnitStatus(value);
      setResult({ state: "found", data });
    } catch (err) {
      // 404 (no record) falls back to the building-wide placeholder view.
      if (err.response?.status === 404) {
        setResult({ state: "notfound", data: null });
      } else {
        setResult({ state: "error", data: null });
      }
    }
  }

  const data = result.data;
  const hasMoveIn = !!data?.moveInDate;
  const moveInDisplay = hasMoveIn ? formatDate(data.moveInDate) : PLACEHOLDER.moveIn;
  const moveOutDisplay = data?.moveOutDate
    ? formatDate(data.moveOutDate)
    : PLACEHOLDER.moveOut;

  return (
    <div>
      <form className="status-search" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter unit number (e.g. 3C)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label="Unit number"
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
          Something went wrong. Please try again.
        </div>
      )}

      {submittedUnit && (result.state === "found" || result.state === "notfound") && (
        <div className="status-result">
          <div className="status-result-head">
            <h3>Unit {submittedUnit}</h3>
          </div>

          {hasMoveIn ? (
            <div className="alert alert-info">
              Your expected move-in date has been scheduled. See below.
            </div>
          ) : (
            <div className="alert alert-info">
              Detailed repair status is coming soon. In the meantime, here are the
              current building-wide move dates.
            </div>
          )}

          <div className="meta-grid">
            <div className="meta-item">
              <div className="label">Move-out date</div>
              <div className="value">{moveOutDisplay}</div>
            </div>
            <div className="meta-item">
              <div className="label">Expected move-in date</div>
              <div className="value">{moveInDisplay}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
