const enderecoFavoritoService = require('../services/enderecoFavorito.service');

class EnderecoFavoritoController {
  // [RFS25] Cadastrar Endereço Favorito
  async criar(req, res) {
    try {
      const endereco = await enderecoFavoritoService.cadastrarEndereco(
        req.userId,
        req.body
      );
      
      res.status(201).json({
        message: 'Endereço favorito cadastrado com sucesso',
        data: endereco
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao cadastrar endereço favorito',
        message: error.message
      });
    }
  }

  // [RFS26] Consultar Endereços Favoritos
  async listar(req, res) {
    try {
      const enderecos = await enderecoFavoritoService.consultarEnderecos(
        req.userId,
        req.query
      );
      
      res.json({
        message: 'Endereços favoritos listados com sucesso',
        data: enderecos
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar endereços favoritos',
        message: error.message
      });
    }
  }

  // Consultar um endereço específico
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const endereco = await enderecoFavoritoService.consultarEnderecoPorId(
        parseInt(id),
        req.userId
      );
      
      res.json({
        message: 'Endereço favorito encontrado',
        data: endereco
      });
    } catch (error) {
      res.status(404).json({
        error: 'Erro ao buscar endereço favorito',
        message: error.message
      });
    }
  }

  // [RFS27] Editar Endereço Favorito
  async editar(req, res) {
    try {
      const { id } = req.params;
      const endereco = await enderecoFavoritoService.editarEndereco(
        parseInt(id),
        req.userId,
        req.body
      );
      
      res.json({
        message: 'Endereço favorito atualizado com sucesso',
        data: endereco
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao editar endereço favorito',
        message: error.message
      });
    }
  }

  // [RFS28] Excluir Endereço Favorito
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const resultado = await enderecoFavoritoService.excluirEndereco(
        parseInt(id),
        req.userId
      );
      
      res.json(resultado);
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao excluir endereço favorito',
        message: error.message
      });
    }
  }

  // Obter estatísticas
  async estatisticas(req, res) {
    try {
      const stats = await enderecoFavoritoService.obterEstatisticas(req.userId);
      
      res.json({
        message: 'Estatísticas obtidas com sucesso',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao obter estatísticas',
        message: error.message
      });
    }
  }
}

module.exports = new EnderecoFavoritoController();
