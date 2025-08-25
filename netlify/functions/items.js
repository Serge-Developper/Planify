const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(mongoUri);
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

// User (minimal) pour vérifier le rôle
const userSchema = new mongoose.Schema({ role: String });
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Helpers
const verifyToken = (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader) throw new Error('Non autorisé');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Non autorisé');
  try { return jwt.verify(token, secret); } catch { throw new Error('Non autorisé'); }
};

const getPathId = (event) => {
  const qs = event.queryStringParameters || {};
  if (qs.id || qs.itemId) return qs.id || qs.itemId;
  const p = event.path || event.rawPath || '';
  const m = p.match(/items\/(?:\.netlify\/functions\/)?items\/([^\/]+)$/) || p.match(/items\/([^\/]+)$/);
  return m && m[1] ? m[1] : null;
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async (event, context) => {
  // Headers pour CORS
  const headers = corsHeaders;
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    await connectDB();

    // GET /api/items or /api/items/:id
    if (event.httpMethod === 'GET') {
      const id = getPathId(event);
      if (id) {
        const doc = await Item.findById(id).lean();
        if (!doc) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Item introuvable' }) };
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, item: doc }) };
      }
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
      
      return { statusCode: 200, headers, body: JSON.stringify({ 
        success: true, 
        items: itemsWithVariants 
      }) };
    }

    // POST /api/items - create (admin only)
    if (event.httpMethod === 'POST') {
      const user = verifyToken(event);
      const u = await User.findById(user.id || user._id).lean();
      if (!u || (u.role !== 'admin')) return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Non autorisé' }) };
      const body = JSON.parse(event.body || '{}');
      if (typeof body.legacyId !== 'number' || !body.name) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'legacyId et name requis' }) };
      }
      const exists = await Item.findOne({ legacyId: body.legacyId });
      if (exists) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'legacyId déjà utilisé' }) };
      const doc = await Item.create({ ...body, createdBy: user.id || user._id, active: true });
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, item: doc }) };
    }

    // PUT /api/items/:id - update (admin only)
    if (event.httpMethod === 'PUT') {
      const user = verifyToken(event);
      const u = await User.findById(user.id || user._id).lean();
      if (!u || (u.role !== 'admin')) return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Non autorisé' }) };
      const id = getPathId(event);
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'ID manquant' }) };
      const body = JSON.parse(event.body || '{}');
      const doc = await Item.findByIdAndUpdate(id, body, { new: true });
      if (!doc) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Item introuvable' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, item: doc }) };
    }

    // DELETE /api/items/:id - delete (admin only)
    if (event.httpMethod === 'DELETE') {
      const user = verifyToken(event);
      const u = await User.findById(user.id || user._id).lean();
      if (!u || (u.role !== 'admin')) return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Non autorisé' }) };
      const id = getPathId(event);
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'ID manquant' }) };
      const doc = await Item.findByIdAndDelete(id);
      if (!doc) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Item introuvable' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Item supprimé' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };

  } catch (error) {
    console.error('Erreur API items:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        success: false, 
        message: 'Erreur API items' 
      })
    };
  }
};