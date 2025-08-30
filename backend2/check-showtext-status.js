const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB Atlas
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI n'est pas défini dans les variables d'environnement.");
}
mongoose.connect(process.env.MONGO_URI);

const Item = require('./models/Item');

async function checkShowTextStatus() {
  try {
    console.log('🔍 Vérification de l\'état showText dans la base de données...');
    
    // Récupérer tous les items avec des variantes
    const items = await Item.find({ 'variants.0': { $exists: true } });
    
    console.log(`📥 Trouvé ${items.length} items avec des variantes`);
    
    items.forEach(item => {
      console.log(`\n📋 Item #${item.legacyId} - "${item.name}":`);
      item.variants.forEach((variant, index) => {
        console.log(`  Variante ${index}: name="${variant.name}", showText=${variant.showText}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkShowTextStatus();

