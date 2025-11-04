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
}

module.exports = new MotoristaService();
