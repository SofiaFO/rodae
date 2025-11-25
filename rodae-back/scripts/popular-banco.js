/**
 * Script para popular o banco de dados com dados de teste
 * Cria usuários, corridas, pagamentos, avaliações e repasses
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Dados de exemplo
const passageiros = [
  { nome: 'Ana Silva', email: 'ana.silva@email.com', senha: '123456', telefone: '(11) 98765-4321' },
  { nome: 'Carlos Oliveira', email: 'carlos.oliveira@email.com', senha: '123456', telefone: '(11) 98765-4322' },
  { nome: 'Maria Santos', email: 'maria.santos@email.com', senha: '123456', telefone: '(11) 98765-4323' },
  { nome: 'Pedro Costa', email: 'pedro.costa@email.com', senha: '123456', telefone: '(11) 98765-4324' },
  { nome: 'Julia Almeida', email: 'julia.almeida@email.com', senha: '123456', telefone: '(11) 98765-4325' },
];

const motoristas = [
  { 
    nome: 'João Motorista', 
    email: 'joao@gmail.com', 
    senha: 'senha', 
    telefone: '(11) 91234-5678',
    cnh: '12345678900',
    placaVeiculo: 'ABC-1234',
    modeloCorVeiculo: 'Honda Civic Prata'
  },
  { 
    nome: 'Roberto Silva', 
    email: 'roberto.silva@email.com', 
    senha: '123456', 
    telefone: '(11) 91234-5679',
    cnh: '12345678901',
    placaVeiculo: 'DEF-5678',
    modeloCorVeiculo: 'Toyota Corolla Preto'
  },
  { 
    nome: 'Fernanda Lima', 
    email: 'fernanda.lima@email.com', 
    senha: '123456', 
    telefone: '(11) 91234-5680',
    cnh: '12345678902',
    placaVeiculo: 'GHI-9012',
    modeloCorVeiculo: 'Chevrolet Onix Branco'
  },
  { 
    nome: 'Marcos Pereira', 
    email: 'marcos.pereira@email.com', 
    senha: '123456', 
    telefone: '(11) 91234-5681',
    cnh: '12345678903',
    placaVeiculo: 'JKL-3456',
    modeloCorVeiculo: 'Hyundai HB20 Vermelho'
  },
  { 
    nome: 'Patricia Rocha', 
    email: 'patricia.rocha@email.com', 
    senha: '123456', 
    telefone: '(11) 91234-5682',
    cnh: '12345678904',
    placaVeiculo: 'MNO-7890',
    modeloCorVeiculo: 'Volkswagen Gol Azul'
  },
];

const rotas = [
  { origem: 'Avenida Paulista, 1000, São Paulo', destino: 'Praça da Sé, São Paulo', distancia: 3.2, duracao: 15 },
  { origem: 'Shopping Eldorado, São Paulo', destino: 'Av Faria Lima, 2000, São Paulo', distancia: 5.8, duracao: 22 },
  { origem: 'Parque Ibirapuera, São Paulo', destino: 'Aeroporto Congonhas, São Paulo', distancia: 8.5, duracao: 28 },
  { origem: 'Estação da Luz, São Paulo', destino: 'Vila Madalena, São Paulo', distancia: 6.2, duracao: 25 },
  { origem: 'Morumbi Shopping, São Paulo', destino: 'Shopping Iguatemi, São Paulo', distancia: 7.1, duracao: 30 },
  { origem: 'Rua Augusta, 500, São Paulo', destino: 'Av Rebouças, 1000, São Paulo', distancia: 4.5, duracao: 18 },
  { origem: 'Berrini, São Paulo', destino: 'Pinheiros, São Paulo', distancia: 5.0, duracao: 20 },
  { origem: 'Brooklin, São Paulo', destino: 'Moema, São Paulo', distancia: 3.8, duracao: 16 },
  { origem: 'Tatuapé, São Paulo', destino: 'Centro, São Paulo', distancia: 9.2, duracao: 35 },
  { origem: 'Santana, São Paulo', destino: 'Lapa, São Paulo', distancia: 10.5, duracao: 40 },
];

const formasPagamento = ['PIX', 'CARTAO_CREDITO', 'CARTEIRA_DIGITAL'];
const tiposCorrida = ['PADRAO', 'PREMIUM', 'COMPARTILHADA'];
const statusCorrida = ['FINALIZADA', 'CANCELADA'];

// Funções auxiliares
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysAgo) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

function calcularValor(distancia, tipo) {
  const TARIFA_BASE = 3.00;
  const TARIFAS = {
    PADRAO: 1.80,
    PREMIUM: 2.80,
    COMPARTILHADA: 1.20
  };
  return TARIFA_BASE + (distancia * TARIFAS[tipo]);
}

async function criarUsuarios() {
  console.log('👥 Criando usuários...');
  
  // Admin (verificar se já existe)
  const adminExistente = await prisma.usuario.findUnique({
    where: { email: 'admin@rodae.com' }
  });
  
  if (!adminExistente) {
    const hashAdmin = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@rodae.com',
        senha: hashAdmin,
        telefone: '(11) 99999-9999',
        tipo: 'ADMIN',
        status: 'ATIVO'
      }
    });
    console.log('   ✓ Admin criado');
  } else {
    console.log('   ✓ Admin já existe');
  }
  
  // Passageiros
  let passageirosCriados = 0;
  for (const p of passageiros) {
    const existe = await prisma.usuario.findUnique({
      where: { email: p.email }
    });
    
    if (!existe) {
      const hash = await bcrypt.hash(p.senha, 10);
      const usuario = await prisma.usuario.create({
        data: {
          nome: p.nome,
          email: p.email,
          senha: hash,
          telefone: p.telefone,
          tipo: 'PASSAGEIRO',
          status: 'ATIVO'
        }
      });
      
      await prisma.passageiro.create({
        data: {
          id: usuario.id
        }
      });
      passageirosCriados++;
    }
  }
  console.log(`   ✓ ${passageirosCriados} passageiros criados (${passageiros.length - passageirosCriados} já existiam)`);
  
  // Motoristas
  let motoristasCriados = 0;
  for (const m of motoristas) {
    const existe = await prisma.usuario.findUnique({
      where: { email: m.email }
    });
    
    if (!existe) {
      const hash = await bcrypt.hash(m.senha, 10);
      const usuario = await prisma.usuario.create({
        data: {
          nome: m.nome,
          email: m.email,
          senha: hash,
          telefone: m.telefone,
          tipo: 'MOTORISTA',
          status: 'ATIVO'
        }
      });
      
      // Calcular data de validade da CNH (2 anos a partir de hoje)
      const validadeCNH = new Date();
      validadeCNH.setFullYear(validadeCNH.getFullYear() + 2);
      
      await prisma.motorista.create({
        data: {
          id: usuario.id,
          cnh: m.cnh,
          validadeCNH,
          docVeiculo: `DOC${m.cnh}`,
          placaVeiculo: m.placaVeiculo,
          modeloCorVeiculo: m.modeloCorVeiculo
        }
      });
      motoristasCriados++;
    }
  }
  console.log(`   ✓ ${motoristasCriados} motoristas criados (${motoristas.length - motoristasCriados} já existiam)\n`);
}

async function criarCorridas() {
  console.log('🚗 Criando corridas...');
  
  const passageirosDB = await prisma.passageiro.findMany({ 
    include: { usuario: true }
  });
  const motoristasDB = await prisma.motorista.findMany({ 
    include: { usuario: true }
  });
  
  if (passageirosDB.length === 0 || motoristasDB.length === 0) {
    console.log('   ⚠️  Nenhum passageiro ou motorista encontrado. Pulando criação de corridas.\n');
    return;
  }
  
  let corridasCriadas = 0;
  let corridasFinalizadas = 0;
  let corridasCanceladas = 0;
  
  // Criar corridas dos últimos 60 dias
  for (let i = 0; i < 150; i++) {
    const passageiro = getRandomElement(passageirosDB);
    const motorista = getRandomElement(motoristasDB);
    const rota = getRandomElement(rotas);
    const tipo = getRandomElement(tiposCorrida);
    const status = Math.random() > 0.15 ? 'FINALIZADA' : 'CANCELADA'; // 85% finalizadas
    const formaPagamento = getRandomElement(formasPagamento);
    const dataCriacao = getRandomDate(60);
    
    const valorFinal = calcularValor(rota.distancia, tipo);
    
    const corrida = await prisma.corrida.create({
      data: {
        passageiroId: passageiro.usuario.id,
        motoristaId: status === 'FINALIZADA' ? motorista.usuario.id : null,
        origem: rota.origem,
        destino: rota.destino,
        valorEstimado: valorFinal,
        valorFinal: status === 'FINALIZADA' ? valorFinal : null,
        formaPagamento,
        opcaoCorrida: tipo,
        status,
        criadoEm: dataCriacao
      }
    });
    
    corridasCriadas++;
    
    if (status === 'FINALIZADA') {
      corridasFinalizadas++;
      
      // Criar pagamento
      const transacaoId = `TXN${Date.now()}${getRandomInt(1000, 9999)}`;
      
      const pagamento = await prisma.pagamento.create({
        data: {
          corridaId: corrida.id,
          valor: valorFinal,
          forma: formaPagamento,
          status: 'PAGO',
          transacaoId,
          criadoEm: dataCriacao
        }
      });
      
      // Criar repasse
      const valorMotorista = valorFinal * 0.80;
      const valorPlataforma = valorFinal * 0.20;
      
      await prisma.repasse.create({
        data: {
          pagamentoId: pagamento.id,
          motoristaId: motorista.usuario.id,
          valorTotal: valorFinal,
          valorMotorista,
          valorPlataforma,
          status: 'CONCLUIDO',
          dataRepasse: new Date(dataCriacao.getTime() + 24 * 60 * 60 * 1000), // 1 dia depois
          tentativas: 1
        }
      });
      
      // Criar avaliação (80% das corridas finalizadas)
      if (Math.random() > 0.20) {
        const nota = getRandomInt(3, 5); // Notas entre 3 e 5
        const comentarios = [
          'Ótimo motorista, muito educado!',
          'Corrida tranquila e segura.',
          'Motorista atencioso e carro limpo.',
          'Recomendo!',
          'Excelente profissional.',
          'Muito bom, pontual.',
          null,
          null
        ];
        
        await prisma.avaliacao.create({
          data: {
            corridaId: corrida.id,
            usuarioDeId: passageiro.usuario.id,
            usuarioParaId: motorista.usuario.id,
            nota,
            comentario: getRandomElement(comentarios),
            criadoEm: new Date(dataCriacao.getTime() + 2 * 60 * 60 * 1000) // 2 horas depois
          }
        });
      }
    } else {
      corridasCanceladas++;
    }
    
    // Log a cada 30 corridas
    if (corridasCriadas % 30 === 0) {
      console.log(`   ⏳ ${corridasCriadas} corridas criadas...`);
    }
  }
  
  console.log(`   ✓ ${corridasCriadas} corridas criadas`);
  console.log(`   ✓ ${corridasFinalizadas} finalizadas`);
  console.log(`   ✓ ${corridasCanceladas} canceladas\n`);
}

async function criarMetodosPagamento() {
  console.log('💳 Criando métodos de pagamento...');
  
  const passageirosDB = await prisma.passageiro.findMany();
  
  if (passageirosDB.length === 0) {
    console.log('   ⚠️  Nenhum passageiro encontrado. Pulando métodos de pagamento.\n');
    return;
  }
  
  let metodosAdicionados = 0;
  
  for (const passageiro of passageirosDB) {
    // PIX
    const pixExiste = await prisma.metodoPagamento.findFirst({
      where: { 
        passageiroId: passageiro.id,
        tipoPagamento: 'PIX'
      }
    });
    
    if (!pixExiste) {
      await prisma.metodoPagamento.create({
        data: {
          passageiroId: passageiro.id,
          tipoPagamento: 'PIX',
          status: 'ATIVO'
        }
      });
      metodosAdicionados++;
    }
    
    // Cartão de crédito
    if (Math.random() > 0.3) {
      const cartaoExiste = await prisma.metodoPagamento.findFirst({
        where: { 
          passageiroId: passageiro.id,
          tipoPagamento: 'CARTAO_CREDITO'
        }
      });
      
      if (!cartaoExiste) {
        await prisma.metodoPagamento.create({
          data: {
            passageiroId: passageiro.id,
            tipoPagamento: 'CARTAO_CREDITO',
            nomeCartao: 'USUARIO TESTE',
            numeroCartaoCriptografado: `**** **** **** ${getRandomInt(1000, 9999)}`,
            validadeCartao: '12/28',
            status: 'ATIVO'
          }
        });
        metodosAdicionados++;
      }
    }
  }
  
  console.log(`   ✓ ${metodosAdicionados} métodos de pagamento adicionados\n`);
}

async function criarEnderecosFavoritos() {
  console.log('📍 Criando endereços favoritos...');
  
  const passageirosDB = await prisma.passageiro.findMany({ 
    include: { usuario: true }
  });
  
  if (passageirosDB.length === 0) {
    console.log('   ⚠️  Nenhum passageiro encontrado. Pulando endereços favoritos.\n');
    return;
  }
  
  const enderecos = [
    { nomeLocal: 'Casa', endereco: 'Rua das Flores, 123, São Paulo', lat: -23.5505, lon: -46.6333 },
    { nomeLocal: 'Trabalho', endereco: 'Av Paulista, 1000, São Paulo', lat: -23.5610, lon: -46.6565 },
    { nomeLocal: 'Academia', endereco: 'Rua dos Esportes, 456, São Paulo', lat: -23.5489, lon: -46.6388 },
  ];
  
  let enderecosAdicionados = 0;
  
  for (const passageiro of passageirosDB) {
    const qtdEnderecos = getRandomInt(1, 3);
    for (let i = 0; i < qtdEnderecos; i++) {
      const endereco = enderecos[i];
      
      const existe = await prisma.enderecoFavorito.findFirst({
        where: {
          usuarioId: passageiro.usuario.id,
          nomeLocal: endereco.nomeLocal
        }
      });
      
      if (!existe) {
        await prisma.enderecoFavorito.create({
          data: {
            usuarioId: passageiro.usuario.id,
            nomeLocal: endereco.nomeLocal,
            endereco: endereco.endereco,
            latitude: endereco.lat,
            longitude: endereco.lon
          }
        });
        enderecosAdicionados++;
      }
    }
  }
  
  console.log(`   ✓ ${enderecosAdicionados} endereços favoritos adicionados\n`);
}

async function exibirEstatisticas() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 ESTATÍSTICAS DO BANCO');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const usuarios = await prisma.usuario.count();
  const passageiros = await prisma.passageiro.count();
  const motoristas = await prisma.motorista.count();
  const corridas = await prisma.corrida.count();
  const corridasFinalizadas = await prisma.corrida.count({ where: { status: 'FINALIZADA' } });
  const corridasCanceladas = await prisma.corrida.count({ where: { status: 'CANCELADA' } });
  const pagamentos = await prisma.pagamento.count();
  const repasses = await prisma.repasse.count();
  const avaliacoes = await prisma.avaliacao.count();
  const metodosPagamento = await prisma.metodoPagamento.count();
  const enderecosFavoritos = await prisma.enderecoFavorito.count();
  
  const valorTotal = await prisma.pagamento.aggregate({
    _sum: { valor: true }
  });
  
  const valorMotoristas = await prisma.repasse.aggregate({
    where: { status: 'CONCLUIDO' },
    _sum: { valorMotorista: true }
  });
  
  const valorPlataforma = await prisma.repasse.aggregate({
    where: { status: 'CONCLUIDO' },
    _sum: { valorPlataforma: true }
  });
  
  console.log(`👥 Usuários: ${usuarios}`);
  console.log(`   - Passageiros: ${passageiros}`);
  console.log(`   - Motoristas: ${motoristas}`);
  console.log(`   - Admins: 1\n`);
  
  console.log(`🚗 Corridas: ${corridas}`);
  console.log(`   - Finalizadas: ${corridasFinalizadas}`);
  console.log(`   - Canceladas: ${corridasCanceladas}\n`);
  
  console.log(`💰 Financeiro:`);
  console.log(`   - Pagamentos: ${pagamentos}`);
  console.log(`   - Repasses: ${repasses}`);
  console.log(`   - Valor total: R$ ${(valorTotal._sum.valor || 0).toFixed(2)}`);
  console.log(`   - Pago aos motoristas: R$ ${(valorMotoristas._sum.valorMotorista || 0).toFixed(2)}`);
  console.log(`   - Receita plataforma: R$ ${(valorPlataforma._sum.valorPlataforma || 0).toFixed(2)}\n`);
  
  console.log(`⭐ Avaliações: ${avaliacoes}\n`);
  console.log(`💳 Métodos de pagamento: ${metodosPagamento}\n`);
  console.log(`📍 Endereços favoritos: ${enderecosFavoritos}\n`);
}

async function main() {
  console.log('\n🚀 Iniciando população do banco de dados...\n');
  
  try {
    // NÃO limpa o banco - apenas adiciona dados
    await criarUsuarios();
    await criarCorridas();
    await criarMetodosPagamento();
    await criarEnderecosFavoritos();
    await exibirEstatisticas();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ BANCO POPULADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📝 Credenciais de acesso:\n');
    console.log('ADMIN:');
    console.log('  Email: admin@rodae.com');
    console.log('  Senha: admin123\n');
    
    console.log('PASSAGEIROS:');
    passageiros.forEach(p => {
      console.log(`  ${p.nome}: ${p.email} / ${p.senha}`);
    });
    
    console.log('\nMOTORISTAS:');
    motoristas.forEach(m => {
      console.log(`  ${m.nome}: ${m.email} / ${m.senha}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
