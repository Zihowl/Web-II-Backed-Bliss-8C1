const { Router } = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getProfile, updateProfile, getOrderHistory } = require('../controllers/user.controller');

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/history', verifyToken, getOrderHistory);

module.exports = router;