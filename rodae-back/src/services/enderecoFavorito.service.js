const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EnderecoFavoritoService {
  // [RFS25] Cadastrar Endereço Favorito
  async cadastrarEndereco(usuarioId, data) {
    const { nomeLocal, endereco, latitude, longitude } = data;

    // Validações
    if (!nomeLocal || !endereco) {
      throw new Error('Nome do local e endereço são obrigatórios');
    }

    if (nomeLocal.length > 50) {
      throw new Error('Nome do local deve ter no máximo 50 caracteres');
    }

    // Verificar se já existe endereço com esse nome para o usuário
    const enderecoExistente = await prisma.enderecoFavorito.findUnique({
      where: {
        usuarioId_nomeLocal: {
          usuarioId,
          nomeLocal
        }
      }
    });

    if (enderecoExistente) {
      throw new Error(`Você já possui um endereço favorito com o nome "${nomeLocal}"`);
    }

    // Verificar limite de 10 endereços por usuário
    const totalEnderecos = await prisma.enderecoFavorito.count({
      where: { usuarioId }
    });

    if (totalEnderecos >= 10) {
      throw new Error('Você atingiu o limite máximo de 10 endereços favoritos');
    }

    // Criar endereço favorito
    const enderecoFavorito = await prisma.enderecoFavorito.create({
      data: {
        usuarioId,
        nomeLocal,
        endereco,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      }
    });

    return enderecoFavorito;
  }

  // [RFS26] Consultar Endereços Favoritos
  async consultarEnderecos(usuarioId, filtros = {}) {
    const { nome } = filtros;

    const where = {
      usuarioId
    };

    // Filtro de busca parcial por nome
    if (nome) {
      where.nomeLocal = {
        contains: nome,
        mode: 'insensitive'
      };
    }

    const enderecos = await prisma.enderecoFavorito.findMany({
      where,
      orderBy: {
        criadoEm: 'desc'
      }
    });

    return enderecos;
  }

  // Consultar um endereço específico
  async consultarEnderecoPorId(enderecoId, usuarioId) {
    const endereco = await prisma.enderecoFavorito.findUnique({
      where: { id: enderecoId }
    });

    if (!endereco) {
      throw new Error('Endereço favorito não encontrado');
    }

    // Verificar se o endereço pertence ao usuário
    if (endereco.usuarioId !== usuarioId) {
      throw new Error('Você não tem permissão para acessar este endereço');
    }

    return endereco;
  }

  // [RFS27] Editar Endereço Favorito
  async editarEndereco(enderecoId, usuarioId, data) {
    const { nomeLocal, endereco, latitude, longitude } = data;

    // Buscar endereço
    const enderecoFavorito = await prisma.enderecoFavorito.findUnique({
      where: { id: enderecoId }
    });

    if (!enderecoFavorito) {
      throw new Error('Endereço favorito não encontrado');
    }

    // Verificar se o endereço pertence ao usuário
    if (enderecoFavorito.usuarioId !== usuarioId) {
      throw new Error('Você não tem permissão para editar este endereço');
    }

    // Se está alterando o nome, verificar se já existe outro com esse nome
    if (nomeLocal && nomeLocal !== enderecoFavorito.nomeLocal) {
      if (nomeLocal.length > 50) {
        throw new Error('Nome do local deve ter no máximo 50 caracteres');
      }

      const nomeExistente = await prisma.enderecoFavorito.findUnique({
        where: {
          usuarioId_nomeLocal: {
            usuarioId,
            nomeLocal
          }
        }
      });

      if (nomeExistente) {
        throw new Error(`Você já possui um endereço favorito com o nome "${nomeLocal}"`);
      }
    }

    // Atualizar endereço
    const enderecoAtualizado = await prisma.enderecoFavorito.update({
      where: { id: enderecoId },
      data: {
        nomeLocal: nomeLocal || enderecoFavorito.nomeLocal,
        endereco: endereco || enderecoFavorito.endereco,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : enderecoFavorito.latitude,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : enderecoFavorito.longitude
      }
    });

    return enderecoAtualizado;
  }

  // [RFS28] Excluir Endereço Favorito
  async excluirEndereco(enderecoId, usuarioId) {
    // Buscar endereço
    const endereco = await prisma.enderecoFavorito.findUnique({
      where: { id: enderecoId }
    });

    if (!endereco) {
      throw new Error('Endereço favorito não encontrado');
    }

    // Verificar se o endereço pertence ao usuário
    if (endereco.usuarioId !== usuarioId) {
      throw new Error('Você não tem permissão para excluir este endereço');
    }

    // Excluir permanentemente
    await prisma.enderecoFavorito.delete({
      where: { id: enderecoId }
    });

    return { message: 'Endereço favorito excluído com sucesso' };
  }

  // Obter estatísticas de endereços do usuário
  async obterEstatisticas(usuarioId) {
    const total = await prisma.enderecoFavorito.count({
      where: { usuarioId }
    });

    return {
      totalEnderecos: total,
      limiteMaximo: 10,
      enderecosDisponiveis: 10 - total
    };
  }
}

module.exports = new EnderecoFavoritoService();
