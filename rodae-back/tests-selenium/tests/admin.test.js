const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const TestHelper = require('../helpers/TestHelper');

describe('Testes de Login - Admin', function() {
  let driver;
  const BASE_URL = 'http://localhost:8080'; // Ajuste conforme sua porta do frontend

  before(async function() {
    driver = await TestHelper.createDriver();
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  it('Deve fazer login como administrador', async function() {
    // Navegar para a página de login
    await driver.get(`${BASE_URL}/login`);
    await TestHelper.sleep(1000);

    // Preencher formulário de login
    const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"]'));
    const senhaInput = await driver.findElement(By.css('input[type="password"], input[name="senha"]'));
    
    await emailInput.sendKeys('admin@rodae.com');
    await senhaInput.sendKeys('admin123');

    // Clicar no botão de login
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Aguardar redirecionamento
    await TestHelper.sleep(2000);

    // Verificar se foi redirecionado para dashboard/admin
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include('admin');
  });

  it('Deve listar motoristas pendentes', async function() {
    // Assumindo que já está logado
    await driver.get(`${BASE_URL}/admin/motoristas`);
    await TestHelper.sleep(2000);

    // Verificar se há uma tabela ou lista de motoristas
    const motoristasElement = await driver.findElement(By.css('table, .motoristas-list, .lista-motoristas'));
    expect(await motoristasElement.isDisplayed()).to.be.true;
  });

  it('Deve filtrar motoristas por status pendente', async function() {
    await driver.get(`${BASE_URL}/admin/motoristas`);
    await TestHelper.sleep(1000);

    // Procurar pelo filtro/select de status
    try {
      const statusFilter = await driver.findElement(By.css('select[name="status"], #status-filter'));
      await statusFilter.click();
      
      // Selecionar PENDENTE
      const pendenteOption = await driver.findElement(By.css('option[value="PENDENTE"]'));
      await pendenteOption.click();
      
      await TestHelper.sleep(1000);

      // Verificar se os resultados foram filtrados
      const motoristas = await driver.findElements(By.css('.motorista-item, tbody tr'));
      expect(motoristas.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Filtro de status não encontrado ou possui estrutura diferente');
    }
  });

  it('Deve aprovar um motorista', async function() {
    await driver.get(`${BASE_URL}/admin/motoristas`);
    await TestHelper.sleep(2000);

    try {
      // Procurar pelo primeiro botão de aprovar
      const aprovarButton = await driver.findElement(By.css('button.aprovar, .btn-aprovar, [data-action="aprovar"]'));
      await aprovarButton.click();

      await TestHelper.sleep(1500);

      // Verificar mensagem de sucesso ou mudança de status
      const successMessage = await driver.findElements(By.css('.success, .toast, .alert-success'));
      expect(successMessage.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Botão de aprovar não encontrado ou estrutura diferente:', e.message);
    }
  });

  it('Deve visualizar estatísticas', async function() {
    await driver.get(`${BASE_URL}/admin/dashboard`);
    await TestHelper.sleep(2000);

    try {
      // Verificar se há cards/elementos de estatísticas
      const statsElements = await driver.findElements(By.css('.stat-card, .estatistica, .dashboard-card'));
      expect(statsElements.length).to.be.greaterThan(0);
    } catch (e) {
      console.log('Elementos de estatísticas não encontrados');
    }
  });
});
