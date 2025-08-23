import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { action } = req.query;

  if (!action) {
    return res.status(400).json({ error: 'Paramètre "action" requis' });
  }

  // Définir allItems au début pour éviter l'erreur "used before assigned"
  const allItems = [
    { name: 'Bordure Rouge', type: 'border', color: '#ff0000', price: 100, rarity: 'common' },
    { name: 'Bordure Bleue', type: 'border', color: '#0000ff', price: 100, rarity: 'common' },
    { name: 'Bordure Verte', type: 'border', color: '#00ff00', price: 100, rarity: 'common' },
    { name: 'Bordure Jaune', type: 'border', color: '#ffff00', price: 100, rarity: 'common' },
    { name: 'Bordure Orange', type: 'border', color: '#ffa500', price: 150, rarity: 'uncommon' },
    { name: 'Bordure Violette', type: 'border', color: '#800080', price: 150, rarity: 'uncommon' },
    { name: 'Bordure Rose', type: 'border', color: '#ffc0cb', price: 150, rarity: 'uncommon' },
    { name: 'Bordure Dorée', type: 'border', color: '#ffd700', price: 300, rarity: 'rare' },
    { name: 'Bordure Arc-en-ciel', type: 'border', color: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', price: 500, rarity: 'epic' },
    { name: 'Bordure Cristal', type: 'border', color: 'rgba(255, 255, 255, 0.8)', price: 750, rarity: 'legendary' }
  ];

  // Vérification du token JWT pour toutes les actions sauf weekly-items
  let decoded = null;
  if (action !== 'weekly-items') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const token = authHeader.substring(7);
    
    try {
      const jwt = await import('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: 'JWT_SECRET non configuré' });
      }
      decoded = jwt.verify(token, jwtSecret);
      
      if (typeof decoded === 'string') {
        return res.status(401).json({ error: 'Token invalide' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();

    switch (action) {
      case 'user-coins':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        const user = await db.collection('users').findOne(
          { username: decoded.username },
          { projection: { coins: 1, _id: 0 } }
        );
        
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.status(200).json({ coins: user.coins || 0 });
        break;

      case 'inventory':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        const userInventory = await db.collection('users').findOne(
          { username: decoded.username },
          { projection: { inventory: 1, equippedItems: 1, _id: 0 } }
        );
        
        if (!userInventory) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Ajouter automatiquement "Bordure Classique" si pas présent
        let inventory = userInventory.inventory || [];
        if (!inventory.some(item => item.name === 'Bordure Classique')) {
          inventory.push({
            name: 'Bordure Classique',
            type: 'border',
            color: '#000000',
            rarity: 'common'
          });
          
          await db.collection('users').updateOne(
            { username: decoded.username },
            { $addToSet: { inventory: { name: 'Bordure Classique', type: 'border', color: '#000000', rarity: 'common' } } }
          );
        }
        
        res.status(200).json({ 
          inventory: inventory,
          equippedItems: userInventory.equippedItems || {}
        });
        break;

      case 'spin-status':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        const userSpin = await db.collection('users').findOne(
          { username: decoded.username },
          { projection: { lastSpinDate: 1, _id: 0 } }
        );
        
        if (!userSpin) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const now = new Date();
        const lastSpin = userSpin.lastSpinDate ? new Date(userSpin.lastSpinDate) : null;
        const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000;
        
        res.status(200).json({ 
          canSpin,
          lastSpinDate: lastSpin,
          nextSpinAvailable: lastSpin ? new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000) : null
        });
        break;

      case 'weekly-items':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        // Générer un seed basé sur la date (change chaque jour)
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        // Fonction de shuffle basée sur le seed
        const shuffled = [...allItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor((seed + i) % (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Prendre les 6 premiers items
        const weeklyItems = shuffled.slice(0, 6);
        
        res.status(200).json({ items: weeklyItems });
        break;

      case 'purchase':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        const { itemName } = req.body;
        if (!itemName) {
          return res.status(400).json({ error: 'Nom de l\'item requis' });
        }
        
        // Trouver l'item dans la liste des items disponibles
        const itemToBuy = allItems.find(item => item.name === itemName);
        if (!itemToBuy) {
          return res.status(404).json({ error: 'Item non trouvé' });
        }
        
        // Vérifier si l'utilisateur a assez de coins
        const userForPurchase = await db.collection('users').findOne({ username: decoded.username });
        if (!userForPurchase) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        if (userForPurchase.coins < itemToBuy.price) {
          return res.status(400).json({ error: 'Coins insuffisants' });
        }
        
        // Effectuer l'achat
        await db.collection('users').updateOne(
          { username: decoded.username },
          { 
            $inc: { coins: -itemToBuy.price },
            $addToSet: { inventory: itemToBuy }
          }
        );
        
        res.status(200).json({ 
          success: true, 
          message: 'Achat effectué avec succès',
          newBalance: userForPurchase.coins - itemToBuy.price
        });
        break;

      case 'equip':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        const { itemName: itemToEquip } = req.body;
        if (!itemToEquip) {
          return res.status(400).json({ error: 'Nom de l\'item requis' });
        }
        
        // Vérifier que l'utilisateur possède l'item
        const userForEquip = await db.collection('users').findOne({ username: decoded.username });
        if (!userForEquip) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const hasItem = userForEquip.inventory && userForEquip.inventory.some(item => item.name === itemToEquip);
        if (!hasItem) {
          return res.status(400).json({ error: 'Vous ne possédez pas cet item' });
        }
        
        // Équiper l'item
        await db.collection('users').updateOne(
          { username: decoded.username },
          { $set: { [`equippedItems.${itemToEquip}`]: true } }
        );
        
        res.status(200).json({ success: true, message: 'Item équipé avec succès' });
        break;

      case 'unequip':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        const { itemName: itemToUnequip } = req.body;
        if (!itemToUnequip) {
          return res.status(400).json({ error: 'Nom de l\'item requis' });
        }
        
        // Déséquiper l'item
        await db.collection('users').updateOne(
          { username: decoded.username },
          { $unset: { [`equippedItems.${itemToUnequip}`]: "" } }
        );
        
        res.status(200).json({ success: true, message: 'Item déséquipé avec succès' });
        break;

      case 'spin-wheel':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Méthode non autorisée' });
        }
        
        if (!decoded || !decoded.username) {
          return res.status(401).json({ error: 'Token invalide' });
        }
        
        // Vérifier si l'utilisateur peut tourner
        const userForSpin = await db.collection('users').findOne({ username: decoded.username });
        if (!userForSpin) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        const nowForSpin = new Date();
        const lastSpinForSpin = userForSpin.lastSpinDate ? new Date(userForSpin.lastSpinDate) : null;
        const canSpinWheel = !lastSpinForSpin || (nowForSpin.getTime() - lastSpinForSpin.getTime()) >= 24 * 60 * 60 * 1000;
        
        if (!canSpinWheel) {
          return res.status(400).json({ error: 'Vous devez attendre 24h entre chaque tour' });
        }
        
        // Générer une récompense aléatoire
        const rewards = [10, 20, 30, 50, 100, 200];
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        
        // Mettre à jour les coins et la date du dernier tour
        await db.collection('users').updateOne(
          { username: decoded.username },
          { 
            $inc: { coins: randomReward },
            $set: { lastSpinDate: nowForSpin }
          }
        );
        
        res.status(200).json({ 
          success: true, 
          reward: randomReward,
          newBalance: userForSpin.coins + randomReward
        });
        break;

      default:
        res.status(400).json({ error: 'Action non reconnue' });
        break;
    }

    await client.close();
  } catch (error) {
    console.error('Erreur API coins:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
