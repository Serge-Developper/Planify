import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTestUser() {
  try {
    console.log('🔧 Création d\'un utilisateur de test...');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI non définie');
      return;
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connexion MongoDB réussie');
    
    const db = client.db('planifyvrai');
    const usersCollection = db.collection('users');
    
    // Vérifier si l'utilisateur de test existe déjà
    const existingUser = await usersCollection.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('⚠️ L\'utilisateur testuser existe déjà');
      await client.close();
      return;
    }
    
    // Créer un mot de passe simple
    const password = 'test123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Créer l'utilisateur de test
    const testUser = {
      username: 'testuser',
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
    
    const result = await usersCollection.insertOne(testUser);
    console.log('✅ Utilisateur de test créé avec succès !');
    console.log('📋 Détails :');
    console.log(`   - Username: testuser`);
    console.log(`   - Password: ${password}`);
    console.log(`   - ID: ${result.insertedId}`);
    console.log(`   - Mot de passe haché: ${hashedPassword.substring(0, 20)}...`);
    
    await client.close();
    console.log('🎉 Script terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createTestUser();

