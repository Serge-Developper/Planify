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

// Asset binaire stocké en DB pour les items
const itemAssetSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  data: String, // base64
  size: Number,
  createdAt: { type: Date, default: Date.now }
});
const ItemAsset = mongoose.models.ItemAsset || mongoose.model('ItemAsset', itemAssetSchema);

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

    // POST /api/items/upload (admin) - multipart/form-data; champ "files"
    if (event.httpMethod === 'POST' && /\/items\/upload$/.test(event.path || '')) {
      const user = verifyToken(event);
      const u = await User.findById(user.id || user._id).lean();
      if (!u || u.role !== 'admin') {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Non autorisé' }) };
      }

      const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'multipart/form-data requis' }) };
      }
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'boundary manquant' }) };
      }
      const raw = Buffer.from(event.body || '', 'base64').toString('binary');
      const parts = raw.split(`--${boundary}`);
      const saved = [];
      for (const part of parts) {
        if (!part.includes('Content-Disposition')) continue;
        if (!/name="files"/.test(part)) continue;
        const filenameLine = part.split(/\r\n/).find(l => l.includes('filename='));
        if (!filenameLine) continue;
        const filename = filenameLine.split('filename=')[1].replace(/"/g, '') || `item-${Date.now()}`;
        const typeLine = part.split(/\r\n/).find(l => l.startsWith('Content-Type:')) || 'Content-Type: application/octet-stream';
        const mimetype = typeLine.split(': ')[1] || 'application/octet-stream';
        const start = part.indexOf('\r\n\r\n');
        if (start === -1) continue;
        const fileContent = part.substring(start + 4, part.lastIndexOf('\r\n'));
        const buffer = Buffer.from(fileContent, 'binary');
        const unique = `item-${Date.now()}-${Math.round(Math.random()*1e9)}${(filename.match(/\.[^.]+$/) || [''])[0]}`;

        await ItemAsset.create({ filename: unique, mimetype, data: buffer.toString('base64'), size: buffer.length });
        saved.push({ filename: unique, url: `/uploads/items/${unique}`, mimetype });
      }

      if (!saved.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Aucun fichier trouvé' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, files: saved }) };
    }

    // GET /api/uploads/items/:filename -> renvoyer data base64 pour affichage
    if (event.httpMethod === 'GET' && /\/uploads\/items\//.test(event.path || '')) {
      const p = event.path || '';
      const m = p.match(/uploads\/items\/(.+)$/);
      const filename = m && m[1] ? m[1] : null;
      if (!filename) return { statusCode: 404, headers, body: JSON.stringify({ success: false }) };
      const doc = await ItemAsset.findOne({ filename }).lean();
      if (!doc) return { statusCode: 404, headers, body: JSON.stringify({ success: false }) };
      // Pour rester cohérent avec l’UI actuelle qui attend une URL, on renvoie un JSON contenant une data URL
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, file: { filename, mimetype: doc.mimetype, dataUrl: `data:${doc.mimetype};base64,${doc.data}` } })
      };
    }

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