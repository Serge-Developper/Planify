import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function createSergeA1User() {
  try {
    console.log('🔧 Création de l\'utilisateur SergeA1...');
    
    // Utilisez votre chaîne de connexion MongoDB Atlas
    const MONGODB_URI = 'mongodb+srv://serge_planify:15...'; // Remplacez par votre vraie URI
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connexion MongoDB réussie');
    
    const db = client.db('planifyvrai');
    const usersCollection = db.collection('users');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({ username: 'SergeA1' });
    if (existingUser) {
      console.log('⚠️ L\'utilisateur SergeA1 existe déjà');
      console.log('📋 Détails:', {
        username: existingUser.username,
        role: existingUser.role,
        hasSecretQuestions: existingUser.hasSecretQuestions,
        secretQuestionsCount: existingUser.secretQuestions ? existingUser.secretQuestions.length : 0
      });
      await client.close();
      return;
    }
    
    // Créer un mot de passe
    const password = 'SergeA1Password';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Créer l'utilisateur SergeA1
    const sergeA1User = {
      username: 'SergeA1',
      password: hashedPassword,
      role: 'eleve',
      groupe: 'A',
      year: 'BUT1',
      coins: 100,
      secretQuestions: [
        {
          question: 'Quel est le nom de votre premier animal ?',
          answer: 'chat'
        },
        {
          question: 'Quel est le prénom de votre mère ?',
          answer: 'marie'
        },
        {
          question: 'Quelle est votre ville de naissance ?',
          answer: 'paris'
        }
      ],
      hasSecretQuestions: true,
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(sergeA1User);
    console.log('✅ Utilisateur SergeA1 créé avec succès !');
    console.log('📋 Détails :');
    console.log(`   - Username: SergeA1`);
    console.log(`   - Password: ${password}`);
    console.log(`   - ID: ${result.insertedId}`);
    console.log(`   - Questions secrètes: ${sergeA1User.secretQuestions.length}`);
    
    await client.close();
    console.log('🎉 Script terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createSergeA1User();
