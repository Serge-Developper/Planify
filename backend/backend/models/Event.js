const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  date: { type: String, required: true },
  heure: { type: String, required: true },
  groupe: { type: String, required: true },
  groupes: [{ type: String }], // Nouveau champ pour supporter plusieurs groupes
  type: { type: String, required: true }, // 'exam' ou 'devoir'
  matiere: { type: String, required: true },
  // Spécialité MMI ciblée (devweb, creation, gestion). Vide = toutes spécialités
  specialite: { type: String, default: '' },
  year: { type: String, required: true }, // Changé de Number à String pour correspondre aux utilisateurs (BUT1, BUT2, etc.)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  archivedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  checkedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  // Masquage individuel: tâches "vidées" par un utilisateur sans affecter les autres
  deletedBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, default: '' },
  archLink: { type: String, default: '' },
  // Ajout: pièces jointes PDF/DOC/DOCX
  attachments: [{
    filename: String,
    url: String,
    mime: String,
    size: Number,
    originalname: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Activation de la boîte de dépôt par le professeur
  submissionEnabled: { type: Boolean, default: false },
  submissions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    files: [{
      filename: String,
      originalname: String,
      size: Number,
      mimetype: String,
      createdAt: { type: Date, default: Date.now }
    }],
    submittedAt: { type: Date, default: Date.now },
    messageHtml: { type: String, default: '' },
    teacherFeedbacks: [{
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      textHtml: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  // Commentaires sur la tâche
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Event', EventSchema);