
const mongoose = require("mongoose");

const ninRecordSchema = new mongoose.Schema(
  {
    ninNumber: { type: String, required: true, unique: true},
    firstName: { type: String, required: true },
    middleName: { type: String, default: null },
    lastName: { type: String, required: true },
    dob: { type: String, required: true },           
    gender: { type: String, required: true, enum: ["M", "F"] },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    residentialAddress: { type: String, default: null },
    stateOfOrigin: { type: String, default: null },
    lga: { type: String, default: null },
    height: { type: String, default: null },
    maritalStatus: { type: String, default: null },
    image: { type: String, default: null },           // base64 with data URI prefix
    enrollmentDate: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NINRecord", ninRecordSchema);
