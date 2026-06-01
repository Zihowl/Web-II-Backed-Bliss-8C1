const { Router } = require('express');
const { register, login, validate, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/validate', verifyToken, validate);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;