const Contact = require("../models/Contact");

// POST /api/contacts
async function createContact(req, res, next) {
  try {
    const { name, contactInfo, unitNumber, subject, message } = req.body;

    if (!name || !contactInfo || !message) {
      return res
        .status(400)
        .json({ message: "Name, contact info, and message are required." });
    }

    const contact = await Contact.create({
      name,
      contactInfo,
      unitNumber,
      subject,
      message,
    });

    res.status(201).json({
      message: "Thanks! Your message has been received.",
      id: contact._id,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// GET /api/contacts  -> team dashboard
async function listContacts(req, res, next) {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    res.json(contacts);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/contacts/:id/status  -> team only
async function updateContactStatus(req, res, next) {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!contact) return res.status(404).json({ message: "Message not found." });
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createContact,
  listContacts,
  updateContactStatus,
};
