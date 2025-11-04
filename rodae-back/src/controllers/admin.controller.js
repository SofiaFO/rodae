const adminService = require('../services/admin.service');

class AdminController {
  // Listar motoristas (com filtro opcional de status)
  async getMotoristas(req, res) {
    try {
      const { status } = req.query; // ?status=PENDENTE ou ?status=ATIVO
      
      const motoristas = await adminService.getAllMotoristas(status);
      
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

  // Aprovar motorista
  async aprovarMotorista(req, res) {
    try {
      const { id } = req.params;
      
      const motorista = await adminService.aprovarMotorista(parseInt(id));
      
      res.json({
        message: 'Motorista aprovado com sucesso',
        data: motorista
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao aprovar motorista',
        message: error.message
      });
    }
  }

  // Rejeitar/Desativar motorista
  async rejeitarMotorista(req, res) {
    try {
      const { id } = req.params;
      
      const motorista = await adminService.rejeitarMotorista(parseInt(id));
      
      res.json({
        message: 'Motorista rejeitado/desativado com sucesso',
        data: motorista
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao rejeitar motorista',
        message: error.message
      });
    }
  }

  // Obter estatísticas gerais
  async getEstatisticas(req, res) {
    try {
      const stats = await adminService.getEstatisticas();
      
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

module.exports = new AdminController();
