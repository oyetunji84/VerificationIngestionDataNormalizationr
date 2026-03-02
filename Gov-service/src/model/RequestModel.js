const mongoose = require("mongoose");
const ninRequestSchema = new mongoose.Schema({
  requestId: String,
  companyId: String,
  ninNumber: String,
  status: String,
  walletTransationId: String,
  amountCharged: Number,
});
module.exports = mongoose.model("NINRequestRecors", ninRequestSchema);
