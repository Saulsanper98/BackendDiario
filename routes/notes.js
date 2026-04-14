const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const { notifyMention, notifyHighPriorityNote } = require('../services/teamsNotifier');

// GET /api/notes?date=YYYY-MM-DD&shift=morning
// Devuelve notas del departamento del usuario autenticado
router.get('/', auth, async (req, res) => {
  try {
    const { date, shift } = req.query;
    const filter = { department: req.user.department };
    if (date) filter.date = date;
    if (shift) filter.shift = shift;
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/all - todas las notas del departamento (para historial)
router.get('/all', auth, async (req, res) => {
  try {
    const notes = await Note.find({ department: req.user.department }).sort({ date: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes
router.post('/', auth, async (req, res) => {
  try {
    const note = new Note({
      ...req.body,
      authorId: req.user.userId,
      authorName: req.user.name,
      department: req.user.department,
    });
    await note.save();
    if (note.priority === 'alta') {
      notifyHighPriorityNote(note).catch(console.error);
    }
    if (note.mentions && note.mentions.length > 0) {
      // Las menciones son IDs — notificar sin bloquear
      notifyMention(note, 'Un compañero').catch(console.error);
    }
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/notes/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Nota no encontrada' });
    if (note.authorId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });
    Object.assign(note, req.body);
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Nota no encontrada' });
    if (note.authorId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });
    await note.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
