const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamento.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * [RFS13] Registrar Pagamento
 * POST /api/pagamentos
 * Qualquer usuário autenticado pode registrar (normalmente feito pelo sistema)
 */
router.post('/', pagamentoController.registrar);

/**
 * [RFS14] Consultar Transações
 * GET /api/pagamentos
 * Retorna transações filtradas por tipo de usuário
 */
router.get('/', pagamentoController.consultarTransacoes);

/**
 * Consultar repasses (Admin apenas)
 * GET /api/pagamentos/repasses
 */
router.get('/repasses', isAdmin, pagamentoController.consultarRepasses);

/**
 * Reprocessar repasse que falhou (Admin apenas)
 * POST /api/pagamentos/repasses/:id/reprocessar
 */
router.post('/repasses/:id/reprocessar', isAdmin, pagamentoController.reprocessarRepasse);

/**
 * Buscar pagamento por ID
 * GET /api/pagamentos/:id
 */
router.get('/:id', pagamentoController.getById);

/**
 * [RFS15] Reembolsar Pagamento (Admin apenas)
 * POST /api/pagamentos/:id/reembolsar
 */
router.post('/:id/reembolsar', isAdmin, pagamentoController.reembolsar);

module.exports = router;
