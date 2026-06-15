const express = require("express");
const router = express.Router();
const {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const requireAuth = require("../middleware/auth");

router.get("/", listAnnouncements);
router.get("/:id", getAnnouncement);
router.post("/", requireAuth, createAnnouncement);
router.delete("/:id", requireAuth, deleteAnnouncement);

module.exports = router;
