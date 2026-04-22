const mongoose = require('mongoose');

const factionSchema = new mongoose.Schema({
  name: { type: String, enum: ['Bagnat','Fermier'], required: true, unique: true },
  totalCoins: { type: Number, default: 0 },
  membersCount: { type: Number, default: 0 },
  leaderboardCoinPrice: { type: Number, default: 1 },
  winnerMessage: { type: String, default: 'Votre faction a gagné 🎉' },
  loserMessage: { type: String, default: 'Votre faction fera mieux la prochaine fois 💪' },
  lastMonthlyRewardsMonth: { type: String, default: null },
  lastMonthlyFactionResetMonth: { type: String, default: null },
  lastMonthlyLeaderboardResetMonth: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Faction', factionSchema);