const mongoose = require('mongoose');

const WorkGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '👥' },
  department: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  memberUserIds: [String],
  invitedUserIds: [String],
  color: { type: String, default: '#7858f6' },
}, { timestamps: true });

WorkGroupSchema.index({ department: 1 });
module.exports = mongoose.model('WorkGroup', WorkGroupSchema);
