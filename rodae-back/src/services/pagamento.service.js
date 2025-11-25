const prisma = require('../config/database');
const pagamentoGatewayService = require('./pagamentoGateway.service');

class PagamentoService {
  /**
   * [RFS13] Registrar Pagamento
   * Registra pagamento de uma corrida finalizada
   */
  async registrarPagamento(corridaId, dadosPagamento) {
    // Validar corrida
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId },
      include: {
        pagamento: true,
        motorista: true
      }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    // Validar que a corrida está finalizada
    if (corrida.status !== 'FINALIZADA') {
      throw new Error('Pagamentos só podem ser registrados em corridas finalizadas');
    }

    // Verificar se já existe pagamento
    if (corrida.pagamento) {
      throw new Error('Pagamento já registrado para esta corrida');
    }

    const { valor, forma, transacaoId } = dadosPagamento;

    // Validar forma de pagamento
    const formasValidas = ['PIX', 'CARTAO_CREDITO', 'CARTEIRA_DIGITAL'];
    if (!formasValidas.includes(forma)) {
      throw new Error('Forma de pagamento inválida');
    }

    // Simular processamento com gateway externo
    console.log('[PAGAMENTO] Processando pagamento via gateway...');
    const resultadoGateway = await pagamentoGatewayService.processarPagamento(
      corrida.passageiroId,
      corridaId,
      valor,
      forma
    );

    // Se falhou, registrar como falho
    const status = resultadoGateway.sucesso ? 'PAGO' : 'FALHOU';

    // Criar pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        corridaId,
        transacaoId: transacaoId || resultadoGateway.transacaoId,
        valor,
        forma,
        status
      },
      include: {
        corrida: {
          include: {
            passageiro: {
              select: { id: true, nome: true, email: true }
            },
            motorista: {
              select: { id: true, nome: true, email: true }
            }
          }
        }
      }
    });

    // Se pagamento foi bem-sucedido, processar repasse ao motorista
    if (status === 'PAGO' && corrida.motoristaId) {
      console.log('[PAGAMENTO] Processando repasse ao motorista...');
      await this.processarRepasse(pagamento.id, corrida.motoristaId, valor);
    }

    return pagamento;
  }

  /**
   * [RFS14] Consultar Transações
   * Lista transações com filtros por perfil
   */
  async consultarTransacoes(userId, userTipo, filtros = {}) {
    const { status, dataInicio, dataFim, corridaId } = filtros;

    let whereClause = {};

    // Filtros baseados no tipo de usuário
    if (userTipo === 'PASSAGEIRO') {
      // Passageiro vê apenas seus pagamentos
      whereClause.corrida = {
        passageiroId: userId
      };
    } else if (userTipo === 'MOTORISTA') {
      // Motorista vê apenas pagamentos de suas corridas
      whereClause.corrida = {
        motoristaId: userId
      };
    }
    // Admin vê tudo (sem filtro adicional)

    // Filtro por status
    if (status) {
      const statusValidos = ['PENDENTE', 'PAGO', 'FALHOU', 'ESTORNADO'];
      if (statusValidos.includes(status)) {
        whereClause.status = status;
      }
    }

    // Filtro por corrida específica
    if (corridaId) {
      whereClause.corridaId = parseInt(corridaId);
    }

    // Filtro por data
    if (dataInicio || dataFim) {
      whereClause.criadoEm = {};
      if (dataInicio) whereClause.criadoEm.gte = new Date(dataInicio);
      if (dataFim) whereClause.criadoEm.lte = new Date(dataFim);
    }

    const transacoes = await prisma.pagamento.findMany({
      where: whereClause,
      include: {
        corrida: {
          include: {
            passageiro: {
              select: { id: true, nome: true, email: true }
            },
            motorista: {
              select: { id: true, nome: true, email: true }
            }
          }
        },
        repasses: {
          where: userTipo === 'MOTORISTA' ? { motoristaId: userId } : {}
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Formatar resposta baseado no tipo de usuário
    return transacoes.map(transacao => {
      const base = {
        id: transacao.id,
        transacaoId: transacao.transacaoId,
        valor: transacao.valor,
        forma: transacao.forma,
        status: transacao.status,
        dataHora: transacao.criadoEm,
        corridaId: transacao.corridaId
      };

      if (userTipo === 'MOTORISTA') {
        // Motorista vê o valor que vai receber (repasse)
        const repasse = transacao.repasses[0];
        return {
          ...base,
          valorRepasse: repasse?.valorMotorista || 0,
          statusRepasse: repasse?.status || 'PENDENTE'
        };
      }

      return base;
    });
  }

  /**
   * [RFS15] Reembolsar Pagamento
   * Realiza reembolso total ou parcial
   */
  async reembolsarPagamento(pagamentoId, dadosReembolso, adminId) {
    const { valorReembolso, justificativa } = dadosReembolso;

    // Buscar pagamento
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: {
        corrida: {
          include: {
            motorista: true
          }
        },
        repasses: true
      }
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    // Validar que está pago
    if (pagamento.status !== 'PAGO') {
      throw new Error('Reembolsos só podem ser feitos para transações concluídas');
    }

    // Validar justificativa
    if (!justificativa || justificativa.trim().length < 10) {
      throw new Error('Justificativa obrigatória (mínimo 10 caracteres)');
    }

    // Validar valor do reembolso
    const valorFinal = valorReembolso || pagamento.valor;
    if (valorFinal > pagamento.valor) {
      throw new Error('Valor de reembolso não pode ser maior que o pagamento');
    }

    const reembolsoParcial = valorFinal < pagamento.valor;

    // Simular estorno no gateway
    console.log('[PAGAMENTO] Processando estorno no gateway...');
    await pagamentoGatewayService.estornarPagamento(pagamento.corridaId);

    // Atualizar pagamento
    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id: pagamentoId },
      data: {
        status: 'ESTORNADO',
        justificativaReembolso: justificativa
      }
    });

    // Cancelar repasses pendentes
    await prisma.repasse.updateMany({
      where: {
        pagamentoId,
        status: { in: ['PENDENTE', 'PROCESSANDO'] }
      },
      data: {
        status: 'CANCELADO',
        ultimoErro: `Reembolso realizado: ${justificativa}`
      }
    });

    console.log(`[PAGAMENTO] Reembolso ${reembolsoParcial ? 'parcial' : 'total'} de R$ ${valorFinal.toFixed(2)} realizado`);

    return {
      pagamento: pagamentoAtualizado,
      valorReembolsado: valorFinal,
      tipo: reembolsoParcial ? 'PARCIAL' : 'TOTAL',
      justificativa
    };
  }

  /**
   * [RFS16] Repassar Pagamento ao Motorista
   * Calcula e processa repasse (80/20)
   */
  async processarRepasse(pagamentoId, motoristaId, valorTotal) {
    // Buscar pagamento
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: { repasses: true }
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    // Validar status do pagamento
    if (pagamento.status !== 'PAGO') {
      throw new Error('Repasse só pode ser executado quando pagamento está PAGO');
    }

    // Verificar se já existe repasse
    const repasseExistente = pagamento.repasses.find(r => r.motoristaId === motoristaId);
    if (repasseExistente) {
      console.log('[REPASSE] Repasse já existe para este motorista');
      return repasseExistente;
    }

    // Calcular valores (80% motorista, 20% plataforma)
    const valorMotorista = valorTotal * 0.80;
    const valorPlataforma = valorTotal * 0.20;

    // Criar registro de repasse
    const repasse = await prisma.repasse.create({
      data: {
        pagamentoId,
        motoristaId,
        valorTotal,
        valorMotorista,
        valorPlataforma,
        status: 'PENDENTE'
      }
    });

    // Simular processamento do repasse
    try {
      console.log('[REPASSE] Iniciando transferência ao motorista...');
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular 98% de sucesso
      const sucesso = Math.random() > 0.02;

      if (sucesso) {
        const repasseConcluido = await prisma.repasse.update({
          where: { id: repasse.id },
          data: {
            status: 'CONCLUIDO',
            dataRepasse: new Date(),
            tentativas: 1
          }
        });

        console.log(`[REPASSE] R$ ${valorMotorista.toFixed(2)} transferidos ao motorista ID ${motoristaId}`);
        return repasseConcluido;
      } else {
        // Simular falha
        throw new Error('Erro na comunicação com sistema bancário');
      }
    } catch (error) {
      console.error('[REPASSE] Erro ao processar repasse:', error.message);
      
      await prisma.repasse.update({
        where: { id: repasse.id },
        data: {
          status: 'FALHOU',
          tentativas: { increment: 1 },
          ultimoErro: error.message
        }
      });

      throw new Error(`Falha no repasse: ${error.message}`);
    }
  }

  /**
   * Reprocessar repasse que falhou
   */
  async reprocessarRepasse(repasseId) {
    const repasse = await prisma.repasse.findUnique({
      where: { id: repasseId },
      include: { pagamento: true }
    });

    if (!repasse) {
      throw new Error('Repasse não encontrado');
    }

    if (repasse.status === 'CONCLUIDO') {
      throw new Error('Repasse já foi concluído');
    }

    if (repasse.status === 'CANCELADO') {
      throw new Error('Repasse cancelado, não pode ser reprocessado');
    }

    if (repasse.pagamento.status !== 'PAGO') {
      throw new Error('Pagamento não está mais no status PAGO');
    }

    console.log(`[REPASSE] Reprocessando repasse ID ${repasseId}...`);

    // Atualizar status para processando
    await prisma.repasse.update({
      where: { id: repasseId },
      data: { status: 'PROCESSANDO' }
    });

    // Tentar novamente
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sucesso = Math.random() > 0.02;

      if (sucesso) {
        const repasseConcluido = await prisma.repasse.update({
          where: { id: repasseId },
          data: {
            status: 'CONCLUIDO',
            dataRepasse: new Date(),
            tentativas: { increment: 1 }
          }
        });

        console.log(`[REPASSE] Reprocessamento bem-sucedido!`);
        return repasseConcluido;
      } else {
        throw new Error('Erro persistente no sistema bancário');
      }
    } catch (error) {
      await prisma.repasse.update({
        where: { id: repasseId },
        data: {
          status: 'FALHOU',
          tentativas: { increment: 1 },
          ultimoErro: error.message
        }
      });

      throw new Error(`Falha no reprocessamento: ${error.message}`);
    }
  }

  /**
   * Consultar repasses (para admin)
   */
  async consultarRepasses(filtros = {}) {
    const { status, motoristaId, dataInicio, dataFim } = filtros;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (motoristaId) {
      whereClause.motoristaId = parseInt(motoristaId);
    }

    if (dataInicio || dataFim) {
      whereClause.criadoEm = {};
      if (dataInicio) whereClause.criadoEm.gte = new Date(dataInicio);
      if (dataFim) whereClause.criadoEm.lte = new Date(dataFim);
    }

    const repasses = await prisma.repasse.findMany({
      where: whereClause,
      include: {
        motorista: {
          select: { id: true, nome: true, email: true }
        },
        pagamento: {
          include: {
            corrida: {
              select: { id: true, origem: true, destino: true }
            }
          }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Calcular estatísticas
    const stats = {
      total: repasses.length,
      pendentes: repasses.filter(r => r.status === 'PENDENTE').length,
      processando: repasses.filter(r => r.status === 'PROCESSANDO').length,
      concluidos: repasses.filter(r => r.status === 'CONCLUIDO').length,
      falhos: repasses.filter(r => r.status === 'FALHOU').length,
      cancelados: repasses.filter(r => r.status === 'CANCELADO').length,
      valorTotalMotoristas: repasses
        .filter(r => r.status === 'CONCLUIDO')
        .reduce((sum, r) => sum + r.valorMotorista, 0),
      valorTotalPlataforma: repasses
        .filter(r => r.status === 'CONCLUIDO')
        .reduce((sum, r) => sum + r.valorPlataforma, 0)
    };

    return { repasses, stats };
  }

  /**
   * Buscar pagamento por ID
   */
  async getPagamentoById(pagamentoId, userId, userTipo) {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: {
        corrida: {
          include: {
            passageiro: {
              select: { id: true, nome: true, email: true }
            },
            motorista: {
              select: { id: true, nome: true, email: true }
            }
          }
        },
        repasses: {
          include: {
            motorista: {
              select: { id: true, nome: true }
            }
          }
        }
      }
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    // Validar permissões
    if (userTipo === 'PASSAGEIRO' && pagamento.corrida.passageiroId !== userId) {
      throw new Error('Acesso negado');
    }

    if (userTipo === 'MOTORISTA' && pagamento.corrida.motoristaId !== userId) {
      throw new Error('Acesso negado');
    }

    return pagamento;
  }
}

module.exports = new PagamentoService();
