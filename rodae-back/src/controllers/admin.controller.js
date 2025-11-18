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

  // [RFS21] Dashboard Resumo
  async getDashboard(req, res) {
    try {
      const dashboard = await adminService.getDashboardResumo();
      
      res.json({
        message: 'Dashboard carregado com sucesso',
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao carregar dashboard',
        message: error.message
      });
    }
  }

  // [RFS22] Ativar/Inativar Usuário
  async toggleUsuarioStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, justificativa } = req.body;

      if (!['ATIVO', 'INATIVO', 'PENDENTE'].includes(status)) {
        return res.status(400).json({
          error: 'Status inválido'
        });
      }

      const usuario = await adminService.toggleUsuarioStatus(
        parseInt(id),
        status,
        req.userId,
        justificativa
      );
      
      res.json({
        message: 'Status do usuário atualizado com sucesso',
        data: usuario
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao atualizar status',
        message: error.message
      });
    }
  }

  // [RFS22] Cancelar Corrida Fraudulenta
  async cancelarCorrida(req, res) {
    try {
      const { id } = req.params;
      const { justificativa } = req.body;

      const corrida = await adminService.cancelarCorridaFraudulenta(
        parseInt(id),
        req.userId,
        justificativa
      );
      
      res.json({
        message: 'Corrida cancelada com sucesso',
        data: corrida
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao cancelar corrida',
        message: error.message
      });
    }
  }

  // [RFS22] Consultar Histórico Detalhado de Usuário
  async getHistoricoUsuario(req, res) {
    try {
      const { id } = req.params;

      const historico = await adminService.consultarHistoricoUsuario(parseInt(id));
      
      res.json({
        message: 'Histórico do usuário obtido com sucesso',
        data: historico
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao obter histórico',
        message: error.message
      });
    }
  }

  // [RFS23] Relatório sobre Corridas
  async getRelatorioCorridas(req, res) {
    try {
      const filtros = req.query;

      const relatorio = await adminService.gerarRelatorioCorridas(filtros);
      
      res.json({
        message: 'Relatório de corridas gerado com sucesso',
        data: relatorio
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao gerar relatório',
        message: error.message
      });
    }
  }

  // [RFS24] Relatório sobre Motoristas
  async getRelatorioMotoristas(req, res) {
    try {
      const filtros = req.query;

      const relatorio = await adminService.gerarRelatorioMotoristas(filtros);
      
      res.json({
        message: 'Relatório de motoristas gerado com sucesso',
        data: relatorio
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao gerar relatório',
        message: error.message
      });
    }
  }
}

module.exports = new AdminController();
