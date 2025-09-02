const mongoose = require('mongoose');

const staticSubjectRuleSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  yearsAllowed: {
    type: [String],
    default: [],
    enum: ['BUT1', 'BUT2', 'BUT3', '']
  },
  groupsAllowed: {
    type: [String],
    default: [],
    enum: ['Promo', 'A', 'A\'', 'A"', 'B', 'B\'', 'B"', '']
  },
  specialitesAllowed: {
    type: [String],
    default: [],
    enum: ['gestion', 'devweb', 'creation', '']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
staticSubjectRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

staticSubjectRuleSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('StaticSubjectRule', staticSubjectRuleSchema);