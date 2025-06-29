// @ts-nocheck
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { verifyToken } = require('../middlewares/auth');

// Récupérer tous les événements
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const events = await Event.find();
  const eventsWithStatus = events.map(event => {
    const isArchived = event.archivedBy && event.archivedBy.map(id => id.toString()).includes(userId);
    const isChecked = event.checkedBy && event.checkedBy.map(id => id.toString()).includes(userId);
    return { ...event.toObject(), archived: isArchived, checked: isChecked };
  });
  res.json(eventsWithStatus);
});

// Ajouter un événement
router.post('/', verifyToken, async (req, res) => {
  const event = new Event({ ...req.body, createdBy: req.user.id });
  await event.save();
  res.json(event);
});

// Supprimer un événement
router.delete('/:id', verifyToken, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'Événement supprimé' });
});

// Modifier un événement
router.put('/:id', verifyToken, async (req, res) => {
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
  await Event.updateOne({ _id: req.params.id }, { $addToSet: { checkedBy: req.user.id } });
  res.json({ success: true });
});

// Dévalider (décocher) un événement
router.post('/:id/uncheck', verifyToken, async (req, res) => {
  await Event.updateOne({ _id: req.params.id }, { $pull: { checkedBy: req.user.id } });
  res.json({ success: true });
});

module.exports = router;