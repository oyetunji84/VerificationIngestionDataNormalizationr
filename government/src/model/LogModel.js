const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    verificationType: { type: String },
    searchId: { type: String },
    status: { type: String },
    fieldsAccessed: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now },
  },
  { strict: false },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
