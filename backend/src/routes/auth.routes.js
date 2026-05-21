const { Router } = require('express');
const { register, login, validate } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/validate', verifyToken, validate);

module.exports = router;