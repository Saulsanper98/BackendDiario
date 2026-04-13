require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado');
  
  const db = mongoose.connection.db;
  
  const p = await db.collection('projects').updateMany(
    { department: 'General' },
    { $set: { department: 'Sistemas' } }
  );
  console.log('Proyectos actualizados:', p.modifiedCount);

  const n = await db.collection('notes').updateMany(
    { department: 'General' },
    { $set: { department: 'Sistemas' } }
  );
  console.log('Notas actualizadas:', n.modifiedCount);

  await mongoose.disconnect();
  console.log('Listo.');
}

fix().catch(console.error);