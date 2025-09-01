const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true },
  color2: { type: String, default: null },
  gradientAngle: { type: Number, default: 135 },
  colorOpacity: { type: Number, default: 1 },
  color2Opacity: { type: Number, default: 1 },
  useGradient: { type: Boolean, default: false },
  yearsAllowed: { type: [String], default: [] },
  groupsAllowed: { type: [String], default: [] },
  specialitesAllowed: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);

