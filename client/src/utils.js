export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// "In Progress" -> "status-in-progress"
export function statusClass(status) {
  if (!status) return "status-not-started";
  return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}
