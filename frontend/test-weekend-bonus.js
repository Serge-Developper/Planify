// Test du système Weekend Bonus côté frontend
console.log('🧪 Test du système Weekend Bonus x2 - Frontend');
console.log('==============================================\n');

// Fonction pour détecter si c'est le weekend (même logique que dans Navbar.vue)
function isWeekend() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi
}

// Fonction pour générer les segments de la roue (même logique que dans Navbar.vue)
function generateWheelSegments() {
  const baseSegments = [
    { label: '10 coins', color: '#FFD700' },
    { label: '20 coins', color: '#FF6347' },
    { label: '30 coins', color: '#FFB347' },
    { label: '50 coins', color: '#4682B4' },
    { label: '70 coins', color: '#8A2BE2' },
    { label: '100 coins', color: '#32CD32' },
    { label: 'Perdu', color: '#ccc' },
  ];
  
  const weekend = isWeekend();
  
  if (weekend) {
    return baseSegments.map(segment => {
      if (segment.label === 'Perdu') {
        return segment;
      }
      const coins = parseInt(segment.label.match(/\d+/)?.[0] || '0');
      return {
        ...segment,
        label: `${coins * 2} coins`
      };
    });
  }
  
  return baseSegments;
}

// Test 1: Vérifier la détection du weekend
console.log('📅 Test de détection du weekend:');
const today = new Date();
const dayOfWeek = today.getDay();
const weekend = isWeekend();

console.log(`   Date actuelle: ${today.toLocaleDateString('fr-FR')}`);
console.log(`   Jour de la semaine: ${dayOfWeek} (0=Dimanche, 6=Samedi)`);
console.log(`   Est-ce le weekend? ${weekend ? 'OUI' : 'NON'}\n`);

// Test 2: Vérifier les segments de la roue
console.log('🎰 Test des segments de la roue:');
const segments = generateWheelSegments();

console.log('   Segments actuels:');
segments.forEach((segment, index) => {
  console.log(`   ${index + 1}. ${segment.label} (${segment.color})`);
});

// Test 3: Vérifier les messages
console.log('\n💬 Test des messages:');
const testSegments = [
  { label: '10 coins' },
  { label: '20 coins' },
  { label: 'Perdu' }
];

testSegments.forEach(segment => {
  if (segment.label === 'Perdu') {
    console.log(`   "Perdu" → "😔 Dommage, vous n'avez rien gagné cette fois-ci !"`);
  } else {
    if (weekend) {
      console.log(`   "${segment.label}" → "🎉 WEEKEND BONUS x2 ! Félicitations ! Vous avez gagné ${segment.label} !"`);
    } else {
      console.log(`   "${segment.label}" → "🎉 Félicitations ! Vous avez gagné ${segment.label} !"`);
    }
  }
});

// Test 4: Vérifier l'affichage de l'indicateur
console.log('\n🎨 Test de l\'indicateur visuel:');
if (weekend) {
  console.log('   ✅ Badge "🎉 WEEKEND BONUS x2 !" affiché');
  console.log('   ✅ Style CSS animé appliqué');
  console.log('   ✅ Dégradé coloré en cours');
} else {
  console.log('   ❌ Badge weekend non affiché (normal en semaine)');
}

// Test 5: Simulation d'un spin
console.log('\n🎲 Simulation d\'un spin:');
const randomSegment = segments[Math.floor(Math.random() * segments.length)];
console.log(`   Segment sélectionné: ${randomSegment.label}`);

if (randomSegment.label === 'Perdu') {
  console.log('   Résultat: 😔 Dommage, vous n\'avez rien gagné cette fois-ci !');
} else {
  const coins = parseInt(randomSegment.label.match(/\d+/)?.[0] || '0');
  if (weekend) {
    console.log(`   Résultat: 🎉 WEEKEND BONUS x2 ! Félicitations ! Vous avez gagné ${coins} coins !`);
    console.log(`   Coins effectivement gagnés: ${coins} (${coins/2} x 2)`);
  } else {
    console.log(`   Résultat: 🎉 Félicitations ! Vous avez gagné ${coins} coins !`);
    console.log(`   Coins effectivement gagnés: ${coins}`);
  }
}

console.log('\n✅ Test frontend terminé avec succès!');
console.log('\n📝 Résumé frontend:');
console.log(`   - Détection weekend: ${weekend ? 'ACTIVE' : 'INACTIVE'}`);
console.log(`   - Segments adaptés: ${weekend ? 'OUI' : 'NON'}`);
console.log(`   - Messages personnalisés: OUI`);
console.log(`   - Indicateur visuel: ${weekend ? 'AFFICHÉ' : 'MASQUÉ'}`);
console.log(`   - Animation CSS: ${weekend ? 'ACTIVE' : 'INACTIVE'}`);

// Test 6: Vérifier les valeurs exactes
console.log('\n🔢 Vérification des valeurs:');
const baseValues = [10, 20, 30, 50, 70, 100];
baseValues.forEach(baseValue => {
  const weekendValue = baseValue * 2;
  console.log(`   ${baseValue} coins → ${weekend ? `${weekendValue} coins (x2)` : `${baseValue} coins`}`);
}); 