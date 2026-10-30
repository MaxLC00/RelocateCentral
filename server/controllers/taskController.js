const mongoose = require("mongoose");
const Task = require("../models/Task");
const { TASK_STATUSES } = require("../models/Task");

const ATTACHMENT_BUCKET = "taskAttachments";

// Pictures and common document types.
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
]);

function getAttachmentBucket() {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not ready.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: ATTACHMENT_BUCKET,
  });
}

function toId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

function serializeAttachment(doc) {
  return {
    id: doc._id,
    filename: doc.filename,
    mimeType: doc.metadata?.mimeType || doc.contentType || "application/octet-stream",
    size: doc.length,
    uploadedBy: doc.metadata?.uploadedBy || "",
    uploadedAt: doc.uploadDate,
  };
}

// GET /api/tasks
async function listTasks(req, res, next) {
  try {
    const tasks = await Task.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks
async function createTask(req, res, next) {
  try {
    const { title, description, assignee, status, dueDate } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "A task title is required." });
    }
    if (status && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    const task = await Task.create({
      title: String(title).trim(),
      description: description || "",
      assignee: assignee || "",
      status: status || "To Do",
      dueDate: dueDate || null,
      order: Date.now(),
      createdBy: req.user?.username || "",
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res, next) {
  try {
    const { title, description, assignee, status, order, dueDate } = req.body;
    if (status !== undefined && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (title !== undefined) task.title = String(title).trim();
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee;
    if (status !== undefined) task.status = status;
    if (order !== undefined) task.order = order;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.json({ message: "Task deleted.", id: req.params.id });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id/attachments
async function listAttachments(req, res, next) {
  try {
    const bucket = getAttachmentBucket();
    const docs = await bucket
      .find({ "metadata.taskId": String(req.params.id) })
      .sort({ uploadDate: 1 })
      .toArray();
    res.json(docs.map(serializeAttachment));
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/attachments  (multipart, field "file")
async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    const metadata = {
      taskId: String(req.params.id),
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.username || "",
    };

    const bucket = getAttachmentBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata,
    });

    uploadStream.on("error", (err) => next(err));
    uploadStream.on("finish", async () => {
      try {
        await Task.updateOne({ _id: task._id }, { $inc: { attachmentCount: 1 } });
      } catch {
        /* count is best-effort */
      }
      res.status(201).json(
        serializeAttachment({
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

// GET /api/tasks/:id/attachments/:attId  -> stream for download
async function downloadAttachment(req, res, next) {
  try {
    const attId = toId(req.params.attId);
    if (!attId) return res.status(400).json({ message: "Invalid attachment id." });

    const bucket = getAttachmentBucket();
    const files = await bucket
      .find({ _id: attId, "metadata.taskId": String(req.params.id) })
      .toArray();
    if (!files.length) {
      return res.status(404).json({ message: "Attachment not found." });
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

    const stream = bucket.openDownloadStream(attId);
    stream.on("error", (err) => next(err));
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id/attachments/:attId
async function deleteAttachment(req, res, next) {
  try {
    const attId = toId(req.params.attId);
    if (!attId) return res.status(400).json({ message: "Invalid attachment id." });

    const bucket = getAttachmentBucket();
    const files = await bucket
      .find({ _id: attId, "metadata.taskId": String(req.params.id) })
      .toArray();
    if (!files.length) {
      return res.status(404).json({ message: "Attachment not found." });
    }

    await bucket.delete(attId);
    try {
      await Task.updateOne(
        { _id: req.params.id, attachmentCount: { $gt: 0 } },
        { $inc: { attachmentCount: -1 } }
      );
    } catch {
      /* count is best-effort */
    }
    res.json({ message: "Attachment deleted.", id: req.params.attId });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listAttachments,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
  ALLOWED_ATTACHMENT_TYPES,
};
