/**
 * Script de teste para relatórios administrativos
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';

async function login(email, senha) {
  const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
  return response.data.data;
}

async function testarRelatorios() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TESTE: Relatórios Administrativos');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. LOGIN COMO ADMIN
    console.log('1️⃣  Fazendo login como admin...');
    const admin = await login('admin@rodae.com', 'admin123');
    const tokenAdmin = admin.token;
    console.log(`✅ Admin logado: ${admin.usuario.nome}\n`);

    const headers = {
      'Authorization': `Bearer ${tokenAdmin}`
    };

    // 2. RELATÓRIO DE CORRIDAS (JSON)
    console.log('2️⃣  Obtendo relatório de corridas...');
    const corridasResponse = await axios.get(
      `${API_URL}/admin/relatorios/corridas`,
      { headers }
    );
    const relCorridas = corridasResponse.data.data;
    
    console.log('\n📈 RESUMO DE CORRIDAS:');
    console.log(`   Total de Corridas: ${relCorridas.resumo.totalCorridas}`);
    console.log(`   Finalizadas: ${relCorridas.resumo.totalFinalizadas}`);
    console.log(`   Canceladas: ${relCorridas.resumo.totalCanceladas}`);
    console.log(`   Em Andamento: ${relCorridas.resumo.totalEmAndamento}`);
    console.log(`   Valor Total: R$ ${relCorridas.resumo.valorTotalMovimentado.toFixed(2)}`);
    console.log(`   Receita Plataforma (20%): R$ ${relCorridas.resumo.valorReceitaPlataforma.toFixed(2)}`);
    console.log(`   Pago aos Motoristas (80%): R$ ${relCorridas.resumo.valorPagoMotoristas.toFixed(2)}`);
    console.log(`   Ticket Médio: R$ ${relCorridas.resumo.ticketMedio.toFixed(2)}`);
    console.log(`   Taxa Cancelamento: ${relCorridas.resumo.taxaCancelamento.toFixed(2)}%`);
    console.log(`   Crescimento Mensal: ${relCorridas.resumo.crescimentoMensal > 0 ? '+' : ''}${relCorridas.resumo.crescimentoMensal.toFixed(1)}%`);

    console.log('\n📊 POR FORMA DE PAGAMENTO:');
    relCorridas.porFormaPagamento.forEach(f => {
      console.log(`   ${f.forma}: ${f.quantidade} corridas (${f.percentual}%) - R$ ${f.valor.toFixed(2)}`);
    });

    console.log('\n🏆 TOP 5 ROTAS:');
    relCorridas.topRotas.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.origem} → ${r.destino}: ${r.corridas} corridas`);
    });

    console.log('\n🕐 POR HORÁRIO:');
    relCorridas.porHorario.forEach(h => {
      console.log(`   ${h.horario}: ${h.corridas} corridas (${h.percentual}%)`);
    });

    console.log(`\n📋 Corridas Recentes: ${relCorridas.corridasRecentes.length} registros`);

    // 3. RELATÓRIO DE MOTORISTAS (JSON)
    console.log('\n3️⃣  Obtendo relatório de motoristas...');
    const motoristasResponse = await axios.get(
      `${API_URL}/admin/relatorios/motoristas`,
      { headers }
    );
    const relMotoristas = motoristasResponse.data.data;
    
    console.log('\n👨‍✈️ RESUMO DE MOTORISTAS:');
    console.log(`   Total: ${relMotoristas.resumo.totalMotoristas}`);
    console.log(`   Ativos: ${relMotoristas.resumo.motoristasAtivos}`);
    console.log(`   Pendentes: ${relMotoristas.resumo.motoristasPendentes}`);
    console.log(`   Inativos: ${relMotoristas.resumo.motoristasInativos}`);
    console.log(`   Total de Corridas: ${relMotoristas.resumo.totalCorridasRealizadas}`);
    console.log(`   Ganho Total dos Motoristas: R$ ${relMotoristas.resumo.ganhoTotalMotoristas.toFixed(2)}`);
    console.log(`   Média de Avaliação: ${relMotoristas.resumo.mediaAvaliacaoGeral.toFixed(1)} ⭐`);

    console.log('\n🏆 TOP 5 MOTORISTAS:');
    relMotoristas.topMotoristas.slice(0, 5).forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.nome}`);
      console.log(`      Corridas: ${m.metricas.totalCorridas} | Ganho: R$ ${m.metricas.ganhoTotal.toFixed(2)} | Nota: ${m.metricas.mediaAvaliacao} ⭐`);
    });

    console.log('\n📊 POR STATUS:');
    relMotoristas.porStatus.forEach(s => {
      console.log(`   ${s.status}: ${s.quantidade} (${s.percentual}%)`);
    });

    console.log('\n⭐ DISTRIBUIÇÃO POR AVALIAÇÃO:');
    relMotoristas.porAvaliacao.forEach(a => {
      console.log(`   ${a.estrelas} estrelas: ${a.quantidade} motoristas (${a.percentual}%)`);
    });

    // 4. TESTE DE EXPORTAÇÃO PDF (CORRIDAS)
    console.log('\n4️⃣  Testando exportação PDF de corridas...');
    const pdfCorridasResponse = await axios.get(
      `${API_URL}/admin/relatorios/corridas/export/pdf`,
      { 
        headers,
        responseType: 'arraybuffer'
      }
    );
    
    const pdfCorridasPath = path.join(__dirname, 'relatorio-corridas-teste.pdf');
    fs.writeFileSync(pdfCorridasPath, pdfCorridasResponse.data);
    console.log(`✅ PDF de corridas salvo: ${pdfCorridasPath}`);
    console.log(`   Tamanho: ${(pdfCorridasResponse.data.length / 1024).toFixed(2)} KB`);

    // 5. TESTE DE EXPORTAÇÃO EXCEL (CORRIDAS)
    console.log('\n5️⃣  Testando exportação Excel de corridas...');
    const excelCorridasResponse = await axios.get(
      `${API_URL}/admin/relatorios/corridas/export/excel`,
      { 
        headers,
        responseType: 'arraybuffer'
      }
    );
    
    const excelCorridasPath = path.join(__dirname, 'relatorio-corridas-teste.xlsx');
    fs.writeFileSync(excelCorridasPath, excelCorridasResponse.data);
    console.log(`✅ Excel de corridas salvo: ${excelCorridasPath}`);
    console.log(`   Tamanho: ${(excelCorridasResponse.data.length / 1024).toFixed(2)} KB`);

    // 6. TESTE DE EXPORTAÇÃO CSV (CORRIDAS)
    console.log('\n6️⃣  Testando exportação CSV de corridas...');
    const csvCorridasResponse = await axios.get(
      `${API_URL}/admin/relatorios/corridas/export/csv`,
      { 
        headers,
        responseType: 'text'
      }
    );
    
    const csvCorridasPath = path.join(__dirname, 'relatorio-corridas-teste.csv');
    fs.writeFileSync(csvCorridasPath, csvCorridasResponse.data, 'utf8');
    console.log(`✅ CSV de corridas salvo: ${csvCorridasPath}`);
    console.log(`   Tamanho: ${(csvCorridasResponse.data.length / 1024).toFixed(2)} KB`);

    // 7. TESTE DE EXPORTAÇÃO PDF (MOTORISTAS)
    console.log('\n7️⃣  Testando exportação PDF de motoristas...');
    const pdfMotoristasResponse = await axios.get(
      `${API_URL}/admin/relatorios/motoristas/export/pdf`,
      { 
        headers,
        responseType: 'arraybuffer'
      }
    );
    
    const pdfMotoristasPath = path.join(__dirname, 'relatorio-motoristas-teste.pdf');
    fs.writeFileSync(pdfMotoristasPath, pdfMotoristasResponse.data);
    console.log(`✅ PDF de motoristas salvo: ${pdfMotoristasPath}`);
    console.log(`   Tamanho: ${(pdfMotoristasResponse.data.length / 1024).toFixed(2)} KB`);

    // 8. TESTE DE EXPORTAÇÃO EXCEL (MOTORISTAS)
    console.log('\n8️⃣  Testando exportação Excel de motoristas...');
    const excelMotoristasResponse = await axios.get(
      `${API_URL}/admin/relatorios/motoristas/export/excel`,
      { 
        headers,
        responseType: 'arraybuffer'
      }
    );
    
    const excelMotoristasPath = path.join(__dirname, 'relatorio-motoristas-teste.xlsx');
    fs.writeFileSync(excelMotoristasPath, excelMotoristasResponse.data);
    console.log(`✅ Excel de motoristas salvo: ${excelMotoristasPath}`);
    console.log(`   Tamanho: ${(excelMotoristasResponse.data.length / 1024).toFixed(2)} KB`);

    // 9. TESTE DE EXPORTAÇÃO CSV (MOTORISTAS)
    console.log('\n9️⃣  Testando exportação CSV de motoristas...');
    const csvMotoristasResponse = await axios.get(
      `${API_URL}/admin/relatorios/motoristas/export/csv`,
      { 
        headers,
        responseType: 'text'
      }
    );
    
    const csvMotoristasPath = path.join(__dirname, 'relatorio-motoristas-teste.csv');
    fs.writeFileSync(csvMotoristasPath, csvMotoristasResponse.data, 'utf8');
    console.log(`✅ CSV de motoristas salvo: ${csvMotoristasPath}`);
    console.log(`   Tamanho: ${(csvMotoristasResponse.data.length / 1024).toFixed(2)} KB`);

    // 10. TESTE COM FILTROS
    console.log('\n🔟 Testando filtros...');
    const dataInicio = '2025-11-01';
    const dataFim = '2025-11-24';
    
    const corridasFiltradoResponse = await axios.get(
      `${API_URL}/admin/relatorios/corridas?dataInicio=${dataInicio}&dataFim=${dataFim}&statusCorrida=FINALIZADA`,
      { headers }
    );
    console.log(`✅ Relatório filtrado: ${corridasFiltradoResponse.data.data.resumo.totalCorridas} corridas finalizadas`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📁 Arquivos gerados na pasta scripts/:');
    console.log('   - relatorio-corridas-teste.pdf');
    console.log('   - relatorio-corridas-teste.xlsx');
    console.log('   - relatorio-corridas-teste.csv');
    console.log('   - relatorio-motoristas-teste.pdf');
    console.log('   - relatorio-motoristas-teste.xlsx');
    console.log('   - relatorio-motoristas-teste.csv\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('   Mensagem:', error.response.data.message);
    }
    if (error.code) {
      console.error('   Código:', error.code);
    }
    process.exit(1);
  }
}

// Executar
console.log('\n🚀 Iniciando testes de relatórios...\n');
testarRelatorios();
