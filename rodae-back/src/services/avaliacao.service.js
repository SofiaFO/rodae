const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AvaliacaoService {
  // [RFS17] Cadastrar Avaliação
  async criarAvaliacao(data, usuarioId) {
    const { corridaId, nota, comentario, usuarioParaId } = data;

    // Validar nota (1 a 5)
    if (nota < 1 || nota > 5) {
      throw new Error('A nota deve estar entre 1 e 5');
    }

    // Validar comentário (máximo 200 caracteres)
    if (comentario && comentario.length > 200) {
      throw new Error('O comentário deve ter no máximo 200 caracteres');
    }

    // Verificar se a corrida existe e está finalizada
    const corrida = await prisma.corrida.findUnique({
      where: { id: corridaId },
      include: {
        passageiro: true,
        motorista: true
      }
    });

    if (!corrida) {
      throw new Error('Corrida não encontrada');
    }

    if (corrida.status !== 'FINALIZADA') {
      throw new Error('Só é possível avaliar corridas finalizadas');
    }

    // Verificar se o usuário participou da corrida
    const participou = corrida.passageiroId === usuarioId || corrida.motoristaId === usuarioId;
    if (!participou) {
      throw new Error('Você não participou desta corrida');
    }

    // Verificar se o usuário está avaliando a pessoa correta
    if (corrida.passageiroId === usuarioId && usuarioParaId !== corrida.motoristaId) {
      throw new Error('Passageiro só pode avaliar o motorista da corrida');
    }

    if (corrida.motoristaId === usuarioId && usuarioParaId !== corrida.passageiroId) {
      throw new Error('Motorista só pode avaliar o passageiro da corrida');
    }

    // Verificar se já existe avaliação para esta corrida pelo usuário
    const avaliacaoExistente = await prisma.avaliacao.findFirst({
      where: {
        corridaId,
        usuarioDeId: usuarioId
      }
    });

    if (avaliacaoExistente) {
      throw new Error('Você já avaliou esta corrida');
    }

    // Criar avaliação
    const avaliacao = await prisma.avaliacao.create({
      data: {
        corridaId,
        nota,
        comentario: comentario || null,
        usuarioDeId: usuarioId,
        usuarioParaId
      },
      include: {
        corrida: true,
        usuarioDe: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true
          }
        },
        usuarioPara: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true
          }
        }
      }
    });

    return avaliacao;
  }

  // [RFS18] Consultar Avaliações
  async consultarAvaliacoes(filtros, usuarioId, userTipo) {
    const { usuarioAvaliadoId, notaMinima, notaMaxima, dataInicio, dataFim } = filtros;

    const where = {
      deletadoEm: null // Não retornar avaliações deletadas
    };

    // Se não for admin, só pode ver suas próprias avaliações recebidas
    if (userTipo !== 'ADMIN') {
      where.usuarioParaId = usuarioId;
    } else if (usuarioAvaliadoId) {
      // Admin pode filtrar por usuário específico
      where.usuarioParaId = parseInt(usuarioAvaliadoId);
    }

    // Filtro de nota
    if (notaMinima !== undefined || notaMaxima !== undefined) {
      where.nota = {};
      if (notaMinima) where.nota.gte = parseInt(notaMinima);
      if (notaMaxima) where.nota.lte = parseInt(notaMaxima);
    }

    // Filtro de período
    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio);
      if (dataFim) where.criadoEm.lte = new Date(dataFim);
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where,
      include: {
        corrida: {
          select: {
            id: true,
            origem: true,
            destino: true,
            status: true
          }
        },
        usuarioDe: {
          select: {
            id: true,
            nome: true,
            tipo: true
          }
        },
        usuarioPara: {
          select: {
            id: true,
            nome: true,
            tipo: true
          }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    return avaliacoes;
  }

  // [RFS19] Editar Avaliação
  async editarAvaliacao(avaliacaoId, data, usuarioId) {
    const { nota, comentario } = data;

    // Validar nota
    if (nota && (nota < 1 || nota > 5)) {
      throw new Error('A nota deve estar entre 1 e 5');
    }

    // Validar comentário
    if (comentario && comentario.length > 200) {
      throw new Error('O comentário deve ter no máximo 200 caracteres');
    }

    // Buscar avaliação
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId }
    });

    if (!avaliacao) {
      throw new Error('Avaliação não encontrada');
    }

    // Verificar se é o dono da avaliação
    if (avaliacao.usuarioDeId !== usuarioId) {
      throw new Error('Você não pode editar esta avaliação');
    }

    // Verificar se foi deletada
    if (avaliacao.deletadoEm) {
      throw new Error('Não é possível editar uma avaliação excluída');
    }

    // Verificar prazo de 24h
    const horasDesdeAvaliacao = (Date.now() - avaliacao.criadoEm.getTime()) / (1000 * 60 * 60);
    if (horasDesdeAvaliacao > 24) {
      throw new Error('O prazo de 24h para editar a avaliação expirou');
    }

    // Criar histórico de edição
    await prisma.avaliacaoHistorico.create({
      data: {
        avaliacaoId,
        notaAnterior: avaliacao.nota,
        comentarioAnterior: avaliacao.comentario,
        notaNova: nota || avaliacao.nota,
        comentarioNovo: comentario !== undefined ? comentario : avaliacao.comentario
      }
    });

    // Atualizar avaliação
    const avaliacaoAtualizada = await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data: {
        nota: nota || avaliacao.nota,
        comentario: comentario !== undefined ? comentario : avaliacao.comentario
      },
      include: {
        corrida: true,
        usuarioDe: {
          select: {
            id: true,
            nome: true,
            tipo: true
          }
        },
        usuarioPara: {
          select: {
            id: true,
            nome: true,
            tipo: true
          }
        },
        historicoEdicoes: true
      }
    });

    return avaliacaoAtualizada;
  }

  // [RFS20] Excluir Avaliação (Soft Delete - apenas Admin)
  async excluirAvaliacao(avaliacaoId, justificativa, adminId) {
    if (!justificativa || justificativa.trim() === '') {
      throw new Error('Justificativa é obrigatória para excluir avaliação');
    }

    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: {
        usuarioDe: true,
        usuarioPara: true
      }
    });

    if (!avaliacao) {
      throw new Error('Avaliação não encontrada');
    }

    if (avaliacao.deletadoEm) {
      throw new Error('Esta avaliação já foi excluída');
    }

    // Soft delete
    const avaliacaoExcluida = await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data: {
        deletadoEm: new Date(),
        justificativaExclusao: justificativa
      }
    });

    // TODO: Criar notificação para o usuário informando a exclusão
    // TODO: Registrar no log administrativo

    return avaliacaoExcluida;
  }

  // Consultar histórico de edições
  async consultarHistorico(avaliacaoId, usuarioId, userTipo) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId }
    });

    if (!avaliacao) {
      throw new Error('Avaliação não encontrada');
    }

    // Verificar permissão
    if (userTipo !== 'ADMIN' && avaliacao.usuarioDeId !== usuarioId) {
      throw new Error('Você não tem permissão para ver o histórico desta avaliação');
    }

    const historico = await prisma.avaliacaoHistorico.findMany({
      where: { avaliacaoId },
      orderBy: { editadoEm: 'desc' }
    });

    return historico;
  }

  // Calcular média de avaliações de um usuário
  async calcularMediaAvaliacoes(usuarioId) {
    const result = await prisma.avaliacao.aggregate({
      where: {
        usuarioParaId: usuarioId,
        deletadoEm: null // Não considerar avaliações deletadas
      },
      _avg: {
        nota: true
      },
      _count: {
        id: true
      }
    });

    return {
      media: result._avg.nota || 0,
      totalAvaliacoes: result._count.id
    };
  }
}

module.exports = new AvaliacaoService();
