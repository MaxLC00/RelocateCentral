const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    contactInfo: {
      type: String,
      required: [true, "Email or phone number is required"],
      trim: true,
    },
    unitNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "General inquiry",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in-review", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
