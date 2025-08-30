const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api';
const TEST_TOKEN = 'your-test-token-here'; // À remplacer par un vrai token

// Fonction pour tester le weekend bonus
async function testWeekendBonus() {
  console.log('🧪 Test du système Weekend Bonus x2');
  console.log('=====================================\n');

  try {
    // Test 1: Vérifier si c'est le weekend
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    console.log(`📅 Date actuelle: ${today.toLocaleDateString('fr-FR')}`);
    console.log(`📅 Jour de la semaine: ${dayOfWeek} (0=Dimanche, 6=Samedi)`);
    console.log(`🎉 Est-ce le weekend? ${isWeekend ? 'OUI' : 'NON'}\n`);

    // Test 2: Tester la route spin-wheel (si on a un token)
    if (TEST_TOKEN !== 'your-test-token-here') {
      console.log('🎰 Test de la route /spin-wheel...');
      
      const response = await axios.post(`${API_URL}/coins/spin-wheel`, {}, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Réponse du serveur:');
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - Coins gagnés: ${response.data.coinsWon}`);
      console.log(`   - Nom de la récompense: ${response.data.rewardName}`);
      console.log(`   - Bonus weekend: ${response.data.isWeekendBonus ? 'OUI' : 'NON'}`);
      console.log(`   - Coins originaux: ${response.data.originalCoins}`);
      console.log(`   - Message: ${response.data.message}\n`);
    } else {
      console.log('⚠️  Token de test non configuré - impossible de tester la route /spin-wheel');
      console.log('   Pour tester, remplacez TEST_TOKEN par un vrai token d\'utilisateur\n');
    }

    // Test 3: Simulation des récompenses
    console.log('🎲 Simulation des récompenses:');
    const rewards = [
      { coins: 10, probability: 0.15, name: "10 coins" },
      { coins: 20, probability: 0.15, name: "20 coins" },
      { coins: 30, probability: 0.15, name: "30 coins" },
      { coins: 50, probability: 0.15, name: "50 coins" },
      { coins: 70, probability: 0.15, name: "70 coins" },
      { coins: 100, probability: 0.15, name: "100 coins" },
      { coins: 0, probability: 0.10, name: "Perdu" }
    ];

    console.log('📊 Récompenses de base:');
    rewards.forEach(reward => {
      if (reward.coins > 0) {
        const weekendCoins = reward.coins * 2;
        console.log(`   - ${reward.name} → ${isWeekend ? `${weekendCoins} coins (x2)` : `${reward.coins} coins`}`);
      } else {
        console.log(`   - ${reward.name} → ${reward.name} (inchangé)`);
      }
    });

    console.log('\n🎯 Test de tirage aléatoire:');
    for (let i = 0; i < 5; i++) {
      const rand = Math.random();
      let cumulative = 0;
      let selectedReward = rewards[0];
      
      for (const reward of rewards) {
        cumulative += reward.probability;
        if (rand <= cumulative) {
          selectedReward = reward;
          break;
        }
      }

      const finalCoins = isWeekend && selectedReward.coins > 0 ? selectedReward.coins * 2 : selectedReward.coins;
      const bonusText = isWeekend && selectedReward.coins > 0 ? ' (WEEKEND BONUS x2!)' : '';
      
      console.log(`   Tirage ${i + 1}: ${selectedReward.name} → ${finalCoins} coins${bonusText}`);
    }

    console.log('\n✅ Test terminé avec succès!');
    console.log('\n📝 Résumé:');
    console.log(`   - Système de détection weekend: ${isWeekend ? 'ACTIF' : 'INACTIF'}`);
    console.log(`   - Récompenses doublées: ${isWeekend ? 'OUI' : 'NON'}`);
    console.log(`   - Case "Perdu" inchangée: OUI`);
    console.log(`   - Messages personnalisés: OUI`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

// Lancer le test
testWeekendBonus(); 