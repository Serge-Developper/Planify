const mongoose = require('mongoose');

const borderColorSchema = new mongoose.Schema({
  // Identifiant métier de la couleur (ex: "gradient-mint", "royal-blue")
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, default: null },
  gradient: { type: String, default: null },
  // Optionnel: mapping vers un legacyId d'item si nécessaire (pour affichage boutique/ADMIN)
  legacyId: { type: Number, default: null },
  price: { type: Number, default: 0 },
  availableInDailyShop: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BorderColor', borderColorSchema);