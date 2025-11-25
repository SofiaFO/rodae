/**
 * Script de teste para corrida com cálculo real de rota
 * Testa integração Nominatim + OSRM + Gateway de Pagamento
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Tokens de autenticação (atualize com tokens reais)
let passageiroToken = '';
let motoristaToken = '';

async function login(email, senha) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      senha
    });
    return response.data.token;
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
    throw error;
  }
}

async function solicitarCorridaComRota(token) {
  try {
    console.log('\n=== 1. SOLICITANDO CORRIDA COM ROTA REAL ===');
    
    const response = await axios.post(
      `${BASE_URL}/corridas/com-rota`,
      {
        origem: 'Avenida Paulista, 1000, São Paulo, SP',
        destino: 'Praça da Sé, São Paulo, SP',
        formaPagamento: 'CARTAO_CREDITO',
        opcaoCorrida: 'PADRAO'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Corrida solicitada com sucesso!');
    console.log('ID da Corrida:', response.data.data.corrida.id);
    console.log('\n📍 Detalhes da Rota:');
    console.log('  Origem:', response.data.data.detalhesRota.coordenadas.origem.enderecoFormatado);
    console.log('  Destino:', response.data.data.detalhesRota.coordenadas.destino.enderecoFormatado);
    console.log('  Distância:', response.data.data.detalhesRota.distancia, 'km');
    console.log('  Duração:', response.data.data.detalhesRota.duracao);
    
    console.log('\n💰 Detalhes do Valor:');
    console.log('  Tarifa Base:', `R$ ${response.data.data.detalhesValor.tarifaBase.toFixed(2)}`);
    console.log('  Valor por KM:', `R$ ${response.data.data.detalhesValor.valorPorKm.toFixed(2)}`);
    console.log('  Valor por Tempo:', `R$ ${response.data.data.detalhesValor.valorPorTempo.toFixed(2)}`);
    console.log('  TOTAL:', `R$ ${response.data.data.detalhesValor.valorTotal.toFixed(2)}`);

    return response.data.data.corrida;
  } catch (error) {
    console.error('❌ Erro ao solicitar corrida:', error.response?.data || error.message);
    throw error;
  }
}

async function motoristaAceitarCorrida(token, corridaId) {
  try {
    console.log('\n=== 2. MOTORISTA ACEITANDO CORRIDA ===');
    
    const response = await axios.post(
      `${BASE_URL}/corridas/${corridaId}/aceitar`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Corrida aceita pelo motorista!');
    console.log('Motorista:', response.data.data.motorista.nome);
    console.log('Veículo:', response.data.data.motorista.motorista.modeloCorVeiculo);
    console.log('Placa:', response.data.data.motorista.motorista.placaVeiculo);

    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao aceitar corrida:', error.response?.data || error.message);
    throw error;
  }
}

async function motoristaFinalizarCorrida(token, corridaId, valorFinal = null) {
  try {
    console.log('\n=== 3. FINALIZANDO CORRIDA COM PAGAMENTO ===');
    
    const dados = valorFinal ? { valorFinal } : {};
    
    const response = await axios.post(
      `${BASE_URL}/corridas/${corridaId}/finalizar`,
      dados,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Corrida finalizada e pagamento processado!');
    console.log('\n💳 Detalhes do Pagamento:');
    console.log('  ID Transação:', response.data.data.pagamento.transacaoId);
    console.log('  Valor Total:', `R$ ${response.data.data.pagamento.valorTotal.toFixed(2)}`);
    console.log('  Valor Motorista (80%):', `R$ ${response.data.data.pagamento.valorMotorista.toFixed(2)}`);
    console.log('  Valor Plataforma (20%):', `R$ ${response.data.data.pagamento.valorPlataforma.toFixed(2)}`);
    console.log('  Status:', response.data.data.pagamento.status);

    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao finalizar corrida:', error.response?.data || error.message);
    throw error;
  }
}

async function consultarCorrida(token, corridaId) {
  try {
    console.log('\n=== 4. CONSULTANDO CORRIDA FINALIZADA ===');
    
    const response = await axios.get(
      `${BASE_URL}/corridas/${corridaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const corrida = response.data.data;
    console.log('✅ Corrida encontrada!');
    console.log('  Status:', corrida.status);
    console.log('  Passageiro:', corrida.passageiro.nome);
    console.log('  Motorista:', corrida.motorista.nome);
    console.log('  Origem:', corrida.origem);
    console.log('  Destino:', corrida.destino);
    console.log('  Valor Estimado:', `R$ ${corrida.valorEstimado.toFixed(2)}`);
    console.log('  Valor Final:', corrida.valorFinal ? `R$ ${corrida.valorFinal.toFixed(2)}` : 'N/A');
    
    if (corrida.pagamento) {
      console.log('\n💳 Pagamento:');
      console.log('  ID:', corrida.pagamento.id);
      console.log('  Status:', corrida.pagamento.status);
      console.log('  Valor:', `R$ ${corrida.pagamento.valor.toFixed(2)}`);
      console.log('  Forma:', corrida.pagamento.forma);
    }

    return corrida;
  } catch (error) {
    console.error('❌ Erro ao consultar corrida:', error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  try {
    console.log('🚀 TESTE DE CORRIDA COM ROTA REAL E PAGAMENTO');
    console.log('================================================');
    
    // 1. Fazer login como passageiro
    console.log('\n🔐 Fazendo login como passageiro...');
    passageiroToken = await login('passageiro1@example.com', 'senha123');
    console.log('✅ Login de passageiro realizado');

    // 2. Fazer login como motorista
    console.log('\n🔐 Fazendo login como motorista...');
    motoristaToken = await login('motorista1@example.com', 'senha123');
    console.log('✅ Login de motorista realizado');

    // 3. Passageiro solicita corrida com rota real
    const corrida = await solicitarCorridaComRota(passageiroToken);

    // 4. Motorista aceita a corrida
    await motoristaAceitarCorrida(motoristaToken, corrida.id);

    // Simular um tempo de corrida
    console.log('\n⏳ Aguardando conclusão da corrida (simulando 3 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Motorista finaliza a corrida (pagamento automático)
    await motoristaFinalizarCorrida(motoristaToken, corrida.id);

    // 6. Consultar corrida finalizada
    await consultarCorrida(passageiroToken, corrida.id);

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO! ✅');
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ TESTE FALHOU:', error.message);
    process.exit(1);
  }
}

// Executar teste
if (require.main === module) {
  runTest();
}

module.exports = { runTest };
