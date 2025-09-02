const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: '#4f46e5'
  },
  color2: {
    type: String,
    default: null
  },
  gradientAngle: {
    type: Number,
    default: 135,
    min: 0,
    max: 360
  },
  colorOpacity: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  },
  color2Opacity: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
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
subjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

subjectSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Subject', subjectSchema);