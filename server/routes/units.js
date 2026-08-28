const express = require("express");
const router = express.Router();
const { getUnitStatus, listUnits, updateUnit, exportUnits } = require("../controllers/unitController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

router.get("/", listUnits);
// Must be registered before "/:unitNumber" so "export" isn't read as a unit number.
router.get(
  "/export",
  requireAuth,
  requireRole("Admin", "Member", "3rd Party"),
  exportUnits
);
router.get("/:unitNumber", getUnitStatus);
router.put(
  "/:unitNumber",
  requireAuth,
  requireRole("Admin", "Member", "3rd Party"),
  updateUnit
);

module.exports = router;
