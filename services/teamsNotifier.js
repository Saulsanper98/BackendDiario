const https = require('https');
const { URL } = require('url');

const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_WEBHOOK_URL;

const DEPT_CHANNELS = {
  Sistemas: 'Bitacora Sistemas',
  Redes: null, // pendiente
  Sala: null, // pendiente
};

async function sendNotification(payload) {
  if (!POWER_AUTOMATE_URL) return;

  const dept = payload.department;
  if (!DEPT_CHANNELS[dept]) return;

  try {
    const url = new URL(POWER_AUTOMATE_URL);
    const body = JSON.stringify({
      event: payload.event,
      department: payload.department,
      title: payload.title,
      message: payload.message,
      author: payload.author,
      date: payload.date,
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`Teams notificación enviada a ${dept}. Status: ${res.statusCode}`);
          resolve(true);
        });
      });
      req.on('error', (err) => {
        console.error('Error enviando notificación Teams:', err.message);
        resolve(false);
      });
      req.write(body);
      req.end();
    });
  } catch (err) {
    console.error('Error en sendNotification:', err.message);
  }
}

module.exports.notifyHandoverDelivered = async function (handover) {
  const SHIFTS = { morning: '🌅 Mañana', afternoon: '🌤 Tarde', night: '🌙 Noche' };
  await sendNotification({
    event: 'handover_delivered',
    department: handover.department,
    title: '🔄 Traspaso de turno entregado',
    author: handover.authorName,
    date: `${handover.date.split('-').reverse().join('/')} ${new Date(handover.deliveredAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
    message: `De ${SHIFTS[handover.fromShift] || handover.fromShift} a ${SHIFTS[handover.toShift] || handover.toShift}${handover.sections?.avisos ? '. Avisos: ' + handover.sections.avisos : ''}`,
  });
};

module.exports.notifyHandoverReceived = async function (handover) {
  const SHIFTS = { morning: '🌅 Mañana', afternoon: '🌤 Tarde', night: '🌙 Noche' };
  await sendNotification({
    event: 'handover_received',
    department: handover.department,
    title: '✅ Traspaso confirmado',
    author: handover.receivedByName,
    date: `${handover.date.split('-').reverse().join('/')} ${new Date(handover.receivedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
    message: `Turno ${SHIFTS[handover.toShift] || handover.toShift} confirmado`,
  });
};

module.exports.notifyMention = async function (note, mentionedUserName) {
  const SHIFTS = { morning: '🌅 Mañana', afternoon: '🌤 Tarde', night: '🌙 Noche' };
  await sendNotification({
    event: 'mention',
    department: note.department,
    title: '🔔 Nueva mención en el Diario',
    author: note.authorName,
    date:
      new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    message: `${mentionedUserName} mencionado en: "${note.title}" (${SHIFTS[note.shift] || note.shift})`,
  });
};

module.exports.notifyHighPriorityNote = async function (note) {
  const SHIFTS = { morning: '🌅 Mañana', afternoon: '🌤 Tarde', night: '🌙 Noche' };
  await sendNotification({
    event: 'high_priority',
    department: note.department,
    title: '📋 Nota de alta prioridad',
    author: note.authorName,
    date:
      new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    message: `"${note.title}" — ${SHIFTS[note.shift] || note.shift}`,
  });
};

module.exports.notifyOverdueTask = async function (task, project, department) {
  await sendNotification({
    event: 'overdue_task',
    department: department,
    title: '⚠️ Tarea vencida',
    author: task.assignedTo || 'Sin asignar',
    date: task.dueDate,
    message: `"${task.name}" en proyecto "${project.name}"`,
  });
};
