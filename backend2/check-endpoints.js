// Script de vérification des endpoints dans le code local
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des endpoints dans le code local...\n');

// Vérifier le fichier coins-simple.js
const coinsFile = path.join(__dirname, 'routes', 'coins-simple.js');
if (fs.existsSync(coinsFile)) {
  const content = fs.readFileSync(coinsFile, 'utf8');
  
  console.log('📁 Fichier coins-simple.js trouvé');
  
  // Chercher les routes
  const routes = [
    { name: 'GET /user-coins', pattern: /router\.get\('\/user-coins'/ },
    { name: 'GET /spin-status', pattern: /router\.get\('\/spin-status'/ },
    { name: 'POST /spin-wheel', pattern: /router\.post\('\/spin-wheel'/ },
    { name: 'GET /inventory', pattern: /router\.get\('\/inventory'/ },
    { name: 'POST /equip-item', pattern: /router\.post\('\/equip-item'/ },
    { name: 'POST /unequip-item', pattern: /router\.post\('\/unequip-item'/ }
  ];
  
  console.log('\n✅ Endpoints trouvés dans coins-simple.js :');
  routes.forEach(route => {
    if (route.pattern.test(content)) {
      console.log(`   ✓ ${route.name}`);
    } else {
      console.log(`   ❌ ${route.name} - MANQUANT`);
    }
  });
  
  // Vérifier spécifiquement spin-status
  const spinStatusMatch = content.match(/router\.get\('\/spin-status'[^}]+}/s);
  if (spinStatusMatch) {
    console.log('\n✅ Endpoint /spin-status trouvé dans le code local');
    console.log('   Ligne approximative:', content.substring(0, spinStatusMatch.index).split('\n').length);
  } else {
    console.log('\n❌ Endpoint /spin-status MANQUANT dans le code local');
  }
  
} else {
  console.log('❌ Fichier coins-simple.js non trouvé');
}

// Vérifier app.js pour les routes
const appFile = path.join(__dirname, 'app.js');
if (fs.existsSync(appFile)) {
  const content = fs.readFileSync(appFile, 'utf8');
  
  console.log('\n📁 Fichier app.js trouvé');
  
  if (content.includes('/api/coins')) {
    console.log('✅ Route /api/coins configurée dans app.js');
  } else {
    console.log('❌ Route /api/coins non configurée dans app.js');
  }
  
  if (content.includes('coinsRoutes')) {
    console.log('✅ Module coinsRoutes importé dans app.js');
  } else {
    console.log('❌ Module coinsRoutes non importé dans app.js');
  }
}

console.log('\n🎯 Conclusion :');
console.log('Si tous les endpoints sont marqués ✓, le problème est que le serveur');
console.log('n\'a pas la dernière version du fichier coins-simple.js');
console.log('\n💡 Solution : Redéployer le fichier routes/coins-simple.js sur IONOS Plesk'); 