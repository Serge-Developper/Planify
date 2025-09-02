const mongoose = require('mongoose');

const staticSubjectRuleSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, trim: true },
  yearsAllowed: [{ type: String }],
  groupsAllowed: [{ type: String }],
  specialitesAllowed: [{ type: String }],
}, { timestamps: true });

staticSubjectRuleSchema.index({ subjectName: 1 }, { unique: true });

module.exports = mongoose.model('StaticSubjectRule', staticSubjectRuleSchema);

