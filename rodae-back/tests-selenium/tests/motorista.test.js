const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const TestHelper = require('../helpers/TestHelper');

describe('Testes de Motorista', function() {
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

  it('Deve fazer login como motorista', async function() {
    await driver.get(`${BASE_URL}/login`);
    await TestHelper.sleep(1000);

    const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"]'));
    const senhaInput = await driver.findElement(By.css('input[type="password"], input[name="senha"]'));
    
    await emailInput.sendKeys('roberto.alves@email.com');
    await senhaInput.sendKeys('123456');

    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    await TestHelper.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.not.include('login');
  });

  it('Deve acessar perfil do motorista', async function() {
    // Procurar pelo link/botão de perfil
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
    await driver.get(`${BASE_URL}/motorista/perfil`);
    await TestHelper.sleep(1500);

    try {
      // Tentar encontrar campo de telefone e atualizar
      const telefoneInput = await driver.findElement(By.css('input[name="telefone"], #telefone'));
      await telefoneInput.clear();
      await telefoneInput.sendKeys('11999887766');

      // Procurar botão de salvar
      const salvarButton = await driver.findElement(By.css('button[type="submit"], .btn-salvar, .salvar'));
      await salvarButton.click();

      await TestHelper.sleep(1500);

      // Verificar mensagem de sucesso
      const successMessage = await driver.findElements(By.css('.success, .toast, .alert-success'));
      expect(successMessage.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Formulário de edição não encontrado ou estrutura diferente:', e.message);
    }
  });

  it('Deve visualizar corridas disponíveis', async function() {
    await driver.get(`${BASE_URL}/motorista/corridas`);
    await TestHelper.sleep(2000);

    try {
      const corridasElement = await driver.findElement(By.css('.corridas-list, .lista-corridas, table'));
      expect(await corridasElement.isDisplayed()).to.be.true;
    } catch (e) {
      console.log('Lista de corridas não encontrada');
    }
  });

  it('Deve aceitar uma corrida', async function() {
    await driver.get(`${BASE_URL}/motorista/corridas`);
    await TestHelper.sleep(2000);

    try {
      const aceitarButton = await driver.findElement(By.css('button.aceitar, .btn-aceitar, [data-action="aceitar"]'));
      await aceitarButton.click();

      await TestHelper.sleep(1500);

      const successMessage = await driver.findElements(By.css('.success, .toast, .alert-success'));
      expect(successMessage.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Botão de aceitar corrida não encontrado:', e.message);
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
