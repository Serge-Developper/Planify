import fetch from 'node-fetch';

async function testRealLogin() {
  console.log('🔍 Test de login avec les vraies données...');
  
  const baseUrl = 'https://planify-snowy.vercel.app/api';
  
  try {
    // Test 1: Login avec SergeA'1 (utilisateur existant avec questions secrètes)
    console.log('\n📡 Test 1: Login avec SergeA\'1');
    const loginResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "SergeA'1",
        password: "admin"
      })
    });
    console.log(`Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login réussi !');
      console.log('📋 Données utilisateur:');
      console.log(`   - Success: ${loginData.success}`);
      console.log(`   - Username: ${loginData.user?.username}`);
      console.log(`   - Role: ${loginData.user?.role}`);
      console.log(`   - Groupe: ${loginData.user?.groupe}`);
      console.log(`   - Coins: ${loginData.user?.coins}`);
      console.log(`   - Has Secret Questions: ${loginData.user?.hasSecretQuestions}`);
      console.log(`   - Token: ${loginData.token ? 'Présent' : 'Absent'}`);
      
      if (loginData.user?.hasSecretQuestions) {
        console.log('✅ L\'utilisateur a des questions secrètes - ne devrait PAS être redirigé vers le formulaire');
      } else {
        console.log('❌ L\'utilisateur n\'a pas de questions secrètes - sera redirigé vers le formulaire');
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Erreur de login:', errorText);
    }
    
    // Test 2: Login avec mauvais mot de passe
    console.log('\n📡 Test 2: Login avec mauvais mot de passe');
    const wrongPasswordResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "SergeA'1",
        password: "mauvais_mot_de_passe"
      })
    });
    console.log(`Status: ${wrongPasswordResponse.status}`);
    
    if (wrongPasswordResponse.status === 401) {
      console.log('✅ API rejette correctement le mauvais mot de passe');
    } else {
      const errorText = await wrongPasswordResponse.text();
      console.log('❌ Comportement inattendu:', errorText);
    }
    
    // Test 3: Login avec utilisateur inexistant
    console.log('\n📡 Test 3: Login avec utilisateur inexistant');
    const fakeUserResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "utilisateur_inexistant",
        password: "motdepasse"
      })
    });
    console.log(`Status: ${fakeUserResponse.status}`);
    
    if (fakeUserResponse.status === 401) {
      console.log('✅ API rejette correctement l\'utilisateur inexistant');
    } else {
      const errorText = await fakeUserResponse.text();
      console.log('❌ Comportement inattendu:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testRealLogin();
