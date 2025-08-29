const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'planify';

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: ''
    };
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const subjectsCollection = db.collection('subjects');

    switch (event.httpMethod) {
      case 'GET': {
        const subjects = await subjectsCollection.find({}).sort({ name: 1 }).toArray();
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify(subjects)
        };
      }
      case 'POST': {
        const newSubject = JSON.parse(event.body || '{}');
        if (!newSubject.name || !newSubject.color) {
          return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Nom et couleur requis' }) };
        }
        const existingSubject = await subjectsCollection.findOne({ name: { $regex: new RegExp(`^${newSubject.name}$`, 'i') } });
        if (existingSubject) {
          return { statusCode: 409, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Cette matière existe déjà' }) };
        }
        const isValidYear = (y) => ['BUT1','BUT2','BUT3'].includes(String(y));
        const isValidGroup = (g) => ['Promo','A','A\'','A"','B','B\'','B"'].includes(String(g));
        const toArray = (v) => Array.isArray(v) ? v.map(String) : [];
        const normalized = {
          name: String(newSubject.name),
          color: String(newSubject.color),
          color2: newSubject.color2 ? String(newSubject.color2) : undefined,
          gradientAngle: typeof newSubject.gradientAngle === 'number' ? newSubject.gradientAngle : undefined,
          colorOpacity: typeof newSubject.colorOpacity === 'number' ? newSubject.colorOpacity : undefined,
          color2Opacity: typeof newSubject.color2Opacity === 'number' ? newSubject.color2Opacity : undefined,
          useGradient: typeof newSubject.useGradient === 'boolean' ? !!newSubject.useGradient : !!newSubject.color2,
          yearsAllowed: toArray(newSubject.yearsAllowed).filter(isValidYear),
          groupsAllowed: toArray(newSubject.groupsAllowed).filter(isValidGroup)
        };
        const result = await subjectsCollection.insertOne({ ...normalized, createdAt: new Date(), updatedAt: new Date() });
        return { statusCode: 201, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ _id: result.insertedId, ...normalized, createdAt: new Date(), updatedAt: new Date() }) };
      }
      case 'PUT': {
        const { id } = event.queryStringParameters || {};
        if (!id) { return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID requis' }) }; }
        const updateDataRaw = JSON.parse(event.body || '{}');
        const mkNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
        const isValidYear = (y) => ['BUT1','BUT2','BUT3'].includes(String(y));
        const isValidGroup = (g) => ['Promo','A','A\'','A"','B','B\'','B"'].includes(String(g));
        const toArray = (v) => Array.isArray(v) ? v.map(String) : [];
        const updateData = {
          ...(updateDataRaw.name !== undefined ? { name: String(updateDataRaw.name) } : {}),
          ...(updateDataRaw.color !== undefined ? { color: String(updateDataRaw.color) } : {}),
          ...(updateDataRaw.color2 !== undefined ? { color2: updateDataRaw.color2 ? String(updateDataRaw.color2) : undefined } : {}),
          ...(updateDataRaw.gradientAngle !== undefined ? (() => { const n = mkNum(updateDataRaw.gradientAngle); return n !== undefined ? { gradientAngle: n } : {}; })() : {}),
          ...(updateDataRaw.colorOpacity !== undefined ? (() => { const n = mkNum(updateDataRaw.colorOpacity); return n !== undefined ? { colorOpacity: n } : {}; })() : {}),
          ...(updateDataRaw.color2Opacity !== undefined ? (() => { const n = mkNum(updateDataRaw.color2Opacity); return n !== undefined ? { color2Opacity: n } : {}; })() : {}),
          ...(typeof updateDataRaw.useGradient === 'boolean' ? { useGradient: !!updateDataRaw.useGradient } : {}),
          ...(updateDataRaw.yearsAllowed !== undefined ? { yearsAllowed: toArray(updateDataRaw.yearsAllowed).filter(isValidYear) } : {}),
          ...(updateDataRaw.groupsAllowed !== undefined ? { groupsAllowed: toArray(updateDataRaw.groupsAllowed).filter(isValidGroup) } : {})
        };
        let objectId;
        try { objectId = require('mongodb').ObjectId(id); } catch (e) {
          try { const { ObjectId } = require('mongodb'); objectId = new ObjectId(id); } catch { return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID invalide' }) }; }
        }
        if (updateData.name) {
          const { ObjectId } = require('mongodb');
          const excludeId = new ObjectId(id);
          const duplicateSubject = await subjectsCollection.findOne({ name: { $regex: new RegExp(`^${updateData.name}$`, 'i') }, _id: { $ne: excludeId } });
          if (duplicateSubject) { return { statusCode: 409, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Cette matière existe déjà' }) }; }
        }
        if (Object.keys(updateData).length === 0) { return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Aucune donnée à mettre à jour' }) }; }
        const updateResult = await subjectsCollection.updateOne({ _id: objectId }, { $set: { ...updateData, updatedAt: new Date() } });
        if (updateResult.matchedCount === 0) { return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Matière non trouvée' }) }; }
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Matière mise à jour avec succès' }) };
      }
      case 'DELETE': {
        const { id: deleteId } = event.queryStringParameters || {};
        if (!deleteId) { return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID requis' }) }; }
        const homeworkCollection = db.collection('homework');
        const homeworkCount = await homeworkCollection.countDocuments({ subjectId: deleteId });
        if (homeworkCount > 0) { return { statusCode: 409, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `Impossible de supprimer cette matière car elle est utilisée dans ${homeworkCount} devoir(s)` }) }; }
        let deleteObjId; try { deleteObjId = require('mongodb').ObjectId(deleteId); } catch (e) { const { ObjectId } = require('mongodb'); try { deleteObjId = new ObjectId(deleteId); } catch { return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID invalide' }) }; } }
        const deleteResult = await subjectsCollection.deleteOne({ _id: deleteObjId });
        if (deleteResult.deletedCount === 0) { return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Matière non trouvée' }) }; }
        return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Matière supprimée avec succès' }) };
      }
      default:
        return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }
  } catch (error) {
    console.error('Erreur subjects.js:', error && error.stack || error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Erreur serveur interne', details: String(error && error.message || error) })
    };
  } finally {
    await client.close();
  }
};
