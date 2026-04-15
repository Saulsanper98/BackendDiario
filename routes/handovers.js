const express = require('express');
const router = express.Router();
const Handover = require('../models/Handover');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { notifyHandoverDelivered, notifyHandoverReceived } = require('../services/teamsNotifier');

// GET /api/handovers
router.get('/', auth, async (req, res) => {
  try {
    const handovers = await Handover.find({ department: req.user.department }).sort({ date: -1, deliveredAt: -1 });
    res.json(handovers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/handovers
router.post('/', auth, async (req, res) => {
  try {
    const requestedAuthorId =
      req.body.authorId ||
      req.body.author_id ||
      req.body.authorMongoId ||
      req.body.authorUserId ||
      req.body.selectedUserId ||
      req.body.userId ||
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

    const handover = new Handover({
      ...req.body,
      authorId: finalAuthorId,
      authorName: finalAuthorName,
      department: req.user.department,
    });
    await handover.save();
    notifyHandoverDelivered(handover).catch((err) =>
      console.error('Error en notifyHandoverDelivered:', err)
    );
    res.status(201).json(handover);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/handovers/:id/receive - confirmar recepcion
router.put('/:id/receive', auth, async (req, res) => {
  try {
    const requestedReceiverId =
      req.body.receivedBy ||
      req.body.receivedById ||
      req.body.receiverId ||
      req.body.signerId ||
      req.body.selectedUserId ||
      req.body.userId ||
      req.body.receiver?.id ||
      req.body.receiver?._id;

    let finalReceivedBy = req.user.userId;
    let finalReceivedByName = req.user.name;

    if (requestedReceiverId) {
      const selectedReceiver = await User.findById(requestedReceiverId);
      if (!selectedReceiver) {
        return res.status(400).json({ error: 'receivedBy no existe' });
      }
      if (selectedReceiver.department !== req.user.department) {
        return res.status(403).json({ error: 'receivedBy no autorizado para este departamento' });
      }
      finalReceivedBy = selectedReceiver._id.toString();
      finalReceivedByName = req.body.receivedByName || selectedReceiver.name;
    } else if (req.body.receivedByName) {
      return res.status(400).json({ error: 'receivedBy requerido cuando se envía receivedByName' });
    }

    const handover = await Handover.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      {
        receivedBy: finalReceivedBy,
        receivedByName: finalReceivedByName,
        receivedAt: new Date().toISOString(),
      },
      { new: true }
    );
    notifyHandoverReceived(handover).catch(console.error);
    if (!handover) return res.status(404).json({ error: 'Traspaso no encontrado' });
    res.json(handover);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
