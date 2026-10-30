const express = require("express");
const router = express.Router();
const {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

router.get("/", listAnnouncements);
router.get("/:id", getAnnouncement);
router.post("/", requireAuth, requireRole("Admin", "Member", "3rd Party"), createAnnouncement);
router.delete("/:id", requireAuth, requireRole("Admin"), deleteAnnouncement);

module.exports = router;
