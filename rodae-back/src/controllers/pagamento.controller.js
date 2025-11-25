const pagamentoService = require('../services/pagamento.service');

class PagamentoController {
  /**
   * [RFS13] Registrar Pagamento
   * POST /api/pagamentos
   */
  async registrar(req, res) {
    try {
      const { corridaId, valor, forma, transacaoId } = req.body;

      if (!corridaId || !valor || !forma) {
        return res.status(400).json({
          error: 'Campos obrigatórios ausentes',
          message: 'corridaId, valor e forma são obrigatórios'
        });
      }

      const pagamento = await pagamentoService.registrarPagamento(corridaId, {
        valor,
        forma,
        transacaoId
      });

      res.status(201).json({
        message: 'Pagamento registrado com sucesso',
        data: pagamento
      });
    } catch (error) {
      console.error('[PAGAMENTO CONTROLLER] Erro ao registrar:', error);
      res.status(400).json({
        error: 'Erro ao registrar pagamento',
        message: error.message
      });
    }
  }

  /**
   * [RFS14] Consultar Transações
   * GET /api/pagamentos
   */
  async consultarTransacoes(req, res) {
    try {
      const userId = req.userId;
      const userTipo = req.userTipo;
      
      const filtros = {
        status: req.query.status,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        corridaId: req.query.corridaId
      };

      const transacoes = await pagamentoService.consultarTransacoes(
        userId,
        userTipo,
        filtros
      );

      res.json({
        message: 'Transações listadas com sucesso',
        data: transacoes,
        total: transacoes.length
      });
    } catch (error) {
      console.error('[PAGAMENTO CONTROLLER] Erro ao consultar:', error);
      res.status(500).json({
        error: 'Erro ao consultar transações',
        message: error.message
      });
    }
  }

  /**
   * Buscar pagamento por ID
   * GET /api/pagamentos/:id
   */
  async getById(req, res) {
    try {
      const pagamentoId = parseInt(req.params.id);
      const userId = req.userId;
      const userTipo = req.userTipo;

      const pagamento = await pagamentoService.getPagamentoById(
        pagamentoId,
        userId,
        userTipo
      );

      res.json({
        message: 'Pagamento encontrado',
        data: pagamento
      });
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          error: 'Pagamento não encontrado',
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
        error: 'Erro ao buscar pagamento',
        message: error.message
      });
    }
  }

  /**
   * [RFS15] Reembolsar Pagamento (Admin apenas)
   * POST /api/pagamentos/:id/reembolsar
   */
  async reembolsar(req, res) {
    try {
      const pagamentoId = parseInt(req.params.id);
      const adminId = req.userId;
      const { valorReembolso, justificativa } = req.body;

      if (!justificativa) {
        return res.status(400).json({
          error: 'Justificativa obrigatória',
          message: 'O reembolso deve ter uma justificativa'
        });
      }

      const resultado = await pagamentoService.reembolsarPagamento(
        pagamentoId,
        { valorReembolso, justificativa },
        adminId
      );

      res.json({
        message: `Reembolso ${resultado.tipo.toLowerCase()} realizado com sucesso`,
        data: resultado
      });
    } catch (error) {
      console.error('[PAGAMENTO CONTROLLER] Erro ao reembolsar:', error);
      
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          error: 'Pagamento não encontrado',
          message: error.message
        });
      }

      res.status(400).json({
        error: 'Erro ao processar reembolso',
        message: error.message
      });
    }
  }

  /**
   * [RFS16] Consultar Repasses (Admin apenas)
   * GET /api/pagamentos/repasses
   */
  async consultarRepasses(req, res) {
    try {
      const filtros = {
        status: req.query.status,
        motoristaId: req.query.motoristaId,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim
      };

      const resultado = await pagamentoService.consultarRepasses(filtros);

      res.json({
        message: 'Repasses listados com sucesso',
        data: resultado.repasses,
        stats: resultado.stats
      });
    } catch (error) {
      console.error('[PAGAMENTO CONTROLLER] Erro ao consultar repasses:', error);
      res.status(500).json({
        error: 'Erro ao consultar repasses',
        message: error.message
      });
    }
  }

  /**
   * Reprocessar repasse que falhou (Admin apenas)
   * POST /api/pagamentos/repasses/:id/reprocessar
   */
  async reprocessarRepasse(req, res) {
    try {
      const repasseId = parseInt(req.params.id);

      const repasse = await pagamentoService.reprocessarRepasse(repasseId);

      res.json({
        message: 'Repasse reprocessado com sucesso',
        data: repasse
      });
    } catch (error) {
      console.error('[PAGAMENTO CONTROLLER] Erro ao reprocessar repasse:', error);
      
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          error: 'Repasse não encontrado',
          message: error.message
        });
      }

      res.status(400).json({
        error: 'Erro ao reprocessar repasse',
        message: error.message
      });
    }
  }
}

module.exports = new PagamentoController();
