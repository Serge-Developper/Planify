// Test de l'API de connexion
const testLogin = async () => {
  try {
    console.log('🧪 Test de l\'API de connexion...');
    
    const response = await fetch('https://planify-snowy.vercel.app/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'SergeA1', // SANS apostrophe
        password: 'Wadafon0!' // Le vrai mot de passe
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📄 Réponse:', data);
    
    if (response.ok) {
      console.log('✅ Connexion réussie !');
    } else {
      console.log('❌ Échec de connexion:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

// Test avec différents usernames
const testUsernames = async () => {
  const usernames = ['SergeA1', 'SergeA\'1', 'SergeA1\'', 'sergea1'];
  
  for (const username of usernames) {
    console.log(`\n🔍 Test avec username: "${username}"`);
    
    try {
      const response = await fetch('https://planify-snowy.vercel.app/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: 'test123'
        })
      });
      
      const data = await response.json();
      console.log(`Status: ${response.status} - ${data.message}`);
      
    } catch (error) {
      console.error('Erreur:', error.message);
    }
  }
};

// Exécuter les tests
console.log('🚀 Démarrage des tests...');
testLogin();
// testUsernames(); // Décommentez pour tester différents usernames
