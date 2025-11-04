const corridaService = require('../services/corrida.service');

class CorridaController {
  /**
   * [RFS05] Cadastrar Corrida (Solicitar Corrida)
   * POST /api/corridas
   */
  async create(req, res) {
    try {
      const passageiroId = req.userId;
      const corrida = await corridaService.createCorrida(passageiroId, req.body);
      
      res.status(201).json({
        message: 'Corrida solicitada com sucesso',
        data: corrida
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao solicitar corrida',
        message: error.message
      });
    }
  }

  /**
   * [RFS06] Consultar Corridas
   * GET /api/corridas
   */
  async getAll(req, res) {
    try {
      const userId = req.userId;
      const userTipo = req.userTipo;
      const filters = {
        status: req.query.status,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        passageiroId: req.query.passageiroId,
        motoristaId: req.query.motoristaId
      };

      const corridas = await corridaService.getCorridasByUser(userId, userTipo, filters);
      
      res.json({
        message: 'Corridas listadas com sucesso',
        data: corridas,
        total: corridas.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar corridas',
        message: error.message
      });
    }
  }

  /**
   * [RFS06] Consultar Corrida por ID
   * GET /api/corridas/:id
   */
  async getById(req, res) {
    try {
      const corridaId = parseInt(req.params.id);
      const userId = req.userId;
      const userTipo = req.userTipo;

      const corrida = await corridaService.getCorridaById(corridaId, userId, userTipo);
      
      res.json({
        message: 'Corrida encontrada',
        data: corrida
      });
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          error: 'Corrida não encontrada',
          message: error.message
        });
      }

      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Erro ao buscar corrida',
        message: error.message
      });
    }
  }

  /**
   * [RFS07] Editar Corrida
   * PUT /api/corridas/:id
   */
  async update(req, res) {
    try {
      const corridaId = parseInt(req.params.id);
      const userId = req.userId;
      const userTipo = req.userTipo;

      const corrida = await corridaService.updateCorrida(corridaId, userId, userTipo, req.body);
      
      res.json({
        message: 'Corrida atualizada com sucesso',
        data: corrida
      });
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          error: 'Corrida não encontrada',
          message: error.message
        });
      }

      if (error.message.includes('permissão') || error.message.includes('Acesso negado')) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: error.message
        });
      }

      res.status(400).json({
        error: 'Erro ao atualizar corrida',
        message: error.message
      });
    }
  }

  /**
   * [RFS08] Excluir/Cancelar Corrida
   * DELETE /api/corridas/:id
   */
  async delete(req, res) {
    try {
      const corridaId = parseInt(req.params.id);
      const userId = req.userId;
      const userTipo = req.userTipo;
      const motivo = req.body.motivo || '';

      const resultado = await corridaService.cancelarCorrida(corridaId, userId, userTipo, motivo);
      
      res.json({
        message: 'Corrida cancelada com sucesso',
        data: resultado
      });
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          error: 'Corrida não encontrada',
          message: error.message
        });
      }

      if (error.message.includes('permissão') || error.message.includes('Acesso negado')) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: error.message
        });
      }

      res.status(400).json({
        error: 'Erro ao cancelar corrida',
        message: error.message
      });
    }
  }

  /**
   * Motorista aceita uma corrida
   * POST /api/corridas/:id/aceitar
   */
  async aceitar(req, res) {
    try {
      const corridaId = parseInt(req.params.id);
      const motoristaId = req.userId;

      const corrida = await corridaService.aceitarCorrida(corridaId, motoristaId);
      
      res.json({
        message: 'Corrida aceita com sucesso',
        data: corrida
      });
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          error: 'Corrida não encontrada',
          message: error.message
        });
      }

      res.status(400).json({
        error: 'Erro ao aceitar corrida',
        message: error.message
      });
    }
  }

  /**
   * Listar corridas disponíveis para motoristas
   * GET /api/corridas/disponiveis
   */
  async getDisponiveis(req, res) {
    try {
      // Buscar corridas sem motorista e em andamento
      const corridas = await corridaService.getCorridasByUser(
        null, 
        'ADMIN', 
        { status: 'EM_ANDAMENTO' }
      );

      // Filtrar apenas as que não tem motorista
      const corridasDisponiveis = corridas.filter(c => !c.motoristaId);
      
      res.json({
        message: 'Corridas disponíveis listadas com sucesso',
        data: corridasDisponiveis,
        total: corridasDisponiveis.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar corridas disponíveis',
        message: error.message
      });
    }
  }
}

module.exports = new CorridaController();
