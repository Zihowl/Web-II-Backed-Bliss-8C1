const UserModel = require('../models/user.model');

// Tabla de usuarios para el panel administrativo (IU-05).
const listUsers = async (req, res, next) => {
  try {
    const users = await UserModel.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// Eliminacion de cuentas (RF-05). La confirmacion previa (RNF-07) se maneja en el
// frontend; aqui evitamos que un admin se elimine a si mismo por accidente.
const deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }
    const deleted = await UserModel.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  deleteUser,
};
