const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

// Registro
const register = async (req, res, next) => {
  try {
    const { name, phone, address, email, password } = req.body;
    
    // Verifica si el usuario existe
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar usuario
    const newUser = await UserModel.createUser(name, phone, address, email, hashedPassword);
    
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', user: newUser });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    // Bloqueo por intentos fallidos (RNF-03): si la cuenta esta bloqueada, rechazar.
    if (user.is_locked) {
      return res.status(423).json({
        mensaje: 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.',
      });
    }

    // Comparar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const estado = await UserModel.registerFailedAttempt(user.id);
      if (estado && estado.is_locked) {
        return res.status(423).json({
          mensaje: 'Demasiados intentos fallidos. Cuenta bloqueada por 1 minuto.',
        });
      }
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    // Login correcto: reiniciamos el contador de intentos.
    await UserModel.resetFailedAttempts(user.id);

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'secret_key_temporal',
      { expiresIn: '24h' }
    );
    
    // Respuesta
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

const validate = async (req, res, next) => {
  try {
    // Si pasamos por el middleware de auth, el token es válido
    // Obtenemos los datos frescos
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  validate
};