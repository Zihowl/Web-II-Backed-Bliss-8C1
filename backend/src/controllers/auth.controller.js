const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/user.model');
const emailService = require('../services/email.service');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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

// Solicitud de recuperacion de contrasenia (RF-03, RNF-04). Responde igual exista o
// no el correo para no filtrar cuentas registradas.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findByEmail(email);

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      await UserModel.createResetToken(user.id, hashToken(token), expiresAt);
      emailService.sendPasswordReset(user.email, { token });
    }

    res.json({
      mensaje: 'Si el correo esta registrado, recibiras un enlace de recuperacion.',
    });
  } catch (error) {
    next(error);
  }
};

// Cambio de contrasenia mediante token (RNF-04).
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ mensaje: 'Token y contraseña son obligatorios' });
    }

    const record = await UserModel.findValidResetToken(hashToken(token));
    if (!record) {
      return res.status(400).json({ mensaje: 'El enlace es invalido o ha expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.consumeResetToken(record.id, record.user_id, hashedPassword);

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  validate,
  forgotPassword,
  resetPassword
};