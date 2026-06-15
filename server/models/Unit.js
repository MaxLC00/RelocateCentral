const mongoose = require("mongoose");

const UNIT_STATUSES = [
  "Not Started",
  "Scheduled",
  "In Progress",
  "Awaiting Inspection",
  "Completed",
];

const updateSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true },
    status: { type: String, enum: UNIT_STATUSES },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const unitSchema = new mongoose.Schema(
  {
    unitNumber: {
      type: String,
      required: [true, "Unit number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: UNIT_STATUSES,
        default: "Not Started",
    },
    updates: [updateSchema],
    storageLocation: {
      type: String,
      trim: true,
      default: "",
    },
    temporaryHousingLocation: {
      type: String,
      trim: true,
      default: "",
    }, 
    residentName: {
      type: String,
      trim: true,
      default: "",
    },
    group: {
      type: Number,
    },
    moveOutDate: {
      type: Date,
      default: null,
    },
    moveInDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
);

module.exports = mongoose.model("Unit", unitSchema);
module.exports.UNIT_STATUSES = UNIT_STATUSES;
