const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id:              { type: String, required: true },
  name:            { type: String, required: true },
  desc:            { type: String, default: '' },
  done:            { type: Boolean, default: false },
  status:          { type: String, default: 'pending' },
  priority:        { type: String, default: 'normal' },
  assignedTo:      { type: String, default: null },
  dueDate:         { type: String, default: null },
  estimatedHours:  { type: Number, default: 0 },
  realHours:       { type: Number, default: 0 },
  images:          { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:       { type: String },
}, { _id: false });

const ActivityLogEntrySchema = new mongoose.Schema({
  at: { type: Number, default: null },
  userId: { type: String, default: null },
  type: { type: String, default: '' },
  taskName: { type: String, default: '' },
  taskId: { type: mongoose.Schema.Types.Mixed, default: null },
  detail: { type: mongoose.Schema.Types.Mixed, default: null },
  action: { type: String, default: '' },
  message: { type: String, default: '' },
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  description:      { type: String, default: '' },
  department:       { type: String, required: true },
  authorId:         { type: String, required: true },
  parentProjectId:  { type: String, default: null },
  status:           { type: String, default: 'active' },
  priority:         { type: String, default: 'normal' },
  dueDate:          { type: String, default: null },
  tasks:            [TaskSchema],
  activityLog:      { type: [ActivityLogEntrySchema], default: [] },
  images:           { type: mongoose.Schema.Types.Mixed, default: {} },
  shares:           { type: mongoose.Schema.Types.Mixed, default: [] },
  collapsed:        { type: Boolean, default: false },
}, { timestamps: true });

ProjectSchema.index({ department: 1 });
ProjectSchema.index({ parentProjectId: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
