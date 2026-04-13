const https = require('https');

module.exports.validateMicrosoftToken = async function validateMicrosoftToken(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      path: '/v1.0/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const user = JSON.parse(data);
            console.log('Usuario validado via Graph:', user.displayName, user.mail);
            resolve({
              oid: user.id,
              name: user.displayName,
              preferred_username: user.mail || user.userPrincipalName,
              department: user.department || null,
              jobTitle: user.jobTitle || null,
            });
          } catch (err) {
            reject(new Error('Error parseando respuesta de Graph'));
          }
        } else {
          console.error('Graph API rechazó el token. Status:', res.statusCode, 'Body:', data);
          reject(new Error('Token inválido según Microsoft Graph'));
        }
      });
    });

    req.on('error', (err) => {
      console.error('Error conectando a Graph API:', err.message);
      reject(new Error('Error conectando a Microsoft Graph'));
    });

    req.end();
  });
};
