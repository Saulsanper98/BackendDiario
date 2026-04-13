const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  authorId:        { type: String, required: true }, // Azure AD object ID
  authorName:      { type: String, required: true },
  department:      { type: String, required: true },
  date:            { type: String, required: true }, // 'YYYY-MM-DD'
  shift:           { type: String, enum: ['morning','afternoon','night'], required: true },
  title:           { type: String, required: true },
  body:            { type: String, default: '' },
  priority:        { type: String, enum: ['normal','media','alta'], default: 'normal' },
  tags:            [String],
  mentions:        [String], // array de Azure AD object IDs
  mentionGroup:    { type: String, default: null },
  visibility:      { type: String, enum: ['department','private','public'], default: 'department' },
  pinned:          { type: Boolean, default: false },
  reminder:        { type: String, default: null },
  images:          { type: mongoose.Schema.Types.Mixed, default: {} },
  shares:          { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

NoteSchema.index({ department: 1, date: 1 });
NoteSchema.index({ authorId: 1 });

module.exports = mongoose.model('Note', NoteSchema);
