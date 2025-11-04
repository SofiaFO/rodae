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
}

module.exports = new PassageiroService();
