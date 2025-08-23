const mongoose = require('mongoose');

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// JWT verification
const jwt = require('jsonwebtoken');
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'planify-api',
    audience: 'planify-frontend'
  });
}

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Vérifier le token seulement pour les actions POST (test-add)
    let user = null;
    if (req.method === 'POST') {
      user = verifyToken(req);
    }
    
    if (req.method === 'GET') {
      // Tous les items disponibles pour la boutique hebdomadaire
      const allWeeklyItems = [
        { id: 1, name: 'Oreilles de chat', price: 50, img: 'oreilleschat' },
        { id: 2, name: 'Clown', price: 80, img: 'clowncheveux' },
        { id: 3, name: 'Cash', price: 60, img: 'cash' },
        { id: 4, name: 'Cible', price: 100, img: 'target' },
        { id: 6, name: 'Roi', price: 90, img: 'roi' },
        { id: 7, name: 'Matrix', price: 110, img: 'matrix' },
        { id: 8, name: 'Ange', price: 120, img: 'angelwings' },
        { id: 9, name: 'Tomb Raider', price: 130, img: 'laracroft' },
        { id: 10, name: 'Étoiles', price: 85, img: 'star' },
        { id: 11, name: 'Cadre royale', price: 95, img: 'cadre' },
        { id: 12, name: 'Roses', price: 105, img: 'love' },
        { id: 13, name: 'Gentleman', price: 115, img: 'moustache' },
        { id: 14, name: 'Vinyle', price: 135, img: 'vinyle' },
        { id: 15, name: 'Advisory', price: 145, img: 'advisory' },
        { id: 16, name: 'Espace', price: 155, img: 'spacestars' },
        { id: 17, name: 'Absolute Cinema', price: 165, img: 'bras' },
        { id: 18, name: 'Flash', price: 175, img: 'flash' },
        { id: 19, name: 'Miaou', price: 185, img: 'chat' },
        { id: 20, name: 'DVD', price: 195, img: 'dvd' },
        { id: 21, name: 'Lunettes pixel', price: 205, img: 'mlglunette' },
        { id: 22, name: '2000', price: 215, img: 'nokia' }
      ];

      // Fonction pour obtenir la seed du jour actuel
      function getCurrentDaySeed() {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        return dateString;
      }

      // Fonction pour générer des items aléatoires basés sur une seed
      function getRandomItemsFromSeed(seed, count = 3) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          const char = seed.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convertir en 32-bit integer
        }
        
        // Utiliser la seed pour mélanger le tableau
        const shuffled = [...allWeeklyItems].sort(() => {
          hash = (hash * 9301 + 49297) % 233280;
          return (hash / 233280) - 0.5;
        });
        
        return shuffled.slice(0, count);
      }

      // Générer les items hebdomadaires pour aujourd'hui
      const daySeed = getCurrentDaySeed();
      let weeklyItems = getRandomItemsFromSeed(daySeed, 3);

      // Ajouts de test (mémoire process, non persistant)
      if (global.__WEEKLY_TEST_IDS__ && global.__WEEKLY_TEST_IDS__.size) {
        const ids = Array.from(global.__WEEKLY_TEST_IDS__);
        for (const id of ids) {
          const s = allWeeklyItems.find(x => x.id === id);
          if (s && !weeklyItems.find(x => x.id === id)) weeklyItems.push(s);
        }
      }

      // Générer les variants de bordures classiques (rotent aussi chaque jour)
      const classicBorderVariants = [
        { id: 'red', name: 'Rouge', color: '#ff0000' },
        { id: 'blue', name: 'Bleu', color: '#0066ff' },
        { id: 'green', name: 'Vert', color: '#00cc00' },
        { id: 'purple', name: 'Violet', color: '#9900cc' },
        { id: 'orange', name: 'Orange', color: '#ff6600' },
        { id: 'pink', name: 'Rose', color: '#ff3399' },
        { id: 'cyan', name: 'Cyan', color: '#00cccc' },
        { id: 'yellow', name: 'Jaune', color: '#ffcc00' },
        { id: 'magenta', name: 'Magenta', color: '#cc0099' },
        { id: 'lime', name: 'Vert citron', color: '#66ff00' }
      ];

      // Fonction pour générer les couleurs du jour basées sur la seed
      function getRandomColorsFromSeed(seed, count = 3) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          const char = seed.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        
        // Différencier la seed pour les couleurs
        hash = hash * 7919; // Nombre premier pour différencier
        
        const shuffled = [...classicBorderVariants].sort(() => {
          hash = (hash * 9301 + 49297) % 233280;
          return (hash / 233280) - 0.5;
        });
        
        return shuffled.slice(0, count);
      }

      const weeklyColors = getRandomColorsFromSeed(daySeed, 3);

      // Calculer le temps jusqu'à la prochaine rotation (1h du matin)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(1, 0, 0, 0); // 1h du matin

      const timeLeft = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return res.status(200).json({
        success: true,
        weeklyItems,
        weeklyColors,
        timeUntilReset,
        daySeed,
        nextReset: tomorrow.toISOString()
      });
    }

    // Endpoint de test: ajouter un item par legacyId aux items du jour
    if (req.method === 'POST' && req.body && req.body.action === 'test-add') {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const legacyId = Number(req.body.legacyId);
      if (!legacyId || Number.isNaN(legacyId)) {
        return res.json({ success: false, message: 'legacyId invalide' });
      }
      if (!global.__WEEKLY_TEST_IDS__) global.__WEEKLY_TEST_IDS__ = new Set();
      global.__WEEKLY_TEST_IDS__.add(legacyId);
      return res.json({ success: true });
    }
    
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (authError) {
    console.error('❌ Erreur auth weekly-items:', authError.message);
    return res.status(401).json({ error: 'Non autorisé' });
  } catch (error) {
    console.error('Erreur weekly-items:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des items hebdomadaires',
      weeklyItems: [],
      timeUntilReset: '00:00:00'
    });
  }
};