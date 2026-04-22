const mongoose = require('mongoose');

const coinsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  lastSpinDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coins', coinsSchema); 