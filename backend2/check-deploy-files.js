// Script de vérification des fichiers de déploiement
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des fichiers de déploiement...\n');

// Liste des fichiers essentiels pour le déploiement
const essentialFiles = [
  { path: 'app.js', description: 'Configuration principale du serveur' },
  { path: 'package.json', description: 'Dépendances Node.js' },
  { path: 'routes/coins-simple.js', description: 'Routes coins (CRITIQUE - contient spin-status)' },
  { path: 'models/User.js', description: 'Modèle utilisateur' },
  { path: 'middlewares/auth.js', description: 'Middleware d\'authentification' }
];

// Liste des fichiers optionnels
const optionalFiles = [
  { path: 'routes/users.js', description: 'Gestion des utilisateurs' },
  { path: 'routes/events.js', description: 'Gestion des événements' },
  { path: 'routes/contact.js', description: 'Formulaire de contact' },
  { path: 'uploads/', description: 'Dossier des avatars' }
];

console.log('📁 Fichiers essentiels (obligatoires) :');
let allEssentialPresent = true;

essentialFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file.path} - ${file.description}`);
  } else {
    console.log(`   ❌ ${file.path} - MANQUANT - ${file.description}`);
    allEssentialPresent = false;
  }
});

console.log('\n📁 Fichiers optionnels :');
optionalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file.path} - ${file.description}`);
  } else {
    console.log(`   ⚠️  ${file.path} - OPTIONNEL - ${file.description}`);
  }
});

// Vérification spécifique de l'endpoint spin-status
const coinsFile = path.join(__dirname, 'routes', 'coins-simple.js');
if (fs.existsSync(coinsFile)) {
  const content = fs.readFileSync(coinsFile, 'utf8');
  if (content.includes('router.get(\'/spin-status\'')) {
    console.log('\n✅ Endpoint /spin-status trouvé dans coins-simple.js');
  } else {
    console.log('\n❌ Endpoint /spin-status MANQUANT dans coins-simple.js');
    allEssentialPresent = false;
  }
}

console.log('\n🎯 Résumé :');
if (allEssentialPresent) {
  console.log('✅ Tous les fichiers essentiels sont présents');
  console.log('🚀 Prêt pour le déploiement sur IONOS Plesk');
  console.log('\n📋 Instructions :');
  console.log('1. Uploadez tous les fichiers listés ci-dessus sur IONOS Plesk');
  console.log('2. Redémarrez l\'application Node.js');
  console.log('3. Testez l\'endpoint /api/coins/spin-status');
} else {
  console.log('❌ Certains fichiers essentiels sont manquants');
  console.log('⚠️  Corrigez les fichiers manquants avant le déploiement');
} 