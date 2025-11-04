const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class TestHelper {
  static async createDriver() {
    const options = new chrome.Options();
    // Descomente a linha abaixo para rodar em modo headless
    // options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--window-size=1920,1080');

    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    return driver;
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
}

module.exports = TestHelper;
