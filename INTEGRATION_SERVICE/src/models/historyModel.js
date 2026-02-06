const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true,
  },
  requestId:{
    type:String
  },
   serviceType: {
    type: String,
    enum: ['NIN', 'BVN', 'DRIVERS_LICENSE', 'PASSPORT'],
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
  },
  errorMessage: {
    type: String
  },
  errorCode: {
    type: String
  },
  
}, {
  timestamps: true
});

module.exports = mongoose.model('History', historySchema);