const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// GET /api/comments?kind=note&targetId=xxx
router.get('/', auth, async (req, res) => {
  try {
    const { kind, targetId, extraId } = req.query;
    const filter = { department: req.user.department };
    if (kind) filter.kind = kind;
    if (targetId) filter.targetId = targetId;
    if (extraId) filter.extraId = extraId;
    const comments = await Comment.find(filter).sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comments
router.post('/', auth, async (req, res) => {
  try {
    const comment = new Comment({
      ...req.body,
      authorId: req.user.userId,
      authorName: req.user.name,
      department: req.user.department,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (comment.authorId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
