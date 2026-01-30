const mongoose = require('mongoose');

const dailyShopSchema = new mongoose.Schema({
  daySeed: { type: String, required: true, unique: true }, // format YYYY-MM-DD (Europe/Paris)
  itemIds: { type: [Number], default: [] }, // 3 ids (legacyId pour dynamiques, ids statiques pour le pool)
  colorIds: { type: [Number], default: [] }, // 3 ids (mapping couleurs)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DailyShop', dailyShopSchema);

