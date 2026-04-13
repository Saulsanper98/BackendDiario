require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const USERS = [
  // ── Sistemas ──
  { name: 'Saul',           initials: 'SL', color: '#7858f6', role: 'Admin',    department: 'Sistemas' },
  { name: 'Daniel Clemente',initials: 'DC', color: '#5ba3e8', role: 'Técnico',  department: 'Sistemas' },
  { name: 'Daniel Mendoza', initials: 'DM', color: '#f4a042', role: 'Técnico',  department: 'Sistemas' },
  { name: 'Alberto',        initials: 'AB', color: '#5aaa7a', role: 'Técnico',  department: 'Sistemas' },
  { name: 'Adrian',         initials: 'AD', color: '#e05a5a', role: 'Técnico',  department: 'Sistemas' },
  { name: 'Daniel Santana', initials: 'DS', color: '#c47b3a', role: 'Técnico',  department: 'Sistemas' },
  { name: 'Sergio',         initials: 'SR', color: '#8b6fd4', role: 'Técnico',  department: 'Sistemas' },

  // ── Redes ──
  { name: 'Kike',           initials: 'KK', color: '#14b8a6', role: 'Técnico',  department: 'Redes' },
  { name: 'Iván',           initials: 'IV', color: '#7858f6', role: 'Técnico',  department: 'Redes' },
  { name: 'Ruben',          initials: 'RB', color: '#5ba3e8', role: 'Técnico',  department: 'Redes' },
  { name: 'Erico',          initials: 'ER', color: '#f4a042', role: 'Técnico',  department: 'Redes' },
  { name: 'Gabriel',        initials: 'GB', color: '#5aaa7a', role: 'Técnico',  department: 'Redes' },

  // ── Sala ──
  { name: 'Zuleima',        initials: 'ZL', color: '#e05a5a', role: 'Técnico',  department: 'Sala' },
  { name: 'Rene',           initials: 'RN', color: '#c47b3a', role: 'Técnico',  department: 'Sala' },
  { name: 'Daniel Miranda', initials: 'DR', color: '#8b6fd4', role: 'Técnico',  department: 'Sala' },
  { name: 'Tenaro',         initials: 'TN', color: '#14b8a6', role: 'Técnico',  department: 'Sala' },
  { name: 'Iván',           initials: 'IV', color: '#f4a042', role: 'Técnico',  department: 'Sala' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');
    await User.deleteMany({});
    console.log('Usuarios anteriores eliminados');
    const created = await User.insertMany(USERS);
    console.log(`${created.length} usuarios creados correctamente:`);
    created.forEach(u => console.log(`  - ${u.name} (${u.department})`));
    await mongoose.disconnect();
    console.log('Listo.');
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

seed();
