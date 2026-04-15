const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { notifyMention, notifyHighPriorityNote } = require('../services/teamsNotifier');
const { createOutlookReminder } = require('../services/outlookNotifier');

async function deleteNoteByRequest(req, res) {
  const noteId =
    req.params.id ||
    req.body?.id ||
    req.body?._id ||
    req.body?.noteId ||
    req.query?.id ||
    req.query?._id ||
    req.query?.noteId;
  if (!noteId) return res.status(400).json({ error: 'ID de nota requerido' });

  const note = await Note.findById(noteId);
  if (!note) return res.status(404).json({ error: 'Nota no encontrada' });

  if (note.department !== req.user.department) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  await Note.deleteOne({ _id: note._id });
  return res.json({ success: true });
}

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
    const requestedAuthorId = req.body.authorId;
    let finalAuthorId = req.user.userId;
    let finalAuthorName = req.user.name;

    if (requestedAuthorId) {
      const selectedAuthor = await User.findById(requestedAuthorId);
      if (!selectedAuthor) {
        return res.status(400).json({ error: 'authorId no existe' });
      }
      if (selectedAuthor.department !== req.user.department) {
        return res.status(403).json({ error: 'authorId no autorizado para este departamento' });
      }
      finalAuthorId = selectedAuthor._id.toString();
      finalAuthorName = req.body.authorName || selectedAuthor.name;
    }

    const note = new Note({
      ...req.body,
      authorId: finalAuthorId,
      authorName: finalAuthorName,
      department: req.user.department,
    });
    await note.save();
    if (note.reminder) {
      createOutlookReminder(note).catch(console.error);
    }
    if (note.priority === 'alta') {
      notifyHighPriorityNote(note).catch(console.error);
    }

    if (note.mentions && note.mentions.length > 0) {
      // Resolver nombres de los mencionados desde MongoDB
      User.find({ _id: { $in: note.mentions } })
        .then((mentionedUsers) => {
          mentionedUsers.forEach((u) => {
            notifyMention(note, u.name).catch(console.error);
          });
        })
        .catch(console.error);
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
    if (Object.prototype.hasOwnProperty.call(req.body, 'authorId')) {
      return res.status(400).json({ error: 'No se permite cambiar authorId' });
    }
    Object.assign(note, req.body);
    await note.save();
    if (note.reminder) {
      createOutlookReminder(note).catch(console.error);
    }
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    return await deleteNoteByRequest(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compatibilidad: algunos clientes envian DELETE /api/notes con id en body/query
router.delete('/', auth, async (req, res) => {
  try {
    return await deleteNoteByRequest(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
