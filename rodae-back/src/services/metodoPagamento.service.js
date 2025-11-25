const prisma = require('../config/database');
const crypto = require('crypto');

// Chave de criptografia (Em produção, usar variável de ambiente)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'rodae-encryption-key-32-chars!!'; // Deve ter 32 caracteres
const ALGORITHM = 'aes-256-cbc';

class MetodoPagamentoService {
  /**
   * Criptografa dados sensíveis (número do cartão)
   */
  encrypt(text) {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Descriptografa dados sensíveis
   */
  decrypt(text) {
    if (!text) return null;
    
    try {
      const parts = text.split(':');
      
      // Validar formato
      if (parts.length !== 2) {
        console.warn('Formato de criptografia inválido. Dados podem estar corrompidos.');
        return null;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      // Validar tamanho do IV
      if (iv.length !== 16) {
        console.warn('IV inválido. Tamanho esperado: 16 bytes.');
        return null;
      }
      
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar:', error.message);
      return null;
    }
  }

  /**
   * Valida número de cartão de crédito (Algoritmo de Luhn)
   */
  validarNumeroCartao(numero) {
    // Remove espaços e traços
    const limpo = numero.replace(/[\s-]/g, '');
    
    // Deve ter entre 13 e 19 dígitos
    if (!/^\d{13,19}$/.test(limpo)) {
      return false;
    }

    // Algoritmo de Luhn
    let soma = 0;
    let dobrar = false;

    for (let i = limpo.length - 1; i >= 0; i--) {
      let digito = parseInt(limpo.charAt(i), 10);

      if (dobrar) {
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }

      soma += digito;
      dobrar = !dobrar;
    }

    return (soma % 10) === 0;
  }

  /**
   * Valida data de validade do cartão (MM/YY)
   */
  validarValidadeCartao(validade) {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    
    if (!regex.test(validade)) {
      return { valido: false, erro: 'Formato inválido. Use MM/AA (ex: 12/25)' };
    }

    const [mes, anoAbreviado] = validade.split('/');
    // Converte ano de 2 dígitos para 4 dígitos (25 -> 2025)
    const anoCompleto = parseInt('20' + anoAbreviado);
    const dataValidade = new Date(anoCompleto, parseInt(mes));
    const hoje = new Date();

    if (dataValidade <= hoje) {
      return { valido: false, erro: 'Cartão expirado' };
    }

    return { valido: true };
  }

  /**
   * Verifica se o cartão está expirado
   */
  verificarExpiracao(validade) {
    const [mes, anoAbreviado] = validade.split('/');
    // Converte ano de 2 dígitos para 4 dígitos (25 -> 2025)
    const anoCompleto = parseInt('20' + anoAbreviado);
    const dataValidade = new Date(anoCompleto, parseInt(mes));
    const hoje = new Date();
    
    return dataValidade <= hoje;
  }

  /**
   * [RFS29] Cadastrar Forma de Pagamento
   * Permite ao passageiro cadastrar um método de pagamento
   */
  async cadastrarMetodoPagamento(passageiroId, data) {
    const { tipoPagamento, nomeCartao, numeroCartao, validadeCartao, cvv } = data;

    // Validar se o passageiro existe
    const passageiro = await prisma.passageiro.findUnique({
      where: { id: passageiroId }
    });

    if (!passageiro) {
      throw new Error('Passageiro não encontrado');
    }

    // Validar tipo de pagamento
    const tiposValidos = ['CARTAO_CREDITO', 'PIX', 'CARTEIRA_APP'];
    if (!tiposValidos.includes(tipoPagamento)) {
      throw new Error('Tipo de pagamento inválido. Opções: CARTAO_CREDITO, PIX, CARTEIRA_APP');
    }

    const dadosMetodo = {
      passageiroId,
      tipoPagamento
    };

    // Se for cartão de crédito, validar e criptografar dados
    if (tipoPagamento === 'CARTAO_CREDITO') {
      // Validações obrigatórias
      if (!nomeCartao || !numeroCartao || !validadeCartao || !cvv) {
        throw new Error('Para cartão de crédito: nomeCartao, numeroCartao, validadeCartao e cvv são obrigatórios');
      }

      // Validar nome no cartão (até 60 caracteres)
      if (nomeCartao.length > 60) {
        throw new Error('Nome no cartão deve ter no máximo 60 caracteres');
      }

      // Validar número do cartão
      if (!this.validarNumeroCartao(numeroCartao)) {
        throw new Error('Número de cartão inválido');
      }

      // Validar validade do cartão
      const validacao = this.validarValidadeCartao(validadeCartao);
      if (!validacao.valido) {
        throw new Error(validacao.erro);
      }

      // Validar CVV (3 ou 4 dígitos)
      if (!/^\d{3,4}$/.test(cvv)) {
        throw new Error('CVV inválido. Deve ter 3 ou 4 dígitos');
      }

      // CVV NÃO é armazenado (apenas validado)
      // Criptografar número do cartão
      dadosMetodo.nomeCartao = nomeCartao;
      dadosMetodo.numeroCartaoCriptografado = this.encrypt(numeroCartao);
      dadosMetodo.validadeCartao = validadeCartao;
    }

    // Criar método de pagamento
    const metodoPagamento = await prisma.metodoPagamento.create({
      data: dadosMetodo,
      include: {
        passageiro: {
          select: {
            id: true,
            usuario: {
              select: {
                nome: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Remover dados sensíveis antes de retornar
    if (metodoPagamento.numeroCartaoCriptografado) {
      const numeroCompleto = this.decrypt(metodoPagamento.numeroCartaoCriptografado);
      metodoPagamento.ultimos4Digitos = numeroCompleto.slice(-4);
      delete metodoPagamento.numeroCartaoCriptografado;
    }

    return metodoPagamento;
  }

  /**
   * [RFS30] Consultar Formas de Pagamento
   * Lista todos os métodos de pagamento do passageiro
   */
  async consultarMetodosPagamento(passageiroId) {
    const metodos = await prisma.metodoPagamento.findMany({
      where: { passageiroId },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Formatar dados para exibição segura
    return metodos.map(metodo => {
      const metodoSeguro = {
        id: metodo.id,
        tipoPagamento: metodo.tipoPagamento,
        status: metodo.status,
        criadoEm: metodo.criadoEm
      };

      if (metodo.tipoPagamento === 'CARTAO_CREDITO') {
        try {
          const numeroCompleto = this.decrypt(metodo.numeroCartaoCriptografado);
          
          if (numeroCompleto) {
            metodoSeguro.ultimos4Digitos = `**** **** **** ${numeroCompleto.slice(-4)}`;
          } else {
            metodoSeguro.ultimos4Digitos = '**** **** **** ****';
            metodoSeguro.erro = 'Dados corrompidos';
          }
          
          metodoSeguro.nomeCartao = metodo.nomeCartao;
          metodoSeguro.validadeCartao = metodo.validadeCartao;
          
          // Verificar se está expirado
          if (metodo.validadeCartao && this.verificarExpiracao(metodo.validadeCartao)) {
            metodoSeguro.status = 'EXPIRADO';
          }
        } catch (error) {
          console.error('Erro ao processar método de pagamento:', error.message);
          metodoSeguro.ultimos4Digitos = '**** **** **** ****';
          metodoSeguro.erro = 'Erro ao descriptografar';
        }
      }

      return metodoSeguro;
    });
  }

  /**
   * Consultar um método de pagamento específico
   */
  async consultarMetodoPagamentoPorId(metodoPagamentoId, passageiroId) {
    const metodo = await prisma.metodoPagamento.findUnique({
      where: { id: metodoPagamentoId }
    });

    if (!metodo) {
      throw new Error('Método de pagamento não encontrado');
    }

    // Validar propriedade
    if (metodo.passageiroId !== passageiroId) {
      throw new Error('Acesso negado. Este método de pagamento não pertence a você');
    }

    // Formatar dados
    const metodoSeguro = {
      id: metodo.id,
      tipoPagamento: metodo.tipoPagamento,
      status: metodo.status,
      criadoEm: metodo.criadoEm,
      atualizadoEm: metodo.atualizadoEm
    };

    if (metodo.tipoPagamento === 'CARTAO_CREDITO') {
      const numeroCompleto = this.decrypt(metodo.numeroCartaoCriptografado);
      metodoSeguro.ultimos4Digitos = `**** **** **** ${numeroCompleto.slice(-4)}`;
      metodoSeguro.nomeCartao = metodo.nomeCartao;
      metodoSeguro.validadeCartao = metodo.validadeCartao;
      
      // Verificar se está expirado
      if (this.verificarExpiracao(metodo.validadeCartao)) {
        metodoSeguro.status = 'EXPIRADO';
      }
    }

    return metodoSeguro;
  }

  /**
   * [RFS31] Editar Forma de Pagamento
   * Permite alterar nome no cartão e validade
   * Não permite alterar número do cartão
   */
  async editarMetodoPagamento(metodoPagamentoId, passageiroId, data) {
    const { nomeCartao, validadeCartao } = data;

    // Buscar método de pagamento
    const metodo = await prisma.metodoPagamento.findUnique({
      where: { id: metodoPagamentoId }
    });

    if (!metodo) {
      throw new Error('Método de pagamento não encontrado');
    }

    // Validar propriedade
    if (metodo.passageiroId !== passageiroId) {
      throw new Error('Acesso negado. Este método de pagamento não pertence a você');
    }

    // Não permite alteração de número do cartão
    if (data.numeroCartao) {
      throw new Error('Não é permitido alterar o número do cartão. Para trocar, exclua e cadastre novamente.');
    }

    const dadosAtualizacao = {};

    // Se for cartão de crédito, permitir alteração de nome e validade
    if (metodo.tipoPagamento === 'CARTAO_CREDITO') {
      if (nomeCartao) {
        if (nomeCartao.length > 60) {
          throw new Error('Nome no cartão deve ter no máximo 60 caracteres');
        }
        dadosAtualizacao.nomeCartao = nomeCartao;
      }

      if (validadeCartao) {
        const validacao = this.validarValidadeCartao(validadeCartao);
        if (!validacao.valido) {
          throw new Error(validacao.erro);
        }
        dadosAtualizacao.validadeCartao = validadeCartao;
        dadosAtualizacao.status = 'ATIVO'; // Reativar se estava expirado
      }
    }

    if (Object.keys(dadosAtualizacao).length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }

    // Atualizar método de pagamento
    const metodoAtualizado = await prisma.metodoPagamento.update({
      where: { id: metodoPagamentoId },
      data: dadosAtualizacao
    });

    // Retornar dados seguros
    return this.consultarMetodoPagamentoPorId(metodoPagamentoId, passageiroId);
  }

  /**
   * [RFS32] Excluir Forma de Pagamento
   * Remove o método de pagamento conforme LGPD
   */
  async excluirMetodoPagamento(metodoPagamentoId, passageiroId) {
    // Buscar método de pagamento
    const metodo = await prisma.metodoPagamento.findUnique({
      where: { id: metodoPagamentoId }
    });

    if (!metodo) {
      throw new Error('Método de pagamento não encontrado');
    }

    // Validar propriedade
    if (metodo.passageiroId !== passageiroId) {
      throw new Error('Acesso negado. Este método de pagamento não pertence a você');
    }

    // Verificar se está sendo usado em corrida em andamento
    const corridaEmAndamento = await prisma.corrida.findFirst({
      where: {
        passageiroId,
        status: 'EM_ANDAMENTO',
        // TODO: Adicionar campo metodoPagamentoId na tabela Corrida
        // metodoPagamentoId: metodoPagamentoId
      }
    });

    if (corridaEmAndamento) {
      throw new Error('Não é possível excluir este método de pagamento. Ele está sendo usado em uma corrida em andamento.');
    }

    // Excluir método de pagamento (conformidade LGPD)
    await prisma.metodoPagamento.delete({
      where: { id: metodoPagamentoId }
    });

    return {
      message: 'Método de pagamento excluído com sucesso',
      metodoPagamentoId
    };
  }

  /**
   * Marcar métodos de pagamento expirados automaticamente
   * (Pode ser executado por um CRON job)
   */
  async marcarMetodosExpirados() {
    const metodos = await prisma.metodoPagamento.findMany({
      where: {
        tipoPagamento: 'CARTAO_CREDITO',
        status: 'ATIVO'
      }
    });

    const metodosExpirados = [];

    for (const metodo of metodos) {
      if (this.verificarExpiracao(metodo.validadeCartao)) {
        await prisma.metodoPagamento.update({
          where: { id: metodo.id },
          data: { status: 'EXPIRADO' }
        });
        metodosExpirados.push(metodo.id);
      }
    }

    return {
      message: `${metodosExpirados.length} método(s) de pagamento marcado(s) como expirado(s)`,
      metodosExpirados
    };
  }
}

module.exports = new MetodoPagamentoService();
