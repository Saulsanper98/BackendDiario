const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

const MAX_ACTIVITY_LOG_ENTRIES = 200;
const ALLOWED_UPDATE_FIELDS = [
  'name',
  'description',
  'parentProjectId',
  'status',
  'priority',
  'dueDate',
  'tasks',
  'activityLog',
  'images',
  'shares',
  'collapsed',
];

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ department: req.user.department }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  try {
    const requestedAuthorId = req.body.authorId;
    let finalAuthorId = req.user.userId;

    if (requestedAuthorId) {
      const selectedAuthor = await User.findById(requestedAuthorId);
      if (!selectedAuthor) {
        return res.status(400).json({ error: 'authorId no existe' });
      }
      if (selectedAuthor.department !== req.user.department) {
        return res.status(403).json({ error: 'authorId no autorizado para este departamento' });
      }
      finalAuthorId = selectedAuthor._id.toString();
    }

    if (req.body.activityLog !== undefined && !Array.isArray(req.body.activityLog)) {
      return res.status(400).json({ error: 'activityLog debe ser un array' });
    }

    const project = new Project({
      ...req.body,
      authorId: finalAuthorId,
      department: req.user.department,
      activityLog: Array.isArray(req.body.activityLog)
        ? req.body.activityLog.slice(-MAX_ACTIVITY_LOG_ENTRIES)
        : [],
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.body.activityLog !== undefined && !Array.isArray(req.body.activityLog)) {
      return res.status(400).json({ error: 'activityLog debe ser un array' });
    }

    const existingProject = await Project.findOne({
      _id: req.params.id,
      department: req.user.department,
    });
    if (!existingProject) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const updateData = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === 'activityLog') {
          const nextActivityLog = req.body.activityLog.slice(-MAX_ACTIVITY_LOG_ENTRIES);
          const hasExistingActivity = Array.isArray(existingProject.activityLog) && existingProject.activityLog.length > 0;
          const wantsToClearActivityLog = req.body.allowClearActivityLog === true;

          // Evita perder actividad por PUT parciales que mandan [] por error.
          if (!(nextActivityLog.length === 0 && hasExistingActivity && !wantsToClearActivityLog)) {
            updateData.activityLog = nextActivityLog;
          }
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    const project = await Project.findByIdAndUpdate(
      existingProject._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      department: req.user.department
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
