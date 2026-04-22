// @ts-nocheck
const mongoose = require('mongoose');

const redeemedBySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now }
}, { _id: false });

const redeemCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true }, // ex: 8 ou 10 chars, MAJ
  rewardType: { type: String, enum: ['item', 'border-color'], required: true },
  payload: {
    // item (compat)
    itemId: { type: Number, default: null },
    itemName: { type: String, default: null },
    // multi-items
    items: {
      type: [{ itemId: Number, itemName: String }],
      default: []
    },
    // border color (compat)
    colorId: { type: String, default: null },
    // multi-colors
    colors: {
      type: [String],
      default: []
    }
  },
  maxUses: { type: Number, default: 1, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, default: null },
  redeemedBy: { type: [redeemedBySchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RedeemCode', redeemCodeSchema);