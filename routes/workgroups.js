const express = require('express');
const router = express.Router();
const WorkGroup = require('../models/WorkGroup');
const WorkGroupInvite = require('../models/WorkGroupInvite');
const User = require('../models/User');
const auth = require('../middleware/auth');

async function resolveActorUser(req) {
  const selectedUserId =
    req.headers['x-selected-user-id'] ||
    req.query.userId ||
    req.body?.userId ||
    req.body?.selectedUserId;

  if (selectedUserId) {
    const selected = await User.findById(selectedUserId);
    if (!selected) return null;
    if (selected.department !== req.user.department) return null;
    return selected;
  }

  const byIdentity = await User.findOne({
    department: req.user.department,
    $or: [{ email: req.user.email || '' }, { entraId: req.user.userId }],
  });
  return byIdentity;
}

function isOwnerOrAdmin(wg, actorUserId) {
  return wg.ownerId === actorUserId || (wg.adminUserIds || []).includes(actorUserId);
}

// GET /api/workgroups/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const wgs = await WorkGroup.find({
      $or: [
        { department: req.user.department },
        { memberUserIds: req.user.userId },
        { ownerId: req.user.userId }
      ]
    });
    res.json(wgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workgroups/invites/pending
router.get('/invites/pending', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    if (!actor) return res.status(403).json({ error: 'No autorizado para este contexto de usuario' });

    const invites = await WorkGroupInvite.find({
      toUserId: actor._id.toString(),
      status: 'pending',
      department: req.user.department,
    }).sort({ createdAt: -1 });

    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workgroups/invites/:inviteId/accept
router.put('/invites/:inviteId/accept', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    if (!actor) return res.status(403).json({ error: 'No autorizado para este contexto de usuario' });

    const invite = await WorkGroupInvite.findOne({
      _id: req.params.inviteId,
      toUserId: actor._id.toString(),
      department: req.user.department,
      status: 'pending',
    });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });

    const wg = await WorkGroup.findOne({
      _id: invite.wgId,
      department: req.user.department,
    });
    if (!wg) return res.status(404).json({ error: 'Grupo no encontrado' });

    if (!wg.memberUserIds.includes(actor._id.toString())) {
      wg.memberUserIds.push(actor._id.toString());
      await wg.save();
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ success: true, invite, workgroup: wg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/workgroups/invites/:inviteId/decline
router.put('/invites/:inviteId/decline', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    if (!actor) return res.status(403).json({ error: 'No autorizado para este contexto de usuario' });

    const invite = await WorkGroupInvite.findOne({
      _id: req.params.inviteId,
      toUserId: actor._id.toString(),
      department: req.user.department,
      status: 'pending',
    });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });

    invite.status = 'declined';
    await invite.save();

    res.json({ success: true, invite });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/workgroups/:id/invites
router.post('/:id/invites', auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: 'toUserId requerido' });

    const actor = await resolveActorUser(req);
    if (!actor) return res.status(403).json({ error: 'No autorizado para este contexto de usuario' });

    const wg = await WorkGroup.findOne({
      _id: req.params.id,
      department: req.user.department,
    });
    if (!wg) return res.status(404).json({ error: 'Grupo no encontrado' });

    const actorId = actor._id.toString();
    if (!isOwnerOrAdmin(wg, actorId)) {
      return res.status(403).json({ error: 'Solo owner/admin puede invitar' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(400).json({ error: 'toUserId no existe' });
    if (toUser.department !== req.user.department) {
      return res.status(403).json({ error: 'No se puede invitar usuarios de otro departamento' });
    }

    const toId = toUser._id.toString();
    if (wg.ownerId === toId || (wg.adminUserIds || []).includes(toId) || (wg.memberUserIds || []).includes(toId)) {
      return res.status(400).json({ error: 'El usuario ya pertenece al grupo' });
    }

    const existingPending = await WorkGroupInvite.findOne({
      wgId: wg._id.toString(),
      toUserId: toId,
      department: req.user.department,
      status: 'pending',
    });
    if (existingPending) return res.status(400).json({ error: 'Ya existe una invitación pendiente' });

    const invite = new WorkGroupInvite({
      wgId: wg._id.toString(),
      fromUserId: actorId,
      toUserId: toId,
      department: req.user.department,
      status: 'pending',
    });
    await invite.save();

    if (!wg.invitedUserIds.includes(toId)) {
      wg.invitedUserIds.push(toId);
      await wg.save();
    }

    res.status(201).json(invite);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    const actorId = actor?._id?.toString();
    const wgs = await WorkGroup.find({
      department: req.user.department,
      ...(actorId
        ? {
            $or: [
              { ownerId: actorId },
              { adminUserIds: actorId },
              { memberUserIds: actorId },
              { invitedUserIds: actorId },
            ],
          }
        : {}),
    });
    res.json(wgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    const ownerId = actor?._id?.toString() || req.user.userId;
    const ownerName = actor?.name || req.user.name;

    const wg = new WorkGroup({
      ...req.body,
      ownerId,
      ownerName,
      department: req.user.department,
      adminUserIds: Array.isArray(req.body.adminUserIds) ? req.body.adminUserIds : [],
      memberUserIds: Array.isArray(req.body.memberUserIds) ? req.body.memberUserIds : [],
    });
    await wg.save();
    res.status(201).json(wg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    if (!actor) return res.status(403).json({ error: 'No autorizado para este contexto de usuario' });

    const wg = await WorkGroup.findOne({
      _id: req.params.id,
      department: req.user.department,
    });
    if (!wg) return res.status(404).json({ error: 'Grupo no encontrado' });

    if (!isOwnerOrAdmin(wg, actor._id.toString())) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    Object.assign(wg, req.body);
    wg.department = req.user.department;
    await wg.save();

    if (!wg) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(wg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const actor = await resolveActorUser(req);
    if (!actor) return res.status(403).json({ error: 'No autorizado para este contexto de usuario' });

    const wg = await WorkGroup.findOne({
      _id: req.params.id,
      department: req.user.department,
    });
    if (!wg) return res.status(404).json({ error: 'Grupo no encontrado' });

    if (wg.ownerId !== actor._id.toString()) {
      return res.status(403).json({ error: 'Solo owner puede eliminar el grupo' });
    }

    await WorkGroupInvite.deleteMany({ wgId: wg._id.toString(), department: req.user.department });
    await wg.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
