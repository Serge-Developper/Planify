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

  // Vérifier l'authentification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  const token = authHeader.substring(7);
  let decoded = null;

  try {
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }
    
    decoded = jwt.default.verify(token, jwtSecret);
    
    if (typeof decoded === 'string') {
      return res.status(401).json({ error: 'Token invalide' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  if (!decoded || !decoded.username) {
    return res.status(401).json({ error: 'Token invalide - pas de username' });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: decoded.username },
      { projection: { purchasedItems: 1, equippedItemId: 1, selectedBorderColor: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // S'assurer que l'item "Bordure Classique" est toujours présent
    let inventory = user.purchasedItems || [];
    if (!inventory.some(item => item.itemId === 0)) {
      inventory.push({
        itemId: 0,
        itemName: 'Bordure Classique',
        purchaseDate: new Date(),
        equipped: false
      });
    }

    res.json({
      inventory: inventory,
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
