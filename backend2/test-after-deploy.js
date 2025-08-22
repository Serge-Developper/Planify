// Script de test complet après déploiement
const axios = require('axios');

const baseUrl = 'https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr';

async function testAfterDeploy() {
  console.log('🧪 Test complet après déploiement...\n');
  
  const tests = [
    {
      name: 'Route de base',
      url: '/',
      method: 'GET',
      expectedStatus: 200,
      description: 'Vérifie que l\'API est accessible'
    },
    {
      name: 'Endpoint user-coins (sans token)',
      url: '/api/coins/user-coins',
      method: 'GET',
      expectedStatus: 401,
      description: 'Vérifie que l\'authentification est requise'
    },
    {
      name: 'Endpoint spin-status (sans token)',
      url: '/api/coins/spin-status',
      method: 'GET',
      expectedStatus: 401,
      description: 'Vérifie que l\'endpoint existe et nécessite un token'
    },
    {
      name: 'Endpoint inventory (sans token)',
      url: '/api/coins/inventory',
      method: 'GET',
      expectedStatus: 401,
      description: 'Vérifie que l\'endpoint inventory existe'
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Test: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Description: ${test.description}`);
      
      const response = await axios({
        method: test.method,
        url: `${baseUrl}${test.url}`,
        timeout: 10000
      });
      
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${response.status} (attendu: ${test.expectedStatus})`);
      } else {
        console.log(`   ⚠️  Status: ${response.status} (attendu: ${test.expectedStatus})`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      if (error.response?.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${error.response.status} (attendu: ${test.expectedStatus})`);
      } else if (error.response?.status === 404) {
        console.log(`   ❌ Status: 404 (Endpoint non trouvé - problème de déploiement)`);
        allTestsPassed = false;
      } else {
        console.log(`   ❌ Erreur: ${error.response?.status || error.message}`);
        allTestsPassed = false;
      }
    }
    
    console.log(''); // Ligne vide pour séparer les tests
  }
  
  console.log('🎯 Résumé des tests :');
  if (allTestsPassed) {
    console.log('✅ Tous les tests sont passés !');
    console.log('🚀 Le déploiement semble réussi');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Testez avec un token JWT valide dans Postman');
    console.log('2. Vérifiez que l\'endpoint /api/coins/spin-status retourne :');
    console.log('   {"success": true, "canSpin": true, "lastSpinDate": null}');
  } else {
    console.log('❌ Certains tests ont échoué');
    console.log('🔧 Vérifiez le déploiement et les logs d\'erreur');
  }
}

testAfterDeploy().catch(console.error); 