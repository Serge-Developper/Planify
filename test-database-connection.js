import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI non définie dans les variables d\'environnement');
      return;
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connexion MongoDB réussie');
    
    const db = client.db('planifyvrai');
    const usersCollection = db.collection('users');
    
    // Compter le nombre total d'utilisateurs
    const totalUsers = await usersCollection.countDocuments();
    console.log(`📊 Nombre total d'utilisateurs: ${totalUsers}`);
    
    // Vérifier un utilisateur spécifique (SergeA'1)
    const user = await usersCollection.findOne({ username: "SergeA'1" });
    
    if (user) {
      console.log('✅ Utilisateur SergeA\'1 trouvé');
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
    
    // Vérifier tous les utilisateurs avec des questions secrètes
    const usersWithSecrets = await usersCollection.find({ 
      secretQuestions: { $exists: true, $ne: null } 
    }).toArray();
    
    console.log(`\n📊 Utilisateurs avec des questions secrètes: ${usersWithSecrets.length}`);
    
    usersWithSecrets.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.username} - Questions: ${u.secretQuestions ? u.secretQuestions.length : 0}`);
    });
    
    await client.close();
    console.log('✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testDatabaseConnection();
