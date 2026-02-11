const mongoose = require("mongoose");
const ninRequestSchema = new mongoose.Schema({
  requestId: String,
  companyId: String,
  ninNumber: String,
  status: String,
  walletTransationId: String,
  amountCharged: Integer,
});
module.exports = mongoose.model("NINRequestRecors", ninRequestSchema);
