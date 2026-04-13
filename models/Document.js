const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  docType:        { type: String, enum: ['document','folder','file'], required: true },
  category:       { type: String, default: 'otro' },
  content:        { type: String, default: '' },
  department:     { type: String, required: true },
  authorId:       { type: String, required: true },
  parentFolderId: { type: String, default: null },
  icon:           { type: String, default: '📄' },
  images:         { type: mongoose.Schema.Types.Mixed, default: {} },
  file:           { type: mongoose.Schema.Types.Mixed, default: null },
  shares:         { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

DocumentSchema.index({ department: 1, parentFolderId: 1 });

module.exports = mongoose.model('Document', DocumentSchema);
