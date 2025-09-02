const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  color: { type: String, default: '#6db4ff' },
  color2: { type: String, default: null },
  gradientAngle: { type: Number, default: 90 },
  colorOpacity: { type: Number, default: null },
  color2Opacity: { type: Number, default: null },
  yearsAllowed: [{ type: String }], // ex: ['BUT1','BUT2','BUT3']
  groupsAllowed: [{ type: String }], // ex: ['A','A\'','A"','B','B\'','B"','Promo']
  specialitesAllowed: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);

