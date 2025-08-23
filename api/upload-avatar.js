import { MongoClient } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🚀 Upload avatar demandé');
    
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }
    
    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }
    
    let decoded;
    try {
      decoded = jwt.default.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    const userId = typeof decoded === 'string' ? null : decoded.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    // Vérifier que le body contient des données
    if (!req.body || !req.body.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    // Décoder le fichier base64
    const base64Data = req.body.file;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format de fichier invalide' });
    }
    
    const mimeType = matches[1];
    const base64Buffer = matches[2];
    const buffer = Buffer.from(base64Buffer, 'base64');
    
    // Vérifier le type MIME
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Le fichier doit être une image' });
    }
    
    // Vérifier la taille (5MB max)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Le fichier est trop volumineux. Taille maximale : 5MB' });
    }
    
    // Déterminer l'extension
    let extension = '.png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = '.jpg';
    else if (mimeType === 'image/gif') extension = '.gif';
    else if (mimeType === 'image/webp') extension = '.webp';
    
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const filename = `avatar-${timestamp}-${random}${extension}`;
    
    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.log('Dossier uploads déjà existant');
    }
    
    // Sauvegarder le fichier
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    
    console.log('✅ Fichier sauvegardé:', filePath);
    
    // Mettre à jour la base de données
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Supprimer l'ancien avatar s'il existe
    const user = await db.collection('users').findOne({ _id: userId });
    if (user && user.avatar) {
      const oldAvatarPath = join(process.cwd(), 'public', user.avatar);
      try {
        await import('fs/promises').then(fs => fs.unlink(oldAvatarPath));
        console.log('🗑️ Ancien avatar supprimé');
      } catch (error) {
        console.log('⚠️ Ancien avatar non trouvé sur le disque');
      }
    }
    
    // Mettre à jour le chemin de l'avatar en base
    const newAvatarPath = `/uploads/avatars/${filename}`;
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { avatar: newAvatarPath } }
    );
    
    await client.close();
    
    console.log('✅ Avatar mis à jour en base:', newAvatarPath);
    
    res.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      avatar: newAvatarPath
    });
    
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'upload de l\'avatar' 
    });
  }
}
