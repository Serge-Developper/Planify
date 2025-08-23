// API pour récupérer l'inventaire des items achetés
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
  
  // Handle GET request
  if (req.method === 'GET') {
    try {
      console.log('🔍 Début de la requête pour récupérer l\'inventaire');
      
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
        // Vérifier que decoded est un objet avec les propriétés attendues
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
      
      // Connect to MongoDB
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      const db = client.db();
      const usersCollection = db.collection('users');
      
      // Find user by ID
      const { ObjectId } = await import('mongodb');
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
      
      if (!user) {
        await client.close();
        console.log('❌ Utilisateur non trouvé, retour inventaire vide');
        return res.status(200).json({
          success: true,
          purchasedItems: [],
          equippedItemId: null,
          selectedBorderColor: 'default'
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      // S'assurer que tous les utilisateurs possèdent l'item "Bordure Classique" (id 0)
      let hasClassic = false;
      if (user.purchasedItems && Array.isArray(user.purchasedItems)) {
        hasClassic = user.purchasedItems.some(item => item.itemId === 0);
      }
      
      if (!hasClassic) {
        console.log('📦 Ajout automatique de la Bordure Classique');
                 try {
           await usersCollection.updateOne(
             { _id: user._id },
             {
               $addToSet: {
                 purchasedItems: {
                   itemId: 0,
                   itemName: 'Bordure Classique',
                   purchaseDate: new Date(),
                   equipped: false
                 }
               }
             }
           );
          // Récupérer l'utilisateur mis à jour
          const updatedUser = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
          if (updatedUser) {
            user.purchasedItems = updatedUser.purchasedItems;
          }
        } catch (updateError) {
          console.warn('❌ Impossible d\'ajouter automatiquement Bordure Classique:', updateError.message);
        }
      }
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      // Return inventory (format compatible avec l'ancien système)
      res.status(200).json({
        success: true,
        purchasedItems: user.purchasedItems || [],
        equippedItemId: user.equippedItemId || null,
        selectedBorderColor: user.selectedBorderColor || 'default'
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'inventaire:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'inventaire',
        purchasedItems: [],
        equippedItemId: null,
        selectedBorderColor: 'default'
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
