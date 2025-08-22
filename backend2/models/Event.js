const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  date: { type: String, required: true },
  heure: { type: String, required: true },
  groupe: { type: String, required: true },
  groupes: [{ type: String }], // Nouveau champ pour supporter plusieurs groupes
  type: { type: String, required: true }, // 'exam' ou 'devoir'
  matiere: { type: String, required: true },
  year: { type: String, required: true }, // Changé de Number à String pour correspondre aux utilisateurs (BUT1, BUT2, etc.)
  archivedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  checkedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  // Masquage individuel: tâches "vidées" par un utilisateur sans affecter les autres
  deletedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, default: '' },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);