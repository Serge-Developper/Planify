import mongoose from 'mongoose';

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
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);
