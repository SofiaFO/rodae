const { By, until } = require('selenium-webdriver');
const TestHelper = require('../helpers/TestHelper');
const colors = require('colors');

async function testeAdmin() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('🧪 TESTE DE ADMIN'.cyan.bold);
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

    // ==================== TESTE 1: Login Admin ====================
    try {
      console.log('📝 Teste 1: Login como administrador'.yellow.bold);
      
      await driver.get(`${BASE_URL}/auth`);
      await TestHelper.sleep(2000);

      // Garantir que está na aba de login (não na de cadastro)
      try {
        const loginTab = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
        await loginTab.click();
        await TestHelper.sleep(500);
      } catch (e) {
        console.log('   ℹ️  Já está na aba de login');
      }

      // Preencher formulário de login
      const emailInput = await driver.wait(
        until.elementLocated(By.css('input[id="email-login"]')),
        5000
      );
      const senhaInput = await driver.findElement(By.css('input[id="password-login"]'));
      
      await emailInput.clear();
      await emailInput.sendKeys('admin@rodae.com');
      await senhaInput.clear();
      await senhaInput.sendKeys('123456');

      const loginButton = await driver.findElement(By.css('button[type="submit"]'));
      await loginButton.click();

      await TestHelper.sleep(3000);

      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes('admin')) {
        console.log('✅ Teste 1 PASSOU: Login admin realizado!\n'.green);
        testsPassed++;
      } else {
        console.log(`❌ Teste 1 FALHOU: URL atual é ${currentUrl}\n`.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 1 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

    // ==================== TESTE 2: Dashboard ====================
    try {
      console.log('📝 Teste 2: Visualizar dashboard'.yellow.bold);
      
      await TestHelper.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes('admin')) {
        // Verificar se carregou conteúdo do dashboard
        const pageContent = await driver.findElement(By.css('body')).getText();
        const hasAdminContent = pageContent.includes('Admin') || 
                                pageContent.includes('Dashboard') ||
                                pageContent.includes('Motoristas');
        
        if (hasAdminContent) {
          console.log('✅ Teste 2 PASSOU: Dashboard admin acessível!\n'.green);
          testsPassed++;
        } else {
          console.log('❌ Teste 2 FALHOU: Dashboard sem conteúdo esperado\n'.red);
          testsFailed++;
        }
      } else {
        console.log('❌ Teste 2 FALHOU: Não está na URL /admin\n'.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 2 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

    // ==================== TESTE 3: Visualizar Tabs ====================
    try {
      console.log('📝 Teste 3: Verificar tabs de gerenciamento'.yellow.bold);
      
      await TestHelper.sleep(1500);
      
      const pageContent = await driver.findElement(By.css('body')).getText();
      
      // Verificar se tem conteúdo relacionado a motoristas ou passageiros
      const hasManagementContent = pageContent.includes('Motorista') || 
                                    pageContent.includes('Passageiro') ||
                                    pageContent.includes('Pendente') ||
                                    pageContent.includes('Ativo') ||
                                    pageContent.includes('CNH');
      
      if (hasManagementContent) {
        console.log('✅ Teste 3 PASSOU: Conteúdo de gerenciamento encontrado!\n'.green);
        testsPassed++;
      } else {
        console.log('❌ Teste 3 FALHOU: Conteúdo de gerenciamento não encontrado\n'.red);
        testsFailed++;
      }
    } catch (e) {
      console.log(`❌ Teste 3 FALHOU: ${e.message}\n`.red);
      testsFailed++;
    }

    // ==================== TESTE 4: Logout ====================
    try {
      console.log('📝 Teste 4: Fazer logout'.yellow.bold);
      
      // Procurar botão "Sair" que contém o ícone LogOut
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
      if (currentUrl === `${BASE_URL}/` || !currentUrl.includes('admin')) {
        console.log('✅ Teste 4 PASSOU: Logout realizado com sucesso!\n'.green);
        testsPassed++;
      } else {
        console.log(`❌ Teste 4 FALHOU: Ainda no admin (${currentUrl})\n`.red);
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
    console.log('📊 RESULTADOS - ADMIN'.cyan.bold);
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
testeAdmin();
