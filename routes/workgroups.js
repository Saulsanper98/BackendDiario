const express = require('express');
const router = express.Router();
const WorkGroup = require('../models/WorkGroup');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const wgs = await WorkGroup.find({
      $or: [{ department: req.user.department }, { memberUserIds: req.user.userId }, { invitedUserIds: req.user.userId }],
    });
    res.json(wgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const wg = new WorkGroup({
      ...req.body,
      ownerId: req.user.userId,
      ownerName: req.user.name,
      department: req.user.department,
    });
    await wg.save();
    res.status(201).json(wg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const wg = await WorkGroup.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!wg) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(wg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await WorkGroup.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
