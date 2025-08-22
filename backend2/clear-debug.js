const fs = require('fs');
const path = require('path');

// Nettoyer le fichier de debug
function clearDebugLog() {
  const debugPath = path.join(__dirname, 'debug.log');
  
  try {
    if (fs.existsSync(debugPath)) {
      fs.writeFileSync(debugPath, '');
      console.log('✅ Fichier debug.log nettoyé');
    } else {
      console.log('ℹ️ Fichier debug.log n\'existe pas');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

// Créer un nouveau fichier de debug avec un timestamp
function createNewDebugLog() {
  const debugPath = path.join(__dirname, 'debug.log');
  const timestamp = new Date().toISOString();
  
  try {
    const initialContent = `=== DEBUG LOG STARTED AT ${timestamp} ===\n`;
    fs.writeFileSync(debugPath, initialContent);
    console.log('✅ Nouveau fichier debug.log créé');
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
  }
}

// Exécuter les actions
console.log('🧹 Nettoyage du fichier de debug...');
clearDebugLog();
createNewDebugLog();
console.log('✅ Nettoyage terminé'); 