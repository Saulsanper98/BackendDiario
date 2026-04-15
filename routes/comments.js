const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
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
    const requestedAuthorId =
      req.body.authorId ||
      req.body.author_id ||
      req.body.authorMongoId ||
      req.body.author?.id ||
      req.body.author?._id;
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
    } else if (req.body.authorName) {
      return res.status(400).json({ error: 'authorId requerido cuando se envía authorName' });
    }

    const comment = new Comment({
      ...req.body,
      authorId: finalAuthorId,
      authorName: finalAuthorName,
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
