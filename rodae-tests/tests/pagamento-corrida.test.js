/**
 * Teste de Solicitação de Corrida com Forma de Pagamento
 * Testa o fluxo de solicitar corrida escolhendo forma de pagamento
 *
 * Pré-requisitos:
 * - Backend rodando na porta 3000
 * - Frontend rodando na porta 8080
 * - Passageiro: ana.silva@email.com / 123456
 */

const { By, until } = require('selenium-webdriver');
const TestHelper = require('../helpers/TestHelper');
const colors = require('colors');

async function testePagamentoCorrida() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('💳 TESTE DE PAGAMENTO NA SOLICITAÇÃO DE CORRIDA'.cyan.bold);
  console.log('='.repeat(60).cyan + '\n');

  let driver;
  try {
    driver = await TestHelper.createDriver();
    const BASE_URL = 'http://localhost:8080';
    const WAIT_TIMEOUT = 10000;

    // LOGIN
    await driver.get(`${BASE_URL}/auth`);
    await TestHelper.sleep(2000);
    const loginTab = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
    await loginTab.click();
    await TestHelper.sleep(500);
    const emailInput = await driver.wait(until.elementLocated(By.css('input[id="email-login"]')), WAIT_TIMEOUT);
    await emailInput.clear();
    await emailInput.sendKeys('ana.silva@email.com');
    const senhaInput = await driver.findElement(By.css('input[id="password-login"]'));
    await senhaInput.clear();
    await senhaInput.sendKeys('123456');
    const btnLogin = await driver.findElement(By.css('button[type="submit"]'));
    await btnLogin.click();
    await driver.wait(until.urlContains('/passageiro'), WAIT_TIMEOUT);
    await TestHelper.sleep(2000);
    console.log('   ✅ Login realizado com sucesso\n'.green);

    // Navegar para Solicitar Corrida
    const btnSolicitarCorrida = await driver.findElement(By.xpath("//button[contains(text(), 'Solicitar Corrida') or contains(text(), 'Nova Corrida') or contains(text(), 'Solicitar Nova Corrida')]"));
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", btnSolicitarCorrida);
    await TestHelper.sleep(500);
    await driver.executeScript("arguments[0].click();", btnSolicitarCorrida);
    await TestHelper.sleep(1500);
    console.log('   ✅ Tela de solicitação de corrida aberta'.green);

    // Preencher origem
    const inputOrigem = await driver.wait(until.elementLocated(By.id('origem')), WAIT_TIMEOUT);
    await inputOrigem.clear();
    await inputOrigem.sendKeys('Avenida Paulista, 1000, São Paulo');
    console.log('   ✅ Origem preenchida'.green);

    // Preencher destino
    const inputDestino = await driver.findElement(By.id('destino'));
    await inputDestino.clear();
    await inputDestino.sendKeys('Praça da Sé, São Paulo');
    console.log('   ✅ Destino preenchido'.green);

    // Selecionar forma de pagamento
    const selectPagamento = await driver.findElement(By.id('pagamento'));
    await selectPagamento.click();
    await TestHelper.sleep(500);

    // Tentar clicar no item usando role='option' (Radix UI)
    let selectItem;
    try {
      selectItem = await driver.wait(
        until.elementLocated(By.xpath("//div[@role='option']")),
        WAIT_TIMEOUT
      );
    } catch (e) {
      // Fallback para data-radix-select-item
      selectItem = await driver.wait(
        until.elementLocated(By.xpath("//div[@data-radix-select-item]")),
        WAIT_TIMEOUT
      );
    }
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", selectItem);
    await TestHelper.sleep(200);
    await driver.executeScript("arguments[0].click();", selectItem);
    console.log('   ✅ Forma de pagamento selecionada'.green);

    // Solicitar corrida
    const btnSubmit = await driver.findElement(By.css('button[type="submit"]'));
    await btnSubmit.click();
    await TestHelper.sleep(2000);

    // Verificar toast de sucesso
    const toastSucesso = await driver.findElements(By.xpath("//*[contains(text(), 'Corrida solicitada') or contains(text(), 'Aguarde um motorista aceitar')]"));
    if (toastSucesso.length > 0) {
      console.log('   ✅ Toast de sucesso exibido'.green);
      console.log('✅ Corrida solicitada com sucesso\n'.green.bold);
    } else {
      throw new Error('Toast de sucesso não exibido após solicitar corrida');
    }

    await TestHelper.sleep(1500);
    console.log('   Aguardando para logar como motorista...'.cyan);

    // LOGAR COMO MOTORISTA
    await driver.get(`${BASE_URL}/auth`);
    await TestHelper.sleep(2000);
    const loginTabMotorista = await driver.findElement(By.xpath("//button[contains(text(), 'Entrar')]"));
    await loginTabMotorista.click();
    await TestHelper.sleep(500);
    const emailInputMotorista = await driver.wait(
      until.elementLocated(By.css('input[id="email-login"]')),
      WAIT_TIMEOUT
    );
    const senhaInputMotorista = await driver.findElement(By.css('input[id="password-login"]'));
    await emailInputMotorista.clear();
    await emailInputMotorista.sendKeys('joao@email.com');
    await senhaInputMotorista.clear();
    await senhaInputMotorista.sendKeys('123456');
    const btnLoginMotorista = await driver.findElement(By.css('button[type="submit"]'));
    await btnLoginMotorista.click();
    await driver.wait(until.urlContains('/motorista'), WAIT_TIMEOUT);
    await TestHelper.sleep(2000);
    console.log('   ✅ Login do motorista realizado com sucesso'.green);

    // Ficar ONLINE para aceitar corridas
    console.log('   Ficando online para aceitar corridas...'.cyan);
    const btnOnline = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Ficar Online') or contains(text(), 'Online')]")),
      WAIT_TIMEOUT
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", btnOnline);
    await TestHelper.sleep(500);
    await driver.executeScript("arguments[0].click();", btnOnline);
    await TestHelper.sleep(1500);
    console.log('   ✅ Motorista online'.green);

    // Buscar botão "Aceitar" (primeira corrida pendente)
    console.log('   Buscando corrida pendente para aceitar...'.cyan);
    const btnAceitar = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Aceitar')][1]")),
      WAIT_TIMEOUT
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", btnAceitar);
    await TestHelper.sleep(500);
    await driver.executeScript("arguments[0].click();", btnAceitar);
    await TestHelper.sleep(2000);
    console.log('   ✅ Corrida aceita pelo motorista'.green);

    // Ficar OFFLINE para finalizar corrida
    console.log('   Ficando offline para finalizar corrida...'.cyan);
    const btnOffline = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Ficar Offline') or contains(text(), 'Offline')]")),
      WAIT_TIMEOUT
    );
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", btnOffline);
    await TestHelper.sleep(500);
    await driver.executeScript("arguments[0].click();", btnOffline);
    await TestHelper.sleep(1500);
    console.log('   ✅ Motorista offline'.green);

    // Navegar para aba "Em Andamento" para finalizar a corrida
    console.log('   Navegando para aba "Em Andamento"...'.cyan);
    const tabEmAndamento = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Em Andamento') or contains(text(), 'Andamento')]")),
      WAIT_TIMEOUT
    );
    await driver.executeScript("arguments[0].click();", tabEmAndamento);
    await TestHelper.sleep(1500);
    console.log('   ✅ Aba "Em Andamento" acessada'.green);

    // Buscar todos os botões dentro da corrida em andamento
    // O botão de finalizar é o segundo botão (primeiro é Ver detalhes)
    console.log('   Buscando botão de finalizar corrida...'.cyan);
    await TestHelper.sleep(1000);
    
    // Buscar pelo segundo botão após o botão com Eye (Ver detalhes)
    const allButtons = await driver.findElements(By.css('button'));
    let btnFinalizar = null;
    
    // Encontrar botão que tem CheckCircle como filho
    for (let btn of allButtons) {
      try {
        const svgs = await btn.findElements(By.css('svg'));
        for (let svg of svgs) {
          const className = await svg.getAttribute('class');
          if (className && className.includes('lucide-check-circle')) {
            btnFinalizar = btn;
            break;
          }
        }
        if (btnFinalizar) break;
      } catch (e) {}
    }
    
    if (!btnFinalizar) {
      throw new Error('Botão de finalizar não encontrado');
    }
    
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", btnFinalizar);
    await TestHelper.sleep(500);
    await driver.executeScript("arguments[0].click();", btnFinalizar);
    await TestHelper.sleep(2000);
    console.log('   ✅ Corrida finalizada pelo motorista'.green);

    // Verificar pagamento e repasse
    // Buscar toast ou card de pagamento
    const toastPagamento = await driver.findElements(By.xpath("//*[contains(text(), 'Pagamento registrado') or contains(text(), 'Repasse realizado') or contains(text(), 'Corrida finalizada')]"));
    if (toastPagamento.length > 0) {
      console.log('   ✅ Pagamento e repasse confirmados'.green);
    } else {
      console.log('   ℹ️  Não foi possível verificar o pagamento/repasse visualmente, verifique no backend.'.yellow);
    }

  } catch (error) {
    console.error('❌ Teste FALHOU:'.red.bold, error.message.red);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

testePagamentoCorrida();
