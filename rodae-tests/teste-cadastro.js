const { By } = require('selenium-webdriver');
const TestHelper = require('./helpers/TestHelper');

async function testeCadastroPassageiro() {
  console.log('\n🧪 Teste de Cadastro de Passageiro\n');
  
  let driver;
  try {
    driver = await TestHelper.createDriver();
    
    console.log('📍 Navegando para http://localhost:8080...');
    await driver.get('http://localhost:8080');
    await TestHelper.sleep(2000);

    console.log('🔍 Procurando botão Cadastrar...');
    const buttons = await driver.findElements(By.css('button, a'));
    for (let btn of buttons) {
      const text = await btn.getText();
      if (text.includes('Cadastrar') || text.includes('CADASTRAR')) {
        console.log('✓ Clicando em Cadastrar');
        await btn.click();
        await TestHelper.sleep(1500);
        break;
      }
    }

    const currentUrl = await driver.getCurrentUrl();
    console.log(`📍 URL após clicar: ${currentUrl}`);

    // Verificar se está na página de auth
    if (currentUrl.includes('auth') || currentUrl.includes('cadastro') || currentUrl === 'http://localhost:8080/') {
      console.log('✅ Página de cadastro acessada!');
      
      // Procurar botão PASSAGEIRO
      console.log('🔍 Procurando botão PASSAGEIRO...');
      const tipoButtons = await driver.findElements(By.css('button'));
      for (let btn of tipoButtons) {
        const text = await btn.getText();
        if (text.includes('Passageiro') || text.includes('PASSAGEIRO')) {
          console.log('✓ Clicando no botão PASSAGEIRO');
          await btn.click();
          await TestHelper.sleep(500);
          break;
        }
      }

      const timestamp = Date.now();
      
      console.log('📝 Preenchendo formulário...');
      const nomeInput = await driver.findElement(By.css('#name'));
      const emailInput = await driver.findElement(By.css('#email-register'));
      const telefoneInput = await driver.findElement(By.css('#phone'));
      const senhaInput = await driver.findElement(By.css('#password-register'));

      await nomeInput.clear();
      await nomeInput.sendKeys('Passageiro Teste Automatizado');
      
      await emailInput.clear();
      await emailInput.sendKeys(`passageiro${timestamp}@email.com`);
      
      await telefoneInput.clear();
      await telefoneInput.sendKeys('11987654321');
      
      await senhaInput.clear();
      await senhaInput.sendKeys('123456');

      console.log('✓ Formulário preenchido!');
      console.log(`   Nome: Passageiro Teste Automatizado`);
      console.log(`   Email: passageiro${timestamp}@email.com`);
      console.log(`   Telefone: 11987654321`);

      console.log('\n📤 Enviando formulário...');
      const submitButton = await driver.findElement(By.css('button[type="submit"]'));
      await submitButton.click();

      await TestHelper.sleep(4000);

      const finalUrl = await driver.getCurrentUrl();
      console.log(`📍 URL após envio: ${finalUrl}`);

      if (!finalUrl.includes('auth')) {
        console.log('\n✅ TESTE PASSOU! Cadastro realizado com sucesso!');
        console.log(`   Usuário foi redirecionado para: ${finalUrl}\n`);
      } else {
        console.log('\n❌ TESTE FALHOU! Usuário ainda está na página de auth');
        const bodyText = await driver.findElement(By.css('body')).getText();
        console.log(`   Conteúdo da página: ${bodyText.substring(0, 200)}...\n`);
      }
    } else {
      console.log(`❌ Não conseguiu acessar página de cadastro. URL: ${currentUrl}`);
    }

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
  } finally {
    if (driver) {
      console.log('🔚 Fechando navegador...');
      await driver.quit();
    }
  }
}

testeCadastroPassageiro();
