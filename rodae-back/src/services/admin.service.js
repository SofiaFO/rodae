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
}

module.exports = new AdminService();
