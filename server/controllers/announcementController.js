const Announcement = require("../models/Announcement");

// GET /api/announcements
async function listAnnouncements(req, res, next) {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    // Pinned first, then newest.
    const announcements = await Announcement.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

// GET /api/announcements/:id
async function getAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id).lean();
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
}

// POST /api/announcements
async function createAnnouncement(req, res, next) {
  try {
    const { title, body, category, pinned, author } = req.body;
    const announcement = await Announcement.create({
      title,
      body,
      category,
      pinned,
      author,
    });
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/announcements/:id
async function deleteAnnouncement(req, res, next) {
  try {
    const result = await Announcement.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    res.json({ message: "Announcement deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
};
