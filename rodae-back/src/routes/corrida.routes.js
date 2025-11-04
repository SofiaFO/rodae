const express = require('express');
const router = express.Router();
const corridaController = require('../controllers/corrida.controller');
const { authMiddleware, isPassageiro, isMotorista, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * [RFS05] Cadastrar Corrida (Solicitar Corrida)
 * Apenas passageiros podem solicitar corridas
 */
router.post('/', isPassageiro, corridaController.create);

/**
 * [RFS06] Consultar Corridas
 * Todos os usuários autenticados podem consultar suas corridas
 * Filtros são aplicados automaticamente conforme tipo de usuário
 */
router.get('/', corridaController.getAll);

/**
 * Listar corridas disponíveis (sem motorista)
 * Usado por motoristas para ver corridas que podem aceitar
 */
router.get('/disponiveis', isMotorista, corridaController.getDisponiveis);

/**
 * [RFS06] Consultar Corrida por ID
 * Usuários só podem ver corridas que estão relacionados
 */
router.get('/:id', corridaController.getById);

/**
 * [RFS07] Editar Corrida
 * Passageiros: podem alterar destino antes de motorista aceitar
 * Motoristas: podem alterar status da corrida
 * Admins: podem alterar qualquer campo
 */
router.put('/:id', corridaController.update);

/**
 * Motorista aceita uma corrida
 * Apenas motoristas podem aceitar corridas
 */
router.post('/:id/aceitar', isMotorista, corridaController.aceitar);

/**
 * [RFS08] Excluir/Cancelar Corrida
 * Passageiros: podem cancelar antes do motorista estar a caminho
 * Motoristas: podem cancelar antes de iniciar deslocamento
 * Admins: podem cancelar em caso de fraude/erro
 */
router.delete('/:id', corridaController.delete);

module.exports = router;
