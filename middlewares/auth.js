const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Auth middleware ejecutándose');
  const token = req.header('Authorization')?.replace('Bearer ', '');

  console.log('Token recibido:', token);

  if (!token) {
    console.log('No se proporcionó token');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('Token verificado exitosamente');
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};