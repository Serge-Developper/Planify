const axios = require('axios');

async function testWeeklyItemsAPI() {
  try {
    console.log('🔄 Test de l\'API weekly-items...');
    
    // Test sans authentification d'abord
    const response = await axios.get('https://planify-mmi.netlify.app/.netlify/functions/coins-weekly-items');
    
    console.log('📦 Réponse API:', response.data);
    
    if (response.data.success) {
      console.log('✅ API fonctionne !');
      console.log('📊 Items hebdomadaires:', response.data.weeklyItems?.length || 0);
      console.log('⏰ Temps jusqu\'à reset:', response.data.timeUntilReset);
      console.log('🌱 Seed du jour:', response.data.daySeed);
    } else {
      console.log('❌ Erreur API:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

testWeeklyItemsAPI();
