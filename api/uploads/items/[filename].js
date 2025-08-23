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
    
    // Chercher l'item avec cette image
    const item = await db.collection('items').findOne(
      { image: filename },
      { projection: { image: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!item || !item.image) {
      return res.status(404).json({ error: 'Image d\'item non trouvée' });
    }
    
    // Retourner l'image depuis la base de données
    if (item.image.startsWith('data:image/')) {
      // Image encodée en base64
      const base64Data = item.image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } else if (item.image.startsWith('http')) {
      // URL externe - rediriger
      res.redirect(item.image);
    } else {
      // Par défaut, retourner une image par défaut
      res.status(404).json({ error: 'Format d\'image non supporté' });
    }
    
  } catch (error) {
    console.error('Erreur récupération image item:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
