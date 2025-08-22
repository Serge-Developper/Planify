import fetch from 'node-fetch';

async function testSimpleAPI() {
  console.log('🔍 Test simple de l\'API...');
  
  const baseUrl = 'https://planify-snowy.vercel.app/api';
  
  try {
    // Test 1: Endpoint de santé (devrait toujours fonctionner)
    console.log('\n📡 Test 1: Endpoint de santé');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API de santé fonctionne:', healthData);
    } else {
      console.log('❌ API de santé ne fonctionne pas');
    }
    
    // Test 2: Endpoint users simple
    console.log('\n📡 Test 2: Endpoint users simple');
    const usersResponse = await fetch(`${baseUrl}/users`);
    console.log(`Status: ${usersResponse.status}`);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ API users fonctionne:', usersData);
    } else {
      console.log('❌ API users ne fonctionne pas');
    }
    
    // Test 3: Test de login avec données minimales
    console.log('\n📡 Test 3: Test de login minimal');
    const loginResponse = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "test",
        password: "test"
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
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testSimpleAPI();
