import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();

    const contactData = {
      name,
      email,
      message,
      createdAt: new Date()
    };

    await db.collection('contacts').insertOne(contactData);
    await client.close();

    res.status(200).json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur contact:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
}
