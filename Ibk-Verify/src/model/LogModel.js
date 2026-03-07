const mongoose = require("mongoose");
const { publishToSearchQueue } = require("../config/rabbitmq");
const { formatLog } = require("../utils/sanitizeLogToQueue");
const LogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    searchId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      default: "GOV_PROVIDER",
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyModel",
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);
LogSchema.post("save", async function (doc) {
  try {
    const payload = formatLog(doc);
    await publishToSearchQueue(payload);
  } catch (error) {
    console.error(
      `[LogModel] post(save) failed to publish | mongoId: ${this._id} | error: ${error.message}`,
    );
  }
});

LogSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) {
    console.warn(
      `[LogModel] post(findOneAndUpdate) received null doc — 
       did you forget to pass { new: true } in your update call?`,
    );
    return;
  }

  try {
    const payload = formatLog(doc);
    await publishToSearchQueue(payload);
  } catch (error) {
    console.error(
      `[LogModel] post(findOneAndUpdate) failed to publish | mongoId: ${doc._id} | status: ${doc.status} | error: ${error.message}`,
    );
  }
});

module.exports = mongoose.model("LogModel", LogSchema);
