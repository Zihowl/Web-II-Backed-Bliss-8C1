const { Router } = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { updateStatus, listOrders, streamStatus } = require('../controllers/order.controller');

const router = Router();

// Stream SSE de estado (usuario). El token va por query string (EventSource).
router.get('/:id/stream', streamStatus);

// Gestion administrativa de pedidos.
router.get('/', verifyToken, requireAdmin, listOrders);
router.put('/:id/status', verifyToken, requireAdmin, updateStatus);

module.exports = router;
