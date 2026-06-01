const { Router } = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const {
  getInventory,
  getLowStock,
  adjustStock,
  checkAvailability,
} = require('../controllers/inventory.controller');

const router = Router();

// Validacion de stock disponible (usuario autenticado): carrito y checkout.
router.post('/check', verifyToken, checkAvailability);

// Gestion de inventario (solo administrador).
router.get('/', verifyToken, requireAdmin, getInventory);
router.get('/low-stock', verifyToken, requireAdmin, getLowStock);
router.put('/:id/adjust', verifyToken, requireAdmin, adjustStock);

module.exports = router;
