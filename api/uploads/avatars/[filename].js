import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'Nom de fichier requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Chercher l'utilisateur avec cet avatar
    const user = await db.collection('users').findOne(
      { avatar: filename },
      { projection: { avatar: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user || !user.avatar) {
      return res.status(404).json({ error: 'Avatar non trouvé' });
    }
    
    // Retourner l'image depuis la base de données
    // Note: Si l'avatar est stocké comme Buffer dans la DB, on le retourne directement
    // Si c'est une URL externe, on redirige vers cette URL
    
    if (user.avatar.startsWith('data:image/')) {
      // Image encodée en base64
      const base64Data = user.avatar.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } else if (user.avatar.startsWith('http')) {
      // URL externe - rediriger
      res.redirect(user.avatar);
    } else {
      // Par défaut, retourner une image par défaut
      res.status(404).json({ error: 'Format d\'avatar non supporté' });
    }
    
  } catch (error) {
    console.error('Erreur récupération avatar:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
