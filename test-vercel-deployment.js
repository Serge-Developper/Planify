// Script de test pour vérifier le déploiement Vercel
const https = require('https');
const http = require('http');

const VERCEL_URL = 'https://planify-snowy.vercel.app';

// Fonction pour faire une requête HTTPS
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Planify-Test-Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Tests à effectuer
async function runTests() {
  console.log('🧪 Début des tests de déploiement Vercel...\n');

  const tests = [
    {
      name: 'Test API de base',
      url: `${VERCEL_URL}/api/`,
      method: 'GET'
    },
    {
      name: 'Test API Users (leaderboard)',
      url: `${VERCEL_URL}/api/users`,
      method: 'GET'
    },
    {
      name: 'Test API Items',
      url: `${VERCEL_URL}/api/items`,
      method: 'GET'
    },
    {
      name: 'Test API Events',
      url: `${VERCEL_URL}/api/events`,
      method: 'GET'
    },
    {
      name: 'Test API Coins',
      url: `${VERCEL_URL}/api/coins/test`,
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📋 Test: ${test.name}`);
      console.log(`🔗 URL: ${test.url}`);
      
      const response = await makeRequest(test.url, test.method);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ Succès (${response.status})`);
        passedTests++;
      } else {
        console.log(`❌ Échec (${response.status})`);
        console.log(`📄 Réponse:`, response.body);
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    
    console.log('---\n');
  }

  console.log(`📊 Résultats: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés ! Votre déploiement Vercel fonctionne parfaitement.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez votre configuration.');
  }
}

// Test de connexion à la base de données (optionnel)
async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...');
  
  try {
    // Test avec un utilisateur de test (si disponible)
    const testUser = {
      username: 'test_user',
      password: 'test_password'
    };
    
    const response = await makeRequest(`${VERCEL_URL}/api/users/login`, 'POST', testUser);
    
    if (response.status === 400) {
      console.log('✅ Connexion à la base de données OK (utilisateur de test non trouvé, ce qui est normal)');
    } else if (response.status === 200) {
      console.log('✅ Connexion à la base de données OK (utilisateur de test trouvé)');
    } else {
      console.log(`⚠️ Statut inattendu: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur de connexion à la base de données: ${error.message}`);
  }
}

// Exécuter les tests
async function main() {
  console.log('🚀 Test de déploiement Planify sur Vercel\n');
  console.log(`🌐 URL de test: ${VERCEL_URL}\n`);
  
  await runTests();
  console.log('\n');
  await testDatabaseConnection();
  
  console.log('\n📝 Instructions:');
  console.log('1. Si tous les tests passent, votre déploiement est réussi !');
  console.log('2. Si certains tests échouent, vérifiez vos variables d\'environnement Vercel');
  console.log('3. Consultez les logs dans votre dashboard Vercel pour plus de détails');
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, testDatabaseConnection };
