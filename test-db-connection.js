import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI non définie dans les variables d\'environnement');
      return;
    }
    
    console.log('📡 Connexion à MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connexion MongoDB réussie !');
    
    const db = client.db('planifyvrai');
    const usersCollection = db.collection('users');
    
    // Compter les utilisateurs
    const userCount = await usersCollection.countDocuments();
    console.log(`👥 Nombre d'utilisateurs dans la base : ${userCount}`);
    
    // Lister quelques utilisateurs
    const users = await usersCollection.find({}).limit(5).toArray();
    console.log('\n📋 Exemples d\'utilisateurs :');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}, Role: ${user.role}, Groupe: ${user.groupe}`);
      console.log(`   Questions secrètes: ${user.secretQuestions ? user.secretQuestions.length : 0}`);
    });
    
    // Tester la recherche d'un utilisateur spécifique
    const testUser = await usersCollection.findOne({ username: 'SergeA\'1' });
    if (testUser) {
      console.log('\n✅ Utilisateur test trouvé :', testUser.username);
      console.log(`   Questions secrètes: ${testUser.secretQuestions ? testUser.secretQuestions.length : 0}`);
    } else {
      console.log('\n❌ Utilisateur test non trouvé');
    }
    
    await client.close();
    console.log('\n🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  }
}

testDatabaseConnection();
