const express = require("express");
const router = express.Router();
const { listUsers, createUser, deleteUser } = require("../controllers/userController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

router.use(requireAuth, requireRole("Admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.delete("/:id", deleteUser);

module.exports = router;
