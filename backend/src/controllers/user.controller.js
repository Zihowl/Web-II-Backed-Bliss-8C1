const UserModel = require('../models/user.model');

const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ profile: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, name, phone, address);
    
    if (!updatedUser) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    res.json({ mensaje: 'Perfil actualizado exitosamente', profile: updatedUser });
  } catch (error) {
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const orders = await UserModel.getOrderHistory(req.user.id);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getOrderHistory
};