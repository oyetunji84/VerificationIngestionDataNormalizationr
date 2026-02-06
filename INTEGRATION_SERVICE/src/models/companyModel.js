const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyEmail:{
    type:String,
    required:true,
    unique:true,
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,

    enum: ['active', 'revoked'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);