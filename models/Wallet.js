
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: true,
    unique: true
  },
  encryptedSeed: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'ETH'
  },
  balance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
walletSchema.index({ userId: 1 });
walletSchema.index({ address: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
