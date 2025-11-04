const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Login
router.post('/login', authController.login);

// Registro (passageiro ou motorista)
router.post('/register', authController.register);

// Obter dados do usuário logado (rota protegida)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
