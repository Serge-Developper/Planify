import fetch from 'node-fetch';

async function testAPIAfterDeploy() {
  console.log('🔍 Test de l\'API après redéploiement...');
  
  const baseUrl = 'https://planify-snowy.vercel.app/api';
  
  try {
    // Test 1: Endpoint de santé
    console.log('\n📡 Test 1: Endpoint de santé');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API de santé fonctionne:', healthData);
    } else {
      console.log('❌ API de santé ne fonctionne pas');
    }
    
    // Test 2: Test de login avec de vrais credentials
    console.log('\n📡 Test 2: Test de login avec SergeA\'1');
    const loginResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "SergeA'1",
        password: "admin" // Remplacez par le vrai mot de passe si différent
      })
    });
    console.log(`Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ API login fonctionne avec MongoDB !');
      console.log('📋 Données utilisateur:');
      console.log(`   - Success: ${loginData.success}`);
      console.log(`   - Username: ${loginData.user?.username}`);
      console.log(`   - Role: ${loginData.user?.role}`);
      console.log(`   - Has Secret Questions: ${loginData.user?.hasSecretQuestions}`);
      console.log(`   - Token: ${loginData.token ? 'Présent' : 'Absent'}`);
      
      if (loginData.user?.hasSecretQuestions) {
        console.log('✅ L\'utilisateur a des questions secrètes - ne devrait PAS être redirigé vers le formulaire');
      } else {
        console.log('❌ L\'utilisateur n\'a pas de questions secrètes - sera redirigé vers le formulaire');
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ API login erreur:', errorText);
    }
    
    // Test 3: Test avec un utilisateur inexistant
    console.log('\n📡 Test 3: Test avec un utilisateur inexistant');
    const fakeLoginResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "utilisateur_inexistant",
        password: "motdepasse"
      })
    });
    console.log(`Status: ${fakeLoginResponse.status}`);
    
    if (fakeLoginResponse.status === 401) {
      console.log('✅ API login rejette correctement un utilisateur inexistant');
    } else {
      const errorText = await fakeLoginResponse.text();
      console.log('❌ Comportement inattendu:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testAPIAfterDeploy();
