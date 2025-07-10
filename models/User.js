
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  hashedPhone: {
    type: String,
    required: true,
    unique: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  verificationReference: String,
  checkoutRequestID: String,
  verifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
userSchema.index({ hashedPhone: 1 });
userSchema.index({ verificationReference: 1 });

module.exports = mongoose.model('User', userSchema);
