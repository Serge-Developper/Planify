const mongoose = require('mongoose');

const dailyShopSchema = new mongoose.Schema({
  daySeed: { type: String, required: true, unique: true }, // format YYYY-MM-DD (Europe/Paris)
  itemIds: { type: [Number], default: [] }, // sélection courante (3 ids)
  colorIds: { type: [Number], default: [] }, // sélection courante (3 ids)
  seenItemIds: { type: [Number], default: [] }, // union des items montrés ce jour
  seenColorIds: { type: [Number], default: [] }, // union des couleurs montrées ce jour
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DailyShop', dailyShopSchema);

