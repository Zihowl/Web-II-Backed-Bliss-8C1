const jwt = require('jsonwebtoken');
const OrderModel = require('../models/order.model');
const emailService = require('../services/email.service');
const sse = require('../services/sse.service');

// Actualiza el estado de un pedido (admin, RF-24). Registra log (RNF-17), notifica
// por correo (RF-28) y empuja el cambio por SSE (RF-26).
const updateStatus = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const order = await OrderModel.updateStatus(orderId, status, req.user.id);

    sse.publish(orderId, { orderId, status: order.status });
    if (order.userEmail) {
      emailService.sendStatusUpdate(order.userEmail, {
        orderId,
        status: order.status,
        userName: order.userName,
      });
    }

    res.json({ mensaje: 'Estado actualizado', order });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    next(error);
  }
};

// Listado administrativo con filtros (RF-25, RNF-18).
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

// Stream SSE del estado de un pedido del usuario (RF-26, RNF-19).
// EventSource no permite cabeceras, asi que el token viaja por query string.
const streamStatus = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_temporal');
    } catch {
      return res.status(403).json({ mensaje: 'Token invalido o expirado' });
    }

    // Verificamos que el pedido pertenezca al usuario (o sea admin).
    const order = await OrderModel.getStatus(orderId, user.id);
    if (!order && user.role !== 'admin') {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    sse.subscribe(orderId, res);
    // Emitimos el estado actual al conectar.
    if (order) {
      res.write(`event: status\ndata: ${JSON.stringify({ orderId, status: order.status })}\n\n`);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateStatus,
  listOrders,
  streamStatus,
};
