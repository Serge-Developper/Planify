// API pour récupérer les événements
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
      
      // Get current date
      const now = new Date();
      
      // Get events (for now, return empty array)
      const events = [];
      
      console.log('📅 Nombre d\'événements trouvés:', events.length);
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
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
  } else {
    console.log('❌ Méthode non autorisée:', req.method);
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
