const express = require('express');
const router = express.Router();
const motoristaController = require('../controllers/motorista.controller');
const { authMiddleware, isMotorista } = require('../middlewares/auth.middleware');

// Criar motorista
router.post('/', motoristaController.create);

// Rotas autenticadas
router.use(authMiddleware);

/**
 * Obter estatísticas do motorista logado
 * GET /api/motoristas/me/estatisticas
 */
router.get('/me/estatisticas', isMotorista, motoristaController.getEstatisticas);

// Listar todos os motoristas
router.get('/', motoristaController.getAll);

// Buscar motorista por ID
router.get('/:id', motoristaController.getById);

// Atualizar motorista
router.put('/:id', motoristaController.update);

// Deletar motorista
router.delete('/:id', motoristaController.delete);

module.exports = router;
