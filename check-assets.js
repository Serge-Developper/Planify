import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Préfixes des assets nécessaires pour le footer
const requiredPrefixes = [
  'grid',
  'chat',
  'email'
];
const requiredFont = 'Cobe-Heavy.ttf';

console.log('🔍 Vérification des assets dans le build...\n');

const distAssetsPath = path.join(__dirname, 'dist', 'assets');
let allGood = true;

// Vérification des SVG (avec hash)
requiredPrefixes.forEach(prefix => {
  const found = fs.readdirSync(distAssetsPath).some(file => file.startsWith(prefix + '-') && file.endsWith('.svg'));
  if (found) {
    console.log(`✅ ${prefix}.svg - OK (avec hash)`);
  } else {
    console.log(`❌ ${prefix}.svg - MANQUANT`);
    allGood = false;
  }
});

// Vérification de la police
const fontFound = fs.readdirSync(path.join(__dirname, 'dist', 'fonts')).includes(requiredFont);
if (fontFound) {
  console.log(`✅ fonts/${requiredFont} - OK`);
} else {
  console.log(`❌ fonts/${requiredFont} - MANQUANT`);
  allGood = false;
}

console.log('\n' + (allGood ? '🎉 Tous les assets sont présents !' : '⚠️  Certains assets sont manquants !'));

// Vérifier aussi les fichiers CSS
const cssFiles = fs.readdirSync(distAssetsPath).filter(file => file.endsWith('.css'));
console.log('\n📄 Fichiers CSS trouvés :', cssFiles);

if (!allGood) {
  console.log('\n💡 Solutions :');
  console.log('1. Rebuild le projet : npm run build');
  console.log('2. Vérifier que tous les assets sont dans src/assets/');
  console.log('3. Uploader tout le dossier dist/ sur le serveur');
  process.exit(1);
} 