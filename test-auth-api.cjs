const https = require('https');

// Test de l'API auth
async function testAuthAPI() {
  console.log('🔍 Test de l\'API d\'authentification...');
  
  const postData = JSON.stringify({
    username: 'test',
    password: 'test'
  });

  const options = {
    hostname: 'planify-mmi.netlify.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 Status: ${res.statusCode}`);
        console.log(`📄 Headers:`, res.headers);
        console.log(`📦 Response:`, data);
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ JSON parsed:`, jsonData);
          
          if (jsonData.user && jsonData.user.hasSecretQuestions !== undefined) {
            console.log(`🔐 hasSecretQuestions: ${jsonData.user.hasSecretQuestions}`);
          }
        } catch (e) {
          console.log(`❌ Erreur parsing JSON:`, e.message);
        }
        
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Erreur requête:`, e);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

testAuthAPI().catch(console.error);
