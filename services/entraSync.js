const https = require('https');
const User = require('../models/User');

async function getAppToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }).toString();

    const options = {
      hostname: 'login.microsoftonline.com',
      path: `/${tenantId}/oauth2/v2.0/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error('No access_token: ' + data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function graphGet(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      path: path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Mapeo email → departamento
const EMAIL_DEPT_MAP = {
  'tecnicosistemas@movilidadgc.org': 'Sistemas',
  'comunicaciones@movilidadgc.org': 'Redes',
  'tecnicosala@movilidadgc.org': 'Sala',
};

// Colores para asignar automáticamente
const COLORS = [
  '#7858f6',
  '#5ba3e8',
  '#f4a042',
  '#5aaa7a',
  '#e05a5a',
  '#c47b3a',
  '#8b6fd4',
  '#14b8a6',
  '#e8c547',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getColorForIndex(index) {
  return COLORS[index % COLORS.length];
}

module.exports.syncUsersFromEntra = async function () {
  console.log('Iniciando sincronización de usuarios desde Entra ID...');
  try {
    const token = await getAppToken();

    // Obtener todos los usuarios del directorio
    const result = await graphGet(
      '/v1.0/users?$select=id,displayName,mail,userPrincipalName,department,jobTitle&$top=100',
      token
    );

    if (!result.value) {
      console.error('Error obteniendo usuarios de Entra ID:', result);
      return;
    }

    console.log(`Usuarios encontrados en Entra ID: ${result.value.length}`);

    // Filtrar solo usuarios de departamentos que usamos
    const deptEmails = Object.keys(EMAIL_DEPT_MAP);

    // Obtener usuarios existentes en MongoDB
    const existingUsers = await User.find({});
    console.log(`Usuarios existentes en MongoDB: ${existingUsers.length}`);

    let colorIndex = existingUsers.length;
    let synced = 0;
    let skipped = 0;

    for (const entraUser of result.value) {
      const email = entraUser.mail || entraUser.userPrincipalName || '';

      // Determinar departamento por email del propietario de la cuenta
      // o por el campo department de Entra ID
      const department = entraUser.department || null;

      if (!department) {
        skipped++;
        continue;
      }

      // Verificar si ya existe en MongoDB
      const existing = existingUsers.find(
        (u) => u.entraId === entraUser.id || u.name.toLowerCase() === (entraUser.displayName || '').toLowerCase()
      );

      if (existing) {
        // Actualizar datos si han cambiado
        await User.findByIdAndUpdate(existing._id, {
          entraId: entraUser.id,
          email: email,
          jobTitle: entraUser.jobTitle || existing.role,
        });
        synced++;
      } else {
        skipped++;
      }
    }

    console.log(`Sincronización completada: ${synced} actualizados, ${skipped} omitidos`);
  } catch (err) {
    console.error('Error en sincronización Entra ID:', err.message);
  }
};

module.exports.getUsersFromEntra = async function (department) {
  try {
    const token = await getAppToken();
    const result = await graphGet(
      `/v1.0/users?$select=id,displayName,mail,userPrincipalName,department,jobTitle&$filter=department eq '${department}'&$top=50`,
      token
    );
    return result.value || [];
  } catch (err) {
    console.error('Error obteniendo usuarios de Entra ID:', err.message);
    return [];
  }
};
