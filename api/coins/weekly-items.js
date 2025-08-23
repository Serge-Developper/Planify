// API pour récupérer les items hebdomadaires
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
      console.log('🔍 Début de la requête pour récupérer les items hebdomadaires');
      
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
      
      // Get current week number
      const now = new Date();
      const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      console.log('📅 Semaine actuelle:', weekNumber);
      
      // Get weekly items (for now, return some default items)
      const weeklyItems = [
        {
          id: 1,
          name: "Bordure Classique",
          price: 50,
          image: "/img/bordure-classique.png",
          category: "bordure"
        },
        {
          id: 2,
          name: "Clown",
          price: 100,
          image: "/img/clown.png",
          category: "avatar"
        },
        {
          id: 3,
          name: "Cash",
          price: 75,
          image: "/img/cash.png",
          category: "avatar"
        }
      ];
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      res.status(200).json({
        success: true,
        weekNumber: weekNumber,
        items: weeklyItems
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des items hebdomadaires:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des items hebdomadaires',
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
