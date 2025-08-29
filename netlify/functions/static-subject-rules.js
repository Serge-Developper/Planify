const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'planify';

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE'
      },
      body: ''
    };
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const coll = db.collection('static_subject_rules');

    switch (event.httpMethod) {
      case 'GET': {
        const docs = await coll.find({}).sort({ subjectName: 1 }).toArray();
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify(docs)
        };
      }
      case 'POST': {
        const payload = JSON.parse(event.body || '{}');
        const subjectName = payload && typeof payload.subjectName === 'string' ? payload.subjectName : '';
        if (!subjectName) {
          return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'subjectName requis' }) };
        }
        const toArray = (v) => Array.isArray(v) ? v.map(String) : [];
        const isValidYear = (y) => ['BUT1','BUT2','BUT3'].includes(String(y));
        const yearsAllowed = toArray(payload.yearsAllowed).filter(isValidYear);
        const specialitesAllowed = toArray(payload.specialitesAllowed).map(String);
        await coll.updateOne(
          { subjectName },
          { $set: { subjectName, yearsAllowed, specialitesAllowed, updatedAt: new Date() } },
          { upsert: true }
        );
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
      }
      case 'DELETE': {
        const { subjectName } = event.queryStringParameters || {};
        if (!subjectName) {
          return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'subjectName requis' }) };
        }
        await coll.deleteOne({ subjectName: String(subjectName) });
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
      }
      default:
        return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }
  } catch (err) {
    console.error('Erreur static-subject-rules:', err && err.stack || err);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Erreur serveur interne', details: String(err && err.message || err) }) };
  } finally {
    try { await client.close(); } catch {}
  }
};

