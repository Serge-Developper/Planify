// ... existing code ...
const mongoose = require('mongoose');

const patchNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  version: { type: String, default: '' },
  html: { type: String, required: true },
  published: { type: Boolean, default: true },
  notify: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

patchNoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PatchNote', patchNoteSchema);
// ... existing code ...