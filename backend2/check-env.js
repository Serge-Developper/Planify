require('dotenv').config();

console.log('🔍 Vérification de la configuration de l\'environnement...\n');

// Variables requises (accepte MONGO_URI ou MONGODB_URI)
const requiredVars = [
  'JWT_SECRET',
  'PORT'
];

// Variables optionnelles
const optionalVars = [
  'NODE_ENV'
];

console.log('📋 Variables requises:');
let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${varName === 'JWT_SECRET' ? '***CONFIGURÉ***' : value}`);
  } else {
    console.log(`  ❌ ${varName}: MANQUANT`);
    allRequiredPresent = false;
  }
});

console.log('\n📋 Variables optionnelles:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️ ${varName}: non configuré (utilisera la valeur par défaut)`);
  }
});

console.log('\n🔧 Configuration actuelle:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT: ${process.env.PORT || 3000}`);
console.log(`  MONGO_URI configuré: ${!!process.env.MONGO_URI}`);
console.log(`  MONGODB_URI configuré: ${!!process.env.MONGODB_URI}`);
console.log(`  MONGO_DB_NAME: ${process.env.MONGO_DB_NAME || '(non défini)'}`);
console.log(`  JWT_SECRET configuré: ${!!process.env.JWT_SECRET}`);

// Vérifier la présence d'au moins une URI Mongo
const hasMongo = !!(process.env.MONGO_URI || process.env.MONGODB_URI);

if (allRequiredPresent && hasMongo) {
  console.log('\n🎉 Toutes les variables requises sont configurées!');
} else {
  console.log('\n⚠️ Certaines variables requises sont manquantes.');
  console.log('Vérifiez votre fichier .env ou les variables d\'environnement.');
}

console.log('\n💡 Conseils:');
console.log('- Assurez-vous que MONGO_URI ou MONGODB_URI pointe vers une base MongoDB valide');
console.log('- JWT_SECRET doit être une chaîne sécurisée et unique');
console.log('- En production, définissez NODE_ENV=production'); 