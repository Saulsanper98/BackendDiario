const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  kind:       { type: String, required: true }, // 'note'|'postit'|'project'|'task'|'doc'
  targetId:   { type: String, required: true },
  extraId:    { type: String, default: null },
  authorId:   { type: String, required: true },
  authorName: { type: String, required: true },
  body:       { type: String, required: true },
  images:     { type: mongoose.Schema.Types.Mixed, default: {} },
  mentions:   [String],
  department: { type: String, required: true },
}, { timestamps: true });

CommentSchema.index({ kind: 1, targetId: 1 });
CommentSchema.index({ department: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
