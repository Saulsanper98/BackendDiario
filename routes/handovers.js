const express = require('express');
const router = express.Router();
const Handover = require('../models/Handover');
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
    const handover = new Handover({
      ...req.body,
      authorId: req.user.userId,
      authorName: req.user.name,
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
    const handover = await Handover.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      {
        receivedBy: req.user.userId,
        receivedByName: req.user.name,
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
