const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Test du système de validation des tâches
async function testTaskValidation() {
  console.log('🧪 TEST DU SYSTÈME DE VALIDATION DES TÂCHES');
  console.log('==========================================\n');

  try {
    // 1. Connexion d'un utilisateur de test
    console.log('1. Connexion utilisateur...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'testuser',
      password: 'testpass'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('✅ Utilisateur connecté\n');

    // 2. Récupérer les tâches existantes
    console.log('2. Récupération des tâches...');
    const eventsResponse = await axios.get(`${API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const tasks = eventsResponse.data;
    console.log(`✅ ${tasks.length} tâches récupérées\n`);

    if (tasks.length === 0) {
      console.log('❌ Aucune tâche trouvée pour les tests');
      return;
    }

    // 3. Trouver une tâche à venir (pas en retard)
    const futureTask = tasks.find(task => {
      const taskDate = new Date(task.date + 'T' + (task.heure || '00:00'));
      return taskDate > new Date() && !task.checked;
    });

    // 4. Trouver une tâche en retard
    const lateTask = tasks.find(task => {
      const taskDate = new Date(task.date + 'T' + (task.heure || '00:00'));
      return taskDate < new Date() && !task.checked;
    });

    if (!futureTask) {
      console.log('⚠️ Aucune tâche à venir trouvée pour le test');
    } else {
      console.log('3. Test validation tâche à temps...');
      console.log(`   Tâche: ${futureTask.titre} (${futureTask.date} ${futureTask.heure})`);
      
      // Récupérer le score initial
      const initialScoreResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const initialScore = initialScoreResponse.data.completedTasks || 0;
      console.log(`   Score initial: ${initialScore}`);

      // Valider la tâche
      await axios.post(`${API_URL}/events/${futureTask._id}/check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Vérifier le nouveau score
      const newScoreResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newScore = newScoreResponse.data.completedTasks || 0;
      
      if (newScore === initialScore + 1) {
        console.log('✅ Tâche à temps validée - +1 point ajouté');
      } else {
        console.log('❌ Erreur: le point n\'a pas été ajouté');
      }

      // Dévalider la tâche
      await axios.post(`${API_URL}/events/${futureTask._id}/uncheck`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Tâche dévalidée\n');
    }

    if (!lateTask) {
      console.log('⚠️ Aucune tâche en retard trouvée pour le test');
    } else {
      console.log('4. Test validation tâche en retard...');
      console.log(`   Tâche: ${lateTask.titre} (${lateTask.date} ${lateTask.heure})`);
      
      // Récupérer le score initial
      const initialScoreResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const initialScore = initialScoreResponse.data.completedTasks || 0;
      console.log(`   Score initial: ${initialScore}`);

      // Valider la tâche en retard
      await axios.post(`${API_URL}/events/${lateTask._id}/check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Vérifier le nouveau score
      const newScoreResponse = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newScore = newScoreResponse.data.completedTasks || 0;
      
      if (newScore === initialScore) {
        console.log('✅ Tâche en retard validée - aucun point ajouté (comportement attendu)');
      } else {
        console.log('❌ Erreur: un point a été ajouté pour une tâche en retard');
      }

      // Dévalider la tâche
      await axios.post(`${API_URL}/events/${lateTask._id}/uncheck`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Tâche dévalidée\n');
    }

    console.log('🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

// Exécuter les tests
testTaskValidation(); 