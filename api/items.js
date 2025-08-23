// API pour gérer les items (boutique, inventaire)
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle GET request - Récupérer les items de la boutique
  if (req.method === 'GET') {
    try {
      console.log('🔍 Début de la requête pour récupérer les items');
      
      // Import dynamique des modules
      const { MongoClient } = await import('mongodb');
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      // Connect to MongoDB
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      const db = client.db();
      const itemsCollection = db.collection('items');
      
      // Get all items
      const items = await itemsCollection.find({}).toArray();
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      console.log(`✅ ${items.length} items récupérés`);
      
      // Return items
      res.status(200).json({
        success: true,
        items: items
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des items:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des items',
        error: error.message
      });
    }
  } 
  // Handle POST request - Acheter un item
  else if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête pour acheter un item');
      
      // Import dynamique des modules
      const { MongoClient } = await import('mongodb');
      const jwt = await import('jsonwebtoken');
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET manquant');
        throw new Error('JWT_SECRET environment variable is not set');
      }
      
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Token d\'autorisation manquant');
        return res.status(401).json({
          success: false,
          message: 'Token d\'autorisation requis'
        });
      }
      
      const token = authHeader.substring(7);
      
      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        if (typeof decoded === 'string' || !decoded.username || !decoded.userId) {
          throw new Error('Token invalide - structure incorrecte');
        }
        console.log('✅ Token JWT vérifié pour:', decoded.username);
      } catch (jwtError) {
        console.log('❌ Token JWT invalide');
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }
      
      // Get request body
      const { itemId } = req.body;
      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: 'itemId requis'
        });
      }
      
      // Connect to MongoDB
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      const db = client.db();
      const usersCollection = db.collection('users');
      const itemsCollection = db.collection('items');
      
      // Find user
      const { ObjectId } = await import('mongodb');
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
      
      if (!user) {
        await client.close();
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      // Find item
      const item = await itemsCollection.findOne({ id: parseInt(itemId) });
      
      if (!item) {
        await client.close();
        return res.status(404).json({
          success: false,
          message: 'Item non trouvé'
        });
      }
      
      // Check if user has enough coins
      if (user.coins < item.price) {
        await client.close();
        return res.status(400).json({
          success: false,
          message: 'Coins insuffisants'
        });
      }
      
      // Check if user already owns this item
      const alreadyOwned = user.purchasedItems && user.purchasedItems.some(purchasedItem => purchasedItem.itemId === parseInt(itemId));
      if (alreadyOwned) {
        await client.close();
        return res.status(400).json({
          success: false,
          message: 'Vous possédez déjà cet item'
        });
      }
      
      // Purchase item - Structure simplifiée pour éviter les erreurs TypeScript
      const purchasedItem = {
        itemId: parseInt(itemId),
        itemName: item.name,
        purchaseDate: new Date(),
        equipped: false
      };
      
      // Utiliser $addToSet qui est plus compatible avec TypeScript
      const updateResult = await usersCollection.updateOne(
        { _id: user._id },
        { 
          $inc: { coins: -item.price },
          $addToSet: { purchasedItems: purchasedItem }
        }
      );
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Item acheté avec succès');
        res.status(200).json({
          success: true,
          message: 'Item acheté avec succès',
          remainingCoins: user.coins - item.price,
          purchasedItem: purchasedItem
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'achat'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'achat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'achat',
        error: error.message
      });
    }
  } else {
    console.log('❌ Méthode non autorisée:', req.method);
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
