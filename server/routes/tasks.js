const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listAttachments,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
  ALLOWED_ATTACHMENT_TYPES,
} = require("../controllers/taskController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

const ALL_ROLES = ["Admin", "Member", "3rd Party"];
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload an image or document."));
    }
  },
});

function handleAttachmentUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File is too large. The maximum size is 25 MB."
          : err.message || "Upload failed.";
      return res.status(400).json({ message });
    }
    next();
  });
}

// Tasks — everyone signed in can view, create, and move; only Admin/Member delete.
router.get("/", requireAuth, requireRole(...ALL_ROLES), listTasks);
router.post("/", requireAuth, requireRole(...ALL_ROLES), createTask);
router.put("/:id", requireAuth, requireRole(...ALL_ROLES), updateTask);
router.delete("/:id", requireAuth, requireRole("Admin", "Member"), deleteTask);

// Task attachments (pictures & documents).
router.get("/:id/attachments", requireAuth, requireRole(...ALL_ROLES), listAttachments);
router.post(
  "/:id/attachments",
  requireAuth,
  requireRole(...ALL_ROLES),
  handleAttachmentUpload,
  uploadAttachment
);
router.get(
  "/:id/attachments/:attId",
  requireAuth,
  requireRole(...ALL_ROLES),
  downloadAttachment
);
router.delete(
  "/:id/attachments/:attId",
  requireAuth,
  requireRole("Admin", "Member"),
  deleteAttachment
);

module.exports = router;
