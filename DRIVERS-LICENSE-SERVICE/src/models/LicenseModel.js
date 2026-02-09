const mongoose = require('mongoose');

const driversLicenseRecordSchema = new mongoose.Schema({
  LicenseNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  FirstName: {
    type: String,
    trim: true
  },
  MiddleName: {
    type: String,
    trim: true,
    default: ''
  },
  LastName: {
    type: String,
    trim: true
  },
  BirthDate: {
    type: String,
  },
  Gen: {
    type: String,
  },
  BloodGroup: {
    type: String,
  },
  HeightCm: {
    type: Number,
    type: String,

  },
  ResidentialAddr: {
    type: String,

  },
  StateOfIssue: {
    type: String,

  },
  IssuedDate: {
    type: String,
  },
  ExpiryDate: {
    type: String,

  },

}, {
  timestamps: true
});



module.exports = mongoose.model('DriversLicenseRecord', driversLicenseRecordSchema);