const motoristaService = require('../services/motorista.service');

class MotoristaController {
  async create(req, res) {
    try {
      const motorista = await motoristaService.createMotorista(req.body);
      res.status(201).json({
        message: 'Motorista criado com sucesso',
        data: motorista
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao criar motorista',
        message: error.message
      });
    }
  }

  async getAll(req, res) {
    try {
      const motoristas = await motoristaService.getAllMotoristas();
      res.json({
        message: 'Motoristas listados com sucesso',
        data: motoristas
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar motoristas',
        message: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const motorista = await motoristaService.getMotoristaById(parseInt(id));
      
      if (!motorista) {
        return res.status(404).json({
          error: 'Motorista não encontrado'
        });
      }

      res.json({
        message: 'Motorista encontrado',
        data: motorista
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao buscar motorista',
        message: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const motorista = await motoristaService.updateMotorista(parseInt(id), req.body);
      
      res.json({
        message: 'Motorista atualizado com sucesso',
        data: motorista
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao atualizar motorista',
        message: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await motoristaService.deleteMotorista(parseInt(id));
      
      res.json({
        message: 'Motorista deletado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao deletar motorista',
        message: error.message
      });
    }
  }

  /**
   * Obter estatísticas do motorista
   * GET /api/motoristas/me/estatisticas
   */
  async getEstatisticas(req, res) {
    try {
      const motoristaId = req.userId;
      
      const estatisticas = await motoristaService.getEstatisticas(motoristaId);
      
      res.json({
        message: 'Estatísticas obtidas com sucesso',
        data: estatisticas
      });
    } catch (error) {
      console.error('[MOTORISTA CONTROLLER] Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro ao obter estatísticas',
        message: error.message
      });
    }
  }
}

module.exports = new MotoristaController();
