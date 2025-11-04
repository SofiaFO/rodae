const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-secreto-aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  async login(email, senha) {
    // Buscar usuário por email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        passageiro: true,
        motorista: true
      }
    });

    if (!usuario) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar se o usuário está ativo
    if (usuario.status === 'INATIVO') {
      throw new Error('Usuário inativo. Entre em contato com o suporte.');
    }

    if (usuario.tipo === 'MOTORISTA' && usuario.status === 'PENDENTE') {
      throw new Error('Sua conta está em análise. Aguarde a aprovação.');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remover senha do retorno
    const { senha: _, ...usuarioSemSenha } = usuario;

    return {
      token,
      usuario: usuarioSemSenha
    };
  }

  async register(data) {
    const { tipo, ...userData } = data;

    if (!tipo || !['PASSAGEIRO', 'MOTORISTA'].includes(tipo)) {
      throw new Error('Tipo de usuário inválido');
    }

    if (tipo === 'PASSAGEIRO') {
      // Usar o serviço de passageiro
      const passageiroService = require('./passageiro.service');
      const passageiro = await passageiroService.createPassageiro(userData);
      
      // Fazer login automático
      return this.login(userData.email, userData.senha);
    } else if (tipo === 'MOTORISTA') {
      // Usar o serviço de motorista
      const motoristaService = require('./motorista.service');
      const motorista = await motoristaService.createMotorista(userData);
      
      // Retornar sem fazer login (motorista precisa ser aprovado)
      return {
        message: 'Motorista cadastrado com sucesso. Sua conta está em análise.',
        usuario: {
          id: motorista.usuario.id,
          nome: motorista.usuario.nome,
          email: motorista.usuario.email,
          tipo: motorista.usuario.tipo,
          status: motorista.usuario.status
        }
      };
    }
  }

  async getUserById(id) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        passageiro: true,
        motorista: true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tipo: true,
        status: true,
        criadoEm: true,
        passageiro: true,
        motorista: {
          select: {
            cnh: true,
            validadeCNH: true,
            placaVeiculo: true,
            modeloCorVeiculo: true
          }
        }
      }
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return usuario;
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }
}

module.exports = new AuthService();
