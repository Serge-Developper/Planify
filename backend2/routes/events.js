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
    
    // Créer des événements de test pour toutes les années
    const eventsData = [
      // BUT2 (événements existants)
      {
        titre: 'Examen Développement Web',
        date: '2024-12-15',
        heure: '09h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'exam',
        matiere: 'Développement web',
        year: 'BUT2'
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
      },
      // BUT1 (nouveaux événements)
      {
        titre: 'Devoir BUT1 - Introduction',
        date: '2024-12-20',
        heure: '10h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Introduction',
        year: 'BUT1'
      },
      {
        titre: 'Examen BUT1 - Bases',
        date: '2024-12-22',
        heure: '14h00',
        groupe: 'Promo',
        groupes: ['Promo'],
        type: 'exam',
        matiere: 'Bases',
        year: 'BUT1'
      },
      // BUT3 (nouveaux événements)
      {
        titre: 'Examen BUT3 - Projet Final',
        date: '2024-12-21',
        heure: '14h00',
        groupe: 'Promo',
        groupes: ['Promo'],
        type: 'exam',
        matiere: 'Projet Final',
        year: 'BUT3'
      },
      {
        titre: 'Devoir BUT3 - Spécialisation',
        date: '2024-12-23',
        heure: '16h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Spécialisation',
        year: 'BUT3'
      }
    ];

    const events = await Event.insertMany(eventsData);
    res.json({ message: `${events.length} événements créés avec succès`, events });
  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
    res.status(500).json({ message: 'Erreur lors de la création des données de test', error: error.message });
  }
});

// Route pour ajouter des événements de test sans supprimer les existants
router.post('/add-test-events', async (req, res) => {
  try {
    // Créer des événements de test pour toutes les années
    const eventsData = [
      // BUT1
      {
        titre: 'Devoir BUT1 - Introduction',
        date: '2024-12-20',
        heure: '10h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Introduction',
        year: 'BUT1'
      },
      {
        titre: 'Examen BUT1 - Bases',
        date: '2024-12-22',
        heure: '14h00',
        groupe: 'Promo',
        groupes: ['Promo'],
        type: 'exam',
        matiere: 'Bases',
        year: 'BUT1'
      },
      // BUT3
      {
        titre: 'Examen BUT3 - Projet Final',
        date: '2024-12-21',
        heure: '14h00',
        groupe: 'Promo',
        groupes: ['Promo'],
        type: 'exam',
        matiere: 'Projet Final',
        year: 'BUT3'
      },
      {
        titre: 'Devoir BUT3 - Spécialisation',
        date: '2024-12-23',
        heure: '16h00',
        groupe: 'A',
        groupes: ['A'],
        type: 'devoir',
        matiere: 'Spécialisation',
        year: 'BUT3'
      }
    ];

    const events = await Event.insertMany(eventsData);
    res.json({ message: `${events.length} événements ajoutés avec succès`, events });
  } catch (error) {
    console.error('Erreur lors de l\'ajout des événements de test:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout des événements de test', error: error.message });
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
    console.log(`=== RÉCUPÉRATION ÉVÉNEMENTS ===`);
    console.log(`Utilisateur: ${req.user.username}, Rôle: ${role}, Année: ${year}, Groupe: ${groupe}`);
    fs.appendFileSync('debug.log', `User: ${req.user.username}, Role: ${role}, Year: ${year}, Groupe: ${groupe}\\n`);
    const normalizedYear = normalizeYear(year);
    const normalizedGroupe = (groupe || '').toUpperCase();

    let query = {};
    if (role !== 'admin' && role !== 'prof') {
      // Logique pour les étudiants et délégués (pas les profs ni les admins)
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
    // Pour les profs et admins : pas de filtre (voient tous les événements)
    if (role === 'prof' || role === 'admin') {
      console.log(`${role === 'prof' ? 'Professeur' : 'Admin'} - Affichage de tous les événements`);
      fs.appendFileSync('debug.log', `${role === 'prof' ? 'Professeur' : 'Admin'} - Affichage de tous les événements\\n`);
    }
    fs.appendFileSync('debug.log', 'Query utilisée: ' + JSON.stringify(query) + '\\n');
    // Exclure les événements "supprimés" individuellement par cet utilisateur
    const events = await Event.find({
      ...query,
      $or: [
        { deletedBy: { $exists: false } },
        { deletedBy: { $size: 0 } },
        { deletedBy: { $nin: [req.user.id] } }
      ]
    });
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

// Vider pour SOI (POST): marque l'événement comme supprimé pour l'utilisateur courant
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    await Event.updateOne({ _id: req.params.id }, { $addToSet: { deletedBy: req.user.id } });
    return res.json({ message: 'Événement masqué pour cet utilisateur' });
  } catch (e) {
    console.error('Erreur masquage (POST):', e);
    return res.status(500).json({ message: 'Erreur masquage' });
  }
});

// Vider pour SOI (DELETE): marque l'événement comme supprimé pour l'utilisateur courant
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    await Event.updateOne({ _id: req.params.id }, { $addToSet: { deletedBy: req.user.id } });
    return res.json({ message: 'Événement masqué pour cet utilisateur' });
  } catch (error) {
    console.error('Erreur lors du masquage:', error);
    return res.status(500).json({ message: 'Erreur lors du masquage pour cet utilisateur' });
  }
});

// Modifier un événement
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(event);
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