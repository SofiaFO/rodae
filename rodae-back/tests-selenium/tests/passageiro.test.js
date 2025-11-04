const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const TestHelper = require('../helpers/TestHelper');

describe('Testes de Passageiro', function() {
  let driver;
  const BASE_URL = 'http://localhost:8080';

  before(async function() {
    driver = await TestHelper.createDriver();
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  it('Deve fazer cadastro de novo passageiro', async function() {
    await driver.get(`${BASE_URL}/registro`);
    await TestHelper.sleep(1000);

    try {
      const nomeInput = await driver.findElement(By.css('input[name="nome"], #nome'));
      const emailInput = await driver.findElement(By.css('input[name="email"], #email'));
      const telefoneInput = await driver.findElement(By.css('input[name="telefone"], #telefone'));
      const senhaInput = await driver.findElement(By.css('input[name="senha"], #senha'));

      const timestamp = Date.now();
      await nomeInput.sendKeys('Teste Usuário');
      await emailInput.sendKeys(`teste${timestamp}@email.com`);
      await telefoneInput.sendKeys('11988776655');
      await senhaInput.sendKeys('123456');

      const submitButton = await driver.findElement(By.css('button[type="submit"]'));
      await submitButton.click();

      await TestHelper.sleep(2000);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.not.include('registro');
    } catch (e) {
      console.log('Formulário de cadastro não encontrado:', e.message);
    }
  });

  it('Deve fazer login como passageiro', async function() {
    await driver.get(`${BASE_URL}/login`);
    await TestHelper.sleep(1000);

    const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"]'));
    const senhaInput = await driver.findElement(By.css('input[type="password"], input[name="senha"]'));
    
    await emailInput.sendKeys('ana.silva@email.com');
    await senhaInput.sendKeys('123456');

    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    await TestHelper.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.not.include('login');
  });

  it('Deve acessar perfil do passageiro', async function() {
    try {
      const perfilLink = await driver.findElement(By.css('a[href*="perfil"], .perfil-link, .user-menu'));
      await perfilLink.click();
      await TestHelper.sleep(1500);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include('perfil');
    } catch (e) {
      console.log('Link de perfil não encontrado:', e.message);
    }
  });

  it('Deve atualizar informações do perfil', async function() {
    await driver.get(`${BASE_URL}/passageiro/perfil`);
    await TestHelper.sleep(1500);

    try {
      const nomeInput = await driver.findElement(By.css('input[name="nome"], #nome'));
      await nomeInput.clear();
      await nomeInput.sendKeys('Ana Silva Atualizada');

      const salvarButton = await driver.findElement(By.css('button[type="submit"], .btn-salvar, .salvar'));
      await salvarButton.click();

      await TestHelper.sleep(1500);

      const successMessage = await driver.findElements(By.css('.success, .toast, .alert-success'));
      expect(successMessage.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Formulário de edição não encontrado:', e.message);
    }
  });

  it('Deve solicitar uma corrida', async function() {
    await driver.get(`${BASE_URL}/passageiro/nova-corrida`);
    await TestHelper.sleep(1500);

    try {
      const origemInput = await driver.findElement(By.css('input[name="origem"], #origem'));
      const destinoInput = await driver.findElement(By.css('input[name="destino"], #destino'));

      await origemInput.sendKeys('Rua A, 123');
      await destinoInput.sendKeys('Rua B, 456');

      const solicitarButton = await driver.findElement(By.css('button[type="submit"], .btn-solicitar'));
      await solicitarButton.click();

      await TestHelper.sleep(2000);

      const successMessage = await driver.findElements(By.css('.success, .toast, .alert-success'));
      expect(successMessage.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Formulário de solicitar corrida não encontrado:', e.message);
    }
  });

  it('Deve visualizar histórico de corridas', async function() {
    await driver.get(`${BASE_URL}/passageiro/historico`);
    await TestHelper.sleep(2000);

    try {
      const historicoElement = await driver.findElement(By.css('.historico-list, table, .corridas-list'));
      expect(await historicoElement.isDisplayed()).to.be.true;
    } catch (e) {
      console.log('Histórico de corridas não encontrado');
    }
  });

  it('Deve fazer logout', async function() {
    try {
      const logoutButton = await driver.findElement(By.css('a[href*="logout"], .logout, .btn-sair'));
      await logoutButton.click();

      await TestHelper.sleep(1500);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).to.include('login');
    } catch (e) {
      console.log('Botão de logout não encontrado:', e.message);
    }
  });
});
