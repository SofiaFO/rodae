const { By } = require('selenium-webdriver');
const TestHelper = require('../helpers/TestHelper');
const colors = require('colors');

async function testeMotorista() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('🧪 TESTE DE MOTORISTA'.cyan.bold);
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

    // ==================== TESTE 1: Cadastro ====================
    try {
      console.log('📝 Teste 1: Cadastro de novo motorista'.yellow.bold);
      console.log('   ℹ️  Obs: Novos motoristas ficam PENDENTES até aprovação do admin\n'.gray);
      
      await driver.get(`${BASE_URL}/auth`);
      await TestHelper.sleep(2000);

      // Clicar na aba "Cadastrar"
      const cadastrarTab = await driver.findElement(By.xpath("//button[contains(text(), 'Cadastrar')]"));
      await cadastrarTab.click();
      await TestHelper.sleep(1000);

      const timestamp = Date.now();
      
      // Selecionar tipo MOTORISTA
      const tipoSelect = await driver.findElement(By.css('select[id="user-type"]'));
      await tipoSelect.click();
      const motoristaOption = await driver.findElement(By.xpath("//option[@value='MOTORISTA']"));
      await motoristaOption.click();
      await TestHelper.sleep(1000);

      const nomeInput = await driver.findElement(By.css('input[id="name"]'));
      const emailInput = await driver.findElement(By.css('input[id="email-register"]'));
      const telefoneInput = await driver.findElement(By.css('input[id="phone"]'));
      const senhaInput = await driver.findElement(By.css('input[id="password-register"]'));

      await nomeInput.clear();
      await nomeInput.sendKeys('Motorista Teste');
      await emailInput.clear();
      await emailInput.sendKeys(`motorista${timestamp}@email.com`);
      await telefoneInput.clear();
      await telefoneInput.sendKeys('11988776655');
      await senhaInput.clear();
      await senhaInput.sendKeys('123456');

      // Campos específicos de motorista
      try {
        const cnhInput = await driver.findElement(By.css('input[id="cnh"]'));
        await cnhInput.sendKeys('12345678901');

        const validadeCNHInput = await driver.findElement(By.css('input[id="validadeCNH"]'));
        await validadeCNHInput.sendKeys('2025-12-31');

        const docVeiculoInput = await driver.findElement(By.css('input[id="docVeiculo"]'));
        await docVeiculoInput.sendKeys('CRLV123456');

        const placaVeiculoInput = await driver.findElement(By.css('input[id="placaVeiculo"]'));
        await placaVeiculoInput.sendKeys('ABC1D23');

        const modeloCorVeiculoInput = await driver.findElement(By.css('input[id="modeloCorVeiculo"]'));
        await modeloCorVeiculoInput.sendKeys('Toyota Corolla Prata');
        
        console.log('   ✓ Campos de motorista preenchidos');
      } catch (e) {
        console.log('   ⚠️  Erro ao preencher campos de veículo:', e.message);
      }

      const submitButton = await driver.findElement(By.css('button[type="submit"]'));
      await submitButton.click();

      await TestHelper.sleep(3000);

      // Para motorista, pode redirecionar para auth ou mostrar mensagem de aprovação
      const currentUrl = await driver.getCurrentUrl();
      const pageContent = await driver.findElement(By.css('body')).getText();
      
      const cadastroOk = currentUrl.includes('auth') || 
                        pageContent.includes('aprovação') || 
                        pageContent.includes('análise');
      
      if (cadastroOk) {
        console.log('✅ Teste 1 PASSOU: Cadastro realizado!\n'.green);
        testsPassed++;
      } else {
        console.log(`❌ Teste 1 FALHOU: URL atual é ${currentUrl}\n`.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 1 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

    // ==================== TESTE 2: Login ====================
    try {
      console.log('📝 Teste 2: Login como motorista'.yellow.bold);
      console.log('   ℹ️  Usando motorista pré-aprovado: joao@gmail.com\n'.gray);
      
      await driver.get(`${BASE_URL}/auth`);
      await TestHelper.sleep(2000);

      // Garantir que está na aba "Entrar"
      try {
        const entrarTab = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
        await entrarTab.click();
        await TestHelper.sleep(500);
      } catch (e) {
        console.log('   ℹ️  Já está na aba de login');
      }

      const emailInput = await driver.findElement(By.css('input[id="email-login"]'));
      const senhaInput = await driver.findElement(By.css('input[id="password-login"]'));
      
      await emailInput.clear();
      await emailInput.sendKeys('marcelo.dias@email.com');
      await senhaInput.clear();
      await senhaInput.sendKeys('123456');

      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();

      await TestHelper.sleep(3000);

      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes('motorista')) {
        console.log('✅ Teste 2 PASSOU: Login realizado com sucesso!\n'.green);
        testsPassed++;
      } else {
        console.log(`❌ Teste 2 FALHOU: URL atual é ${currentUrl}\n`.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 2 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

    // ==================== TESTE 3: Dashboard ====================
    try {
      console.log('📝 Teste 3: Acessar dashboard'.yellow.bold);
      
      await TestHelper.sleep(2000);
      const currentUrl = await driver.getCurrentUrl();
      
      if (currentUrl.includes('motorista')) {
        // Verificar se tem conteúdo do dashboard
        const pageContent = await driver.findElement(By.css('body')).getText();
        const hasContent = pageContent.includes('Online') || 
                          pageContent.includes('offline') ||
                          pageContent.includes('Painel') ||
                          pageContent.includes('Ganhos');
        
        if (hasContent) {
          console.log('✅ Teste 3 PASSOU: Dashboard acessível!\n'.green);
          testsPassed++;
        } else {
          console.log('❌ Teste 3 FALHOU: Dashboard sem conteúdo esperado\n'.red);
          testsFailed++;
        }
      } else {
        console.log('❌ Teste 3 FALHOU: Não está no dashboard\n'.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 3 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

    // ==================== TESTE 4: Logout ====================
    try {
      console.log('📝 Teste 4: Fazer logout'.yellow.bold);
      
      const logoutButtons = await driver.findElements(By.css('button'));
      let logoutClicked = false;
      
      for (let btn of logoutButtons) {
        try {
          const text = await btn.getText();
          if (text.includes('Sair')) {
            await btn.click();
            logoutClicked = true;
            await TestHelper.sleep(2000);
            break;
          }
        } catch (e) {
          // Continuar procurando
        }
      }

      if (!logoutClicked) {
        throw new Error('Botão de logout não encontrado');
      }

      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl === `${BASE_URL}/` || !currentUrl.includes('motorista')) {
        console.log('✅ Teste 4 PASSOU: Logout realizado com sucesso!\n'.green);
        testsPassed++;
      } else {
        console.log('❌ Teste 4 FALHOU: Ainda no dashboard\n'.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 4 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

  } catch (error) {
    console.error('❌ Erro fatal no teste:'.red, error.message);
  } finally {
    if (driver) {
      console.log('\n⏳ Aguardando 3 segundos antes de fechar o navegador...'.yellow);
      await TestHelper.sleep(3000);
      await driver.quit();
      console.log('✅ Navegador fechado!\n'.green);
    }

    // ==================== RESULTADOS ====================
    console.log('\n' + '='.repeat(60).cyan);
    console.log('📊 RESULTADOS - MOTORISTA'.cyan.bold);
    console.log('='.repeat(60).cyan);
    console.log(`✅ Passou: ${testsPassed}`.green);
    console.log(`❌ Falhou: ${testsFailed}`.red);
    console.log(`📈 Total: ${testsPassed + testsFailed}`);
    console.log('='.repeat(60).cyan + '\n');

    if (testsFailed === 0) {
      console.log('🎉 Todos os testes passaram!\n'.green.bold);
      process.exit(0);
    } else {
      console.log('⚠️  Alguns testes falharam.\n'.yellow.bold);
      process.exit(1);
    }
  }
}

// Executar teste
testeMotorista();
