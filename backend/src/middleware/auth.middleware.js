const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_temporal');
      req.user = decoded;
      next();
  } catch (error) {
      return res.status(403).json({ mensaje: 'Token inválido o expirado' });
  }
};

module.exports = {
  verifyToken
};
