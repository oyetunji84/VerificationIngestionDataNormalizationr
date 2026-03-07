const mongoose = require("mongoose");

const dlSchema = new mongoose.Schema({
  licenseNumber: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  dateOfBirth: { type: Date },
  expiryDate: { type: Date },
  issuedDate: { type: Date },
  class: { type: String },
  stateOfIssue: { type: String },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("License", dlSchema);
