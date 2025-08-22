// Test simple de l'endpoint spin-status
const axios = require('axios');

async function testSpinStatus() {
  const baseUrl = 'https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr';
  
  console.log('🔍 Test de l\'endpoint spin-status...\n');
  
  try {
    // Test sans token (devrait retourner 401)
    console.log('Test 1: Sans token (devrait retourner 401)');
    const response1 = await axios.get(`${baseUrl}/api/coins/spin-status`);
    console.log('✅ Status:', response1.status);
    console.log('✅ Réponse:', response1.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Status: 401 (Non autorisé - normal sans token)');
    } else if (error.response?.status === 404) {
      console.log('❌ Status: 404 (Endpoint non trouvé - problème de déploiement)');
      console.log('💡 Solution: Redéployer le fichier routes/coins-simple.js sur IONOS Plesk');
    } else {
      console.log('❌ Erreur:', error.response?.status || error.message);
    }
  }
  
  console.log('\n🎯 Conclusion:');
  console.log('- Si vous obtenez 401: L\'endpoint existe mais nécessite un token');
  console.log('- Si vous obtenez 404: L\'endpoint n\'existe pas sur le serveur');
  console.log('- Si vous obtenez 200: L\'endpoint fonctionne parfaitement');
}

testSpinStatus().catch(console.error); 