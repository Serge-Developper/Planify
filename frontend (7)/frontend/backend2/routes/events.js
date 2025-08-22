// @ts-nocheck
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { verifyToken, requireRole } = require('../middlewares/auth');
const fs = require('fs');

// Handler OPTIONS pour toutes les routes de ce router
router.options('*', (req, res) => {
  res.sendStatus(200);
});

// Route de test pour vérifier que l'API fonctionne
router.get('/test', (req, res) => {
  res.json({ message: 'API Events fonctionne !', timestamp: new Date() });
});

// Route pour créer des données de test (GET et POST)
router.get('/seed', async (req, res) => {
  try {
    // Supprimer les données existantes
    await Event.deleteMany({});
    
    // Créer des événements de test qui correspondent aux utilisateurs existants
    const eventsData = [
      {
        titre: 'Examen Développement Web',
        date: '2024-12-15', // Date plus récente
        heure: '09h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'exam',
        matiere: 'Développement web',
        year: 'BUT2' // Format texte pour correspondre aux utilisateurs
      },
      {
        titre: 'Devoir Anglais',
        date: '2024-12-16',
        heure: '14h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Anglais',
        year: 'BUT2'
      },
      {
        titre: 'Projet Gestion de projet',
        date: '2024-12-17',
        heure: '10h00',
        groupe: 'Promo',
        groupes: ['Promo'],
        type: 'devoir',
        matiere: 'Gestion de projet',
        year: 'BUT2'
      },
      {
        titre: 'Examen Culture numérique',
        date: '2024-12-18',
        heure: '15h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'exam',
        matiere: 'Culture numérique',
        year: 'BUT2'
      },
      {
        titre: 'TP Intégration',
        date: '2024-12-19',
        heure: '08h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Intégration',
        year: 'BUT2'
      }
    ];

    const events = await Event.insertMany(eventsData);
    res.json({ message: `${events.length} événements créés avec succès`, events });
  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
    res.status(500).json({ message: 'Erreur lors de la création des données de test', error: error.message });
  }
});

// Route pour créer des données de test (POST)
router.post('/seed', async (req, res) => {
  try {
    // Supprimer les données existantes
    await Event.deleteMany({});
    
    // Créer des événements de test qui correspondent aux utilisateurs existants
    const eventsData = [
      {
        titre: 'Examen Développement Web',
        date: '2024-12-15', // Date plus récente
        heure: '09h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'exam',
        matiere: 'Développement web',
        year: 'BUT2' // Format texte pour correspondre aux utilisateurs
      },
      {
        titre: 'Devoir Anglais',
        date: '2024-12-16',
        heure: '14h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Anglais',
        year: 'BUT2'
      },
      {
        titre: 'Projet Gestion de projet',
        date: '2024-12-17',
        heure: '10h00',
        groupe: 'Promo',
        groupes: ['Promo'],
        type: 'devoir',
        matiere: 'Gestion de projet',
        year: 'BUT2'
      },
      {
        titre: 'Examen Culture numérique',
        date: '2024-12-18',
        heure: '15h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'exam',
        matiere: 'Culture numérique',
        year: 'BUT2'
      },
      {
        titre: 'TP Intégration',
        date: '2024-12-19',
        heure: '08h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Intégration',
        year: 'BUT2'
      }
    ];

    const events = await Event.insertMany(eventsData);
    res.json({ message: `${events.length} événements créés avec succès`, events });
  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
    res.status(500).json({ message: 'Erreur lors de la création des données de test', error: error.message });
  }
});

// Fonction utilitaire pour normaliser l'année
function normalizeYear(year) {
  if (!year) return '';
  let y = year.replace(/\s+/g, '').toUpperCase();
  if (y === 'BUT1' || y === '1') return '1';
  if (y === 'BUT2' || y === '2') return '2';
  if (y === 'BUT3' || y === '3') return '3';
  return y;
}

// Fonction utilitaire pour normaliser le groupe (insensible à la casse)
function normalizeGroupe(groupe) {
  if (!groupe) return '';
  return groupe.replace(/\s+/g, '').toUpperCase();
}

// Récupérer tous les événements avec filtrage
router.get('/', verifyToken, async (req, res) => {
  try {
    const { id: userId, role, year, groupe } = req.user;
    fs.appendFileSync('debug.log', 'User year: ' + year + '\\n');
    const normalizedYear = normalizeYear(year);
    const normalizedGroupe = (groupe || '').toUpperCase();

    let query = {};
    if (role !== 'admin') {
      const possibleYears = [normalizedYear];
      if (normalizedYear === '1') possibleYears.push('BUT1', 'BUT 1', 1);
      if (normalizedYear === '2') possibleYears.push('BUT2', 'BUT 2', 2);
      if (normalizedYear === '3') possibleYears.push('BUT3', 'BUT 3', 3);

      query = {
        $and: [
          { year: { $in: possibleYears } },
          {
            $or: [
              { groupe: { $regex: `^${normalizedGroupe}$`, $options: 'i' } },
              { groupe: 'Promo' },
              { groupes: { $in: [groupe, 'Promo'] } }
            ]
          }
        ]
      };
    }
    fs.appendFileSync('debug.log', 'Query utilisée: ' + JSON.stringify(query) + '\\n');
    const events = await Event.find(query);
    console.log(`${events.length} événements trouvés pour l'utilisateur ${req.user.username}`);
    
    const eventsWithStatus = events.map(event => {
      const isArchived = event.archivedBy && event.archivedBy.map(id => id.toString()).includes(userId);
      const isChecked = event.checkedBy && event.checkedBy.map(id => id.toString()).includes(userId);
      return { ...event.toObject(), archived: isArchived, checked: isChecked };
    });
    
    res.json(eventsWithStatus);
  } catch (error) {
    console.error('Erreur critique dans GET /events:', error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des événements.", error: error.message });
  }
});

// Version sans authentification pour debug
router.get('/all', async (req, res) => {
  try {
    console.log('GET /events/all appelé');
    const events = await Event.find({});
    console.log(`${events.length} événements trouvés (sans filtre)`);
    res.json(events);
  } catch (error) {
    console.error('Erreur critique dans GET /events/all:', error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des événements.", error: error.message });
  }
});

// Ajouter un événement
router.post('/', verifyToken, requireRole(['admin', 'prof', 'delegue']), async (req, res) => {
  const event = new Event({ ...req.body, createdBy: req.user.id });
  await event.save();
  res.json(event);
});

// Supprimer un événement (POST pour compatibilité IONOS/Plesk)
router.post('/:id/delete', verifyToken, requireRole(['admin', 'delegue']), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'Événement supprimé' });
});

// Modifier un événement
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(event);
});

// Supprimer un événement (DELETE pour compatibilité frontend)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    // Autoriser la suppression si :
    // - l'utilisateur est admin ou délégué
    // - OU l'utilisateur a archivé la tâche (son ID est dans archivedBy)
    const isAdminOrDelegue = req.user.role === 'admin' || req.user.role === 'delegue';
    const isArchivedByUser = event.archivedBy && event.archivedBy.map(id => id.toString()).includes(req.user.id);
    if (!isAdminOrDelegue && !isArchivedByUser) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cet événement (il faut être admin/délégué ou l\'avoir archivé).' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement' });
  }
});

// Archiver un événement
router.post('/:id/archive', verifyToken, async (req, res) => {
  await Event.updateOne({ _id: req.params.id }, { $addToSet: { archivedBy: req.user.id } });
  res.json({ success: true });
});

// Désarchiver un événement
router.post('/:id/unarchive', verifyToken, async (req, res) => {
  await Event.updateOne({ _id: req.params.id }, { $pull: { archivedBy: req.user.id } });
  res.json({ success: true });
});

// Valider (cocher) un événement
router.post('/:id/check', verifyToken, async (req, res) => {
  try {
    // Récupérer l'événement pour vérifier s'il est en retard
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier si la tâche est en retard
    const [h, m] = (event.heure || '').split(':');
    const target = new Date(event.date);
    target.setHours(Number(h), Number(m || 0), 0, 0);
    const now = new Date();
    const isLate = now > target;

    // Ajouter l'utilisateur à la liste des utilisateurs qui ont validé cette tâche
    await Event.updateOne({ _id: req.params.id }, { $addToSet: { checkedBy: req.user.id } });
    
    // Incrémenter le compteur de tâches complétées seulement si la tâche n'est PAS en retard
    if (!isLate) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasks: 1 } });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la validation de la tâche:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la validation de la tâche' });
  }
});

// Dévalider (décocher) un événement
router.post('/:id/uncheck', verifyToken, async (req, res) => {
  try {
    // Récupérer l'événement pour vérifier s'il était en retard
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Vérifier si la tâche était en retard au moment de la validation
    const [h, m] = (event.heure || '').split(':');
    const target = new Date(event.date);
    target.setHours(Number(h), Number(m || 0), 0, 0);
    const now = new Date();
    const isLate = now > target;

    // Retirer l'utilisateur de la liste des utilisateurs qui ont validé cette tâche
    await Event.updateOne({ _id: req.params.id }, { $pull: { checkedBy: req.user.id } });
    
    // Décrémenter le compteur de tâches complétées seulement si la tâche n'était PAS en retard
    if (!isLate) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasks: -1 } });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la dévalidation de la tâche:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la dévalidation de la tâche' });
  }
});

module.exports = router;