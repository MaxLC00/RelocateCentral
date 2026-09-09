const mongoose = require("mongoose");

const BUCKET_NAME = "uploads";

// Allowed upload types: JPEG, PDF, and Excel (xls / xlsx).
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not ready.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

function toId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

function serialize(doc) {
  return {
    id: doc._id,
    filename: doc.filename,
    title: doc.metadata?.title || "",
    description: doc.metadata?.description || "",
    mimeType: doc.metadata?.mimeType || doc.contentType || "application/octet-stream",
    size: doc.length,
    uploadedBy: doc.metadata?.uploadedBy || "",
    uploadedAt: doc.uploadDate,
  };
}

// GET /api/files
async function listFiles(req, res, next) {
  try {
    const bucket = getBucket();
    const docs = await bucket.find().sort({ uploadDate: -1 }).toArray();
    res.json(docs.map(serialize));
  } catch (err) {
    next(err);
  }
}

// POST /api/files  (multipart, field name "file")
async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    const metadata = {
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.username || "",
      title: (req.body.title || "").trim(),
      description: (req.body.description || "").trim(),
    };

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata,
    });

    uploadStream.on("error", (err) => next(err));
    uploadStream.on("finish", () => {
      res.status(201).json(
        serialize({
          _id: uploadStream.id,
          filename: req.file.originalname,
          length: req.file.size,
          uploadDate: new Date(),
          metadata,
        })
      );
    });

    uploadStream.end(req.file.buffer);
  } catch (err) {
    next(err);
  }
}

// GET /api/files/:id  -> stream the file for download
async function downloadFile(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid file id." });

    const bucket = getBucket();
    const files = await bucket.find({ _id: id }).toArray();
    if (!files.length) {
      return res.status(404).json({ message: "File not found." });
    }

    const file = files[0];
    res.setHeader(
      "Content-Type",
      file.metadata?.mimeType || file.contentType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.filename)}"`
    );

    const stream = bucket.openDownloadStream(id);
    stream.on("error", (err) => next(err));
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/files/:id
async function deleteFile(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid file id." });

    const bucket = getBucket();
    const files = await bucket.find({ _id: id }).toArray();
    if (!files.length) {
      return res.status(404).json({ message: "File not found." });
    }

    await bucket.delete(id);
    res.json({ message: "File deleted.", id: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  ALLOWED_MIME_TYPES,
};
