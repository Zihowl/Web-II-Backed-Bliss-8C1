const express = require('express');
const { createOrder, captureOrder } = require('../controllers/paypal.controller');
const { paypalConfig } = require('../config/paypal.config');

const paypalRouter = express.Router();

// Endpoint para exponer solo el clientId al frontend (seguro)
paypalRouter.get('/config', (_req, res) => {
  res.json({ clientId: paypalConfig.clientId });
});

paypalRouter.post('/create-order', createOrder);
paypalRouter.post('/capture-order/:orderId', captureOrder);

module.exports = { paypalRouter };
