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
  listUnits,
  updateUnit,
};
