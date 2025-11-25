const passageiroService = require('../services/passageiro.service');

class PassageiroController {
  async create(req, res) {
    try {
      const passageiro = await passageiroService.createPassageiro(req.body);
      res.status(201).json({
        message: 'Passageiro criado com sucesso',
        data: passageiro
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao criar passageiro',
        message: error.message
      });
    }
  }

  async getAll(req, res) {
    try {
      const passageiros = await passageiroService.getAllPassageiros();
      res.json({
        message: 'Passageiros listados com sucesso',
        data: passageiros
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar passageiros',
        message: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const passageiro = await passageiroService.getPassageiroById(parseInt(id));
      
      if (!passageiro) {
        return res.status(404).json({
          error: 'Passageiro não encontrado'
        });
      }

      res.json({
        message: 'Passageiro encontrado',
        data: passageiro
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao buscar passageiro',
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const passageiro = await passageiroService.updatePassageiro(parseInt(id), req.body);
      
      res.json({
        message: 'Passageiro atualizado com sucesso',
        data: passageiro
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao atualizar passageiro',
        message: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await passageiroService.deletePassageiro(parseInt(id));
      
      res.json({
        message: 'Passageiro deletado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao deletar passageiro',
        message: error.message
      });
    }
  }

  /**
   * Obter estatísticas do passageiro
   * GET /api/passageiros/me/estatisticas
   */
  async getEstatisticas(req, res) {
    try {
      const passageiroId = req.userId;
      
      const estatisticas = await passageiroService.getEstatisticas(passageiroId);
      
      res.json({
        message: 'Estatísticas obtidas com sucesso',
        data: estatisticas
      });
    } catch (error) {
      console.error('[PASSAGEIRO CONTROLLER] Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro ao obter estatísticas',
        message: error.message
      });
    }
  }
}

module.exports = new PassageiroController();
