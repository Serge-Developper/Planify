const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#3B82F6' },
  color2: { type: String, default: null },
  gradientAngle: { type: Number, default: 135 },
  colorOpacity: { type: Number, default: 1 },
  color2Opacity: { type: Number, default: 1 },
  useGradient: { type: Boolean, default: false },
  yearsAllowed: [{ type: String }],
  groupsAllowed: [{ type: String }],
  specialitesAllowed: [{ type: String }],
  departmentAllowed: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);