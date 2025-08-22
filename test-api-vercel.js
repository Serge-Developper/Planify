import fetch from 'node-fetch';

async function testVercelAPI() {
  console.log('🔍 Test de l\'API Vercel...');
  
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
    
    // Test 2: Endpoint users
    console.log('\n📡 Test 2: Endpoint users');
    const usersResponse = await fetch(`${baseUrl}/users`);
    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ API users fonctionne:', usersData);
    } else {
      console.log('❌ API users ne fonctionne pas');
    }
    
    // Test 3: Test de login (sans credentials)
    console.log('\n📡 Test 3: Test de login (sans credentials)');
    const loginResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      })
    });
    console.log(`Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ API login fonctionne:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ API login erreur:', errorText);
    }
    
    // Test 4: Test des questions secrètes
    console.log('\n📡 Test 4: Test des questions secrètes');
    const secretResponse = await fetch(`${baseUrl}/users/secret-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test',
        questions: []
      })
    });
    console.log(`Status: ${secretResponse.status}`);
    
    if (secretResponse.ok) {
      const secretData = await secretResponse.json();
      console.log('✅ API questions secrètes fonctionne:', secretData);
    } else {
      const errorText = await secretResponse.text();
      console.log('❌ API questions secrètes erreur:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testVercelAPI();
