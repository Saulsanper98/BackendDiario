const { validateMicrosoftToken } = require('../auth/microsoftAuth');

const MICROSOFT_DEPT_MAP = {
  'tecnicosistemas@movilidadgc.org': 'Sistemas',
  'comunicaciones@movilidadgc.org':  'Redes',
  'tecnicosala@movilidadgc.org':     'Sala',
};

module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await validateMicrosoftToken(token);
      const email = payload.preferred_username || '';
      const department = MICROSOFT_DEPT_MAP[email.toLowerCase()] || 'General';

      req.user = {
        userId: payload.oid,
        name: payload.name,
        email: email,
        department: department,
      };
      next();
    } catch (tokenErr) {
      console.error('Error validando token:', tokenErr.message);
      return res.status(401).json({ message: 'Token inválido.', error: tokenErr.message });
    }

  } catch (err) {
    return res.status(500).json({ message: 'Error interno de autenticación.' });
  }
};
