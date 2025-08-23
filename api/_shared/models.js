import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  coins: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: null
  },
  inventory: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    equipped: {
      type: Boolean,
      default: false
    },
    equippedSlot: {
      type: String,
      enum: ['avatar', 'border', 'background'],
      default: 'avatar'
    }
  }],
  secretQuestions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Event Schema
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  location: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Item Schema
const itemSchema = new mongoose.Schema({
  legacyId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['generic', 'discord', 'jojo'],
    default: 'generic'
  },
  infoOnly: {
    type: Boolean,
    default: false
  },
  infoDescription: String,
  availableInDailyShop: {
    type: Boolean,
    default: false
  },
  assets: [{
    src: String,
    style: {
      top: { type: Number, default: 0 },
      left: { type: Number, default: 0 },
      width: { type: Number, default: 100 },
      height: Number,
      rotate: { type: Number, default: 0 },
      objectFit: { type: String, default: 'contain' },
      zIndex: { type: Number, default: 1 }
    }
  }],
  backgrounds: {
    collection: String,
    leaderboard: String,
    avatar: String,
    navbar: String,
    'popup-style': String
  },
  variants: [{
    name: String,
    assets: [{
      src: String,
      style: {
        top: { type: Number, default: 0 },
        left: { type: Number, default: 0 },
        width: { type: Number, default: 100 },
        height: Number,
        rotate: { type: Number, default: 0 },
        objectFit: { type: String, default: 'contain' },
        zIndex: { type: Number, default: 1 }
      }
    }],
    backgrounds: {
      collection: String,
      leaderboard: String,
      avatar: String,
      navbar: String,
      'popup-style': String
    },
    textOnly: { type: Boolean, default: false },
    textContent: String
  }]
});

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);