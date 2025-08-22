const fetch = require('node-fetch');

async function testWeeklyItems() {
  console.log('🧪 Test de l\'endpoint weekly-items...\n');
  
  try {
    // Test local
    const localURL = 'http://localhost:3000/api/coins/weekly-items';
    console.log('📍 Test local:', localURL);
    
    const response = await fetch(localURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Token de test
      }
    });
    
    const data = await response.json();
    console.log('📊 Réponse locale:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Items hebdomadaires:', data.weeklyItems ? data.weeklyItems.length : 'Non défini');
    console.log('Temps restant:', data.timeUntilReset || 'Non défini');
    
    if (data.weeklyItems && data.weeklyItems.length > 0) {
      console.log('\n📦 Items disponibles:');
      data.weeklyItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ${item.price} coins - ID: ${item.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testWeeklyItems();
