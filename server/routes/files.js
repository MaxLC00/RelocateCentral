const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  ALLOWED_MIME_TYPES,
} = require("../controllers/fileController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload a JPEG, PDF, or Excel file."));
    }
  },
});

// Turn multer/file-filter errors into clean 400 responses.
function handleUpload(req, res, next) {
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

// Anyone signed in can browse & download.
router.get("/", requireAuth, requireRole("Admin", "Member", "3rd Party"), listFiles);
router.get("/:id", requireAuth, requireRole("Admin", "Member", "3rd Party"), downloadFile);

// Only Admins and Members can upload or remove files.
router.post("/", requireAuth, requireRole("Admin", "Member"), handleUpload, uploadFile);
router.delete("/:id", requireAuth, requireRole("Admin", "Member"), deleteFile);

module.exports = router;
