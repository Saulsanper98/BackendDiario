const mongoose = require('mongoose');

const PostitSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  body:        { type: String, default: '' },
  column:      { type: String, enum: ['pendiente','progreso','revision','hecho'], default: 'pendiente' },
  color:       { type: String, default: 'yellow' },
  priority:    { type: String, enum: ['normal','media','alta'], default: 'normal' },
  department:  { type: String, required: true },
  authorId:    { type: String, required: true },
  assignedTo:  { type: String, default: null },
  dueDate:     { type: String, default: null },
  images:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

PostitSchema.index({ department: 1, column: 1 });

module.exports = mongoose.model('Postit', PostitSchema);
