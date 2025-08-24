const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Répertoire racine où sont stockés les fichiers uploadés lors du build Netlify
// On pointe vers le dossier "public/uploads" du repo si présent, sinon "uploads" à la racine.
const PUBLIC_DIRS = [
  path.join(process.cwd(), 'public', 'uploads'),
  path.join(process.cwd(), 'uploads')
];

const ALLOWED_FOLDERS = new Set(['avatars', 'items']);

const mimeFromExt = (ext) => {
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
};

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI || '', { bufferCommands: false });
  isConnected = true;
}

const avatarSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Avatar = mongoose.models.Avatar || mongoose.model('Avatar', avatarSchema);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Méthode non autorisée' })
    };
  }

  try {
    // Chemins attendus:
    // /.netlify/functions/uploads/avatars/<filename>
    // /.netlify/functions/uploads/items/<filename>
    const rawPath = event.path || event.rawPath || '';
    const marker = '/uploads/';
    const idx = rawPath.indexOf(marker);
    if (idx === -1) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Chemin invalide' })
      };
    }

    const subPath = rawPath.slice(idx + marker.length); // e.g. "avatars/avatar-xxx.png"
    const [folder, filename] = subPath.split('/');

    if (!ALLOWED_FOLDERS.has(folder) || !filename || filename.includes('..')) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Chemin de fichier invalide' })
      };
    }

    // 1) Essai sur disque
    for (const base of PUBLIC_DIRS) {
      const p = path.join(base, folder, filename);
      if (fs.existsSync(p)) {
        const ext = path.extname(p);
        const mime = mimeFromExt(ext);
        const data = fs.readFileSync(p);
        return { statusCode: 200, headers: { ...headers, 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' }, body: data.toString('base64'), isBase64Encoded: true };
      }
    }

    // 2) Fallback: chercher en base (avatars seulement)
    if (folder === 'avatars') {
      try {
        await connectDB();
        const doc = await Avatar.findOne({ filename }).lean();
        if (doc && doc.data) {
          return { statusCode: 200, headers: { ...headers, 'Content-Type': doc.contentType || 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' }, body: Buffer.from(doc.data).toString('base64'), isBase64Encoded: true };
        }
      } catch (e) {
        console.error('Erreur lecture avatar DB:', e);
      }
    }

    return { statusCode: 404, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Fichier non trouvé' }) };
  } catch (error) {
    console.error('Erreur uploads:', error);
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Erreur serveur interne' }) };
  }
};