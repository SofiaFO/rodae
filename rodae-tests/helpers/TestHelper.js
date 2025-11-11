const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class TestHelper {
  static async createDriver() {
    console.log('🚀 Iniciando Chrome...');
    
    const options = new chrome.Options();
    
    // Modo headless DESABILITADO - você verá o navegador abrir
    // options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--start-maximized');

    try {
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      // Configurar timeouts
      await driver.manage().setTimeouts({
        implicit: 10000,
        pageLoad: 30000,
        script: 30000
      });

      console.log('✅ Chrome iniciado com sucesso!');
      return driver;
    } catch (error) {
      console.error('❌ Erro ao criar driver:', error.message);
      throw error;
    }
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async waitForElement(driver, locator, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const element = await driver.findElement(locator);
        if (await element.isDisplayed()) {
          return element;
        }
      } catch (e) {
        // Elemento ainda não encontrado
      }
      await this.sleep(100);
    }
    throw new Error(`Element ${locator} not found after ${timeout}ms`);
  }

  static async safeClick(driver, locator) {
    try {
      const element = await this.waitForElement(driver, locator);
      await element.click();
      return true;
    } catch (e) {
      console.log(`Erro ao clicar no elemento ${locator}:`, e.message);
      return false;
    }
  }

  static async safeSendKeys(driver, locator, text) {
    try {
      const element = await this.waitForElement(driver, locator);
      await element.clear();
      await element.sendKeys(text);
      return true;
    } catch (e) {
      console.log(`Erro ao preencher elemento ${locator}:`, e.message);
      return false;
    }
  }
}

module.exports = TestHelper;
