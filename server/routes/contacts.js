const express = require("express");
const router = express.Router();
const {
  createContact,
  listContacts,
  updateContactStatus,
} = require("../controllers/contactController");
const requireAuth = require("../middleware/auth");

router.post("/", createContact);
router.get("/", requireAuth, listContacts);
router.patch("/:id/status", requireAuth, updateContactStatus);

module.exports = router;
