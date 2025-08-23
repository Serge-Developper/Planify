import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Récupérer les items hebdomadaires
    const weeklyItems = await db.collection('weeklyItems').find({}).toArray();
    
    await client.close();
    
    res.json({ weeklyItems: weeklyItems || [] });
  } catch (error) {
    console.error('Erreur lors de la récupération des items hebdomadaires:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
