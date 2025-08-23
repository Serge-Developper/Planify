// API pour récupérer le statut du spin de l'utilisateur
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
      console.log('🔍 Début de la requête pour récupérer le statut du spin');
      
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
        console.log('❌ Utilisateur non trouvé');
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      // Check if user can spin today
      const today = new Date();
      const lastSpinDate = user.lastSpinDate ? new Date(user.lastSpinDate) : null;
      
      let canSpin = true;
      let nextSpinDate = null;
      
      if (lastSpinDate) {
        const lastSpinDay = new Date(lastSpinDate.getFullYear(), lastSpinDate.getMonth(), lastSpinDate.getDate());
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (lastSpinDay.getTime() === todayDay.getTime()) {
          canSpin = false;
          // Next spin will be tomorrow
          nextSpinDate = new Date(todayDay.getTime() + 24 * 60 * 60 * 1000);
        }
      }
      
      console.log('🎰 Peut faire un spin aujourd\'hui:', canSpin);
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      res.status(200).json({
        success: true,
        canSpin: canSpin,
        lastSpinDate: lastSpinDate,
        nextSpinDate: nextSpinDate
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut du spin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut du spin',
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
