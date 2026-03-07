const mongoose = require("mongoose");

const bvnSchema = new mongoose.Schema({
  bvn: { type: String, required: true, unique: true, length: 11 },
  firstName: { type: String },
  lastName: { type: String },
  middleName: { type: String },
  dateOfBirth: { type: Date },
  phone: { type: String },
  enrollmentBank: { type: String },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BVN", bvnSchema);
