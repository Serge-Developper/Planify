const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  color: { type: String, required: true },
  color2: { type: String, default: null },
  useGradient: { type: Boolean, default: false },
  gradientAngle: { type: Number, default: 135 },
  colorOpacity: { type: Number, default: 1 },
  color2Opacity: { type: Number, default: 1 },
  yearsAllowed: { type: [String], default: [] },
  groupsAllowed: { type: [String], default: [] },
  specialitesAllowed: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);

