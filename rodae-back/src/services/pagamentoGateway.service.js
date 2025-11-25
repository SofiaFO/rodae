const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PagamentoGatewayService {
  /**
   * Simula processamento de pagamento
   * Em produção, integrar com Stripe, Mercado Pago, etc.
   */
  async processarPagamento(corridaId, formaPagamento, valor) {
    // Simular delay de processamento
    await this.delay(1000);

    // Simular taxa de sucesso de 95%
    const sucesso = Math.random() > 0.05;

    if (!sucesso) {
      return {
        sucesso: false,
        status: 'FALHOU',
        mensagem: 'Pagamento recusado. Tente novamente ou use outro método.',
        transacaoId: null
      };
    }

    // Gerar ID fictício de transação
    const transacaoId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      sucesso: true,
      status: 'PAGO',
      mensagem: 'Pagamento processado com sucesso',
      transacaoId,
      detalhes: {
        formaPagamento,
        valor,
        dataProcessamento: new Date(),
        taxaPlataforma: (valor * 0.20).toFixed(2), // 20% para plataforma
        valorMotorista: (valor * 0.80).toFixed(2)  // 80% para motorista
      }
    };
  }

  /**
   * Registra pagamento no banco de dados
   */
  async registrarPagamento(corridaId, valor, formaPagamento) {
    // Verificar se corrida existe e está finalizada
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    if (corrida.status !== 'FINALIZADA') {
      throw new Error('Apenas corridas finalizadas podem ser pagas');
    }

    // Verificar se já existe pagamento
    const pagamentoExistente = await prisma.pagamento.findUnique({
      where: { corridaId }
    });

    if (pagamentoExistente && pagamentoExistente.status === 'PAGO') {
      throw new Error('Esta corrida já foi paga');
    }

    // Processar pagamento através do gateway
    const resultadoGateway = await this.processarPagamento(corridaId, formaPagamento, valor);

    // Criar ou atualizar pagamento
    const pagamento = pagamentoExistente
      ? await prisma.pagamento.update({
          where: { corridaId },
          data: {
            valor,
            forma: formaPagamento,
            status: resultadoGateway.status
          }
        })
      : await prisma.pagamento.create({
          data: {
            corridaId,
            valor,
            forma: formaPagamento,
            status: resultadoGateway.status
          }
        });

    // Se pagamento foi bem-sucedido, processar repasse ao motorista
    if (resultadoGateway.sucesso && corrida.motoristaId) {
      await this.processarRepasse(corrida.motoristaId, corridaId, valor);
    }

    return {
      pagamento,
      gateway: resultadoGateway
    };
  }

  /**
   * Processa repasse ao motorista (RFS16)
   * 80% para motorista, 20% para plataforma
   */
  async processarRepasse(motoristaId, corridaId, valorTotal) {
    const valorRepasse = valorTotal * 0.80; // 80% para motorista
    const taxaPlataforma = valorTotal * 0.20; // 20% para plataforma

    // TODO: Criar tabela de Repasses no schema
    // Por enquanto, apenas logamos
    console.log(`[REPASSE] Motorista ${motoristaId} - Corrida ${corridaId}`);
    console.log(`  Valor total: R$ ${valorTotal.toFixed(2)}`);
    console.log(`  Repasse motorista: R$ ${valorRepasse.toFixed(2)}`);
    console.log(`  Taxa plataforma: R$ ${taxaPlataforma.toFixed(2)}`);

    return {
      motoristaId,
      corridaId,
      valorTotal,
      valorRepasse,
      taxaPlataforma,
      status: 'PROCESSADO',
      dataRepasse: new Date()
    };
  }

  /**
   * Processa reembolso (RFS14 - Estornar pagamento)
   */
  async estornarPagamento(corridaId, justificativa) {
    const pagamento = await prisma.pagamento.findUnique({
      where: { corridaId },
      include: {
        corrida: {
          include: {
            passageiro: true,
            motorista: true
          }
        }
      }
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    if (pagamento.status !== 'PAGO') {
      throw new Error('Apenas pagamentos confirmados podem ser estornados');
    }

    // Atualizar status do pagamento
    const pagamentoEstornado = await prisma.pagamento.update({
      where: { corridaId },
      data: {
        status: 'ESTORNADO'
      }
    });

    // Log de auditoria
    console.log(`[ESTORNO] Corrida ${corridaId} - Valor: R$ ${pagamento.valor}`);
    console.log(`  Justificativa: ${justificativa}`);
    console.log(`  Passageiro: ${pagamento.corrida.passageiroId}`);
    console.log(`  Motorista: ${pagamento.corrida.motoristaId}`);

    return {
      pagamento: pagamentoEstornado,
      valorEstornado: pagamento.valor,
      justificativa,
      dataEstorno: new Date()
    };
  }

  /**
   * Consulta transações financeiras
   */
  async consultarTransacoes(filtros = {}) {
    const { dataInicio, dataFim, status, formaPagamento } = filtros;

    const where = {};

    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio);
      if (dataFim) where.criadoEm.lte = new Date(dataFim);
    }

    if (status) {
      where.status = status;
    }

    if (formaPagamento) {
      where.forma = formaPagamento;
    }

    const transacoes = await prisma.pagamento.findMany({
      where,
      include: {
        corrida: {
          select: {
            id: true,
            origem: true,
            destino: true,
            passageiroId: true,
            motoristaId: true,
            valorEstimado: true
          }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Calcular totais
    const totalGeral = transacoes.reduce((sum, t) => sum + t.valor, 0);
    const totalPago = transacoes.filter(t => t.status === 'PAGO').reduce((sum, t) => sum + t.valor, 0);
    const totalEstornado = transacoes.filter(t => t.status === 'ESTORNADO').reduce((sum, t) => sum + t.valor, 0);

    return {
      transacoes,
      resumo: {
        total: transacoes.length,
        totalGeral: totalGeral.toFixed(2),
        totalPago: totalPago.toFixed(2),
        totalEstornado: totalEstornado.toFixed(2),
        totalPendente: transacoes.filter(t => t.status === 'PENDENTE').length
      }
    };
  }

  /**
   * Função auxiliar para delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PagamentoGatewayService();
