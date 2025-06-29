const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve'], required: true },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  year: { type: Number, enum: [1, 2, 3], default: null }
});

module.exports = mongoose.model('User', userSchema); 