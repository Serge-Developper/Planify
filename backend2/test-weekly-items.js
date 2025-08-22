const express = require('express');
const jwt = require('jsonwebtoken');

// Simuler un token d'authentification pour les tests
const testToken = jwt.sign(
  { id: 'test-user-id', username: 'test-user' },
  'your-secret-key',
  { expiresIn: '1h' }
);

// Test de l'endpoint weekly-items
async function testWeeklyItems() {
  console.log('🧪 Test de l\'endpoint weekly-items...\n');
  
  try {
    // Simuler une requête à l'endpoint
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

// Test de cohérence entre plusieurs appels
async function testConsistency() {
  console.log('\n🧪 Test de cohérence (même jour)...\n');
  
  try {
    const responses = [];
    
    // Faire 3 appels consécutifs
    for (let i = 0; i < 3; i++) {
      const response = await fetch('http://localhost:3000/api/coins/weekly-items', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      responses.push(data);
      
      console.log(`Appel ${i + 1}:`, data.weeklyItems.map(item => item.name));
    }
    
    // Vérifier que tous les appels donnent les mêmes items
    const firstItems = responses[0].weeklyItems.map(item => item.id).sort();
    const allSame = responses.every(response => {
      const items = response.weeklyItems.map(item => item.id).sort();
      return JSON.stringify(items) === JSON.stringify(firstItems);
    });
    
    if (allSame) {
      console.log('\n✅ Test de cohérence réussi: Tous les appels donnent les mêmes items');
    } else {
      console.log('\n❌ Erreur: Les items ne sont pas cohérents entre les appels');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de cohérence:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de la boutique hebdomadaire...\n');
  
  await testWeeklyItems();
  await testConsistency();
  
  console.log('\n✨ Tests terminés');
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = { testWeeklyItems, testConsistency }; 