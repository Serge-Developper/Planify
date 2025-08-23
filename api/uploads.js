import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Extraire le chemin du fichier depuis l'URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = url.pathname.replace('/api/uploads/', '');
    
    if (!filePath) {
      return res.status(400).json({ error: 'Chemin de fichier requis' });
    }

    // Sécuriser le chemin pour éviter les attaques de traversal
    if (filePath.includes('..') || filePath.includes('//')) {
      return res.status(400).json({ error: 'Chemin de fichier invalide' });
    }

    // Construire le chemin complet vers le fichier
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);
    
    // Vérifier que le fichier existe
    try {
      const fileBuffer = await readFile(fullPath);
      
      // Déterminer le type MIME basé sur l'extension
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      let contentType = 'application/octet-stream';
      
      if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'svg') contentType = 'image/svg+xml';
      
      // Définir les headers de cache pour optimiser les performances
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
      res.setHeader('Content-Length', fileBuffer.length);
      
      res.status(200).send(fileBuffer);
    } catch (fileError) {
      console.log(`Fichier non trouvé: ${filePath}, utilisation d'une image par défaut`);
      
      // Retourner une image par défaut au lieu d'une erreur 404
      // Créer une image PNG simple (1x1 pixel transparent)
      const defaultImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
        0x1F, 0x15, 0xC4, 0x89, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
        0xE2, 0x21, 0xBC, 0x33, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
      ]);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 heure pour les images par défaut
      res.setHeader('Content-Length', defaultImageBuffer.length);
      
      res.status(200).send(defaultImageBuffer);
    }
    
  } catch (error) {
    console.error('Erreur lors du service du fichier:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
