const mongoose = require("mongoose");

const CompanyModel = new mongoose.Schema({
  name: { type: String },
  clientId: { type: String, unique: true },
  status: { type: String, default: "ACTIVE" },
  createdAt: { type: Date, default: Date.now },
  clientSecret: { type: String, unique: true },
});

module.exports = mongoose.model("CompanyModel", CompanyModel);
