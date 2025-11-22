const express = require('express');
const router = express.Router();
const enderecoFavoritoController = require('../controllers/enderecoFavorito.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// [RFS25] POST /api/enderecos-favoritos - Cadastrar endereço favorito
// Body: { nomeLocal, endereco, latitude?, longitude? }
router.post('/', enderecoFavoritoController.criar);

// [RFS26] GET /api/enderecos-favoritos - Listar endereços favoritos
// Query params: ?nome=Casa (busca parcial)
router.get('/', enderecoFavoritoController.listar);

// GET /api/enderecos-favoritos/estatisticas - Obter estatísticas
router.get('/estatisticas', enderecoFavoritoController.estatisticas);

// GET /api/enderecos-favoritos/:id - Buscar endereço específico
router.get('/:id', enderecoFavoritoController.buscarPorId);

// [RFS27] PUT /api/enderecos-favoritos/:id - Editar endereço favorito
// Body: { nomeLocal?, endereco?, latitude?, longitude? }
router.put('/:id', enderecoFavoritoController.editar);

// [RFS28] DELETE /api/enderecos-favoritos/:id - Excluir endereço favorito
router.delete('/:id', enderecoFavoritoController.excluir);

module.exports = router;
