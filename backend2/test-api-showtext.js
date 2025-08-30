const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI);

const Item = require('./models/Item');

async function testApiShowText() {
  try {
    console.log('🔍 Test de l\'API showText...');
    
    // 1. Trouver un item avec des variantes
    const item = await Item.findOne({ 'variants.0': { $exists: true } });
    if (!item) {
      console.log('❌ Aucun item avec des variantes trouvé');
      return;
    }
    
    console.log(`📥 Item trouvé: ${item.legacyId} - ${item.name}`);
    console.log('📋 Variantes actuelles:');
    item.variants.forEach((v, i) => {
      console.log(`  Variante ${i}: name="${v.name}", showText=${v.showText}`);
    });
    
    // 2. Mettre à jour showText à true pour la première variante
    if (item.variants.length > 0) {
      item.variants[0].showText = true;
      await item.save();
      console.log('✅ showText mis à true pour la première variante');
    }
    
    // 3. Récupérer l'item avec lean() (comme l'API)
    const leanItem = await Item.findById(item._id).lean();
    console.log('📥 Item récupéré avec lean():');
    leanItem.variants.forEach((v, i) => {
      console.log(`  Variante ${i}: name="${v.name}", showText=${v.showText}`);
    });
    
    // 4. Appliquer le traitement de l'API
    const processedItem = {
      ...leanItem,
      variants: Array.isArray(leanItem.variants) ? leanItem.variants.map(v => ({
        ...v,
        showText: !!v.showText
      })) : []
    };
    
    console.log('📝 Item après traitement API:');
    processedItem.variants.forEach((v, i) => {
      console.log(`  Variante ${i}: name="${v.name}", showText=${v.showText}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

testApiShowText();

