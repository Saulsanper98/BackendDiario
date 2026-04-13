const mongoose = require('mongoose');

const HandoverSchema = new mongoose.Schema({
  date:           { type: String, required: true },
  fromShift:      { type: String, enum: ['morning','afternoon','night'], required: true },
  toShift:        { type: String, enum: ['morning','afternoon','night'], required: true },
  authorId:       { type: String, required: true },
  authorName:     { type: String, required: true },
  department:     { type: String, required: true },
  deliveredAt:    { type: String, required: true },
  sections: {
    incidencias:  [String],
    pendientes:   [String],
    proyectos:    [String],
    avisos:       { type: String, default: '' },
  },
  receivedBy:     { type: String, default: null },
  receivedByName: { type: String, default: null },
  receivedAt:     { type: String, default: null },
}, { timestamps: true });

HandoverSchema.index({ department: 1, date: 1 });

module.exports = mongoose.model('Handover', HandoverSchema);
