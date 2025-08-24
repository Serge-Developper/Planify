const fs = require('fs');
const path = require('path');

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

    if (!ALLOWED_FOLDERS.has(folder) || !filename) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Chemin de fichier invalide' })
      };
    }

    // Interdire toute traversée de répertoire
    if (filename.includes('..')) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Nom de fichier invalide' })
      };
    }

    // Chercher le fichier dans les répertoires connus
    let filePath = null;
    for (const base of PUBLIC_DIRS) {
      const p = path.join(base, folder, filename);
      if (fs.existsSync(p)) { filePath = p; break; }
    }

    if (!filePath) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Fichier non trouvé' })
      };
    }

    const ext = path.extname(filePath);
    const mime = mimeFromExt(ext);
    const data = fs.readFileSync(filePath);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
      body: data.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Erreur uploads:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Erreur serveur interne' })
    };
  }
};