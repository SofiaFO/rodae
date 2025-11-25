/**
 * Script de teste para estatísticas de usuários
 * Testa endpoints de estatísticas para passageiros e motoristas
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function login(email, senha) {
  const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
  return response.data.data;
}

async function testarEstatisticas() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TESTE: Estatísticas de Usuários');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. LOGIN PASSAGEIRO
    console.log('1️⃣  Fazendo login como passageiro...');
    const passageiro = await login('julia.almeida@email.com', '123456');
    const tokenPassageiro = passageiro.token;
    console.log(`✅ Passageiro logado: ${passageiro.usuario.nome}\n`);

    // 2. ESTATÍSTICAS DO PASSAGEIRO
    console.log('2️⃣  Obtendo estatísticas do passageiro...');
    const estatPassageiro = await axios.get(
      `${API_URL}/passageiros/me/estatisticas`,
      {
        headers: { Authorization: `Bearer ${tokenPassageiro}` }
      }
    );

    const estatP = estatPassageiro.data.data;
    console.log('✅ Estatísticas do Passageiro:');
    console.log('\n📈 CORRIDAS:');
    console.log(`   Total: ${estatP.corridas.total}`);
    console.log(`   Finalizadas: ${estatP.corridas.finalizadas}`);
    console.log(`   Em andamento: ${estatP.corridas.emAndamento}`);
    console.log(`   Canceladas: ${estatP.corridas.canceladas}`);

    console.log('\n⭐ AVALIAÇÕES:');
    console.log(`   Média: ${estatP.avaliacoes.media} (${estatP.avaliacoes.estrelas} estrelas)`);
    console.log(`   Total: ${estatP.avaliacoes.total}`);

    console.log('\n💰 FINANCEIRO:');
    console.log(`   Gasto total: R$ ${estatP.financeiro.gastoTotal.toFixed(2)}`);
    console.log(`   Gasto médio por corrida: R$ ${estatP.financeiro.gastoMedio.toFixed(2)}`);
    console.log(`   Método mais usado: ${estatP.financeiro.metodoPagamentoMaisUsado || 'N/A'}`);

    console.log('\n📅 ÚLTIMOS 30 DIAS:');
    console.log(`   Corridas: ${estatP.ultimos30Dias.corridas}`);
    console.log(`   Gastos: R$ ${estatP.ultimos30Dias.gastos.toFixed(2)}`);

    if (estatP.ultimaCorrida) {
      console.log('\n🚗 ÚLTIMA CORRIDA:');
      console.log(`   #${estatP.ultimaCorrida.id}`);
      console.log(`   Origem: ${estatP.ultimaCorrida.origem}`);
      console.log(`   Destino: ${estatP.ultimaCorrida.destino}`);
      console.log(`   Valor: R$ ${estatP.ultimaCorrida.valor.toFixed(2)}`);
      console.log(`   Data: ${new Date(estatP.ultimaCorrida.data).toLocaleString('pt-BR')}`);
    } else {
      console.log('\n🚗 Nenhuma corrida realizada ainda');
    }

    // 3. LOGIN MOTORISTA
    console.log('\n\n3️⃣  Fazendo login como motorista...');
    const motorista = await login('joao@gmail.com', 'senha');
    const tokenMotorista = motorista.token;
    console.log(`✅ Motorista logado: ${motorista.usuario.nome}\n`);

    // 4. ESTATÍSTICAS DO MOTORISTA
    console.log('4️⃣  Obtendo estatísticas do motorista...');
    const estatMotorista = await axios.get(
      `${API_URL}/motoristas/me/estatisticas`,
      {
        headers: { Authorization: `Bearer ${tokenMotorista}` }
      }
    );

    const estatM = estatMotorista.data.data;
    console.log('✅ Estatísticas do Motorista:');
    console.log('\n📈 CORRIDAS:');
    console.log(`   Total: ${estatM.corridas.total}`);
    console.log(`   Finalizadas: ${estatM.corridas.finalizadas}`);
    console.log(`   Em andamento: ${estatM.corridas.emAndamento}`);
    console.log(`   Canceladas: ${estatM.corridas.canceladas}`);
    console.log(`   Taxa de aceitação: ${estatM.corridas.taxaAceitacao}%`);

    console.log('\n⭐ AVALIAÇÕES:');
    console.log(`   Média: ${estatM.avaliacoes.media} (${estatM.avaliacoes.estrelas} estrelas)`);
    console.log(`   Total: ${estatM.avaliacoes.total}`);

    console.log('\n💰 FINANCEIRO:');
    console.log(`   Receita total (recebida): R$ ${estatM.financeiro.receitaTotal.toFixed(2)}`);
    console.log(`   Receita média por corrida: R$ ${estatM.financeiro.receitaMedia.toFixed(2)}`);
    console.log(`   Valor total das corridas: R$ ${estatM.financeiro.valorTotalCorridas.toFixed(2)}`);
    console.log(`   Valor a receber (pendente): R$ ${estatM.financeiro.valorAReceber.toFixed(2)}`);
    console.log(`   Repasses pendentes: ${estatM.financeiro.repassesPendentes}`);
    console.log(`   Taxa da plataforma: ${estatM.financeiro.taxaPlataforma}%`);

    console.log('\n📅 ÚLTIMOS 30 DIAS:');
    console.log(`   Corridas: ${estatM.ultimos30Dias.corridas}`);
    console.log(`   Receita: R$ ${estatM.ultimos30Dias.receita.toFixed(2)}`);

    if (estatM.ultimaCorrida) {
      console.log('\n🚗 ÚLTIMA CORRIDA:');
      console.log(`   #${estatM.ultimaCorrida.id}`);
      console.log(`   Origem: ${estatM.ultimaCorrida.origem}`);
      console.log(`   Destino: ${estatM.ultimaCorrida.destino}`);
      console.log(`   Valor: R$ ${estatM.ultimaCorrida.valor.toFixed(2)}`);
      console.log(`   Passageiro: ${estatM.ultimaCorrida.passageiro}`);
      console.log(`   Data: ${new Date(estatM.ultimaCorrida.data).toLocaleString('pt-BR')}`);
    } else {
      console.log('\n🚗 Nenhuma corrida realizada ainda');
    }

    console.log('\n📊 PERFORMANCE:');
    console.log(`   Tempo médio online: ${estatM.performance.tempoMedioOnline}`);

    // 5. COMPARAÇÃO
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 COMPARAÇÃO PASSAGEIRO vs MOTORISTA');
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n👤 PASSAGEIRO:');
    console.log(`   - ${estatP.corridas.total} corridas realizadas`);
    console.log(`   - Avaliação: ${estatP.avaliacoes.media} ⭐`);
    console.log(`   - Gasto total: R$ ${estatP.financeiro.gastoTotal.toFixed(2)}`);
    console.log(`   - Últimos 30 dias: ${estatP.ultimos30Dias.corridas} corridas`);

    console.log('\n🚕 MOTORISTA:');
    console.log(`   - ${estatM.corridas.total} corridas realizadas`);
    console.log(`   - Avaliação: ${estatM.avaliacoes.media} ⭐`);
    console.log(`   - Receita total: R$ ${estatM.financeiro.receitaTotal.toFixed(2)}`);
    console.log(`   - A receber: R$ ${estatM.financeiro.valorAReceber.toFixed(2)}`);
    console.log(`   - Últimos 30 dias: ${estatM.ultimos30Dias.corridas} corridas`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('   Mensagem:', error.response.data.message);
    }
    if (error.code) {
      console.error('   Código:', error.code);
    }
    if (error.stack && !error.response) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Executar
console.log('\n🚀 Iniciando testes de estatísticas...\n');
testarEstatisticas();
