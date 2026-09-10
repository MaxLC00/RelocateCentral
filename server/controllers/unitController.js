const Unit = require("../models/Unit");

// GET /api/units/:unitNumber  -> public status check
async function getUnitStatus(req, res, next) {
  try {
    const unitNumber = String(req.params.unitNumber || "").trim().toUpperCase();
    if (!unitNumber) {
      return res.status(400).json({ message: "Unit number is required" });
    }

    const unit = await Unit.findOne({ unitNumber }).lean();
    if (!unit) {
      return res
        .status(404)
        .json({ message: `No record found for unit ${unitNumber}` });
    }

    // Sort the update timeline newest-first for display.
    if (Array.isArray(unit.updates)) {
      unit.updates.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json(unit);
  } catch (err) {
    next(err);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/units/by-resident?name=J Doe  -> public status check by resident name.
// Matches on last name (case-insensitive); the first initial is only used to
// disambiguate when several residents share the same last name.
async function getUnitByResident(req, res, next) {
  try {
    const raw = String(req.query.name || "").trim().replace(/\s+/g, " ");
    if (!raw) {
      return res.status(400).json({ message: "A name is required" });
    }

    // Split into an optional first initial and a last name.
    const tokens = raw.split(" ");
    let initial = "";
    let lastName = raw;
    if (tokens.length >= 2) {
      initial = tokens[0].replace(/[^A-Za-z]/g, "").charAt(0);
      lastName = tokens.slice(1).join(" ");
    }

    // Match resident names ending with the given last name (as a whole word),
    // case-insensitive — e.g. "J Doe" or "Mary Doe" both match last name "Doe".
    const lastNameRegex = new RegExp(`(^|\\s)${escapeRegex(lastName)}$`, "i");
    let matches = await Unit.find({ residentName: lastNameRegex }).lean();

    if (matches.length === 0) {
      return res.status(404).json({ message: `No record found for "${raw}"` });
    }

    if (matches.length > 1 && initial) {
      const byInitial = matches.filter(
        (u) =>
          u.residentName.trim().charAt(0).toLowerCase() === initial.toLowerCase()
      );
      if (byInitial.length === 0) {
        return res.status(404).json({ message: `No record found for "${raw}"` });
      }
      matches = byInitial;
    }

    if (matches.length > 1) {
      return res.status(409).json({
        message:
          'Multiple residents share that last name. Please include your first initial, for example "J Doe".',
      });
    }

    const unit = matches[0];
    if (Array.isArray(unit.updates)) {
      unit.updates.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json(unit);
  } catch (err) {
    next(err);
  }
}

// GET /api/units  -> overview list (used by dashboards later)
async function listUnits(req, res, next) {
  try {
    const units = await Unit.find()
      .select("unitNumber floor group residentName status progressPercent estimatedCompletion updatedAt")
      .sort({ unitNumber: 1 })
      .lean();
    res.json(units);
  } catch (err) {
    next(err);
  }
}

// Wrap a value for safe CSV output (RFC 4180 style).
function csvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateCell(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

// GET /api/units/export  -> CSV download for signed-in team members
async function exportUnits(req, res, next) {
  try {
    const units = await Unit.find()
      .sort({ group: 1, unitNumber: 1 })
      .lean();

    const columns = [
      "Unit Number",
      "Floor",
      "Group",
      "Resident Name",
      "Status",
      "Return Week",
      "Storage Location",
      "Temporary Housing Location",
      "Notes",
      "Latest Update",
      "Latest Update Date",
      "Last Modified",
    ];

    const rows = units.map((u) => {
      const latest =
        Array.isArray(u.updates) && u.updates.length
          ? [...u.updates].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null;
      return [
        u.unitNumber,
        u.floor,
        u.group,
        u.residentName,
        u.status,
        formatDateCell(u.moveInDate),
        u.storageLocation,
        u.temporaryHousingLocation,
        u.notes,
        latest ? latest.note : "",
        latest ? formatDateCell(latest.date) : "",
        formatDateCell(u.updatedAt),
      ];
    });

    const csv = [columns, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="unit-status-${stamp}.csv"`
    );
    // BOM so Excel opens UTF-8 correctly.
    res.send("\uFEFF" + csv);
  } catch (err) {
    next(err);
  }
}

// PUT /api/units/:unitNumber  -> team only
async function updateUnit(req, res, next) {
  try {
    const unitNumber = String(req.params.unitNumber || "").trim().toUpperCase();
    const { status, progressPercent, estimatedCompletion, summary, residentName, moveOutDate, moveInDate, storageLocation, temporaryHousingLocation, notes, updateNote } = req.body;

    const unit = await Unit.findOne({ unitNumber });
    if (!unit) {
      return res.status(404).json({ message: `No record found for unit ${unitNumber}` });
    }

    if (residentName !== undefined) unit.residentName = residentName;
    if (status !== undefined) unit.status = status;
    if (progressPercent !== undefined) unit.progressPercent = progressPercent;
    if (estimatedCompletion !== undefined) unit.estimatedCompletion = estimatedCompletion;
    if (summary !== undefined) unit.summary = summary;
    if (moveOutDate !== undefined) unit.moveOutDate = moveOutDate;
    if (moveInDate !== undefined) unit.moveInDate = moveInDate;
    if (storageLocation !== undefined) unit.storageLocation = storageLocation;
    if (temporaryHousingLocation !== undefined) unit.temporaryHousingLocation = temporaryHousingLocation;
    if (notes !== undefined) unit.notes = notes;

    if (updateNote && updateNote.trim()) {
      unit.updates.push({ note: updateNote.trim(), status: unit.status });
    }

    await unit.save();
    res.json(unit);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUnitStatus,
  getUnitByResident,
  listUnits,
  updateUnit,
  exportUnits,
};
