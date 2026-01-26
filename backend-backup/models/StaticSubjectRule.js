const mongoose = require('mongoose');

const staticSubjectRuleSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, unique: true },
  yearsAllowed: [{ type: String }],
  groupsAllowed: [{ type: String }],
  specialitesAllowed: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('StaticSubjectRule', staticSubjectRuleSchema);