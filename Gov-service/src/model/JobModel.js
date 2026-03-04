const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  callbackUrl: {
    type: String,
    required: true,
  },
  companyId: {
    type: String,
    required: true,
  },
  UserId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["NIN", "BVN", "LICENSE", "PASSPORT"],
    required: true,
  },
  IdempotencyKey: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "success", "failed"],
    default: "pending",
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
  },
  retry_count: {
    type: Number,
    default: 0,
  },
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
