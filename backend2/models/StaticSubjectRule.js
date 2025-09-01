const mongoose = require('mongoose');

const staticSubjectRuleSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, unique: true, trim: true },
  yearsAllowed: { type: [String], default: [] },
  groupsAllowed: { type: [String], default: [] },
  specialitesAllowed: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('StaticSubjectRule', staticSubjectRuleSchema);

