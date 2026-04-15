const mongoose = require('mongoose');

const WorkGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  objectives: { type: String, default: '' },
  icon: { type: String, default: '👥' },
  department: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  adminUserIds: { type: [String], default: [] },
  memberUserIds: { type: [String], default: [] },
  invitedUserIds: { type: [String], default: [] }, // legacy compat
  color: { type: String, default: '#7858f6' },
}, { timestamps: true });

WorkGroupSchema.index({ department: 1 });
WorkGroupSchema.index({ ownerId: 1 });
module.exports = mongoose.model('WorkGroup', WorkGroupSchema);
