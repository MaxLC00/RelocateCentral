const express = require("express");
const router = express.Router();
const {
  createContact,
  listContacts,
  updateContactStatus,
} = require("../controllers/contactController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

router.post("/", createContact);
router.get("/", requireAuth, requireRole("Admin", "Member", "3rd Party"), listContacts);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("Admin", "Member"),
  updateContactStatus
);

module.exports = router;
