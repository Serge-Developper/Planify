const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI || '', { useNewUrlParser: true, useUnifiedTopology: true });
  isConnected = true;
}

const userSchema = new mongoose.Schema({
  username: String,
  avatar: String,
  role: String,
  year: String,
  groupe: String,
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const avatarSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Avatar = mongoose.models.Avatar || mongoose.model('Avatar', avatarSchema);

function verifyToken(event) {
  const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const e = new Error('Token manquant'); e.statusCode = 401; throw e;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
  } catch {
    const e = new Error('Token invalide'); e.statusCode = 401; throw e;
  }
}

function parseDataUrl(dataUrl) {
  // data:[mime];base64,<payload>
  const m = /^data:([\w\/\-\.\+]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], 'base64') };
}

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Méthode non autorisée' }) };

  try {
    await connectDB();
    const decoded = verifyToken(event);
    const body = JSON.parse(event.body || '{}');
    const { filename, data } = body;

    if (!filename || !data) {
      return { statusCode: 400, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Paramètres manquants' }) };
    }

    const parsed = parseDataUrl(data) || { contentType: 'application/octet-stream', buffer: Buffer.from(data, 'base64') };

    const safeName = `avatar-${Date.now()}-${Math.floor(Math.random() * 1e9)}${filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '.png'}`;

    // Upsert avatar doc
    await Avatar.findOneAndUpdate(
      { filename: safeName },
      { filename: safeName, contentType: parsed.contentType, data: parsed.buffer, userId: decoded.id || decoded._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mettre à jour le champ avatar de l'utilisateur
    const user = await User.findById(decoded.id || decoded._id);
    if (user) {
      user.avatar = `/uploads/avatars/${safeName}`;
      await user.save();
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, avatar: `/uploads/avatars/${safeName}` })
    };
  } catch (error) {
    const code = error.statusCode || 500;
    return { statusCode: code, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: error.message || 'Erreur serveur' }) };
  }
};