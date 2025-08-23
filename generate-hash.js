import bcrypt from 'bcryptjs';

async function generateHash() {
  try {
    const password = 'test123';
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Hash généré :');
    console.log(`Mot de passe: ${password}`);
    console.log(`Hash: ${hash}`);
    
    // Test de vérification
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Vérification: ${isValid ? '✅ OK' : '❌ ÉCHEC'}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

generateHash();

