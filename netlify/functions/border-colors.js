const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Connexion Mongo
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI manquant');
  await mongoose.connect(uri);
  isConnected = true;
}

// Modèle BorderColor
const borderColorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, default: null },
  gradient: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});
const BorderColor = mongoose.models.BorderColor || mongoose.model('BorderColor', borderColorSchema);

// Auth admin
function verifyAdmin(event) {
  const hdr = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!hdr) throw new Error('Non autorisé');
  const token = hdr.startsWith('Bearer ')? hdr.slice(7): hdr;
  const secret = process.env.JWT_SECRET;
  const decoded = jwt.verify(token, secret || 'your-super-secret-jwt-key-change-this-in-production');
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'prof')) throw new Error('Non autorisé');
  return decoded;
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    await connectDB();

    if (event.httpMethod === 'GET') {
      const list = await BorderColor.find({}).sort({ createdAt: -1 }).lean();
      return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, colors: list }) };
    }

    if (event.httpMethod === 'POST') {
      try { verifyAdmin(event); } catch { return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ success:false, message:'Non autorisé' }) }; }
      const body = JSON.parse(event.body || '{}');
      const id = String(body.id || '').trim() || String(body.colorId || '').trim();
      const name = String(body.name || '').trim() || id;
      const color = body.color ? String(body.color) : null;
      const gradient = body.gradient ? String(body.gradient) : null;
      if (!id) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success:false, message:'id requis' }) };
      const exists = await BorderColor.findOne({ id });
      if (exists) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success:false, message:'id déjà utilisé' }) };
      const doc = await BorderColor.create({ id, name, color, gradient });
      return { statusCode: 201, headers: corsHeaders, body: JSON.stringify({ success:true, color: doc }) };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ success:false, message:'Méthode non autorisée' }) };
  } catch (e) {
    console.error('Erreur border-colors:', e);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success:false, message:'Erreur serveur interne' }) };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      isConnected = false;
    }
  }
};

