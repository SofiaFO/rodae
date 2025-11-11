const express = require('express');
const router = express.Router();
const metodoPagamentoController = require('../controllers/metodoPagamento.controller');
const { authMiddleware, isPassageiro } = require('../middlewares/auth.middleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * [RFS29] Cadastrar Forma de Pagamento
 * POST /api/metodos-pagamento
 * Apenas passageiros podem cadastrar métodos de pagamento
 * 
 * Body:
 * {
 *   "tipoPagamento": "CARTAO_CREDITO" | "PIX" | "CARTEIRA_APP",
 *   "nomeCartao": "João Silva" (obrigatório para cartão),
 *   "numeroCartao": "1234567890123456" (obrigatório para cartão),
 *   "validadeCartao": "12/2026" (obrigatório para cartão),
 *   "cvv": "123" (obrigatório para cartão, não é armazenado)
 * }
 */
router.post('/', isPassageiro, metodoPagamentoController.create);

/**
 * [RFS30] Consultar Formas de Pagamento
 * GET /api/metodos-pagamento
 * Retorna todos os métodos de pagamento do passageiro logado
 * 
 * Resposta:
 * {
 *   "message": "Métodos de pagamento listados com sucesso",
 *   "data": [
 *     {
 *       "id": 1,
 *       "tipoPagamento": "CARTAO_CREDITO",
 *       "ultimos4Digitos": "**** **** **** 1234",
 *       "nomeCartao": "João Silva",
 *       "validadeCartao": "12/2026",
 *       "status": "ATIVO",
 *       "criadoEm": "2024-11-10T..."
 *     }
 *   ],
 *   "total": 1
 * }
 */
router.get('/', isPassageiro, metodoPagamentoController.getAll);

/**
 * [RFS30] Consultar Forma de Pagamento por ID
 * GET /api/metodos-pagamento/:id
 * Retorna detalhes de um método de pagamento específico
 */
router.get('/:id', isPassageiro, metodoPagamentoController.getById);

/**
 * [RFS31] Editar Forma de Pagamento
 * PUT /api/metodos-pagamento/:id
 * Permite editar nomeCartao e validadeCartao
 * NÃO permite alterar numeroCartao (para trocar, deve excluir e cadastrar novo)
 * 
 * Body:
 * {
 *   "nomeCartao": "João Silva Santos",
 *   "validadeCartao": "12/2027"
 * }
 */
router.put('/:id', isPassageiro, metodoPagamentoController.update);

/**
 * [RFS32] Excluir Forma de Pagamento
 * DELETE /api/metodos-pagamento/:id
 * Exclui um método de pagamento (conformidade LGPD)
 * NÃO permite exclusão se estiver sendo usado em corrida em andamento
 */
router.delete('/:id', isPassageiro, metodoPagamentoController.delete);

/**
 * Marcar métodos expirados (rota administrativa/CRON)
 * POST /api/metodos-pagamento/marcar-expirados
 * Marca automaticamente métodos com validade vencida como EXPIRADO
 */
router.post('/marcar-expirados', metodoPagamentoController.marcarExpirados);

module.exports = router;
