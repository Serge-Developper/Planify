const mongoose = require('mongoose');

const styleSchema = new mongoose.Schema({
  top: { type: Number, default: 0 },
  left: { type: Number, default: 0 },
  width: { type: Number, default: 100 },
  height: { type: Number, default: null },
  rotate: { type: Number, default: 0 },
  objectFit: { type: String, default: 'contain' },
  zIndex: { type: Number, default: 1 },
  margin: { type: Number, default: 0 },
  padding: { type: Number, default: 0 },
  background: { type: String, default: '' },
  boxShadow: { type: String, default: '' },
  borderWidth: { type: Number, default: 0 },
  borderStyle: { type: String, default: 'none' },
  borderColor: { type: String, default: '' },
  borderRadius: { type: Number, default: 0 },
  centered: { type: Boolean, default: false }
}, { _id: false });

const assetSchema = new mongoose.Schema({
  src: { type: String, required: true }, // chemin relatif sous /uploads/items
  style: { type: styleSchema, default: () => ({}) },
  collectionStyle: { type: styleSchema, default: null },
  collectionStyleMobile: { type: styleSchema, default: null },
  leaderboardStyle: { type: styleSchema, default: null },
  leaderboardStyleMobile: { type: styleSchema, default: null },
  avatarStyle: { type: styleSchema, default: null },
  avatarStyleMobile: { type: styleSchema, default: null },
  navbarStyle: { type: styleSchema, default: null },
  navbarStyleMobile: { type: styleSchema, default: null },
  popupStyleStyle: { type: styleSchema, default: null },
  profilePopupStyle: { type: styleSchema, default: null },
  profilePopupStyleMobile: { type: styleSchema, default: null },
  profilePopupStylePc: { type: styleSchema, default: null },
  largeAvatarStyle: { type: styleSchema, default: null },
  largeAvatarStyleMobile: { type: styleSchema, default: null },
  cosmeticPreviewStyle: { type: styleSchema, default: null },
  cosmeticPreviewStyleMobile: { type: styleSchema, default: null },
  dailyStyle: { type: styleSchema, default: null },
  meta: { type: Object, default: {} }
}, { _id: false });

// Schéma explicite pour les variantes afin d'assurer la persistance correcte
const variantSchema = new mongoose.Schema({
  name: { type: String, default: 'Style' },
  assets: { type: [assetSchema], default: [] },
  backgrounds: {
    collection: { type: String, default: null },
    leaderboard: { type: String, default: null },
    avatar: { type: String, default: null },
    navbar: { type: String, default: null },
    'popup-style': { type: String, default: null },
    'profile-popup': { type: String, default: null }
  },
  navbarPlacements: { type: [String], default: [] },
  showText: { type: Boolean, default: false }, // Afficher le texte "Par défaut" au lieu de l'image
  textOnly: { type: Boolean, default: false }, // Style avec texte uniquement (pas d'images)
  textContent: { type: String, default: '' }, // Texte à afficher pour ce style
  removeNavbarBorder: { type: Boolean, default: false },
  removeLeaderboardBorder: { type: Boolean, default: false },
  removeProfilePopupBorder: { type: Boolean, default: false }
}, { _id: false });

const itemSchema = new mongoose.Schema({
  legacyId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, default: 'generic' },
  // Affichage info-only (pas d'achat, juste une icône info avec description)
  infoOnly: { type: Boolean, default: false },
  infoDescription: { type: String, default: null },

  assets: { type: [assetSchema], default: [] },
  backgrounds: {
    collection: { type: String, default: null },
    leaderboard: { type: String, default: null },
    avatar: { type: String, default: null },
    navbar: { type: String, default: null },
    'popup-style': { type: String, default: null },
    'profile-popup': { type: String, default: null }
  },
  availableInDailyShop: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  // Variantes de style optionnelles (pour sélection de style dans la boutique)
  variants: { type: [variantSchema], default: [] },
  meta: { type: Object, default: {} }
});

module.exports = mongoose.model('Item', itemSchema);