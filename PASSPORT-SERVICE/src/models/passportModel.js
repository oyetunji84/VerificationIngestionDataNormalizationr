const mongoose = require('mongoose');

const passportRecordSchema = new mongoose.Schema({
  passportNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  givenNames: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  placeOfBirth: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true,
    default: 'Nigerian'
  },
  issueDate: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  issuingAuthority: {
    type: String,
    required: true,
    default: 'Nigeria Immigration Service'
  },
  passportType: {
    type: String,
    required: true,
    default: 'P'
  },
  photo_filename: {
    type: String,
    required: true
  },


}, {
  timestamps: true
});

module.exports = mongoose.model('PassportRecord', passportRecordSchema);