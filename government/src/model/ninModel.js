const mongoose = require("mongoose");

const ninSchema = new mongoose.Schema({
  nin: { type: String, required: true, unique: true, length: 11 },
  firstName: { type: String },
  lastName: { type: String },
  middleName: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String },
  address: { type: String },
  phone: { type: String },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("NIN", ninSchema);
