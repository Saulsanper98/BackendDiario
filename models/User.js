const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  initials:   { type: String, required: true },
  color:      { type: String, required: true },
  role:       { type: String, default: 'Técnico' },
  department: { type: String, required: true },
  entraId:    { type: String, default: null },
  email:      { type: String, default: null },
  active:     { type: Boolean, default: true },
  pin:        { type: String, default: null }, // PIN opcional para selección
}, { timestamps: true });

UserSchema.index({ department: 1 });

module.exports = mongoose.model('User', UserSchema);
