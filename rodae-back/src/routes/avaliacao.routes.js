const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacao.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// [RFS17] Cadastrar Avaliação
// POST /api/avaliacoes
// Body: { corridaId, nota, comentario, usuarioParaId }
router.post('/', avaliacaoController.criar);

// [RFS18] Consultar Avaliações
// GET /api/avaliacoes?usuarioAvaliadoId=1&notaMinima=4&notaMaxima=5&dataInicio=2025-01-01&dataFim=2025-12-31
router.get('/', avaliacaoController.consultar);

// GET /api/avaliacoes/minhas - Consultar avaliações recebidas pelo usuário logado
router.get('/minhas', avaliacaoController.minhasAvaliacoes);

// GET /api/avaliacoes/media/:usuarioId - Consultar média de avaliações
router.get('/media/:usuarioId?', avaliacaoController.media);

// [RFS19] Editar Avaliação
// PUT /api/avaliacoes/:id
// Body: { nota, comentario }
router.put('/:id', avaliacaoController.editar);

// GET /api/avaliacoes/:id/historico - Consultar histórico de edições
router.get('/:id/historico', avaliacaoController.historico);

// [RFS20] Excluir Avaliação (apenas Admin)
// DELETE /api/avaliacoes/:id
// Body: { justificativa }
router.delete('/:id', isAdmin, avaliacaoController.excluir);

module.exports = router;
