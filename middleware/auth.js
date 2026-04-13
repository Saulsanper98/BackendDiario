const { validateMicrosoftToken } = require('../auth/microsoftAuth');

const MICROSOFT_DEPT_MAP = {
  'tecnicosistemas@movilidadgc.org': 'Sistemas',
  'comunicaciones@movilidadgc.org':  'Redes',
  'tecnicosala@movilidadgc.org':     'Sala',
};

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Auth header recibido:', authHeader ? authHeader.slice(0, 50) + '...' : 'NINGUNO');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extraído:', token.slice(0, 30) + '...');

    try {
      const payload = await validateMicrosoftToken(token);
      console.log('Token válido. Payload oid:', payload.oid);
      console.log('Payload keys:', Object.keys(payload));
      const email = payload.preferred_username || '';
      const department = MICROSOFT_DEPT_MAP[email.toLowerCase()] || 'General';
      
      req.user = {
        userId: payload.oid,
        name: payload.name,
        email: email,
        department: department,
      };
      console.log('Departamento asignado:', department, 'para email:', email);
      
      console.log('req.user construido:', req.user);
      next();
    } catch (tokenErr) {
      console.error('Error validando token:', tokenErr.message);
      console.error('Token error name:', tokenErr.name);
      return res.status(401).json({ message: 'Token inválido.', error: tokenErr.message });
    }

  } catch (err) {
    console.error('Error general en auth middleware:', err);
    return res.status(500).json({ message: 'Error interno de autenticación.' });
  }
};
