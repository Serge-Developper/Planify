// API pour récupérer les items de la boutique hebdomadaire
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
      const jwt = await import('jsonwebtoken');
      
      // Check environment variables
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
      
      // Tous les items disponibles pour la boutique hebdomadaire (basé sur l'ancien système)
      const allWeeklyItems = [
        // Items normaux
        { id: 1, name: 'Oreilles de chat', price: 50, img: '/src/assets/img/oreilleschat.gif' },
        { id: 2, name: 'Clown', price: 80, img: '/src/assets/img/clowncheveux.gif' },
        { id: 3, name: 'Cash', price: 60, img: '/src/assets/img/cash.gif' },
        { id: 4, name: 'Cible', price: 100, img: '/src/assets/img/target.gif' },
        { id: 6, name: 'Roi', price: 90, img: '/src/assets/img/roi.gif' },
        { id: 7, name: 'Matrix', price: 110, img: '/src/assets/img/matrix.gif' },
        { id: 8, name: 'Ange', price: 600, img: '/src/assets/img/angelwings.gif' },
        { id: 9, name: 'Tomb Raider', price: 130, img: '/src/assets/img/laracroft.gif' },
        { id: 10, name: 'Étoiles', price: 100, img: '/src/assets/img/star.gif' },
        { id: 11, name: 'Cadre royale', price: 95, img: '/src/assets/img/cadre.gif' },
        { id: 12, name: 'Roses', price: 105, img: '/src/assets/img/love.gif' },
        { id: 13, name: 'Gentleman', price: 115, img: '/src/assets/img/moustache.gif' },
        { id: 14, name: 'Vinyle', price: 135, img: '/src/assets/img/vinyle.gif' },
        { id: 15, name: 'Advisory', price: 145, img: '/src/assets/img/advisory.gif' },
        { id: 16, name: 'Espace', price: 155, img: '/src/assets/img/spacestars.gif' },
        { id: 17, name: 'Absolute Cinema', price: 165, img: '/src/assets/img/bras.png' },
        { id: 18, name: 'Flash', price: 175, img: '/src/assets/img/flash.gif' },
        { id: 19, name: 'Miaou', price: 200, img: '/src/assets/img/chat.gif' },
        { id: 20, name: 'DVD', price: 195, img: '/src/assets/img/dvd.png' },
        { id: 21, name: 'Lunettes pixel', price: 130, img: '/src/assets/img/mlglunette.gif' },
        { id: 22, name: '2000', price: 215, img: '/src/assets/img/nokia.gif' },
        { id: 23, name: 'Discord', price: 160, img: '/src/assets/img/discord.png' },
        { id: 24, name: 'Jojo', price: 170, img: '/src/assets/img/tobecontinued.png' }
      ];

      // Fonction pour obtenir la seed du jour actuel (heure Europe/Paris)
      function getCurrentDaySeed() {
        const formatter = new Intl.DateTimeFormat('fr-CA', {
          timeZone: 'Europe/Paris',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return formatter.format(new Date()); // format YYYY-MM-DD
      }

      // Mélange déterministe basé sur une seed
      function getShuffledItemsFromSeed(seed, items) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          const char = seed.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convertir en 32-bit integer
        }
        
        // Utiliser la seed pour mélanger le tableau
        const shuffled = [...items].sort(() => {
          hash = (hash * 9301 + 49297) % 233280;
          return (hash / 233280) - 0.5;
        });
        return shuffled;
      }

      // Générer les items hebdomadaires pour aujourd'hui
      const daySeed = getCurrentDaySeed();
      const shuffledItems = getShuffledItemsFromSeed(daySeed, allWeeklyItems);
      const weeklyItems = shuffledItems.slice(0, 3);

      // Calculer le temps jusqu'à la prochaine rotation à 01:00 (heure Europe/Paris)
      const now = new Date();
      const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      const parisTarget = new Date(parisNow);
      parisTarget.setHours(1, 0, 0, 0);
      if (parisNow.getHours() >= 1) {
        parisTarget.setDate(parisTarget.getDate() + 1);
      }
      const timeLeft = parisTarget.getTime() - parisNow.getTime();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      console.log(`✅ ${weeklyItems.length} items hebdomadaires générés pour le ${daySeed}`);

      // Return weekly items (format compatible avec l'ancien système)
      res.status(200).json({
        success: true,
        weeklyItems: weeklyItems,
        timeUntilReset: timeUntilReset,
        daySeed: daySeed,
        nextReset: new Date(Date.now() + timeLeft).toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des items hebdomadaires:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des items hebdomadaires',
        weeklyItems: [],
        timeUntilReset: '00:00:00'
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
