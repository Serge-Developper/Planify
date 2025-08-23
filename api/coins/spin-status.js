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
      { projection: { lastSpinDate: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const now = new Date();
    const lastSpin = user.lastSpinDate ? new Date(user.lastSpinDate) : null;
    
    // Vérifier si l'utilisateur peut tourner aujourd'hui
    let canSpin = true;
    if (lastSpin) {
      const lastSpinDate = new Date(lastSpin);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastSpinDay = new Date(lastSpinDate.getFullYear(), lastSpinDate.getMonth(), lastSpinDate.getDate());
      
      canSpin = lastSpinDay.getTime() !== today.getTime();
    }

    res.json({
      canSpin: canSpin,
      lastSpinDate: lastSpin
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut de spin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
