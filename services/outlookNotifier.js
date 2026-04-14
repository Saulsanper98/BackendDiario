const https = require('https');
const { URL } = require('url');

const OUTLOOK_WEBHOOK_URL = process.env.OUTLOOK_WEBHOOK_URL;

module.exports.createOutlookReminder = async function(note) {
  if (!OUTLOOK_WEBHOOK_URL) {
    console.log('Outlook: OUTLOOK_WEBHOOK_URL no configurada');
    return;
  }

  if (!note.reminder) return;

  try {
    // Construir fecha/hora del recordatorio
    const reminderDate = note.date; // YYYY-MM-DD
    const reminderTime = note.reminder; // HH:MM
    const reminderDateTime = `${reminderDate}T${reminderTime}:00`;

    const url = new URL(OUTLOOK_WEBHOOK_URL);
    const body = JSON.stringify({
      subject: `📋 Recordatorio: ${note.title}`,
      body: `Recordatorio del Diario Departamental\n\nNota: ${note.title}\nTurno: ${note.shift}\nDepartamento: ${note.department}`,
      reminderTime: reminderDateTime,
      authorEmail: note.authorEmail || '',
      department: note.department,
      timeZone: 'Atlantic/Canary',
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
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`Outlook recordatorio creado. Status: ${res.statusCode}`);
          resolve(true);
        });
      });
      req.on('error', (err) => {
        console.error('Error creando recordatorio Outlook:', err.message);
        resolve(false);
      });
      req.write(body);
      req.end();
    });
  } catch (err) {
    console.error('Error en createOutlookReminder:', err.message);
  }
};
