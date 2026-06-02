const { createPaypalOrder, capturePaypalOrder } = require('../services/paypal.service');

const createOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    const order = await createPaypalOrder(orderData);
    // Normalizar respuesta: devolver solo el id de la orden para el cliente
    const id = order?.id || null;
    return res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
};

const captureOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await capturePaypalOrder(orderId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, captureOrder };
