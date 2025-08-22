import { MongoClient } from 'mongodb';

// Variables d'environnement temporaires pour le test
// Remplacez par vos vraies valeurs
const MONGODB_URI = 'mongodb+srv://planifyvrai:planifyvrai@cluster0.mongodb.net/planifyvrai?retryWrites=true&w=majority';

async function testMongoDBDirect() {
  console.log('🔍 Test direct de connexion MongoDB...');
  
  try {
    console.log('📡 Tentative de connexion à MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connexion MongoDB réussie !');
    
    const db = client.db('planifyvrai');
    const usersCollection = db.collection('users');
    
    // Compter le nombre total d'utilisateurs
    const totalUsers = await usersCollection.countDocuments();
    console.log(`📊 Nombre total d'utilisateurs: ${totalUsers}`);
    
    // Vérifier l'utilisateur SergeA'1
    const user = await usersCollection.findOne({ username: "SergeA'1" });
    
    if (user) {
      console.log('✅ Utilisateur SergeA\'1 trouvé !');
      console.log('📋 Données utilisateur:');
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Secret Questions: ${JSON.stringify(user.secretQuestions)}`);
      console.log(`   - Has Secret Questions: ${user.hasSecretQuestions}`);
      
      // Vérifier la logique de hasSecretQuestions
      const hasSecretQuestions = user.secretQuestions && Array.isArray(user.secretQuestions) && user.secretQuestions.length > 0;
      console.log(`🔍 Logique hasSecretQuestions: ${hasSecretQuestions}`);
      
      if (hasSecretQuestions) {
        console.log('✅ L\'utilisateur a des questions secrètes - ne devrait PAS être redirigé vers le formulaire');
      } else {
        console.log('❌ L\'utilisateur n\'a pas de questions secrètes - sera redirigé vers le formulaire');
      }
    } else {
      console.log('❌ Utilisateur SergeA\'1 non trouvé');
    }
    
    await client.close();
    console.log('✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test MongoDB:', error.message);
    console.log('💡 Vérifiez votre chaîne de connexion MongoDB dans MONGODB_URI');
  }
}

testMongoDBDirect();
