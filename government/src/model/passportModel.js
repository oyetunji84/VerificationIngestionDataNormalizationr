const mongoose = require("mongoose");

const passportSchema = new mongoose.Schema({
  passportNumber: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  dateOfBirth: { type: Date },
  expiryDate: { type: Date },
  issueDate: { type: Date },
  nationality: { type: String, default: "Nigerian" },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Passport", passportSchema);
