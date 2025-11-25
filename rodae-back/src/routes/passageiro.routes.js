const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiro.controller');
const { authMiddleware, isPassageiro } = require('../middlewares/auth.middleware');

// Criar passageiro
router.post('/', passageiroController.create);

// Rotas autenticadas
router.use(authMiddleware);

/**
 * Obter estatísticas do passageiro logado
 * GET /api/passageiros/me/estatisticas
 * IMPORTANTE: Deve vir ANTES de /:id para não conflitar
 */
router.get('/me/estatisticas', isPassageiro, passageiroController.getEstatisticas);

// Listar todos os passageiros
router.get('/', passageiroController.getAll);

// Buscar passageiro por ID (deve vir DEPOIS de rotas específicas como /me/*)
router.get('/:id', passageiroController.getById);

// Atualizar passageiro
router.put('/:id', passageiroController.update);

// Deletar passageiro
router.delete('/:id', passageiroController.delete);

module.exports = router;
