const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatorios.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas requerem autenticação e permissão de admin
router.use(authMiddleware);
router.use(isAdmin);

/**
 * GET /api/admin/relatorios/corridas
 * Retorna relatório de corridas em JSON
 */
router.get('/corridas', relatoriosController.getRelatoriosCorridas);

/**
 * GET /api/admin/relatorios/motoristas
 * Retorna relatório de motoristas em JSON
 */
router.get('/motoristas', relatoriosController.getRelatoriosMotoristas);

/**
 * GET /api/admin/relatorios/corridas/export/:formato
 * Exporta relatório de corridas (pdf, excel, csv)
 */
router.get('/corridas/export/:formato', relatoriosController.exportRelatoriosCorridas);

/**
 * GET /api/admin/relatorios/motoristas/export/:formato
 * Exporta relatório de motoristas (pdf, excel, csv)
 */
router.get('/motoristas/export/:formato', relatoriosController.exportRelatoriosMotoristas);

module.exports = router;
