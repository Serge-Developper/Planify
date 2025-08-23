import crypto from 'crypto';

// Générer un JWT_SECRET sécurisé
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('🔐 JWT_SECRET généré :');
console.log(jwtSecret);
console.log('\n📋 Copiez cette valeur dans vos variables d\'environnement Vercel');
console.log('🔗 Allez sur Vercel → Settings → Environment Variables');
console.log('📝 Ajoutez : JWT_SECRET = ' + jwtSecret);

