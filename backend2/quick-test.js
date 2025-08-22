// Test rapide de l'endpoint spin-status sur le serveur de production
const axios = require('axios');

async function quickTest() {
  const baseUrl = 'https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr';
  
  console.log('🔍 Test rapide des endpoints coins...\n');
  
  // Test 1: Route de base
  try {
    const response1 = await axios.get(`${baseUrl}/`);
    console.log('✅ Route de base:', response1.data);
  } catch (error) {
    console.log('❌ Route de base:', error.response?.status || error.message);
  }
  
  // Test 2: Route coins existante (devrait fonctionner)
  try {
    const response2 = await axios.get(`${baseUrl}/api/coins/user-coins`);
    console.log('✅ Route user-coins:', response2.status);
  } catch (error) {
    console.log('❌ Route user-coins:', error.response?.status || error.message);
  }
  
  // Test 3: Route spin-status (problématique)
  try {
    const response3 = await axios.get(`${baseUrl}/api/coins/spin-status`);
    console.log('✅ Route spin-status:', response3.status);
  } catch (error) {
    console.log('❌ Route spin-status:', error.response?.status || error.message);
    if (error.response?.status === 404) {
      console.log('🔧 Le backend n\'est pas à jour - il faut redéployer');
    }
  }
  
  // Test 4: Route inventory
  try {
    const response4 = await axios.get(`${baseUrl}/api/coins/inventory`);
    console.log('✅ Route inventory:', response4.status);
  } catch (error) {
    console.log('❌ Route inventory:', error.response?.status || error.message);
  }
}

quickTest(); 