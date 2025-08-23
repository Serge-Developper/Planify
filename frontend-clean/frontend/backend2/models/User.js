const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3'], default: null },
  avatar: { type: String, default: null }, // Chemin vers l'image de profil
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  coins: { type: Number, default: 0 }, // PlanifyCoins
  completedTasks: { type: Number, default: 0 }, // Nombre de tâches complétées
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false }
  }],
  equippedItemId: { type: Number, default: null },
  lastSpinDate: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema); 