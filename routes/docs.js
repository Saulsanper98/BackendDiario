const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// GET /api/docs
router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({ department: req.user.department }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/docs
router.post('/', auth, async (req, res) => {
  try {
    const doc = new Document({
      ...req.body,
      authorId: req.user.userId,
      department: req.user.department,
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error('Error creando documento:', err.message);
    console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/docs/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      req.body,
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/docs/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      department: req.user.department
    });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
