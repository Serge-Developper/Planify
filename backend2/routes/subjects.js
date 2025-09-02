const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const StaticSubjectRule = require('../models/StaticSubjectRule');

// GET - Récupérer toutes les matières
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des matières' });
  }
});

// GET - Récupérer une matière par ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Erreur lors de la récupération de la matière:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer une nouvelle matière
router.post('/', async (req, res) => {
  try {
    const {
      name,
      color,
      color2,
      gradientAngle,
      colorOpacity,
      color2Opacity,
      yearsAllowed,
      groupsAllowed,
      specialitesAllowed
    } = req.body;

    // Vérifier si une matière avec ce nom existe déjà
    const existingSubject = await Subject.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSubject) {
      return res.status(400).json({ error: 'Une matière avec ce nom existe déjà' });
    }

    const newSubject = new Subject({
      name,
      color,
      color2,
      gradientAngle,
      colorOpacity,
      color2Opacity,
      yearsAllowed: yearsAllowed || [],
      groupsAllowed: groupsAllowed || [],
      specialitesAllowed: specialitesAllowed || []
    });

    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (error) {
    console.error('Erreur lors de la création de la matière:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la matière' });
  }
});

// PUT - Mettre à jour une matière
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      color,
      color2,
      gradientAngle,
      colorOpacity,
      color2Opacity,
      yearsAllowed,
      groupsAllowed,
      specialitesAllowed
    } = req.body;

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (name) {
      const existingSubject = await Subject.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingSubject) {
        return res.status(400).json({ error: 'Une matière avec ce nom existe déjà' });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name,
        color,
        color2,
        gradientAngle,
        colorOpacity,
        color2Opacity,
        yearsAllowed,
        groupsAllowed,
        specialitesAllowed,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedSubject) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }

    res.json(updatedSubject);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la matière:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// DELETE - Supprimer une matière
router.delete('/:id', async (req, res) => {
  try {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
    
    if (!deletedSubject) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }

    res.json({ message: 'Matière supprimée avec succès', subject: deletedSubject });
  } catch (error) {
    console.error('Erreur lors de la suppression de la matière:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

// === Routes pour les règles statiques ===

// GET - Récupérer toutes les règles statiques
router.get('/static-rules/all', async (req, res) => {
  try {
    const rules = await StaticSubjectRule.find().sort({ subjectName: 1 });
    res.json(rules);
  } catch (error) {
    console.error('Erreur lors de la récupération des règles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST - Créer ou mettre à jour une règle statique
router.post('/static-rules', async (req, res) => {
  try {
    const { subjectName, yearsAllowed, groupsAllowed, specialitesAllowed } = req.body;

    if (!subjectName) {
      return res.status(400).json({ error: 'Le nom de la matière est requis' });
    }

    const rule = await StaticSubjectRule.findOneAndUpdate(
      { subjectName },
      {
        subjectName,
        yearsAllowed: yearsAllowed || [],
        groupsAllowed: groupsAllowed || [],
        specialitesAllowed: specialitesAllowed || [],
        updatedAt: Date.now()
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(rule);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la règle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE - Supprimer une règle statique
router.delete('/static-rules/:subjectName', async (req, res) => {
  try {
    const deleted = await StaticSubjectRule.findOneAndDelete({ 
      subjectName: req.params.subjectName 
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Règle non trouvée' });
    }

    res.json({ message: 'Règle supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la règle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;