const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || '', {
  // useNewUrlParser et useUnifiedTopology ne sont plus nécessaires avec Mongoose 6+
});

const Item = require('./models/Item');

async function migrateShowText() {
  try {
    console.log('🔍 Migration du champ showText...');
    
    // Récupérer tous les items qui ont des variantes
    const items = await Item.find({ 'variants.0': { $exists: true } });
    console.log(`📥 Trouvé ${items.length} items avec des variantes`);
    
    let updatedCount = 0;
    
    for (const item of items) {
      let needsUpdate = false;
      
      // Vérifier chaque variante
      for (let i = 0; i < item.variants.length; i++) {
        const variant = item.variants[i];
        
        // Si la variante n'a pas de champ showText, l'ajouter
        if (variant.showText === undefined) {
          console.log(`  - Item ${item.legacyId}: Ajout de showText: false à la variante "${variant.name || 'Sans nom'}"`);
          item.variants[i].showText = false;
          needsUpdate = true;
        }
      }
      
      // Sauvegarder l'item si des modifications ont été apportées
      if (needsUpdate) {
        await item.save();
        updatedCount++;
        console.log(`  ✅ Item ${item.legacyId} mis à jour`);
      }
    }
    
    console.log(`🎉 Migration terminée ! ${updatedCount} items mis à jour`);
    
    // Vérifier que la migration a fonctionné
    const testItem = await Item.findOne({ 'variants.0': { $exists: true } });
    if (testItem && testItem.variants.length > 0) {
      console.log('📋 Vérification - Premier item:');
      testItem.variants.forEach((v, i) => {
        console.log(`  Variante ${i}: name="${v.name}", showText=${v.showText}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateShowText();

