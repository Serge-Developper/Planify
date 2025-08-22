const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3'], default: null },
  avatar: { type: String, default: null }, // Chemin vers l'image de profil
  coins: { type: Number, default: 0 }, // PlanifyCoins
  completedTasks: { type: Number, default: 0 }, // Nombre de tâches complétées
  validations: { type: Number, default: 0 }, // Nombre de validations
  lastSpinDate: { type: Date, default: null }, // Date du dernier spin
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false }
  }],
  equippedItemId: { type: Number, default: null, required: false }, // ID de l'item actuellement équipé
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
});

module.exports = mongoose.model('User', userSchema); 