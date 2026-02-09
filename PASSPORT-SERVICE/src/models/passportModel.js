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
    trim: true
  },
  givenNames: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: String,
  },
  sex: {
    type: String,
  },
  placeOfBirth: {
    type: String,
  },
  nationality: {
    type: String,
    default: 'Nigerian'
  },
  issueDate: {
    type: String,
  },
  expiryDate: {
    type: String,

  },
  issuingAuthority: {
    type: String,
    
    default: 'Nigeria Immigration Service'
  },
  passportType: {
    type: String,
      default: 'P'
  },
  photo_filename: {
    type: String,
  },


}, {
  timestamps: true
});

module.exports = mongoose.model('PassportRecord', passportRecordSchema);