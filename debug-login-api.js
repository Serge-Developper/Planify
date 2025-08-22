import fetch from 'node-fetch';

async function debugLoginAPI() {
  console.log('🔍 Debug de l\'API de login...');
  
  const baseUrl = 'https://planify-snowy.vercel.app/api';
  
  try {
    // Test avec différents utilisateurs pour voir le comportement
    const testCases = [
      { username: "SergeA'1", password: "admin", description: "Utilisateur existant" },
      { username: "test", password: "test", description: "Utilisateur test" },
      { username: "inexistant", password: "motdepasse", description: "Utilisateur inexistant" }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📡 Test: ${testCase.description}`);
      console.log(`   Username: ${testCase.username}`);
      
      const response = await fetch(`${baseUrl}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testCase.username,
          password: testCase.password
        })
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Réponse:');
        console.log(`      - Success: ${data.success}`);
        console.log(`      - Username: ${data.user?.username}`);
        console.log(`      - Role: ${data.user?.role}`);
        console.log(`      - Has Secret Questions: ${data.user?.hasSecretQuestions}`);
        console.log(`      - Token: ${data.token ? 'Présent' : 'Absent'}`);
        
        // Vérifier si c'est des données de test
        if (data.user?.role === 'user' && data.user?.coins === 100) {
          console.log('   ⚠️  ATTENTION: Données de test détectées !');
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erreur: ${errorText}`);
      }
    }
    
    // Test spécial pour voir si l'API utilise MongoDB
    console.log('\n📡 Test spécial: Vérification MongoDB');
    const mongoTest = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "SergeA'1",
        password: "mauvais_mot_de_passe"
      })
    });
    
    console.log(`   Status avec mauvais mot de passe: ${mongoTest.status}`);
    if (mongoTest.status === 401) {
      console.log('   ✅ API rejette le mauvais mot de passe - MongoDB fonctionne');
    } else {
      const errorText = await mongoTest.text();
      console.log(`   ❌ Comportement inattendu: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

debugLoginAPI();
