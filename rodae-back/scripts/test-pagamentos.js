/**
 * Script de teste para sistema de pagamentos [RFC04]
 * Testa RFS13, RFS14, RFS15 e RFS16
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

let tokenPassageiro, tokenMotorista, tokenAdmin;
let passageiroId, motoristaId;
let corridaId, pagamentoId, repasseId;

async function login(email, senha) {
  const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
  return response.data.data;
}

async function testarSistemaPagamentos() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE: Sistema de Pagamentos [RFC04]');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. LOGIN
    console.log('1️⃣  Fazendo login...');
    const passageiro = await login('ana.silva@email.com', '123456');
    tokenPassageiro = passageiro.token;
    passageiroId = passageiro.usuario.id;
    console.log(`✅ Passageiro logado: ${passageiro.usuario.nome}`);

    const motorista = await login('joao@gmail.com', 'senha');
    tokenMotorista = motorista.token;
    motoristaId = motorista.usuario.id;
    console.log(`✅ Motorista logado: ${motorista.usuario.nome}`);

    const admin = await login('admin@rodae.com', 'admin123');
    tokenAdmin = admin.token;
    console.log(`✅ Admin logado: ${admin.usuario.nome}\n`);

    // 2. SOLICITAR CORRIDA
    console.log('2️⃣  Solicitando corrida com rota real...');
    const corridaResponse = await axios.post(
      `${API_URL}/corridas/com-rota`,
      {
        origem: 'Avenida Paulista, 1000, São Paulo',
        destino: 'Praça da Sé, São Paulo',
        formaPagamento: 'PIX',
        opcaoCorrida: 'PADRAO'
      },
      {
        headers: { Authorization: `Bearer ${tokenPassageiro}` }
      }
    );
    corridaId = corridaResponse.data.data.corrida.id;
    const valorEstimado = corridaResponse.data.data.corrida.valorEstimado;
    console.log(`✅ Corrida #${corridaId} criada`);
    console.log(`   Valor estimado: R$ ${valorEstimado.toFixed(2)}\n`);

    // 3. MOTORISTA ACEITA
    console.log('3️⃣  Motorista aceitando corrida...');
    await axios.post(
      `${API_URL}/corridas/${corridaId}/aceitar`,
      {},
      {
        headers: { Authorization: `Bearer ${tokenMotorista}` }
      }
    );
    console.log(`✅ Corrida aceita pelo motorista\n`);

    // 4. MOTORISTA FINALIZA (REGISTRA PAGAMENTO AUTOMATICAMENTE)
    console.log('4️⃣  Motorista finalizando corrida...');
    const finalizarResponse = await axios.post(
      `${API_URL}/corridas/${corridaId}/finalizar`,
      { valorFinal: valorEstimado },
      {
        headers: { Authorization: `Bearer ${tokenMotorista}` }
      }
    );
    
    pagamentoId = finalizarResponse.data.data.pagamento.id;
    const pagamento = finalizarResponse.data.data.pagamento;
    
    console.log(`✅ Corrida finalizada`);
    console.log(`   Pagamento ID: ${pagamentoId}`);
    console.log(`   Status: ${pagamento.status}`);
    console.log(`   Transação: ${pagamento.transacaoId}`);
    console.log(`   Valor total: R$ ${pagamento.valorTotal.toFixed(2)}`);
    console.log(`   Motorista recebe: R$ ${pagamento.valorMotorista.toFixed(2)} (80%)`);
    console.log(`   Plataforma recebe: R$ ${pagamento.valorPlataforma.toFixed(2)} (20%)`);
    console.log(`   Status repasse: ${pagamento.statusRepasse}\n`);

    // 5. [RFS14] CONSULTAR TRANSAÇÕES - PASSAGEIRO
    console.log('5️⃣  [RFS14] Consultando transações como passageiro...');
    const transacoesPassageiro = await axios.get(
      `${API_URL}/pagamentos`,
      {
        headers: { Authorization: `Bearer ${tokenPassageiro}` }
      }
    );
    console.log(`✅ ${transacoesPassageiro.data.total} transações encontradas`);
    if (transacoesPassageiro.data.data.length > 0) {
      const ultima = transacoesPassageiro.data.data[0];
      console.log(`   Última transação: R$ ${ultima.valor.toFixed(2)} - ${ultima.status}\n`);
    }

    // 6. [RFS14] CONSULTAR TRANSAÇÕES - MOTORISTA (VÊ REPASSES)
    console.log('6️⃣  [RFS14] Consultando transações como motorista...');
    const transacoesMotorista = await axios.get(
      `${API_URL}/pagamentos?status=PAGO`,
      {
        headers: { Authorization: `Bearer ${tokenMotorista}` }
      }
    );
    console.log(`✅ ${transacoesMotorista.data.total} transações encontradas`);
    if (transacoesMotorista.data.data.length > 0) {
      const ultima = transacoesMotorista.data.data[0];
      console.log(`   Última transação:`);
      console.log(`   - Valor total: R$ ${ultima.valor.toFixed(2)}`);
      console.log(`   - Repasse motorista: R$ ${ultima.valorRepasse.toFixed(2)}`);
      console.log(`   - Status repasse: ${ultima.statusRepasse}\n`);
    }

    // 7. BUSCAR PAGAMENTO POR ID
    console.log('7️⃣  Buscando detalhes do pagamento...');
    const pagamentoDetalhes = await axios.get(
      `${API_URL}/pagamentos/${pagamentoId}`,
      {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      }
    );
    console.log(`✅ Pagamento encontrado`);
    console.log(`   Corrida: #${pagamentoDetalhes.data.data.corridaId}`);
    console.log(`   Passageiro: ${pagamentoDetalhes.data.data.corrida.passageiro.nome}`);
    console.log(`   Motorista: ${pagamentoDetalhes.data.data.corrida.motorista.nome}`);
    console.log(`   Repasses: ${pagamentoDetalhes.data.data.repasses.length}\n`);

    // 8. [RFS16] CONSULTAR REPASSES - ADMIN
    console.log('8️⃣  [RFS16] Consultando repasses como admin...');
    const repassesResponse = await axios.get(
      `${API_URL}/pagamentos/repasses`,
      {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      }
    );
    console.log(`✅ Repasses consultados`);
    console.log(`   Total: ${repassesResponse.data.stats.total}`);
    console.log(`   Pendentes: ${repassesResponse.data.stats.pendentes}`);
    console.log(`   Processando: ${repassesResponse.data.stats.processando}`);
    console.log(`   Concluídos: ${repassesResponse.data.stats.concluidos}`);
    console.log(`   Falhos: ${repassesResponse.data.stats.falhos}`);
    console.log(`   Valor total motoristas: R$ ${repassesResponse.data.stats.valorTotalMotoristas.toFixed(2)}`);
    console.log(`   Valor total plataforma: R$ ${repassesResponse.data.stats.valorTotalPlataforma.toFixed(2)}\n`);

    // 9. TESTAR REPROCESSAMENTO (se houver falho)
    const repasseFalho = repassesResponse.data.data.find(r => r.status === 'FALHOU');
    if (repasseFalho) {
      console.log('9️⃣  Reprocessando repasse que falhou...');
      const reprocessarResponse = await axios.post(
        `${API_URL}/pagamentos/repasses/${repasseFalho.id}/reprocessar`,
        {},
        {
          headers: { Authorization: `Bearer ${tokenAdmin}` }
        }
      );
      console.log(`✅ Repasse reprocessado: ${reprocessarResponse.data.data.status}\n`);
    } else {
      console.log('9️⃣  Sem repasses falhos para reprocessar\n');
    }

    // 10. [RFS15] REEMBOLSAR PAGAMENTO - ADMIN
    console.log('🔟 [RFS15] Testando reembolso...');
    
    // Criar outra corrida para reembolsar
    const corridaReembolso = await axios.post(
      `${API_URL}/corridas/com-rota`,
      {
        origem: 'Rua Augusta, São Paulo',
        destino: 'Av Faria Lima, São Paulo',
        formaPagamento: 'CARTAO_CREDITO',
        opcaoCorrida: 'PREMIUM'
      },
      {
        headers: { Authorization: `Bearer ${tokenPassageiro}` }
      }
    );
    
    const corridaReembolsoId = corridaReembolso.data.data.corrida.id;
    console.log(`   Corrida #${corridaReembolsoId} criada para teste de reembolso`);
    
    // Motorista aceita
    await axios.post(
      `${API_URL}/corridas/${corridaReembolsoId}/aceitar`,
      {},
      { headers: { Authorization: `Bearer ${tokenMotorista}` } }
    );
    
    // Motorista finaliza
    const finalizarReembolso = await axios.post(
      `${API_URL}/corridas/${corridaReembolsoId}/finalizar`,
      {},
      { headers: { Authorization: `Bearer ${tokenMotorista}` } }
    );
    
    const pagamentoReembolsoId = finalizarReembolso.data.data.pagamento.id;
    console.log(`   Pagamento #${pagamentoReembolsoId} registrado`);
    
    // Admin reembolsa
    const reembolsoResponse = await axios.post(
      `${API_URL}/pagamentos/${pagamentoReembolsoId}/reembolsar`,
      {
        justificativa: 'Teste de reembolso - cancelamento por erro do sistema'
      },
      {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      }
    );
    
    console.log(`✅ Reembolso ${reembolsoResponse.data.data.tipo.toLowerCase()} realizado`);
    console.log(`   Valor reembolsado: R$ ${reembolsoResponse.data.data.valorReembolsado.toFixed(2)}`);
    console.log(`   Status: ${reembolsoResponse.data.data.pagamento.status}`);
    console.log(`   Justificativa: ${reembolsoResponse.data.data.justificativa}\n`);

    // 11. RESUMO FINAL
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📊 Resumo:');
    console.log(`   - ${transacoesPassageiro.data.total} transações de passageiros`);
    console.log(`   - ${transacoesMotorista.data.total} transações de motoristas`);
    console.log(`   - ${repassesResponse.data.stats.total} repasses processados`);
    console.log(`   - R$ ${repassesResponse.data.stats.valorTotalMotoristas.toFixed(2)} repassados aos motoristas`);
    console.log(`   - R$ ${repassesResponse.data.stats.valorTotalPlataforma.toFixed(2)} de taxa da plataforma\n`);

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('   Mensagem:', error.response.data.message);
    }
    process.exit(1);
  }
}

// Executar
console.log('\n🚀 Iniciando testes do sistema de pagamentos...\n');
testarSistemaPagamentos();
