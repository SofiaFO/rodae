const prisma = require('../config/database');
const bcrypt = require('bcrypt');

class PassageiroService {
  async createPassageiro(data) {
    const { nome, email, telefone, senha } = data;

    // Verificar se o email já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário e passageiro em uma transação
    const passageiro = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome,
          email,
          telefone,
          senha: senhaHash,
          tipo: 'PASSAGEIRO',
          status: 'ATIVO'
        }
      });

      const passageiroData = await tx.passageiro.create({
        data: {
          id: usuario.id
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

      return passageiroData;
    });

    return passageiro;
  }

  async getAllPassageiros() {
    const passageiros = await prisma.passageiro.findMany({
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

    return passageiros;
  }

  async getPassageiroById(id) {
    const passageiro = await prisma.passageiro.findUnique({
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
            corridasAsPassageiro: {
              include: {
                motorista: {
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

    return passageiro;
  }

  async updatePassageiro(id, data) {
    const { nome, email, telefone, senha } = data;

    const updateData = {};
    
    if (nome) updateData.nome = nome;
    if (email) updateData.email = email;
    if (telefone) updateData.telefone = telefone;
    if (senha) updateData.senha = await bcrypt.hash(senha, 10);

    const passageiro = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tipo: true,
        status: true,
        criadoEm: true
      }
    });

    return passageiro;
  }

  async deletePassageiro(id) {
    await prisma.usuario.delete({
      where: { id }
    });
  }

  /**
   * Obter estatísticas do passageiro
   * Retorna: total de corridas, avaliação média recebida, gastos totais
   */
  async getEstatisticas(passageiroId) {
    // Validar se é passageiro
    const passageiro = await prisma.usuario.findUnique({
      where: { 
        id: passageiroId,
        tipo: 'PASSAGEIRO'
      }
    });

    if (!passageiro) {
      throw new Error('Passageiro não encontrado');
    }

    // 1. Total de corridas realizadas
    const totalCorridas = await prisma.corrida.count({
      where: {
        passageiroId,
        status: 'FINALIZADA'
      }
    });

    // 2. Corridas em andamento
    const corridasEmAndamento = await prisma.corrida.count({
      where: {
        passageiroId,
        status: 'EM_ANDAMENTO'
      }
    });

    // 3. Corridas canceladas
    const corridasCanceladas = await prisma.corrida.count({
      where: {
        passageiroId,
        status: 'CANCELADA'
      }
    });

    // 4. Avaliação média recebida (de motoristas)
    const avaliacoesRecebidas = await prisma.avaliacao.findMany({
      where: {
        usuarioParaId: passageiroId,
        deletadoEm: null
      },
      select: {
        nota: true
      }
    });

    const avaliacaoMedia = avaliacoesRecebidas.length > 0
      ? avaliacoesRecebidas.reduce((sum, av) => sum + av.nota, 0) / avaliacoesRecebidas.length
      : 0;

    // 5. Total de avaliações recebidas
    const totalAvaliacoes = avaliacoesRecebidas.length;

    // 6. Gastos totais (corridas finalizadas com pagamento)
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        corrida: {
          passageiroId,
          status: 'FINALIZADA'
        },
        status: 'PAGO'
      },
      select: {
        valor: true
      }
    });

    const gastoTotal = pagamentos.reduce((sum, pag) => sum + pag.valor, 0);

    // 7. Gasto médio por corrida
    const gastoMedio = totalCorridas > 0 ? gastoTotal / totalCorridas : 0;

    // 8. Última corrida
    const ultimaCorrida = await prisma.corrida.findFirst({
      where: {
        passageiroId,
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
        criadoEm: true
      }
    });

    // 9. Método de pagamento mais usado
    const metodoPagamentoMaisUsado = await prisma.corrida.groupBy({
      by: ['formaPagamento'],
      where: {
        passageiroId,
        status: 'FINALIZADA'
      },
      _count: {
        formaPagamento: true
      },
      orderBy: {
        _count: {
          formaPagamento: 'desc'
        }
      },
      take: 1
    });

    // 10. Estatísticas por período (últimos 30 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const corridasUltimos30Dias = await prisma.corrida.count({
      where: {
        passageiroId,
        status: 'FINALIZADA',
        criadoEm: {
          gte: dataLimite
        }
      }
    });

    const gastosUltimos30Dias = await prisma.pagamento.aggregate({
      where: {
        corrida: {
          passageiroId,
          status: 'FINALIZADA',
          criadoEm: {
            gte: dataLimite
          }
        },
        status: 'PAGO'
      },
      _sum: {
        valor: true
      }
    });

    return {
      corridas: {
        total: totalCorridas,
        finalizadas: totalCorridas,
        emAndamento: corridasEmAndamento,
        canceladas: corridasCanceladas
      },
      avaliacoes: {
        media: Number(avaliacaoMedia.toFixed(1)),
        total: totalAvaliacoes,
        estrelas: avaliacaoMedia >= 4.5 ? 5 : avaliacaoMedia >= 3.5 ? 4 : avaliacaoMedia >= 2.5 ? 3 : avaliacaoMedia >= 1.5 ? 2 : 1
      },
      financeiro: {
        gastoTotal: Number(gastoTotal.toFixed(2)),
        gastoMedio: Number(gastoMedio.toFixed(2)),
        metodoPagamentoMaisUsado: metodoPagamentoMaisUsado[0]?.formaPagamento || null
      },
      ultimos30Dias: {
        corridas: corridasUltimos30Dias,
        gastos: Number((gastosUltimos30Dias._sum.valor || 0).toFixed(2))
      },
      ultimaCorrida: ultimaCorrida ? {
        id: ultimaCorrida.id,
        origem: ultimaCorrida.origem,
        destino: ultimaCorrida.destino,
        valor: ultimaCorrida.valorFinal || 0,
        data: ultimaCorrida.criadoEm
      } : null
    };
  }
}

module.exports = new PassageiroService();
