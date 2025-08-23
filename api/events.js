// API pour gérer les événements
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
  
  // Handle GET request - Récupérer les événements
  if (req.method === 'GET') {
    try {
      console.log('🔍 Début de la requête pour récupérer les événements');
      
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
      const eventsCollection = db.collection('events');
      
      // Get all events
      const events = await eventsCollection.find({}).toArray();
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      console.log(`✅ ${events.length} événements récupérés`);
      
      // Return events
      res.status(200).json({
        success: true,
        events: events
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des événements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des événements',
        error: error.message
      });
    }
  } 
  // Handle POST request - Créer un événement
  else if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête pour créer un événement');
      
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
      const { title, description, date, type, priority } = req.body;
      if (!title || !date) {
        return res.status(400).json({
          success: false,
          message: 'title et date requis'
        });
      }
      
      // Connect to MongoDB
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      const db = client.db();
      const eventsCollection = db.collection('events');
      
      // Create event
      const { ObjectId } = await import('mongodb');
      const newEvent = {
        _id: new ObjectId(),
        title,
        description: description || '',
        date: new Date(date),
        type: type || 'devoir',
        priority: priority || 'medium',
        completed: false,
        archived: false,
        userId: decoded.userId,
        username: decoded.username,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await eventsCollection.insertOne(newEvent);
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      if (insertResult.insertedId) {
        console.log('✅ Événement créé avec succès');
        res.status(201).json({
          success: true,
          message: 'Événement créé avec succès',
          event: newEvent
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création',
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
