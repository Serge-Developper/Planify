// Script de test pour vérifier la route spin-status
const axios = require('axios');

async function testSpinStatus() {
  try {
    console.log('🧪 Test de la route /api/coins/spin-status');
    console.log('==========================================');
    
    // URL de test (à adapter selon votre environnement)
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const testUrl = `${baseUrl}/api/coins/spin-status`;
    
    console.log(`📍 URL de test: ${testUrl}`);
    
    // Token de test (à remplacer par un vrai token)
    const testToken = process.env.TEST_TOKEN || 'your-test-token-here';
    
    const response = await axios.get(testUrl, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Route accessible !');
    console.log('📊 Réponse:', response.data);
    
    if (response.data.success) {
      console.log('✅ Route fonctionne correctement');
      console.log(`🎯 canSpin: ${response.data.canSpin}`);
      console.log(`📅 lastSpinDate: ${response.data.lastSpinDate}`);
    } else {
      console.log('⚠️ Route répond mais avec une erreur');
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.statusText}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('   Aucune réponse reçue du serveur');
    } else {
      console.log(`   Erreur: ${error.message}`);
    }
    
    console.log('');
    console.log('🔧 Solutions possibles :');
    console.log('1. Vérifier que le serveur est démarré');
    console.log('2. Vérifier l\'URL de l\'API');
    console.log('3. Vérifier que la route est bien déployée');
    console.log('4. Vérifier le token d\'authentification');
  }
}

// Exécuter le test
testSpinStatus(); 