const { Router } = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getProfile, updateProfile, getOrderHistory, saveOrder } = require('../controllers/user.controller');

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/history', verifyToken, getOrderHistory);
router.post('/history', verifyToken, saveOrder);

module.exports = router;