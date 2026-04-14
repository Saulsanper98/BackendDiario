const https = require('https');
const { URL } = require('url');

const SHAREPOINT_SITE_ID = 'bc5cd581-1100-4f8d-90ba-6a230b8b134b';
const SHAREPOINT_DRIVE_ID = 'b!gdVcvAARjU-QumojC4sTS0PlaUZ0AnpOsmijuR8vl9hULFRPKp2DRI-O-S-aeiuJ';
const FOLDER_PATH = 'DiarioDepartamental';

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

async function uploadFileToSharePoint(fileName, fileBuffer, mimeType, subfolder, userToken) {
  try {
    const token = userToken;
    if (!token) throw new Error('Token de usuario requerido');
    const folderPath = subfolder ? `${FOLDER_PATH}/${subfolder}` : FOLDER_PATH;
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._\-() ]/g, '_');
    const uploadUrl = new URL(`https://graph.microsoft.com/v1.0/drives/${SHAREPOINT_DRIVE_ID}/root:/${folderPath}/${safeFileName}:/content`);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: uploadUrl.hostname,
        path: uploadUrl.pathname,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': mimeType || 'application/octet-stream',
          'Content-Length': fileBuffer.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const result = JSON.parse(data);
            console.log('Archivo subido a SharePoint:', result.webUrl);
            resolve({
              id: result.id,
              name: result.name,
              url: result.webUrl,
              downloadUrl: result['@microsoft.graph.downloadUrl'],
            });
          } else {
            console.error('Error subiendo a SharePoint:', res.statusCode, data);
            reject(new Error(`SharePoint error ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(fileBuffer);
      req.end();
    });
  } catch (err) {
    console.error('Error en uploadFileToSharePoint:', err.message);
    throw err;
  }
}

async function deleteFileFromSharePoint(fileId) {
  try {
    const token = await getAppToken();
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'graph.microsoft.com',
        path: `/v1.0/drives/${SHAREPOINT_DRIVE_ID}/items/${fileId}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const req = https.request(options, (res) => {
        resolve(res.statusCode === 204);
      });
      req.on('error', reject);
      req.end();
    });
  } catch (err) {
    console.error('Error eliminando de SharePoint:', err.message);
    return false;
  }
}

module.exports = { uploadFileToSharePoint, deleteFileFromSharePoint };
