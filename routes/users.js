const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { syncUsersFromEntra } = require('../services/entraSync');

// GET /api/users/department - usuarios del departamento del token Microsoft
router.get('/department', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      department: req.user.department,
      active: true 
    }).sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - crear usuario (solo admin)
router.post('/', auth, async (req, res) => {
  try {
    const user = new User({
      ...req.body,
      department: req.user.department,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/:id - editar usuario
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      req.body,
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id - desactivar usuario
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, department: req.user.department },
      { active: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/sync — sincronizar desde Entra ID (solo admin)
router.post('/sync', auth, async (req, res) => {
  try {
    await syncUsersFromEntra();
    const users = await User.find({ active: true });
    res.json({ success: true, count: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
