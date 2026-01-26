const mongoose = require('mongoose');

const factionSchema = new mongoose.Schema({
  name: { type: String, enum: ['Bagnat','Fermier'], required: true, unique: true },
  totalCoins: { type: Number, default: 0 },
  membersCount: { type: Number, default: 0 },
  leaderboardCoinPrice: { type: Number, default: 1 },
  lastBalancedMonth: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Faction', factionSchema);