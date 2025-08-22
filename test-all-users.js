import fetch from 'node-fetch';

async function testAllUsers() {
  console.log('🔍 Test de tous les utilisateurs de la base de données...');
  
  const baseUrl = 'https://planify-snowy.vercel.app/api';
  
  // Liste des utilisateurs de votre base de données
  const users = [
    { username: "SergeA'1", password: "admin", description: "SergeA'1 (BUT1)" },
    { username: "SergeA\"1", password: "admin", description: "SergeA\"1 (BUT1)" },
    { username: "MaximeB1", password: "admin", description: "MaximeB1 (BUT1)" },
    { username: "MaximeB'1", password: "admin", description: "MaximeB'1 (BUT1)" },
    { username: "MaximeB\"1", password: "admin", description: "MaximeB\"1 (BUT1)" },
    { username: "SergeA2", password: "admin", description: "SergeA2 (BUT2)" },
    { username: "SergeA'2", password: "admin", description: "SergeA'2 (BUT2)" },
    { username: "SergeA\"2", password: "admin", description: "SergeA\"2 (BUT2)" },
    { username: "MaximeB2", password: "admin", description: "MaximeB2 (BUT2)" },
    { username: "MaximeB'2", password: "admin", description: "MaximeB'2 (BUT2)" },
    { username: "MaximeB\"2", password: "admin", description: "MaximeB\"2 (BUT2)" },
    { username: "SergeA3", password: "admin", description: "SergeA3 (BUT3)" },
    { username: "SergeA'3", password: "admin", description: "SergeA'3 (BUT3)" },
    { username: "MaximeB3", password: "admin", description: "MaximeB3 (BUT3)" },
    { username: "MaximeB'3", password: "admin", description: "MaximeB'3 (BUT3)" },
    { username: "MaximeB\"3", password: "admin", description: "MaximeB\"3 (BUT3)" },
    { username: "delegueA1", password: "admin", description: "delegueA1 (Délégué)" },
    { username: "delegueA'1", password: "admin", description: "delegueA'1 (Délégué)" }
  ];
  
  let successCount = 0;
  let totalCount = 0;
  
  for (const user of users) {
    totalCount++;
    console.log(`\n📡 Test ${totalCount}/${users.length}: ${user.description}`);
    console.log(`   Username: ${user.username}`);
    
    try {
      const response = await fetch(`${baseUrl}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        successCount++;
        console.log('   ✅ Login réussi !');
        console.log(`      - Role: ${data.user?.role}`);
        console.log(`      - Groupe: ${data.user?.groupe}`);
        console.log(`      - Coins: ${data.user?.coins}`);
        console.log(`      - Has Secret Questions: ${data.user?.hasSecretQuestions}`);
        
        if (data.user?.hasSecretQuestions) {
          console.log('      ✅ A des questions secrètes - ne sera PAS redirigé');
        } else {
          console.log('      ❌ N\'a pas de questions secrètes - sera redirigé');
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Erreur: ${errorText}`);
      }
      
      // Pause entre les requêtes pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Erreur réseau: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Résumé: ${successCount}/${totalCount} utilisateurs connectés avec succès`);
  
  if (successCount === totalCount) {
    console.log('🎉 Tous les utilisateurs fonctionnent !');
  } else {
    console.log('⚠️  Certains utilisateurs ont des problèmes');
  }
}

testAllUsers();
