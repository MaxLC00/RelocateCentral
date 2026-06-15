import { useState } from "react";

// Placeholder data shown until per-unit details are loaded into the database.
const PLACEHOLDER = {
  moveOut: "June 10 – June 12",
  moveIn: "August 24 – August 28",
};

export default function StatusChecker() {
  const [unit, setUnit] = useState("");
  const [submittedUnit, setSubmittedUnit] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const value = unit.trim().toUpperCase();
    if (!value) return;
    setSubmittedUnit(value);
  }

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

      {submittedUnit && (
        <div className="status-result">
          <div className="status-result-head">
            <h3>Unit {submittedUnit}</h3>
          </div>

          <div className="alert alert-info">
            Detailed repair status is coming soon. In the meantime, here are the
            current building-wide move dates.
          </div>

          <div className="meta-grid">
            <div className="meta-item">
              <div className="label">Move-out date</div>
              <div className="value">{PLACEHOLDER.moveOut}</div>
            </div>
            <div className="meta-item">
              <div className="label">Expected move-in date</div>
              <div className="value">{PLACEHOLDER.moveIn}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
