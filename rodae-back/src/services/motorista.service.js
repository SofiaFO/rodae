const prisma = require('../config/database');
const bcrypt = require('bcrypt');

class MotoristaService {
  async createMotorista(data) {
    const { nome, email, telefone, senha, cnh, validadeCNH, docVeiculo, placaVeiculo, modeloCorVeiculo } = data;

    // Verificar se o email já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Verificar se CNH já existe
    const existingCNH = await prisma.motorista.findUnique({
      where: { cnh }
    });

    if (existingCNH) {
      throw new Error('CNH já cadastrada');
    }

    // Verificar se placa já existe
    const existingPlaca = await prisma.motorista.findUnique({
      where: { placaVeiculo }
    });

    if (existingPlaca) {
      throw new Error('Placa de veículo já cadastrada');
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário e motorista em uma transação
    const motorista = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email,
          telefone,
          senha: senhaHash,
          tipo: 'MOTORISTA',
          status: 'PENDENTE' // Motorista precisa ser aprovado
        }
      });

      const motoristaData = await tx.motorista.create({
        data: {
          id: usuario.id,
          cnh,
          validadeCNH: new Date(validadeCNH),
          docVeiculo,
          placaVeiculo,
          modeloCorVeiculo
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              tipo: true,
              status: true,
              criadoEm: true
            }
          }
        }
      });

      return motoristaData;
    });

    return motorista;
  }

  async getAllMotoristas() {
    const motoristas = await prisma.motorista.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            tipo: true,
            status: true,
            criadoEm: true
          }
        }
      }
    });

    return motoristas;
  }

  async getMotoristaById(id) {
    const motorista = await prisma.motorista.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            tipo: true,
            status: true,
            criadoEm: true,
            corridasAsMotorista: {
              include: {
                passageiro: {
                  select: {
                    nome: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return motorista;
  }

  async updateMotorista(id, data) {
    const { nome, email, telefone, senha, cnh, validadeCNH, docVeiculo, placaVeiculo, modeloCorVeiculo } = data;

    const motorista = await prisma.$transaction(async (tx) => {
      // Atualizar dados do usuário
      const updateUserData = {};
      if (nome) updateUserData.nome = nome;
      if (email) updateUserData.email = email;
      if (telefone) updateUserData.telefone = telefone;
      if (senha) updateUserData.senha = await bcrypt.hash(senha, 10);

      if (Object.keys(updateUserData).length > 0) {
        await tx.usuario.update({
          where: { id },
          data: updateUserData
        });
      }

      // Atualizar dados do motorista
      const updateMotoristaData = {};
      if (cnh) updateMotoristaData.cnh = cnh;
      if (validadeCNH) updateMotoristaData.validadeCNH = new Date(validadeCNH);
      if (docVeiculo) updateMotoristaData.docVeiculo = docVeiculo;
      if (placaVeiculo) updateMotoristaData.placaVeiculo = placaVeiculo;
      if (modeloCorVeiculo) updateMotoristaData.modeloCorVeiculo = modeloCorVeiculo;

      const motoristaUpdated = await tx.motorista.update({
        where: { id },
        data: updateMotoristaData,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              tipo: true,
              status: true,
              criadoEm: true
            }
          }
        }
      });

      return motoristaUpdated;
    });

    return motorista;
  }

  async deleteMotorista(id) {
    await prisma.usuario.delete({
      where: { id }
    });
  }

  async aprovarMotorista(id) {
    const motorista = await prisma.usuario.update({
      where: { id },
      data: { status: 'ATIVO' },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true
      }
    });

    return motorista;
  }

  /**
   * Obter estatísticas do motorista
   * Retorna: total de corridas, avaliação média recebida, receita total
   */
  async getEstatisticas(motoristaId) {
    // Validar se é motorista
    const motorista = await prisma.usuario.findUnique({
      where: { 
        id: motoristaId,
        tipo: 'MOTORISTA'
      }
    });

    if (!motorista) {
      throw new Error('Motorista não encontrado');
    }

    // Datas para filtros
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
    const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);

    // Início e fim desta semana (domingo a sábado)
    const diaSemana = agora.getDay(); // 0 = domingo, 6 = sábado
    const inicioEstaSemana = new Date(agora);
    inicioEstaSemana.setDate(agora.getDate() - diaSemana);
    inicioEstaSemana.setHours(0, 0, 0, 0);

    const fimEstaSemana = new Date(inicioEstaSemana);
    fimEstaSemana.setDate(inicioEstaSemana.getDate() + 6);
    fimEstaSemana.setHours(23, 59, 59, 999);

    // Início e fim da semana passada
    const inicioSemanaPassada = new Date(inicioEstaSemana);
    inicioSemanaPassada.setDate(inicioEstaSemana.getDate() - 7);
    
    const fimSemanaPassada = new Date(inicioSemanaPassada);
    fimSemanaPassada.setDate(inicioSemanaPassada.getDate() + 6);
    fimSemanaPassada.setHours(23, 59, 59, 999);

    // 1. HOJE - Corridas finalizadas
    const corridasHoje = await prisma.corrida.count({
      where: {
        motoristaId,
        status: 'FINALIZADA',
        criadoEm: {
          gte: inicioHoje,
          lte: fimHoje
        }
      }
    });

    // 2. HOJE - Receita (repasses concluídos)
    const receitaHoje = await prisma.repasse.aggregate({
      where: {
        motoristaId,
        status: 'CONCLUIDO',
        dataRepasse: {
          gte: inicioHoje,
          lte: fimHoje
        }
      },
      _sum: {
        valorMotorista: true
      }
    });

    // 3. ESTA SEMANA - Corridas
    const corridasEstaSemana = await prisma.corrida.count({
      where: {
        motoristaId,
        status: 'FINALIZADA',
        criadoEm: {
          gte: inicioEstaSemana,
          lte: fimEstaSemana
        }
      }
    });

    // 4. ESTA SEMANA - Receita
    const receitaEstaSemana = await prisma.repasse.aggregate({
      where: {
        motoristaId,
        status: 'CONCLUIDO',
        dataRepasse: {
          gte: inicioEstaSemana,
          lte: fimEstaSemana
        }
      },
      _sum: {
        valorMotorista: true
      }
    });

    // 5. SEMANA PASSADA - Receita (para comparação)
    const receitaSemanaPassada = await prisma.repasse.aggregate({
      where: {
        motoristaId,
        status: 'CONCLUIDO',
        dataRepasse: {
          gte: inicioSemanaPassada,
          lte: fimSemanaPassada
        }
      },
      _sum: {
        valorMotorista: true
      }
    });

    // 6. Calcular porcentagem de crescimento
    const valorEstaSemana = receitaEstaSemana._sum.valorMotorista || 0;
    const valorSemanaPassada = receitaSemanaPassada._sum.valorMotorista || 0;
    
    let porcentagemCrescimento = 0;
    if (valorSemanaPassada > 0) {
      porcentagemCrescimento = ((valorEstaSemana - valorSemanaPassada) / valorSemanaPassada) * 100;
    } else if (valorEstaSemana > 0) {
      porcentagemCrescimento = 100; // Se semana passada foi 0 e essa tem receita, é 100%
    }

    // 7. Total de corridas realizadas (todas)
    const totalCorridas = await prisma.corrida.count({
      where: {
        motoristaId,
        status: 'FINALIZADA'
      }
    });

    // 8. Corridas em andamento
    const corridasEmAndamento = await prisma.corrida.count({
      where: {
        motoristaId,
        status: 'EM_ANDAMENTO'
      }
    });

    // 9. Corridas canceladas
    const corridasCanceladas = await prisma.corrida.count({
      where: {
        motoristaId,
        status: 'CANCELADA'
      }
    });

    // 10. Avaliação média recebida (de passageiros)
    const avaliacoesRecebidas = await prisma.avaliacao.findMany({
      where: {
        usuarioParaId: motoristaId,
        deletadoEm: null
      },
      select: {
        nota: true
      }
    });

    const avaliacaoMedia = avaliacoesRecebidas.length > 0
      ? avaliacoesRecebidas.reduce((sum, av) => sum + av.nota, 0) / avaliacoesRecebidas.length
      : 0;

    // 11. Total de avaliações recebidas
    const totalAvaliacoes = avaliacoesRecebidas.length;

    // 12. Receita total (repasses concluídos) - TODAS AS CORRIDAS
    const repasses = await prisma.repasse.findMany({
      where: {
        motoristaId,
        status: 'CONCLUIDO'
      },
      select: {
        valorMotorista: true,
        valorTotal: true
      }
    });

    const receitaTotal = repasses.reduce((sum, rep) => sum + rep.valorMotorista, 0);
    const valorTotalCorridas = repasses.reduce((sum, rep) => sum + rep.valorTotal, 0);

    // 13. Receita média por corrida
    const receitaMedia = totalCorridas > 0 ? receitaTotal / totalCorridas : 0;

    // 14. Repasses pendentes (a receber)
    const repassesPendentes = await prisma.repasse.aggregate({
      where: {
        motoristaId,
        status: { in: ['PENDENTE', 'PROCESSANDO'] }
      },
      _sum: {
        valorMotorista: true
      },
      _count: {
        id: true
      }
    });

    const valorAReceber = repassesPendentes._sum.valorMotorista || 0;
    const totalRepassesPendentes = repassesPendentes._count.id || 0;

    // 15. Última corrida
    const ultimaCorrida = await prisma.corrida.findFirst({
      where: {
        motoristaId,
        status: 'FINALIZADA'
      },
      orderBy: {
        criadoEm: 'desc'
      },
      select: {
        id: true,
        origem: true,
        destino: true,
        valorFinal: true,
        criadoEm: true,
        passageiro: {
          select: {
            nome: true
          }
        }
      }
    });

    // 16. Estatísticas por período (últimos 30 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const corridasUltimos30Dias = await prisma.corrida.count({
      where: {
        motoristaId,
        status: 'FINALIZADA',
        criadoEm: {
          gte: dataLimite
        }
      }
    });

    const receitaUltimos30Dias = await prisma.repasse.aggregate({
      where: {
        motoristaId,
        status: 'CONCLUIDO',
        dataRepasse: {
          gte: dataLimite
        }
      },
      _sum: {
        valorMotorista: true
      }
    });

    // 17. Taxa de aceitação (corridas aceitas vs disponíveis)
    const taxaAceitacao = 100; // Simplificado

    return {
      // HOJE
      hoje: {
        corridas: corridasHoje,
        receita: Number((receitaHoje._sum.valorMotorista || 0).toFixed(2))
      },
      // ESTA SEMANA
      estaSemana: {
        corridas: corridasEstaSemana,
        receita: Number(valorEstaSemana.toFixed(2)),
        receitaSemanaPassada: Number(valorSemanaPassada.toFixed(2)),
        porcentagemCrescimento: Number(porcentagemCrescimento.toFixed(1)),
        cresceu: porcentagemCrescimento >= 0
      },
      // AVALIAÇÃO MÉDIA
      avaliacoes: {
        media: Number(avaliacaoMedia.toFixed(1)),
        total: totalAvaliacoes,
        estrelas: avaliacaoMedia >= 4.5 ? 5 : avaliacaoMedia >= 3.5 ? 4 : avaliacaoMedia >= 2.5 ? 3 : avaliacaoMedia >= 1.5 ? 2 : 1
      },
      // RECEITA TOTAL (TODAS AS CORRIDAS)
      receitaTotalGeral: Number(receitaTotal.toFixed(2)),
      // Dados completos
      corridas: {
        total: totalCorridas,
        finalizadas: totalCorridas,
        emAndamento: corridasEmAndamento,
        canceladas: corridasCanceladas,
        taxaAceitacao
      },
      financeiro: {
        receitaTotal: Number(receitaTotal.toFixed(2)),
        receitaMedia: Number(receitaMedia.toFixed(2)),
        valorTotalCorridas: Number(valorTotalCorridas.toFixed(2)),
        valorAReceber: Number(valorAReceber.toFixed(2)),
        repassesPendentes: totalRepassesPendentes,
        taxaPlataforma: 20 // 20%
      },
      ultimos30Dias: {
        corridas: corridasUltimos30Dias,
        receita: Number((receitaUltimos30Dias._sum.valorMotorista || 0).toFixed(2))
      },
      ultimaCorrida: ultimaCorrida ? {
        id: ultimaCorrida.id,
        origem: ultimaCorrida.origem,
        destino: ultimaCorrida.destino,
        valor: ultimaCorrida.valorFinal || 0,
        passageiro: ultimaCorrida.passageiro.nome,
        data: ultimaCorrida.criadoEm
      } : null,
      performance: {
        tempoMedioOnline: "N/A"
      }
    };
  }
}

module.exports = new MotoristaService();
