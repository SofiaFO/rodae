const avaliacaoService = require('../services/avaliacao.service');

class AvaliacaoController {
  // [RFS17] Cadastrar Avaliação
  async criar(req, res) {
    try {
      const avaliacao = await avaliacaoService.criarAvaliacao(req.body, req.userId);
      
      res.status(201).json({
        message: 'Avaliação criada com sucesso',
        data: avaliacao
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao criar avaliação',
        message: error.message
      });
    }
  }

  // [RFS18] Consultar Avaliações
  async consultar(req, res) {
    try {
      const filtros = req.query;
      const avaliacoes = await avaliacaoService.consultarAvaliacoes(
        filtros,
        req.userId,
        req.userTipo
      );
      
      res.json({
        message: 'Avaliações listadas com sucesso',
        data: avaliacoes
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao consultar avaliações',
        message: error.message
      });
    }
  }

  // Consultar avaliações recebidas pelo usuário logado
  async minhasAvaliacoes(req, res) {
    try {
      const avaliacoes = await avaliacaoService.consultarAvaliacoes(
        {},
        req.userId,
        req.userTipo
      );
      
      res.json({
        message: 'Suas avaliações listadas com sucesso',
        data: avaliacoes
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao consultar avaliações',
        message: error.message
      });
    }
  }

  // Consultar média de avaliações
  async media(req, res) {
    try {
      const { usuarioId } = req.params;
      const userId = usuarioId ? parseInt(usuarioId) : req.userId;
      
      const media = await avaliacaoService.calcularMediaAvaliacoes(userId);
      
      res.json({
        message: 'Média calculada com sucesso',
        data: media
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao calcular média',
        message: error.message
      });
    }
  }

  // [RFS19] Editar Avaliação
  async editar(req, res) {
    try {
      const { id } = req.params;
      const avaliacao = await avaliacaoService.editarAvaliacao(
        parseInt(id),
        req.body,
        req.userId
      );
      
      res.json({
        message: 'Avaliação atualizada com sucesso',
        data: avaliacao
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao editar avaliação',
        message: error.message
      });
    }
  }

  // [RFS20] Excluir Avaliação (Soft Delete - apenas Admin)
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const { justificativa } = req.body;
      
      const avaliacao = await avaliacaoService.excluirAvaliacao(
        parseInt(id),
        justificativa,
        req.userId
      );
      
      res.json({
        message: 'Avaliação excluída com sucesso',
        data: avaliacao
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao excluir avaliação',
        message: error.message
      });
    }
  }

  // Consultar histórico de edições
  async historico(req, res) {
    try {
      const { id } = req.params;
      const historico = await avaliacaoService.consultarHistorico(
        parseInt(id),
        req.userId,
        req.userTipo
      );
      
      res.json({
        message: 'Histórico listado com sucesso',
        data: historico
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao consultar histórico',
        message: error.message
      });
    }
  }
}

module.exports = new AvaliacaoController();
