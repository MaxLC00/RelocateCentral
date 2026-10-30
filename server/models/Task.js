const mongoose = require("mongoose");

const TASK_STATUSES = ["To Do", "In Progress", "Done"];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    assignee: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "To Do",
    },
    // Lower order sorts first within a column.
    order: {
      type: Number,
      default: 0,
    },
    attachmentCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;
