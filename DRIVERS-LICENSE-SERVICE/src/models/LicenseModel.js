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
    required: true,
    trim: true
  },
  MiddleName: {
    type: String,
    trim: true,
    default: ''
  },
  LastName: {
    type: String,
    required: true,
    trim: true
  },
  BirthDate: {
    type: String,
    required: true
  },
  Gen: {
    type: String,
    required: true,
    enum: ['m', 'f']
  },
  BloodGroup: {
    type: String,
    required: true
  },
  HeightCm: {
    type: Number,
    required: true
  },
  ResidentialAddr: {
    type: String,
    required: true
  },
  StateOfIssue: {
    type: String,
    required: true
  },
  IssuedDate: {
    type: String,
    required: true
  },
  ExpiryDate: {
    type: String,
    required: true
  },

}, {
  timestamps: true
});



module.exports = mongoose.model('DriversLicenseRecord', driversLicenseRecordSchema);