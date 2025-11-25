const prisma = require('../config/database');
const geocodingService = require('./geocoding.service');
const rotaService = require('./rota.service');
const pagamentoService = require('./pagamento.service');

class CorridaService {
  /**
   * [RFS09] Solicitar Corrida com cálculo real de rota e valor
   * Usa APIs gratuitas para geocodificação e cálculo de rota
   */
  async solicitarCorridaComRotaReal(passageiroId, data) {
    const { origem, destino, formaPagamento, opcaoCorrida } = data;

    // Validar passageiro
    const passageiro = await prisma.usuario.findUnique({
      where: { 
        id: passageiroId,
        tipo: 'PASSAGEIRO',
        status: 'ATIVO'
      }
    });

    if (!passageiro) {
      throw new Error('Passageiro não encontrado ou inativo');
    }

    // Validações
    if (!origem || !destino || !formaPagamento || !opcaoCorrida) {
      throw new Error('Campos obrigatórios: origem, destino, formaPagamento, opcaoCorrida');
    }

    // 1. Geocodificar endereços (Nominatim)
    console.log('[CORRIDA] Geocodificando endereços...');
    const { origem: coordsOrigem, destino: coordsDestino } = await geocodingService.geocodeBatch(
      origem,
      destino
    );

    // 2. Calcular rota e valor (OSRM)
    console.log('[CORRIDA] Calculando rota e valor...');
    const { rota, valor } = await rotaService.calcularEstimativaCompleta(
      coordsOrigem,
      coordsDestino,
      opcaoCorrida
    );

    // 3. Criar corrida no banco
    const corrida = await prisma.corrida.create({
      data: {
        passageiroId,
        origem: coordsOrigem.enderecoFormatado || origem,
        destino: coordsDestino.enderecoFormatado || destino,
        formaPagamento,
        opcaoCorrida,
        valorEstimado: valor.valorTotal,
        status: 'EM_ANDAMENTO'
      },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        }
      }
    });

    // 4. Buscar motoristas próximos (raio de 5km)
    // TODO: Implementar notificação para motoristas
    // TODO: Implementar timeout de 8 minutos

    return {
      corrida,
      detalhesRota: {
        coordenadas: {
          origem: coordsOrigem,
          destino: coordsDestino
        },
        distancia: rota.distanciaKm,
        duracao: rota.duracaoFormatada,
        duracaoMinutos: rota.duracaoMinutos
      },
      detalhesValor: valor
    };
  }

  /**
   * [RFS05] Cadastrar Corrida (Solicitar Corrida)
   * Cria uma nova solicitação de corrida
   */
  async createCorrida(passageiroId, data) {
    const { origem, destino, formaPagamento, opcaoCorrida, origemLat, origemLng, destinoLat, destinoLng } = data;

    // Validar se o passageiro existe e está ativo
    const passageiro = await prisma.usuario.findUnique({
      where: { 
        id: passageiroId,
        tipo: 'PASSAGEIRO',
        status: 'ATIVO'
      }
    });

    if (!passageiro) {
      throw new Error('Passageiro não encontrado ou inativo');
    }

    // Validar campos obrigatórios
    if (!origem || !destino || !formaPagamento || !opcaoCorrida) {
      throw new Error('Campos obrigatórios: origem, destino, formaPagamento, opcaoCorrida');
    }

    // Validar forma de pagamento
    const formasPagamentoValidas = ['PIX', 'CARTAO_CREDITO', 'CARTEIRA_DIGITAL'];
    if (!formasPagamentoValidas.includes(formaPagamento)) {
      throw new Error('Forma de pagamento inválida. Opções: PIX, CARTAO_CREDITO, CARTEIRA_DIGITAL');
    }

    // Validar opção de corrida
    const opcoesCorridaValidas = ['PADRAO', 'PREMIUM', 'COMPARTILHADA'];
    if (!opcoesCorridaValidas.includes(opcaoCorrida)) {
      throw new Error('Opção de corrida inválida. Opções: PADRAO, PREMIUM, COMPARTILHADA');
    }

    // Calcular valor estimado da corrida
    const valorEstimado = this.calcularValorEstimado(
      origemLat, 
      origemLng, 
      destinoLat, 
      destinoLng, 
      opcaoCorrida
    );

    // Criar a corrida com status PENDENTE (aguardando motorista)
    const corrida = await prisma.corrida.create({
      data: {
        passageiroId,
        origem,
        destino,
        formaPagamento,
        opcaoCorrida,
        valorEstimado,
        status: 'EM_ANDAMENTO' // Considerando como solicitação ativa
      },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        }
      }
    });

    // TODO: Implementar lógica para notificar motoristas próximos (raio de 5km)
    // TODO: Implementar timeout de 8 minutos se nenhum motorista aceitar

    return corrida;
  }

  /**
   * Calcula o valor estimado da corrida
   * Baseado em distância + tempo estimado + modalidade
   */
  calcularValorEstimado(origemLat, origemLng, destinoLat, destinoLng, opcaoCorrida) {
    // Cálculo simplificado - em produção usar API de rotas (Google Maps, etc)
    const distanciaKm = this.calcularDistancia(origemLat, origemLng, destinoLat, destinoLng);
    
    // Valores base por km
    const valorPorKm = {
      PADRAO: 2.5,
      PREMIUM: 4.0,
      COMPARTILHADA: 1.8
    };

    const tarifa = valorPorKm[opcaoCorrida] || valorPorKm.PADRAO;
    const valorBase = 5.0; // Bandeirada
    const valorEstimado = valorBase + (distanciaKm * tarifa);

    return parseFloat(valorEstimado.toFixed(2));
  }

  /**
   * Calcula distância entre dois pontos (fórmula de Haversine)
   */
  calcularDistancia(lat1, lon1, lat2, lon2) {
    // Se não houver coordenadas, retorna distância média de 10km
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return 10;
    }

    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * [RFS06] Consultar Corrida
   * Lista corridas com filtros específicos por tipo de usuário
   */
  async getCorridasByUser(userId, userTipo, filters = {}) {
    const { status, dataInicio, dataFim, passageiroId, motoristaId } = filters;

    let whereClause = {};

    // Passageiros só podem ver suas próprias corridas
    if (userTipo === 'PASSAGEIRO') {
      whereClause.passageiroId = userId;
    }
    // Motoristas só podem ver corridas que realizaram
    else if (userTipo === 'MOTORISTA') {
      whereClause.motoristaId = userId;
    }
    // Administradores podem ver todas, com filtros opcionais
    else if (userTipo === 'ADMIN') {
      if (passageiroId) whereClause.passageiroId = parseInt(passageiroId);
      if (motoristaId) whereClause.motoristaId = parseInt(motoristaId);
    }

    // Filtro por status
    if (status) {
      const statusValidos = ['EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'];
      if (statusValidos.includes(status)) {
        whereClause.status = status;
      }
    }

    // Filtro por data
    if (dataInicio || dataFim) {
      whereClause.criadoEm = {};
      if (dataInicio) whereClause.criadoEm.gte = new Date(dataInicio);
      if (dataFim) whereClause.criadoEm.lte = new Date(dataFim);
    }

    const corridas = await prisma.corrida.findMany({
      where: whereClause,
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            motorista: {
              select: {
                placaVeiculo: true,
                modeloCorVeiculo: true
              }
            }
          }
        },
        avaliacoes: {
          select: {
            id: true,
            usuarioDeId: true
          }
        }
      },
      orderBy: {
        criadoEm: 'desc' // Mais recentes primeiro
      }
    });

    // Adicionar informação se o usuário atual já avaliou cada corrida
    const corridasComInfo = corridas.map(corrida => {
      const jaAvaliou = corrida.avaliacoes.some(av => av.usuarioDeId === userId);
      return {
        ...corrida,
        usuarioAtualJaAvaliou: jaAvaliou,
        podeAvaliar: corrida.status === 'FINALIZADA' && !jaAvaliou
      };
    });

    return corridasComInfo;
  }

  /**
   * Consulta uma corrida específica por ID
   */
  async getCorridaById(corridaId, userId, userTipo) {
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            motorista: {
              select: {
                placaVeiculo: true,
                modeloCorVeiculo: true,
                cnh: true
              }
            }
          }
        },
        pagamento: true,
        avaliacoes: {
          include: {
            usuarioDe: {
              select: {
                id: true,
                nome: true
              }
            },
            usuarioPara: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    // Validar permissões de acesso
    if (userTipo === 'PASSAGEIRO' && corrida.passageiroId !== userId) {
      throw new Error('Acesso negado. Você só pode visualizar suas próprias corridas');
    }

    if (userTipo === 'MOTORISTA' && corrida.motoristaId !== userId) {
      throw new Error('Acesso negado. Você só pode visualizar corridas que realizou');
    }

    // Adicionar informação se o usuário atual já avaliou
    const jaAvaliou = corrida.avaliacoes.some(av => av.usuarioDeId === userId);
    
    // Adicionar informações úteis para o front
    const corridaComInfo = {
      ...corrida,
      usuarioAtualJaAvaliou: jaAvaliou,
      podeAvaliar: corrida.status === 'FINALIZADA' && !jaAvaliou
    };

    return corridaComInfo;
  }

  /**
   * [RFS07] Editar Corrida
   * Permite alteração de dados da corrida conforme permissões
   */
  async updateCorrida(corridaId, userId, userTipo, data) {
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    const updateData = {};

    // PASSAGEIRO: pode alterar destino apenas antes de motorista aceitar
    if (userTipo === 'PASSAGEIRO') {
      if (corrida.passageiroId !== userId) {
        throw new Error('Você não tem permissão para editar esta corrida');
      }

      // Se motorista já aceitou, não pode alterar
      if (corrida.motoristaId) {
        throw new Error('Não é possível alterar a corrida após um motorista aceitar');
      }

      // Pode alterar apenas destino
      if (data.destino) {
        updateData.destino = data.destino;
        
        // Recalcular valor se destino mudou
        if (data.destinoLat && data.destinoLng) {
          const novoValor = this.calcularValorEstimado(
            null, null, // origem não muda
            data.destinoLat,
            data.destinoLng,
            corrida.opcaoCorrida
          );
          updateData.valorEstimado = novoValor;
        }
      }

      // Forma de pagamento NÃO pode ser alterada após solicitação
      if (data.formaPagamento) {
        throw new Error('Não é possível alterar a forma de pagamento após a solicitação');
      }
    }
    
    // MOTORISTA: pode alterar status da corrida
    else if (userTipo === 'MOTORISTA') {
      if (corrida.motoristaId !== userId) {
        throw new Error('Você não tem permissão para editar esta corrida');
      }

      // Pode aceitar a corrida (adicionar-se como motorista)
      if (data.aceitarCorrida && !corrida.motoristaId) {
        updateData.motoristaId = userId;
      }

      // Pode alterar status
      if (data.status) {
        const statusPermitidos = ['EM_ANDAMENTO', 'FINALIZADA'];
        if (!statusPermitidos.includes(data.status)) {
          throw new Error('Status inválido para motorista');
        }
        updateData.status = data.status;
      }
    }
    
    // ADMIN: pode alterar qualquer campo e forçar cancelamento
    else if (userTipo === 'ADMIN') {
      if (data.origem) updateData.origem = data.origem;
      if (data.destino) updateData.destino = data.destino;
      if (data.status) updateData.status = data.status;
      if (data.valorEstimado) updateData.valorEstimado = data.valorEstimado;
      if (data.motoristaId !== undefined) updateData.motoristaId = data.motoristaId;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }

    const corridaAtualizada = await prisma.corrida.update({
      where: { id: corridaId },
      data: updateData,
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            email: true,
            motorista: {
              select: {
                placaVeiculo: true,
                modeloCorVeiculo: true
              }
            }
          }
        }
      }
    });

    return corridaAtualizada;
  }

  /**
   * [RFS08] Excluir Corrida (Cancelar Corrida)
   * Cancela uma corrida conforme regras de negócio
   */
  async cancelarCorrida(corridaId, userId, userTipo, motivo = '') {
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    // Corrida já cancelada ou finalizada
    if (corrida.status === 'CANCELADA') {
      throw new Error('Corrida já está cancelada');
    }

    if (corrida.status === 'FINALIZADA') {
      throw new Error('Não é possível cancelar uma corrida finalizada');
    }

    let taxaCancelamento = 0;

    // PASSAGEIRO: pode cancelar antes do motorista estar a caminho
    if (userTipo === 'PASSAGEIRO') {
      if (corrida.passageiroId !== userId) {
        throw new Error('Você não tem permissão para cancelar esta corrida');
      }

      // Se motorista já aceitou, cobra taxa de cancelamento
      if (corrida.motoristaId) {
        taxaCancelamento = corrida.valorEstimado * 0.2; // 20% do valor
      }
    }
    
    // MOTORISTA: pode cancelar apenas antes de iniciar deslocamento
    else if (userTipo === 'MOTORISTA') {
      if (corrida.motoristaId !== userId) {
        throw new Error('Você não tem permissão para cancelar esta corrida');
      }

      // Motorista pode cancelar sem taxa (mas pode afetar reputação)
    }
    
    // ADMIN: pode cancelar em caso de fraude ou erro
    else if (userTipo === 'ADMIN') {
      // Admin pode cancelar qualquer corrida
    } else {
      throw new Error('Permissão negada para cancelar corrida');
    }

    // Atualizar status para CANCELADA
    const corridaCancelada = await prisma.corrida.update({
      where: { id: corridaId },
      data: {
        status: 'CANCELADA'
      },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // TODO: Registrar motivo do cancelamento
    // TODO: Processar taxa de cancelamento se aplicável
    // TODO: Notificar partes envolvidas

    return {
      corrida: corridaCancelada,
      taxaCancelamento,
      motivo
    };
  }

  /**
   * Motorista aceita uma corrida
   */
  async aceitarCorrida(corridaId, motoristaId) {
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    if (corrida.motoristaId) {
      throw new Error('Corrida já foi aceita por outro motorista');
    }

    if (corrida.status !== 'EM_ANDAMENTO') {
      throw new Error('Corrida não está disponível para ser aceita');
    }

    // Verificar se o motorista existe e está ativo
    const motorista = await prisma.usuario.findUnique({
      where: { 
        id: motoristaId,
        tipo: 'MOTORISTA',
        status: 'ATIVO'
      }
    });

    if (!motorista) {
      throw new Error('Motorista não encontrado ou inativo');
    }

    const corridaAceita = await prisma.corrida.update({
      where: { id: corridaId },
      data: {
        motoristaId
      },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            telefone: true
          }
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            motorista: {
              select: {
                placaVeiculo: true,
                modeloCorVeiculo: true
              }
            }
          }
        }
      }
    });

    // TODO: Notificar passageiro que motorista aceitou

    return corridaAceita;
  }

  /**
   * Finalizar corrida com processamento de pagamento
   * Integra com sistema de pagamentos e processa repasse
   */
  async finalizarCorridaComPagamento(corridaId, motoristaId, dadosFinalizacao = {}) {
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId },
      include: {
        passageiro: true,
        motorista: true,
        pagamento: true
      }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    if (corrida.motoristaId !== motoristaId) {
      throw new Error('Apenas o motorista da corrida pode finalizá-la');
    }

    if (corrida.status === 'FINALIZADA') {
      throw new Error('Corrida já foi finalizada');
    }

    if (corrida.status === 'CANCELADA') {
      throw new Error('Não é possível finalizar uma corrida cancelada');
    }

    // 1. Calcular valor final (pode ser diferente do estimado)
    const valorFinal = dadosFinalizacao.valorFinal || corrida.valorEstimado;

    // 2. Finalizar corrida
    const corridaFinalizada = await prisma.corrida.update({
      where: { id: corridaId },
      data: {
        status: 'FINALIZADA',
        valorFinal: valorFinal
      }
    });

    // 3. Registrar pagamento (se ainda não existe)
    let pagamento = corrida.pagamento;
    if (!pagamento) {
      console.log('[CORRIDA] Registrando pagamento...');
      pagamento = await pagamentoService.registrarPagamento(corridaId, {
        valor: valorFinal,
        forma: corrida.formaPagamento
      });
    }

    // 4. Buscar dados atualizados
    const corridaCompleta = await prisma.corrida.findUnique({
      where: { id: corridaId },
      include: {
        passageiro: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        pagamento: {
          include: {
            repasses: true
          }
        }
      }
    });

    const repasse = corridaCompleta.pagamento?.repasses[0];

    return {
      corrida: corridaCompleta,
      pagamento: {
        id: corridaCompleta.pagamento?.id,
        transacaoId: corridaCompleta.pagamento?.transacaoId,
        valorTotal: valorFinal,
        valorMotorista: repasse?.valorMotorista || 0,
        valorPlataforma: repasse?.valorPlataforma || 0,
        status: corridaCompleta.pagamento?.status || 'PENDENTE',
        statusRepasse: repasse?.status || 'PENDENTE'
      }
    };
  }
}

module.exports = new CorridaService();
