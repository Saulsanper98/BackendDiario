const express = require('express');
const router = express.Router();
const Postit = require('../models/Postit');
const auth = require('../middleware/auth');

// GET /api/postit
router.get('/', auth, async (req, res) => {
  try {
    const cards = await Postit.find({ department: req.user.department }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/postit
router.post('/', auth, async (req, res) => {
  try {
    const card = new Postit({
      ...req.body,
      authorId: req.user.userId,
      department: req.user.department,
    });
    await card.save();
    res.status(201).json(card);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/postit/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const card = await Postit.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      req.body,
      { new: true }
    );
    if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada' });
    res.json(card);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/postit/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await Postit.findOneAndDelete({
      _id: req.params.id,
      department: req.user.department
    });
    if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
