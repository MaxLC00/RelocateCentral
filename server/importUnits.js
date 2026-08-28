require("dotenv").config();
const path = require("path");
const XLSX = require("xlsx");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Unit = require("./models/Unit");

// ── Config ────────────────────────────────────────────────────────────────────
// Override with flags:  node importUnits.js --file "..." --sheet "..." [--commit]
const DEFAULT_FILE = path.join(
  __dirname,
  "..",
  "Allerton Return & Lease Up Planning 2026-08-26.xlsx"
);
const DEFAULT_SHEET = "Rent Roll New Phasing";

function getArg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const FILE = getArg("file", DEFAULT_FILE);
const SHEET = getArg("sheet", DEFAULT_SHEET);
const COMMIT = process.argv.includes("--commit");

// ── Helpers ─────────────────────────────────────────────────────────────────
const BLANKS = new Set(["", "-", "n/a", "na", "tbd"]);

function clean(value) {
  const str = String(value ?? "").trim();
  return BLANKS.has(str.toLowerCase()) ? "" : str;
}

// Parse M/D/YY, M/D/YYYY, or an Excel serial-ish value into a Date (or null).
function parseDate(value) {
  const str = clean(value);
  if (!str) return null;

  const mdY = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdY) {
    let [, m, d, y] = mdY;
    y = Number(y);
    if (y < 100) y += 2000;
    const dt = new Date(Date.UTC(y, Number(m) - 1, Number(d)));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Locate the header row (the one whose first cell is "Unit #") and build a
// name -> column-index map so we're resilient to column shifts.
function buildColumnMap(rows) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const first = String(row[0] ?? "").trim().toLowerCase();
    if (first === "unit #" || first === "unit#") {
      const map = {};
      row.forEach((cell, c) => {
        const key = String(cell ?? "").trim().toLowerCase().replace(/\s+/g, " ");
        if (key) map[key] = c;
      });
      return { headerRow: r, map };
    }
  }
  throw new Error(`Could not find a "Unit #" header row in sheet "${SHEET}".`);
}

function combineLocation(belongings, storage) {
  const parts = [clean(belongings), clean(storage)].filter(Boolean);
  return parts.join(" ");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const wb = XLSX.readFile(FILE);
  if (!wb.SheetNames.includes(SHEET)) {
    console.error(
      `Sheet "${SHEET}" not found. Available: ${wb.SheetNames.join(", ")}`
    );
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEET], {
    header: 1,
    defval: "",
    raw: false,
  });

  const { headerRow, map } = buildColumnMap(rows);
  const col = (name) => map[name.toLowerCase()];

  const idx = {
    unit: col("unit #") ?? col("unit#"),
    resident: col("resident name"),
    tempDest: col("temp destination"),
    belongings: col("belongings location"),
    storage: col("storage or unit #"),
    notes: col("notes / current status"),
    delivery: col("updated delivery date"),
  };

  const records = [];
  const skipped = [];

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const unitNumber = clean(row[idx.unit]).toUpperCase();

    // Only accept rows whose Unit # looks like an actual unit (digits).
    if (!/^\d{2,4}[A-Z]?$/.test(unitNumber)) {
      if (clean(row[idx.resident]) || clean(row[idx.unit])) {
        skipped.push({ row: r + 1, unit: row[idx.unit], reason: "no valid unit #" });
      }
      continue;
    }

    const record = {
      unitNumber,
      residentName: clean(row[idx.resident]),
      temporaryHousingLocation: clean(row[idx.tempDest]),
      storageLocation: combineLocation(row[idx.belongings], row[idx.storage]),
      notes: clean(row[idx.notes]),
      moveInDate: parseDate(row[idx.delivery]),
    };
    records.push(record);
  }

  console.log(`Sheet: "${SHEET}"  |  header row: ${headerRow + 1}`);
  console.log(`Parsed ${records.length} unit rows (skipped ${skipped.length}).`);
  console.log("\nSample of first 5 parsed records:");
  records.slice(0, 5).forEach((rec) =>
    console.log(
      `  ${rec.unitNumber.padEnd(5)} | ${(rec.residentName || "(vacant)").padEnd(22)} | ` +
        `move-in ${rec.moveInDate ? rec.moveInDate.toISOString().slice(0, 10) : "—"} | ` +
        `temp: ${rec.temporaryHousingLocation || "—"} | storage: ${rec.storageLocation || "—"}`
    )
  );
  const withMoveIn = records.filter((r) => r.moveInDate).length;
  console.log(`\n${withMoveIn} of ${records.length} rows have a move-in date.`);

  if (!COMMIT) {
    console.log("\nDRY RUN — nothing written. Re-run with --commit to apply.");
    return;
  }

  await connectDB();
  let created = 0;
  let updated = 0;
  for (const rec of records) {
    const result = await Unit.updateOne(
      { unitNumber: rec.unitNumber },
      {
        $set: {
          residentName: rec.residentName,
          temporaryHousingLocation: rec.temporaryHousingLocation,
          storageLocation: rec.storageLocation,
          notes: rec.notes,
          moveInDate: rec.moveInDate,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
    else if (result.matchedCount) updated += 1;
  }
  console.log(`\nImport complete: ${created} created, ${updated} updated.`);
}

run()
  .catch((err) => {
    console.error("Import failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.connection.close();
  });
