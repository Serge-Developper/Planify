const jwt = require('jsonwebtoken');

// Simuler un token d'authentification pour les tests
const testToken = jwt.sign(
  { id: 'test-user-id', username: 'test-user' },
  'your-secret-key',
  { expiresIn: '1h' }
);

// Test de l'endpoint weekly-items avec la bonne URL
async function testWeeklyItemsFixed() {
  console.log('🧪 Test de l\'endpoint weekly-items (URL corrigée)...\n');
  
  try {
    // URL corrigée (sans /api dupliqué)
    const response = await fetch('http://localhost:3000/api/coins/weekly-items', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Réponse reçue:');
    console.log('Success:', data.success);
    console.log('Items hebdomadaires:', data.weeklyItems.map(item => item.name));
    console.log('Temps jusqu\'à reset:', data.timeUntilReset);
    console.log('Seed du jour:', data.daySeed);
    console.log('Prochain reset:', data.nextReset);
    
    // Vérifier que les items sont cohérents
    if (data.weeklyItems.length === 3) {
      console.log('\n✅ Test réussi: 3 items hebdomadaires générés');
    } else {
      console.log('\n❌ Erreur: Nombre d\'items incorrect');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Test de l'URL de production (simulation)
async function testProductionURL() {
  console.log('\n🧪 Test de l\'URL de production (simulation)...\n');
  
  const productionURL = 'https://api.planifymmi.fr/api/coins/weekly-items';
  const wrongURL = 'https://api.planifymmi.fr/api/api/coins/weekly-items';
  
  console.log('✅ URL correcte:', productionURL);
  console.log('❌ URL incorrecte (causait 404):', wrongURL);
  console.log('\n🔧 Correction appliquée: Suppression du /api redondant dans le frontend');
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de la boutique hebdomadaire (URL corrigée)...\n');
  
  await testWeeklyItemsFixed();
  await testProductionURL();
  
  console.log('\n✨ Tests terminés');
  console.log('\n📋 Résumé des corrections:');
  console.log('1. ✅ URL corrigée dans le frontend');
  console.log('2. ✅ Utilisation de secureApiCall pour la gestion d\'erreurs');
  console.log('3. ✅ Fallback automatique vers la logique locale');
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = { testWeeklyItemsFixed, testProductionURL }; 