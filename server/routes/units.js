const express = require("express");
const router = express.Router();
const { getUnitStatus, getUnitByResident, listUnits, updateUnit, exportUnits } = require("../controllers/unitController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

router.get("/", listUnits);
// Static paths must be registered before "/:unitNumber" so they aren't read as a unit number.
router.get(
  "/export",
  requireAuth,
  requireRole("Admin", "Member", "3rd Party"),
  exportUnits
);
router.get("/by-resident", getUnitByResident);
router.get("/:unitNumber", getUnitStatus);
router.put(
  "/:unitNumber",
  requireAuth,
  requireRole("Admin", "Member", "3rd Party"),
  updateUnit
);

module.exports = router;
