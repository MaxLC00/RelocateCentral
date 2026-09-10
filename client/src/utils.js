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

// Given a date, return the Mon–Sun week it falls in, e.g. "Sep 7 – Sep 13, 2026".
// Computed in UTC so it matches the stored delivery date regardless of viewer TZ.
export function weekRange(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const day = d.getUTCDay(); // 0 = Sun … 6 = Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offsetToMonday)
  );
  const sunday = new Date(
    Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6)
  );

  const fmt = (dt) =>
    dt.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getUTCFullYear()}`;
}

// "In Progress" -> "status-in-progress"
export function statusClass(status) {
  if (!status) return "status-not-started";
  return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}
