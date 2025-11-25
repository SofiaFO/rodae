const prisma = require('../config/database');

/**
 * Service para geração de relatórios administrativos
 */
class RelatoriosService {
  /**
   * Gera43 relatório completo de corridas
   */
  async gerarRelatorioCorridas(filtros = {}) {
    const { dataInicio, dataFim, statusCorrida, formaPagamento, tipoCorrida } = filtros;

    // Define período padrão: últimos 30 dias
    const hoje = new Date();
    const fimPeriodo = dataFim ? new Date(dataFim + 'T23:59:59') : hoje;
    const inicioPeriodo = dataInicio 
      ? new Date(dataInicio + 'T00:00:00')
      : new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Período para comparação (mês anterior)
    const inicioMesAnterior = new Date(inicioPeriodo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtros para queries
    const whereClause = {
      criadoEm: {
        gte: inicioPeriodo,
        lte: fimPeriodo
      }
    };

    if (statusCorrida) whereClause.status = statusCorrida;
    if (tipoCorrida) whereClause.tipo = tipoCorrida;

    // 1. RESUMO GERAL
    const [corridas, corridasMesAnterior, corridasEmAndamento] = await Promise.all([
      prisma.corrida.findMany({
        where: whereClause,
        include: {
          pagamento: true,
          avaliacao: true
        }
      }),
      prisma.corrida.count({
        where: {
          criadoEm: {
            gte: inicioMesAnterior,
            lt: inicioPeriodo
          }
        }
      }),
      prisma.corrida.count({
        where: { status: 'EM_ANDAMENTO' }
      })
    ]);

    const totalCorridas = corridas.length;
    const finalizadas = corridas.filter(c => c.status === 'FINALIZADA');
    const canceladas = corridas.filter(c => c.status === 'CANCELADA');
    
    const valorTotalMovimentado = finalizadas.reduce((sum, c) => sum + (c.valorFinal || 0), 0);
    const valorReceitaPlataforma = valorTotalMovimentado * 0.20;
    const valorPagoMotoristas = valorTotalMovimentado * 0.80;
    const ticketMedio = totalCorridas > 0 ? valorTotalMovimentado / finalizadas.length : 0;
    const distanciaMedia = finalizadas.length > 0 
      ? finalizadas.reduce((sum, c) => sum + (c.distancia || 0), 0) / finalizadas.length 
      : 0;
    const duracaoMedia = finalizadas.length > 0
      ? finalizadas.reduce((sum, c) => sum + (c.duracao || 0), 0) / finalizadas.length
      : 0;
    const taxaCancelamento = totalCorridas > 0 ? (canceladas.length / totalCorridas) * 100 : 0;
    const crescimentoMensal = corridasMesAnterior > 0 
      ? ((totalCorridas - corridasMesAnterior) / corridasMesAnterior) * 100 
      : 100;

    const resumo = {
      totalCorridas,
      totalFinalizadas: finalizadas.length,
      totalCanceladas: canceladas.length,
      totalEmAndamento: corridasEmAndamento,
      valorTotalMovimentado: Number(valorTotalMovimentado.toFixed(2)),
      valorReceitaPlataforma: Number(valorReceitaPlataforma.toFixed(2)),
      valorPagoMotoristas: Number(valorPagoMotoristas.toFixed(2)),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      distanciaMedia: Number(distanciaMedia.toFixed(1)),
      duracaoMedia: Number(duracaoMedia.toFixed(0)),
      taxaCancelamento: Number(taxaCancelamento.toFixed(2)),
      crescimentoMensal: Number(crescimentoMensal.toFixed(1))
    };

    // 2. POR PERÍODO (últimos 7 dias)
    const porPeriodo = this._agruparPorPeriodo(corridas, 7);

    // 3. POR FORMA DE PAGAMENTO
    const porFormaPagamento = this._agruparPorFormaPagamento(finalizadas);

    // 4. POR TIPO DE CORRIDA
    const porTipoCorrida = this._agruparPorTipo(corridas);

    // 5. TOP ROTAS
    const topRotas = this._calcularTopRotas(finalizadas, 5);

    // 6. POR HORÁRIO
    const porHorario = this._agruparPorHorario(corridas);

    // 7. CORRIDAS RECENTES
    const corridasRecentes = await this._buscarCorridasRecentes(whereClause, 20);

    return {
      resumo,
      porPeriodo,
      porFormaPagamento,
      porTipoCorrida,
      topRotas,
      porHorario,
      corridasRecentes
    };
  }

  /**
   * Gera relatório completo de motoristas
   */
  async gerarRelatorioMotoristas(filtros = {}) {
    const { dataInicio, dataFim, statusMotorista, avaliacaoMinima } = filtros;

    // Define período padrão: últimos 30 dias
    const hoje = new Date();
    const fimPeriodo = dataFim ? new Date(dataFim + 'T23:59:59') : hoje;
    const inicioPeriodo = dataInicio 
      ? new Date(dataInicio + 'T00:00:00')
      : new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar motoristas
    const whereMotorista = {};
    if (statusMotorista) {
      whereMotorista.usuario = { status: statusMotorista };
    }

    const motoristas = await prisma.motorista.findMany({
      where: whereMotorista,
      include: {
        usuario: {
          include: {
            avaliacoesRecebidas: {
              where: { deletadoEm: null }
            }
          }
        },
        corridas: {
          where: {
            criadoEm: {
              gte: inicioPeriodo,
              lte: fimPeriodo
            }
          },
          include: {
            pagamento: {
              include: {
                repasses: {
                  where: { status: 'CONCLUIDO' }
                }
              }
            }
          }
        }
      }
    });

    // 1. RESUMO GERAL
    const totalMotoristas = motoristas.length;
    const motoristasAtivos = motoristas.filter(m => m.usuario.status === 'ATIVO').length;
    const motoristasPendentes = motoristas.filter(m => m.usuario.status === 'PENDENTE').length;
    const motoristasInativos = motoristas.filter(m => m.usuario.status === 'INATIVO').length;

    let totalCorridasRealizadas = 0;
    let ganhoTotalMotoristas = 0;
    let totalAvaliacoes = 0;
    let somaAvaliacoes = 0;

    motoristas.forEach(m => {
      totalCorridasRealizadas += m.corridas.length;
      m.corridas.forEach(c => {
        if (c.pagamento?.repasses) {
          c.pagamento.repasses.forEach(r => {
            ganhoTotalMotoristas += r.valorMotorista;
          });
        }
      });
      m.usuario.avaliacoesRecebidas.forEach(a => {
        totalAvaliacoes++;
        somaAvaliacoes += a.nota;
      });
    });

    const mediaAvaliacaoGeral = totalAvaliacoes > 0 ? somaAvaliacoes / totalAvaliacoes : 0;

    const resumo = {
      totalMotoristas,
      motoristasAtivos,
      motoristasPendentes,
      motoristasInativos,
      totalCorridasRealizadas,
      ganhoTotalMotoristas: Number(ganhoTotalMotoristas.toFixed(2)),
      mediaAvaliacaoGeral: Number(mediaAvaliacaoGeral.toFixed(1)),
      totalAvaliacoes,
      taxaAceitacao: 87.3, // TODO: Calcular baseado em lógica de aceitação
      tempoMedioResposta: 2.4 // TODO: Calcular baseado em timestamps
    };

    // 2. TOP MOTORISTAS
    const topMotoristas = this._calcularTopMotoristas(motoristas, avaliacaoMinima, 20);

    // 3. POR STATUS
    const porStatus = [
      { status: 'ATIVO', quantidade: motoristasAtivos, percentual: (motoristasAtivos / totalMotoristas * 100) },
      { status: 'PENDENTE', quantidade: motoristasPendentes, percentual: (motoristasPendentes / totalMotoristas * 100) },
      { status: 'INATIVO', quantidade: motoristasInativos, percentual: (motoristasInativos / totalMotoristas * 100) }
    ].map(item => ({
      ...item,
      percentual: Number(item.percentual.toFixed(1))
    }));

    // 4. POR AVALIAÇÃO
    const porAvaliacao = this._agruparPorAvaliacao(motoristas);

    // 5. DESEMPENHO MENSAL
    const desempenhoMensal = await this._calcularDesempenhoMensal(6);

    return {
      resumo,
      topMotoristas,
      porStatus,
      porAvaliacao,
      desempenhoMensal
    };
  }

  // ========== MÉTODOS AUXILIARES ==========

  _agruparPorPeriodo(corridas, dias) {
    const resultado = [];
    const hoje = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - i);
      data.setHours(0, 0, 0, 0);

      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);

      const corridasDia = corridas.filter(c => {
        const criadoEm = new Date(c.criadoEm);
        return criadoEm >= data && criadoEm <= dataFim;
      });

      const cancelamentos = corridasDia.filter(c => c.status === 'CANCELADA').length;
      const valor = corridasDia
        .filter(c => c.status === 'FINALIZADA')
        .reduce((sum, c) => sum + (c.valorFinal || 0), 0);

      resultado.push({
        periodo: `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`,
        corridas: corridasDia.length,
        valor: Number(valor.toFixed(2)),
        cancelamentos
      });
    }

    return resultado;
  }

  _agruparPorFormaPagamento(corridas) {
    const grupos = {};
    let total = 0;

    corridas.forEach(c => {
      if (c.pagamento?.formaPagamento) {
        const forma = c.pagamento.formaPagamento;
        if (!grupos[forma]) {
          grupos[forma] = { quantidade: 0, valor: 0 };
        }
        grupos[forma].quantidade++;
        grupos[forma].valor += c.valorFinal || 0;
        total++;
      }
    });

    return Object.entries(grupos).map(([forma, dados]) => ({
      forma,
      quantidade: dados.quantidade,
      percentual: Number(((dados.quantidade / total) * 100).toFixed(1)),
      valor: Number(dados.valor.toFixed(2))
    })).sort((a, b) => b.quantidade - a.quantidade);
  }

  _agruparPorTipo(corridas) {
    const grupos = {};
    const total = corridas.length;

    corridas.forEach(c => {
      const tipo = c.tipo || 'PADRAO';
      if (!grupos[tipo]) {
        grupos[tipo] = { quantidade: 0, valor: 0 };
      }
      grupos[tipo].quantidade++;
      if (c.status === 'FINALIZADA') {
        grupos[tipo].valor += c.valorFinal || 0;
      }
    });

    return Object.entries(grupos).map(([tipo, dados]) => ({
      tipo,
      quantidade: dados.quantidade,
      percentual: Number(((dados.quantidade / total) * 100).toFixed(1)),
      valor: Number(dados.valor.toFixed(2))
    })).sort((a, b) => b.quantidade - a.quantidade);
  }

  _calcularTopRotas(corridas, limite) {
    const rotas = {};

    corridas.forEach(c => {
      const chave = `${c.origem}|||${c.destino}`;
      if (!rotas[chave]) {
        rotas[chave] = {
          origem: c.origem,
          destino: c.destino,
          corridas: 0,
          valor: 0
        };
      }
      rotas[chave].corridas++;
      rotas[chave].valor += c.valorFinal || 0;
    });

    return Object.values(rotas)
      .sort((a, b) => b.corridas - a.corridas)
      .slice(0, limite)
      .map(r => ({
        ...r,
        valor: Number(r.valor.toFixed(2))
      }));
  }

  _agruparPorHorario(corridas) {
    const horarios = {
      '00h-06h': 0,
      '06h-12h': 0,
      '12h-18h': 0,
      '18h-00h': 0
    };

    corridas.forEach(c => {
      const hora = new Date(c.criadoEm).getHours();
      if (hora >= 0 && hora < 6) horarios['00h-06h']++;
      else if (hora >= 6 && hora < 12) horarios['06h-12h']++;
      else if (hora >= 12 && hora < 18) horarios['12h-18h']++;
      else horarios['18h-00h']++;
    });

    const total = corridas.length;

    return Object.entries(horarios).map(([horario, corridas]) => ({
      horario,
      corridas,
      percentual: Number(((corridas / total) * 100).toFixed(1))
    }));
  }

  async _buscarCorridasRecentes(whereClause, limite) {
    const corridas = await prisma.corrida.findMany({
      where: whereClause,
      include: {
        passageiro: {
          include: { usuario: true }
        },
        motorista: {
          include: { usuario: true }
        },
        pagamento: true
      },
      orderBy: { criadoEm: 'desc' },
      take: limite
    });

    return corridas.map(c => ({
      id: c.id,
      data: c.criadoEm.toISOString(),
      passageiro: c.passageiro?.usuario?.nome || 'N/A',
      motorista: c.motorista?.usuario?.nome || null,
      origem: c.origem,
      destino: c.destino,
      distancia: c.distancia || 0,
      duracao: c.duracao || 0,
      valor: c.valorFinal || 0,
      formaPagamento: c.pagamento?.formaPagamento || 'N/A',
      tipo: c.tipo || 'PADRAO',
      status: c.status
    }));
  }

  _calcularTopMotoristas(motoristas, avaliacaoMinima, limite) {
    const resultado = motoristas.map(m => {
      const totalCorridas = m.corridas.length;
      const corridasFinalizadas = m.corridas.filter(c => c.status === 'FINALIZADA').length;
      
      let ganhoTotal = 0;
      m.corridas.forEach(c => {
        if (c.pagamento?.repasses) {
          c.pagamento.repasses.forEach(r => {
            ganhoTotal += r.valorMotorista;
          });
        }
      });

      const avaliacoes = m.usuario.avaliacoesRecebidas;
      const totalAvaliacoes = avaliacoes.length;
      const mediaAvaliacao = totalAvaliacoes > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / totalAvaliacoes
        : 0;

      const taxaSucesso = totalCorridas > 0 ? (corridasFinalizadas / totalCorridas) * 100 : 0;

      // TODO: Calcular horasTrabalhadas e distanciaTotal
      const horasTrabalhadas = 0;
      const distanciaTotal = m.corridas.reduce((sum, c) => sum + (c.distancia || 0), 0);

      return {
        id: m.id,
        nome: m.usuario.nome,
        email: m.usuario.email,
        telefone: m.usuario.telefone,
        cnh: m.cnh,
        placa: m.placaVeiculo,
        modelo: m.modeloCorVeiculo,
        status: m.usuario.status,
        metricas: {
          totalCorridas,
          corridasFinalizadas,
          taxaSucesso: Number(taxaSucesso.toFixed(1)),
          ganhoTotal: Number(ganhoTotal.toFixed(2)),
          mediaAvaliacao: Number(mediaAvaliacao.toFixed(1)),
          totalAvaliacoes,
          horasTrabalhadas,
          distanciaTotal: Number(distanciaTotal.toFixed(1))
        }
      };
    });

    // Filtrar por avaliação mínima se especificado
    let filtrado = resultado;
    if (avaliacaoMinima) {
      filtrado = resultado.filter(m => m.metricas.mediaAvaliacao >= avaliacaoMinima);
    }

    return filtrado
      .sort((a, b) => b.metricas.ganhoTotal - a.metricas.ganhoTotal)
      .slice(0, limite);
  }

  _agruparPorAvaliacao(motoristas) {
    const distribuicao = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    motoristas.forEach(m => {
      const avaliacoes = m.usuario.avaliacoesRecebidas;
      if (avaliacoes.length > 0) {
        const media = avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length;
        const estrelas = Math.round(media);
        distribuicao[estrelas]++;
      }
    });

    const total = motoristas.length;

    return [5, 4, 3, 2, 1].map(estrelas => ({
      estrelas,
      quantidade: distribuicao[estrelas],
      percentual: Number(((distribuicao[estrelas] / total) * 100).toFixed(1))
    }));
  }

  async _calcularDesempenhoMensal(meses) {
    const resultado = [];
    const hoje = new Date();
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = meses - 1; i >= 0; i--) {
      const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0, 23, 59, 59);

      const [corridas, repasses, avaliacoes] = await Promise.all([
        prisma.corrida.count({
          where: {
            criadoEm: { gte: dataInicio, lte: dataFim },
            status: 'FINALIZADA'
          }
        }),
        prisma.repasse.aggregate({
          where: {
            dataRepasse: { gte: dataInicio, lte: dataFim },
            status: 'CONCLUIDO'
          },
          _sum: { valorMotorista: true }
        }),
        prisma.avaliacao.aggregate({
          where: {
            criadoEm: { gte: dataInicio, lte: dataFim },
            deletadoEm: null
          },
          _avg: { nota: true }
        })
      ]);

      resultado.push({
        mes: nomesMeses[dataInicio.getMonth()],
        corridas,
        ganho: Number((repasses._sum.valorMotorista || 0).toFixed(2)),
        mediaAvaliacao: Number((avaliacoes._avg.nota || 0).toFixed(1))
      });
    }

    return resultado;
  }
}

module.exports = new RelatoriosService();
