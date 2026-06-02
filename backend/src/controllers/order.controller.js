const OrderModel = require('../models/order.model');

// Listado administrativo con filtros (RF-25, RNF-18). El estado ahora es el del pago.
const listOrders = async (req, res, next) => {
  try {
    const { status, from, to, customer, minTotal, maxTotal } = req.query;
    const orders = await OrderModel.listOrders({
      status,
      from,
      to,
      customer,
      minTotal: minTotal ? Number(minTotal) : undefined,
      maxTotal: maxTotal ? Number(maxTotal) : undefined,
    });
    res.json({ orders, estados: OrderModel.ESTADOS });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrders,
};
