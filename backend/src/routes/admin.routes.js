const { Router } = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const { listUsers, deleteUser } = require('../controllers/admin.controller');
const { addProduct, editProduct, removeProduct } = require('../controllers/products.controller');

const router = Router();

// Todas las rutas de este modulo requieren rol admin.
router.use(verifyToken, requireAdmin);

// Gestion de usuarios (RF-05, IU-05/06).
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);

// CRUD de productos (RF-07, RF-08, RNF-08).
router.post('/products', addProduct);
router.put('/products/:id', editProduct);
router.delete('/products/:id', removeProduct);

module.exports = router;
