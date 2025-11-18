const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdminService {
  // Listar motoristas por status
  async getMotoristasByStatus(status) {
    return await prisma.usuario.findMany({
      where: {
        tipo: 'MOTORISTA',
        status: status
      },
      include: {
        motorista: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
  }

  // Listar todos os motoristas com filtro opcional
  async getAllMotoristas(statusFilter = null) {
    const where = {
      tipo: 'MOTORISTA'
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    return await prisma.usuario.findMany({
      where,
      include: {
        motorista: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
  }

  // Aprovar motorista
  async aprovarMotorista(motoristaId) {
    const motorista = await prisma.usuario.findUnique({
      where: { id: motoristaId }
    });

    if (!motorista) {
      throw new Error('Motorista não encontrado');
    }

    if (motorista.tipo !== 'MOTORISTA') {
      throw new Error('Usuário não é um motorista');
    }

    if (motorista.status === 'ATIVO') {
      throw new Error('Motorista já está ativo');
    }

    return await prisma.usuario.update({
      where: { id: motoristaId },
      data: { status: 'ATIVO' },
      include: {
        motorista: true
      }
    });
  }

  // Rejeitar/Desativar motorista
  async rejeitarMotorista(motoristaId) {
    const motorista = await prisma.usuario.findUnique({
      where: { id: motoristaId }
    });

    if (!motorista) {
      throw new Error('Motorista não encontrado');
    }

    if (motorista.tipo !== 'MOTORISTA') {
      throw new Error('Usuário não é um motorista');
    }

    return await prisma.usuario.update({
      where: { id: motoristaId },
      data: { status: 'INATIVO' },
      include: {
        motorista: true
      }
    });
  }

  // Estatísticas gerais
  async getEstatisticas() {
    const [
      totalMotoristas,
      motoristasAtivos,
      motoristasPendentes,
      motoristasInativos,
      totalPassageiros,
      totalCorridas
    ] = await Promise.all([
      prisma.usuario.count({ where: { tipo: 'MOTORISTA' } }),
      prisma.usuario.count({ where: { tipo: 'MOTORISTA', status: 'ATIVO' } }),
      prisma.usuario.count({ where: { tipo: 'MOTORISTA', status: 'PENDENTE' } }),
      prisma.usuario.count({ where: { tipo: 'MOTORISTA', status: 'INATIVO' } }),
      prisma.usuario.count({ where: { tipo: 'PASSAGEIRO' } }),
      prisma.corrida.count()
    ]);

    return {
      motoristas: {
        total: totalMotoristas,
        ativos: motoristasAtivos,
        pendentes: motoristasPendentes,
        inativos: motoristasInativos
      },
      passageiros: {
        total: totalPassageiros
      },
      corridas: {
        total: totalCorridas
      }
    };
  }

  // [RFS21] Dashboard Resumo - Dados em tempo real
  async getDashboardResumo() {
    const [
      // Usuários
      totalUsuarios,
      usuariosAtivos,
      usuariosInativos,
      usuariosPendentes,
      
      // Corridas
      totalCorridas,
      corridasEmAndamento,
      corridasFinalizadas,
      corridasCanceladas,
      
      // Financeiro
      receitaResult,
      reembolsosResult,
      pagamentosPendentes
    ] = await Promise.all([
      // Contagem de usuários
      prisma.usuario.count(),
      prisma.usuario.count({ where: { status: 'ATIVO' } }),
      prisma.usuario.count({ where: { status: 'INATIVO' } }),
      prisma.usuario.count({ where: { status: 'PENDENTE' } }),
      
      // Contagem de corridas
      prisma.corrida.count(),
      prisma.corrida.count({ where: { status: 'EM_ANDAMENTO' } }),
      prisma.corrida.count({ where: { status: 'FINALIZADA' } }),
      prisma.corrida.count({ where: { status: 'CANCELADA' } }),
      
      // Dados financeiros
      prisma.pagamento.aggregate({
        where: { status: 'PAGO' },
        _sum: { valor: true }
      }),
      prisma.pagamento.aggregate({
        where: { status: 'ESTORNADO' },
        _sum: { valor: true },
        _count: true
      }),
      prisma.pagamento.count({ where: { status: 'PENDENTE' } })
    ]);

    return {
      usuarios: {
        total: totalUsuarios,
        ativos: usuariosAtivos,
        inativos: usuariosInativos,
        pendentes: usuariosPendentes
      },
      corridas: {
        total: totalCorridas,
        emAndamento: corridasEmAndamento,
        finalizadas: corridasFinalizadas,
        canceladas: corridasCanceladas
      },
      financeiro: {
        receitaTotal: receitaResult._sum.valor || 0,
        reembolsos: {
          total: reembolsosResult._sum.valor || 0,
          quantidade: reembolsosResult._count
        },
        pagamentosPendentes
      }
    };
  }

  // [RFS22] Ativar/Inativar Usuário
  async toggleUsuarioStatus(usuarioId, novoStatus, adminId, justificativa) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { status: novoStatus }
    });

    // TODO: Registrar em log administrativo
    console.log(`[LOG ADMIN] Admin ${adminId} alterou status do usuário ${usuarioId} para ${novoStatus}. Justificativa: ${justificativa}`);

    return usuarioAtualizado;
  }

  // [RFS22] Cancelar Corrida Fraudulenta
  async cancelarCorridaFraudulenta(corridaId, adminId, justificativa) {
    if (!justificativa) {
      throw new Error('Justificativa é obrigatória');
    }

    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    if (corrida.status === 'CANCELADA') {
      throw new Error('Corrida já está cancelada');
    }

    const corridaAtualizada = await prisma.corrida.update({
      where: { id: corridaId },
      data: { status: 'CANCELADA' }
    });

    // TODO: Registrar em log administrativo
    console.log(`[LOG ADMIN] Admin ${adminId} cancelou corrida ${corridaId}. Justificativa: ${justificativa}`);

    return corridaAtualizada;
  }

  // [RFS22] Consultar Histórico Detalhado de Usuário
  async consultarHistoricoUsuario(usuarioId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        corridasAsPassageiro: {
          include: {
            motorista: {
              select: { id: true, nome: true }
            },
            pagamento: true,
            avaliacao: true
          },
          orderBy: { criadoEm: 'desc' }
        },
        corridasAsMotorista: {
          include: {
            passageiro: {
              select: { id: true, nome: true }
            },
            pagamento: true,
            avaliacao: true
          },
          orderBy: { criadoEm: 'desc' }
        },
        avaliacoesFeitas: true,
        avaliacoesRecebidas: true,
        notificacoes: {
          orderBy: { criadoEm: 'desc' },
          take: 50
        }
      }
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return usuario;
  }

  // [RFS23] Relatório sobre Corridas
  async gerarRelatorioCorridas(filtros) {
    const { dataInicio, dataFim, statusCorrida, statusPagamento, cidade } = filtros;

    const where = {};

    // Filtro de período
    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio);
      if (dataFim) where.criadoEm.lte = new Date(dataFim);
    }

    // Filtro de status da corrida
    if (statusCorrida) {
      where.status = statusCorrida;
    }

    // Filtro de pagamento
    if (statusPagamento) {
      where.pagamento = {
        status: statusPagamento
      };
    }

    // Filtro de cidade/região (pela origem)
    if (cidade) {
      where.origem = {
        contains: cidade,
        mode: 'insensitive'
      };
    }

    // Buscar corridas com filtros
    const corridas = await prisma.corrida.findMany({
      where,
      include: {
        passageiro: {
          select: { id: true, nome: true }
        },
        motorista: {
          select: { id: true, nome: true }
        },
        pagamento: true
      },
      orderBy: { criadoEm: 'desc' }
    });

    // Calcular indicadores
    const totalCorridas = corridas.length;
    const valorTotal = corridas.reduce((sum, c) => sum + (c.pagamento?.valor || c.valorEstimado), 0);
    
    // Calcular tempo médio (assumindo que existe campo de duração ou calculando pela diferença)
    const corridasFinalizadas = corridas.filter(c => c.status === 'FINALIZADA');
    
    const corridasCanceladas = corridas.filter(c => c.status === 'CANCELADA').length;
    const taxaCancelamento = totalCorridas > 0 ? (corridasCanceladas / totalCorridas) * 100 : 0;
    
    const ticketMedio = totalCorridas > 0 ? valorTotal / totalCorridas : 0;

    return {
      resumo: {
        totalCorridas,
        valorTotalMovimentado: valorTotal,
        tempoMedioDeslocamento: null, // TODO: Implementar quando houver campo de duração
        taxaCancelamento: taxaCancelamento.toFixed(2),
        ticketMedio: ticketMedio.toFixed(2)
      },
      corridas,
      filtrosAplicados: filtros
    };
  }

  // [RFS24] Relatório sobre Motoristas
  async gerarRelatorioMotoristas(filtros) {
    const { dataInicio, dataFim, statusMotorista, cidade } = filtros;

    const where = {
      tipo: 'MOTORISTA'
    };

    // Filtro de status
    if (statusMotorista) {
      where.status = statusMotorista;
    }

    // Buscar motoristas
    const motoristas = await prisma.usuario.findMany({
      where,
      include: {
        motorista: true,
        corridasAsMotorista: {
          where: {
            ...(dataInicio || dataFim ? {
              criadoEm: {
                ...(dataInicio && { gte: new Date(dataInicio) }),
                ...(dataFim && { lte: new Date(dataFim) })
              }
            } : {}),
            ...(cidade ? {
              origem: {
                contains: cidade,
                mode: 'insensitive'
              }
            } : {})
          },
          include: {
            pagamento: true
          }
        },
        avaliacoesRecebidas: {
          where: {
            deletadoEm: null
          }
        }
      }
    });

    // Calcular métricas para cada motorista
    const motoristasComMetricas = motoristas.map(motorista => {
      const corridas = motorista.corridasAsMotorista;
      const totalCorridas = corridas.length;
      const corridasFinalizadas = corridas.filter(c => c.status === 'FINALIZADA').length;
      const ganhoTotal = corridas.reduce((sum, c) => sum + (c.pagamento?.valor || 0), 0);
      
      const avaliacoes = motorista.avaliacoesRecebidas;
      const mediaAvaliacao = avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0;

      return {
        id: motorista.id,
        nome: motorista.nome,
        email: motorista.email,
        telefone: motorista.telefone,
        status: motorista.status,
        cnh: motorista.motorista?.cnh,
        placaVeiculo: motorista.motorista?.placaVeiculo,
        modeloCorVeiculo: motorista.motorista?.modeloCorVeiculo,
        metricas: {
          totalCorridas,
          corridasFinalizadas,
          ganhoTotal: ganhoTotal.toFixed(2),
          mediaAvaliacao: mediaAvaliacao.toFixed(2),
          totalAvaliacoes: avaliacoes.length
        }
      };
    });

    // Calcular totais gerais
    const totalCorridas = motoristasComMetricas.reduce((sum, m) => sum + m.metricas.totalCorridas, 0);
    const ganhoTotalGeral = motoristasComMetricas.reduce((sum, m) => sum + parseFloat(m.metricas.ganhoTotal), 0);

    return {
      resumo: {
        totalMotoristas: motoristas.length,
        totalCorridas,
        ganhoTotalGeral: ganhoTotalGeral.toFixed(2),
        mediaGeralAvaliacoes: motoristasComMetricas.length > 0
          ? (motoristasComMetricas.reduce((sum, m) => sum + parseFloat(m.metricas.mediaAvaliacao), 0) / motoristasComMetricas.length).toFixed(2)
          : 0
      },
      motoristas: motoristasComMetricas,
      filtrosAplicados: filtros
    };
  }
}

module.exports = new AdminService();
