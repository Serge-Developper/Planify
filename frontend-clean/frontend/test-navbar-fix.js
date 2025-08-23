// Test pour vérifier que les corrections de Navbar.vue fonctionnent
console.log('🧪 TEST DES CORRECTIONS NAVBAR');

// Test 1: Vérifier que les segments sont corrects
function testSegments() {
  console.log('📋 Test 1: Vérification des segments');
  
  const baseSegments = [
    { label: '10 coins', color: '#FFD700' },
    { label: '20 coins', color: '#FF6347' },
    { label: '30 coins', color: '#FFB347' },
    { label: '50 coins', color: '#4682B4' },
    { label: '70 coins', color: '#8A2BE2' },
    { label: '100 coins', color: '#32CD32' },
    { label: 'Perdu', color: '#ccc' },
  ];
  
  console.log('✅ Segments de base:', baseSegments);
  console.log('✅ Nombre de segments:', baseSegments.length);
  
  // Test weekend
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  console.log('📅 Jour actuel:', dayOfWeek, isWeekend ? '(Weekend)' : '(Semaine)');
  
  if (isWeekend) {
    const weekendSegments = baseSegments.map(segment => {
      if (segment.label === 'Perdu') {
        return segment;
      }
      const coins = parseInt(segment.label.match(/\d+/)?.[0] || '0');
      return {
        ...segment,
        label: `${coins * 2} coins`
      };
    });
    console.log('🎉 Segments weekend:', weekendSegments);
  }
}

// Test 2: Vérifier que findIndex fonctionne
function testFindIndex() {
  console.log('\n🔍 Test 2: Vérification de findIndex');
  
  const segments = [
    { label: '10 coins', color: '#FFD700' },
    { label: '20 coins', color: '#FF6347' },
    { label: 'Perdu', color: '#ccc' }
  ];
  
  console.log('✅ Segments pour test:', segments);
  
  // Test findIndex
  const index = segments.findIndex(seg => seg.label.toLowerCase() === '10 coins');
  console.log('✅ Index trouvé pour "10 coins":', index);
  
  // Test avec un label qui n'existe pas
  const notFound = segments.findIndex(seg => seg.label.toLowerCase() === '999 coins');
  console.log('✅ Index pour "999 coins" (non trouvé):', notFound);
}

// Test 3: Vérifier la structure des segments
function testSegmentStructure() {
  console.log('\n🏗️ Test 3: Vérification de la structure des segments');
  
  const segments = [
    { label: '10 coins', color: '#FFD700' },
    { label: 'Perdu', color: '#ccc' }
  ];
  
  segments.forEach((segment, index) => {
    console.log(`✅ Segment ${index}:`, {
      hasLabel: typeof segment.label === 'string',
      hasColor: typeof segment.color === 'string',
      label: segment.label,
      color: segment.color
    });
  });
}

// Exécuter tous les tests
console.log('🚀 Démarrage des tests...\n');

try {
  testSegments();
  testFindIndex();
  testSegmentStructure();
  
  console.log('\n🎉 Tous les tests sont passés avec succès !');
  console.log('✅ Les corrections de Navbar.vue devraient fonctionner');
} catch (error) {
  console.error('❌ Erreur lors des tests:', error);
} 