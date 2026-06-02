const { Router } = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { listOrders } = require('../controllers/order.controller');

const router = Router();

// Gestion administrativa de pedidos (listado con filtros, incluido el estado de pago).
router.get('/', verifyToken, requireAdmin, listOrders);

module.exports = router;
