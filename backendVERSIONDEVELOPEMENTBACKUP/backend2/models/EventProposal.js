const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  filename: String,
  url: String,
  mime: String,
  size: Number,
  originalname: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

const EventProposalSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  date: { type: String, required: true },
  heure: { type: String, required: true },
  groupe: { type: String, required: true },
  groupes: [{ type: String }],
  type: { type: String, required: true },
  matiere: { type: String, required: true },
  specialite: { type: String, default: '' },
  year: { type: String, required: true },
  description: { type: String, default: '' },
  submissionEnabled: { type: Boolean, default: false },
  groupWorkEnabled: { type: Boolean, default: false },
  workGroupsDraft: [{ name: String, capacity: Number }],
  attachments: [AttachmentSchema],
  checkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  acceptedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'validated', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventProposal', EventProposalSchema);