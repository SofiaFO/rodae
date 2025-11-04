const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas exigem autenticação e permissão de admin
router.use(authMiddleware);
router.use(isAdmin);

// GET /api/admin/motoristas - Listar todos os motoristas (com filtro opcional)
// Query params: ?status=PENDENTE ou ?status=ATIVO ou ?status=INATIVO
router.get('/motoristas', adminController.getMotoristas);

// PUT /api/admin/motoristas/:id/aprovar - Aprovar motorista
router.put('/motoristas/:id/aprovar', adminController.aprovarMotorista);

// PUT /api/admin/motoristas/:id/rejeitar - Rejeitar/Desativar motorista
router.put('/motoristas/:id/rejeitar', adminController.rejeitarMotorista);

// GET /api/admin/estatisticas - Obter estatísticas gerais
router.get('/estatisticas', adminController.getEstatisticas);

module.exports = router;
