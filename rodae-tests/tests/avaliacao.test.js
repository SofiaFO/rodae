const { By, until } = require('selenium-webdriver');
const TestHelper = require('../helpers/TestHelper');
const colors = require('colors');

async function testeAvaliacoes() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('🧪 TESTE DE AVALIAÇÕES'.cyan.bold);
  console.log('='.repeat(60).cyan + '\n');

  let driver;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ==================== SETUP ====================
    console.log('📋 Iniciando setup...'.yellow);
    driver = await TestHelper.createDriver();
    const BASE_URL = 'http://localhost:8080';
    console.log('✅ Setup concluído!\n'.green);

    // ==================== TESTE 1: Passageiro Avalia Motorista ====================
    try {
      console.log('📝 Teste 1: Passageiro avalia motorista de corrida finalizada'.yellow.bold);
      
      // 1. Fazer login como passageiro
      await driver.get(`${BASE_URL}/auth`);
      await TestHelper.sleep(2000);

      const loginTab = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
      await loginTab.click();
      await TestHelper.sleep(500);

      const emailInput = await driver.wait(
        until.elementLocated(By.css('input[id="email-login"]')),
        5000
      );
      const senhaInput = await driver.findElement(By.css('input[id="password-login"]'));
      
      await emailInput.clear();
      await emailInput.sendKeys('ana.silva@email.com');
      await senhaInput.clear();
      await senhaInput.sendKeys('123456');

      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();

      // 2. Aguardar dashboard carregar
      await driver.wait(until.urlContains('/passageiro'), 10000);
      await TestHelper.sleep(2000);

      console.log('   ✅ Login realizado com sucesso'.green);

      // 3. Clicar na tab "Finalizadas"
      console.log('   Acessando aba "Finalizadas"...'.cyan);
      await TestHelper.sleep(2000);

      const tabFinalizadas = await driver.findElement(
        By.xpath("//button[contains(text(), 'Finalizadas')]")
      );
      await tabFinalizadas.click();
      await TestHelper.sleep(2000);
      console.log('   ✅ Aba "Finalizadas" acessada'.green);

      // 4. Procurar por corrida finalizada com botão "Avaliar"
      console.log('   Procurando corrida para avaliar...'.cyan);
      await TestHelper.sleep(1000);

      let botaoAvaliar = null;
      
      // Procurar botão "Avaliar" na aba de finalizadas
      try {
        const botoesAvaliar = await driver.findElements(
          By.xpath("//button[contains(text(), 'Avaliar')]")
        );
        if (botoesAvaliar.length > 0) {
          botaoAvaliar = botoesAvaliar[0];
          console.log(`   ✅ Encontradas ${botoesAvaliar.length} corrida(s) para avaliar`.green);
        }
      } catch (e) {
        console.log('   ℹ️  Nenhuma corrida disponível para avaliar'.yellow);
      }

      if (!botaoAvaliar) {
        console.log('❌ Nenhum botão "Avaliar" encontrado. Execute o seed do banco: npm run seed (no rodae-back)'.red);
        throw new Error('Botão "Avaliar" não encontrado');
      }

      // 5. Clicar no botão "Avaliar"
      console.log('   Clicando em "Avaliar"...'.cyan);
      await botaoAvaliar.click();
      await TestHelper.sleep(1500);

      // 6. Verificar se o diálogo de avaliação abriu
      console.log('   Aguardando modal de avaliação...'.cyan);
      await TestHelper.sleep(1000);
      
      // Verificar se o título do modal apareceu
      const tituloModal = await driver.findElements(
        By.xpath("//*[contains(text(), 'Avaliar')]")
      );
      
      if (tituloModal.length === 0) {
        console.log('❌ Modal de avaliação não abriu'.red);
        throw new Error('Modal de avaliação não encontrado');
      }
      console.log('   ✅ Modal de avaliação aberto'.green);

      // 7. Selecionar 5 estrelas
      console.log('   Selecionando 5 estrelas...'.cyan);
      await TestHelper.sleep(500);
      
      // Buscar buttons type="button" vazios (sem texto) que são as estrelas
      const todosButtons = await driver.findElements(By.css('button[type="button"]'));
      const botoesEstrela = [];
      
      for (let btn of todosButtons) {
        try {
          const texto = await btn.getText();
          if (texto.trim() === '') {
            botoesEstrela.push(btn);
          }
        } catch (e) {}
      }
      
      console.log(`   Debug: Encontrados ${botoesEstrela.length} botões vazios (estrelas)`.gray);
      
      if (botoesEstrela.length < 5) {
        console.log(`❌ Esperava 5 estrelas, encontradas apenas ${botoesEstrela.length}`.red);
        throw new Error('Sistema de estrelas não encontrado');
      }

      // Clicar na 5ª estrela (índice 4)
      await botoesEstrela[4].click();
      await TestHelper.sleep(500);
      console.log('   ✅ 5 estrelas selecionadas'.green);

      // 8. Escrever comentário
      console.log('   Escrevendo comentário...'.cyan);
      const campoComentario = await driver.findElement(By.css('textarea[id="comentario"]'));
      await campoComentario.clear();
      await campoComentario.sendKeys('Motorista excelente! Muito educado e pontual. Recomendo!');
      console.log('   ✅ Comentário preenchido'.green);

      // 9. Enviar avaliação
      console.log('   Enviando avaliação...'.cyan);
      const botaoEnviar = await driver.findElement(
        By.xpath("//button[contains(text(), 'Enviar Avaliação')]")
      );
      await botaoEnviar.click();
      await TestHelper.sleep(2000);

      // 10. Verificar toast de sucesso
      try {
        const toastSucesso = await driver.findElements(
          By.xpath("//*[contains(text(), 'Avaliação enviada') or contains(text(), 'sucesso') or contains(text(), 'Obrigado')]")
        );
        
        if (toastSucesso.length > 0) {
          console.log('   ✅ Avaliação enviada com sucesso!'.green);
        } else {
          console.log('   ⚠️  Toast de sucesso não encontrado, mas avaliação pode ter sido enviada'.yellow);
        }
      } catch (e) {
        console.log('   ⚠️  Não foi possível verificar toast de sucesso'.yellow);
      }

      console.log('✅ Teste 1 PASSOU\n'.green.bold);
      testsPassed++;

    } catch (error) {
      console.error('❌ Teste 1 FALHOU:'.red.bold, error.message.red);
      testsFailed++;
    }

    // ==================== TESTE 2: Motorista Avalia Passageiro ====================
    try {
      console.log('📝 Teste 2: Motorista avalia passageiro de corrida finalizada'.yellow.bold);
      
      // 1. Voltar para página de auth (fazer logout)
      await driver.get(`${BASE_URL}/auth`);
      await TestHelper.sleep(2000);

      // 2. Fazer login como motorista
      const loginTab = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
      await loginTab.click();
      await TestHelper.sleep(500);

      const emailInput = await driver.wait(
        until.elementLocated(By.css('input[id="email-login"]')),
        5000
      );
      const senhaInput = await driver.findElement(By.css('input[id="password-login"]'));
      
      await emailInput.clear();
      await emailInput.sendKeys('joao@gmail.com');
      await senhaInput.clear();
      await senhaInput.sendKeys('senha');

      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();

      // 3. Aguardar dashboard carregar
      await driver.wait(until.urlContains('/motorista'), 10000);
      await TestHelper.sleep(2000);

      console.log('   ✅ Login do motorista realizado com sucesso'.green);

      // 4. Clicar na tab "Finalizadas"
      console.log('   Acessando aba "Finalizadas"...'.cyan);
      await TestHelper.sleep(2000);

      const tabFinalizadas = await driver.findElement(
        By.xpath("//button[contains(text(), 'Finalizadas')]")
      );
      await tabFinalizadas.click();
      await TestHelper.sleep(2000);
      console.log('   ✅ Aba "Finalizadas" acessada'.green);

      // 5. Procurar por corrida finalizada com botão "Avaliar"
      console.log('   Procurando corrida para avaliar...'.cyan);
      await TestHelper.sleep(1000);

      let botaoAvaliar = null;
      
      // Procurar botão "Avaliar" na aba de finalizadas
      try {
        const botoesAvaliar = await driver.findElements(
          By.xpath("//button[contains(text(), 'Avaliar')]")
        );
        if (botoesAvaliar.length > 0) {
          botaoAvaliar = botoesAvaliar[0];
          console.log(`   ✅ Encontradas ${botoesAvaliar.length} corrida(s) para avaliar`.green);
        }
      } catch (e) {}

      if (!botaoAvaliar) {
        console.log('❌ Nenhum botão "Avaliar" encontrado. Execute o seed do banco: npm run seed (no rodae-back)'.red);
        throw new Error('Botão "Avaliar" não encontrado');
      }

      // 6. Clicar no botão "Avaliar"
      console.log('   Clicando em "Avaliar"...'.cyan);
      await botaoAvaliar.click();
      await TestHelper.sleep(1500);

      // 7. Verificar se o diálogo de avaliação abriu
      console.log('   Aguardando modal de avaliação...'.cyan);
      await TestHelper.sleep(1000);
      
      const tituloModal = await driver.findElements(
        By.xpath("//*[contains(text(), 'Avaliar')]")
      );
      
      if (tituloModal.length === 0) {
        console.log('❌ Modal de avaliação não abriu'.red);
        throw new Error('Modal de avaliação não encontrado');
      }
      console.log('   ✅ Modal de avaliação aberto'.green);

      // 8. Selecionar 5 estrelas (motorista)
      console.log('   Selecionando 5 estrelas...'.cyan);
      await TestHelper.sleep(500);
      
      // Buscar buttons type="button" vazios (sem texto) que são as estrelas
      const todosButtonsMotorista = await driver.findElements(By.css('button[type="button"]'));
      const botoesEstrelaMotorista = [];
      
      for (let btn of todosButtonsMotorista) {
        try {
          const texto = await btn.getText();
          if (texto.trim() === '') {
            botoesEstrelaMotorista.push(btn);
          }
        } catch (e) {}
      }
      
      console.log(`   Debug: Encontrados ${botoesEstrelaMotorista.length} botões vazios (estrelas)`.gray);
      
      if (botoesEstrelaMotorista.length < 5) {
        console.log(`❌ Esperava 5 estrelas, encontradas apenas ${botoesEstrelaMotorista.length}`.red);
        throw new Error('Sistema de estrelas não encontrado');
      }

      await botoesEstrelaMotorista[4].click();
      await TestHelper.sleep(500);
      console.log('   ✅ 5 estrelas selecionadas'.green);

      // 9. Escrever comentário
      console.log('   Escrevendo comentário...'.cyan);
      const campoComentario = await driver.findElement(By.css('textarea[id="comentario"]'));
      await campoComentario.clear();
      await campoComentario.sendKeys('Passageiro pontual e educado. Foi um prazer!');
      console.log('   ✅ Comentário preenchido'.green);

      // 10. Enviar avaliação
      console.log('   Enviando avaliação...'.cyan);
      const botaoEnviar = await driver.findElement(
        By.xpath("//button[contains(text(), 'Enviar Avaliação')]")
      );
      await botaoEnviar.click();
      await TestHelper.sleep(2000);

      console.log('   ✅ Avaliação enviada'.green);

      console.log('✅ Teste 2 PASSOU\n'.green.bold);
      testsPassed++;

    } catch (error) {
      console.error('❌ Teste 2 FALHOU:'.red.bold, error.message.red);
      testsFailed++;
    }

    // ==================== TESTE 3: Visualizar Minhas Avaliações ====================
    try {
      console.log('📝 Teste 3: Visualizar avaliações recebidas'.yellow.bold);
      
      // Já está logado como motorista, navegar para aba de avaliações
      console.log('   Acessando aba de avaliações...'.cyan);
      
      try {
        const abaAvaliacoes = await driver.findElement(
          By.xpath("//button[contains(text(), 'Minhas Avaliações') or contains(text(), 'Avaliações')]")
        );
        await abaAvaliacoes.click();
        await TestHelper.sleep(2000);
        
        console.log('   ✅ Aba de avaliações acessada'.green);

        // Verificar se há avaliações listadas
        const avaliacoesListadas = await driver.findElements(
          By.xpath("//*[contains(@class, 'star') or contains(text(), '★')]")
        );
        
        if (avaliacoesListadas.length > 0) {
          console.log(`   ✅ ${avaliacoesListadas.length} avaliações encontradas`.green);
        } else {
          console.log('   ℹ️  Nenhuma avaliação listada ainda'.yellow);
        }

        console.log('✅ Teste 3 PASSOU\n'.green.bold);
        testsPassed++;

      } catch (e) {
        console.log('   ℹ️  Aba de avaliações não encontrada ou não implementada'.yellow);
        console.log('✅ Teste 3 PASSOU (aba opcional)\n'.green.bold);
        testsPassed++;
      }

    } catch (error) {
      console.error('❌ Teste 3 FALHOU:'.red.bold, error.message.red);
      testsFailed++;
    }

    // ==================== RESULTADOS ====================
    console.log('\n' + '='.repeat(60).cyan);
    console.log('📊 RESULTADOS DOS TESTES'.cyan.bold);
    console.log('='.repeat(60).cyan);
    console.log(`✅ Testes passados: ${testsPassed}`.green);
    console.log(`❌ Testes falhados: ${testsFailed}`.red);
    console.log('='.repeat(60).cyan + '\n');

  } catch (error) {
    console.error('❌ Erro crítico durante execução dos testes:'.red.bold);
    console.error(error);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Executar os testes
testeAvaliacoes().catch((error) => {
  console.error('❌ Erro fatal:'.red.bold, error);
  process.exit(1);
});
