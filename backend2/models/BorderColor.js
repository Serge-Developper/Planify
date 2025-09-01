const mongoose = require('mongoose');

const BorderColorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // identifiant lisible (ex: red, royal-blue)
  name: { type: String, required: true },
  color: { type: String, default: null }, // ex: #ff0000 ou rgba(...)
  gradient: { type: String, default: null }, // ex: linear-gradient(...)
  price: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BorderColor', BorderColorSchema);

