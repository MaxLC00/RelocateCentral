const express = require("express");
const router = express.Router();
const { getUnitStatus, listUnits, updateUnit } = require("../controllers/unitController");
const requireAuth = require("../middleware/auth");

router.get("/", listUnits);
router.get("/:unitNumber", getUnitStatus);
router.put("/:unitNumber", requireAuth, updateUnit);

module.exports = router;
