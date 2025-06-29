const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  date: { type: String, required: true },
  heure: { type: String, required: true },
  groupe: { type: String, required: true },
  type: { type: String, required: true }, // 'exam' ou 'devoir'
  matiere: { type: String, required: true },
  year: { type: Number, required: true },
  archivedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  checkedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Event', eventSchema);