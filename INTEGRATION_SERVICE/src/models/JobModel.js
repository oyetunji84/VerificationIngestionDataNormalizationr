const mongoose = require("mongoose");

const JOB_STATUSES = ["pending", "processing", "success", "failed"];

const jobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: JOB_STATUSES,
      required: true,
      default: "pending",
    },
    IdempotencyKey: {
      type: String,
      unique: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    retry_count: {
      type: Number,
      default: 0,
    },
    route: {
      type: String,
      required: true,
    },
    companyId: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
