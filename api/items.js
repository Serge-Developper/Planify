const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    throw error;
  }
};

// Style Schema
const styleSchema = new mongoose.Schema({
  top: { type: Number, default: 0 },
  left: { type: Number, default: 0 },
  width: { type: Number, default: 100 },
  height: { type: Number, default: null },
  rotate: { type: Number, default: 0 },
  objectFit: { type: String, default: 'contain' },
  zIndex: { type: Number, default: 1 }
}, { _id: false });

// Asset Schema
const assetSchema = new mongoose.Schema({
  src: { type: String, required: true },
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
  meta: { type: Object, default: {} }
}, { _id: false });

// Variant Schema
const variantSchema = new mongoose.Schema({
  name: { type: String, default: 'Style' },
  assets: { type: [assetSchema], default: [] },
  backgrounds: {
    collection: { type: String, default: null },
    leaderboard: { type: String, default: null },
    avatar: { type: String, default: null },
    navbar: { type: String, default: null },
    'popup-style': { type: String, default: null }
  },
  showText: { type: Boolean, default: false },
  textOnly: { type: Boolean, default: false },
  textContent: { type: String, default: '' }
}, { _id: false });

// Item Schema
const itemSchema = new mongoose.Schema({
  legacyId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, default: 'generic' },
  infoOnly: { type: Boolean, default: false },
  infoDescription: { type: String, default: null },
  assets: { type: [assetSchema], default: [] },
  backgrounds: {
    collection: { type: String, default: null },
    leaderboard: { type: String, default: null },
    avatar: { type: String, default: null },
    navbar: { type: String, default: null },
    'popup-style': { type: String, default: null }
  },
  availableInDailyShop: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  variants: { type: [variantSchema], default: [] }
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET /api/items - List all active items
    if (req.method === 'GET') {
      const items = await Item.find({ active: true }).sort({ createdAt: -1 }).lean();
      
      // S'assurer que les variantes sont bien incluses avec tous les champs
      const itemsWithVariants = items.map(item => ({
        ...item,
        variants: Array.isArray(item.variants) ? item.variants.map(v => ({
          ...v,
          showText: !!v.showText,
          textOnly: !!v.textOnly,
          textContent: v.textContent || ''
        })) : []
      }));
      
      return res.status(200).json({ 
        success: true, 
        items: itemsWithVariants 
      });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });

  } catch (error) {
    console.error('Erreur API items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur chargement items' 
    });
  }
};