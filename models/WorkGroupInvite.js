const mongoose = require('mongoose');

const WorkGroupInviteSchema = new mongoose.Schema({
  wgId: { type: String, required: true },
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  department: { type: String, required: true },
}, { timestamps: true });

WorkGroupInviteSchema.index({ toUserId: 1, status: 1, department: 1 });
WorkGroupInviteSchema.index({ wgId: 1, toUserId: 1, status: 1 });

module.exports = mongoose.model('WorkGroupInvite', WorkGroupInviteSchema);
