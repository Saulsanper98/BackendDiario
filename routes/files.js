const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadFileToSharePoint, deleteFileFromSharePoint } = require('../services/sharepointUploader');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB máximo
});

// POST /api/files/upload — subir archivo a SharePoint
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const { originalname, buffer, mimetype } = req.file;
    const subfolder = req.body.subfolder || req.user.department;
    const userToken = req.headers['authorization']?.replace('Bearer ', '');

    const result = await uploadFileToSharePoint(
      originalname,
      buffer,
      mimetype,
      subfolder,
      userToken
    );

    res.json(result);
  } catch (err) {
    console.error('Error en upload:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id — eliminar archivo de SharePoint
router.delete('/:id', auth, async (req, res) => {
  try {
    const success = await deleteFileFromSharePoint(req.params.id);
    if (success) res.json({ success: true });
    else res.status(500).json({ error: 'No se pudo eliminar' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
