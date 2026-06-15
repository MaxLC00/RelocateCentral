const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["general", "repair", "relocation", "urgent"],
      default: "general",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    author: {
      type: String,
      trim: true,
      default: "Building Management",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
