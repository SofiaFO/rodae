const metodoPagamentoService = require('../services/metodoPagamento.service');

class MetodoPagamentoController {
  /**
   * [RFS29] Cadastrar Forma de Pagamento
   * POST /api/metodos-pagamento
   */
  async create(req, res) {
    try {
      const passageiroId = req.userId; // Vem do middleware de autenticação
      const metodo = await metodoPagamentoService.cadastrarMetodoPagamento(passageiroId, req.body);
      
      res.status(201).json({
        message: 'Método de pagamento cadastrado com sucesso',
        data: metodo
      });
    } catch (error) {
      res.status(400).json({
        error: 'Erro ao cadastrar método de pagamento',
        message: error.message
      });
    }
  }

  /**
   * [RFS30] Consultar Formas de Pagamento
   * GET /api/metodos-pagamento
   */
  async getAll(req, res) {
    try {
      const passageiroId = req.userId;
      const metodos = await metodoPagamentoService.consultarMetodosPagamento(passageiroId);
      
      res.json({
        message: 'Métodos de pagamento listados com sucesso',
        data: metodos,
        total: metodos.length
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao listar métodos de pagamento',
        message: error.message
      });
    }
  }

  /**
   * [RFS30] Consultar Forma de Pagamento por ID
   * GET /api/metodos-pagamento/:id
   */
  async getById(req, res) {
    try {
      const metodoPagamentoId = parseInt(req.params.id);
      const passageiroId = req.userId;

      const metodo = await metodoPagamentoService.consultarMetodoPagamentoPorId(metodoPagamentoId, passageiroId);
      
      res.json({
        message: 'Método de pagamento encontrado',
        data: metodo
      });
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          error: 'Método de pagamento não encontrado',
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
        error: 'Erro ao buscar método de pagamento',
        message: error.message
      });
    }
  }

  /**
   * [RFS31] Editar Forma de Pagamento
   * PUT /api/metodos-pagamento/:id
   */
  async update(req, res) {
    try {
      const metodoPagamentoId = parseInt(req.params.id);
      const passageiroId = req.userId;

      const metodo = await metodoPagamentoService.editarMetodoPagamento(
        metodoPagamentoId,
        passageiroId,
        req.body
      );
      
      res.json({
        message: 'Método de pagamento atualizado com sucesso',
        data: metodo
      });
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          error: 'Método de pagamento não encontrado',
          message: error.message
        });
      }

      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: error.message
        });
      }

      res.status(400).json({
        error: 'Erro ao atualizar método de pagamento',
        message: error.message
      });
    }
  }

  /**
   * [RFS32] Excluir Forma de Pagamento
   * DELETE /api/metodos-pagamento/:id
   */
  async delete(req, res) {
    try {
      const metodoPagamentoId = parseInt(req.params.id);
      const passageiroId = req.userId;

      const resultado = await metodoPagamentoService.excluirMetodoPagamento(
        metodoPagamentoId,
        passageiroId
      );
      
      res.json({
        message: 'Método de pagamento excluído com sucesso',
        data: resultado
      });
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          error: 'Método de pagamento não encontrado',
          message: error.message
        });
      }

      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: error.message
        });
      }

      if (error.message.includes('corrida em andamento')) {
        return res.status(400).json({
          error: 'Método em uso',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Erro ao excluir método de pagamento',
        message: error.message
      });
    }
  }

  /**
   * Marcar métodos expirados (executado manualmente ou por CRON)
   * POST /api/metodos-pagamento/marcar-expirados
   */
  async marcarExpirados(req, res) {
    try {
      const resultado = await metodoPagamentoService.marcarMetodosExpirados();
      
      res.json({
        message: 'Métodos expirados marcados com sucesso',
        data: resultado
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao marcar métodos expirados',
        message: error.message
      });
    }
  }
}

module.exports = new MetodoPagamentoController();
