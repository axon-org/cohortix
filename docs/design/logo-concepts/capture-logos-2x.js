const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  
  const htmlPath = path.join(__dirname, 'render-transparent.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(2000);

  const dir = __dirname;
  await (await page.locator('#wordmark-white')).screenshot({ path: path.join(dir, 'cohortix-wordmark-white@2x.png'), omitBackground: true });
  await (await page.locator('#wordmark-dark')).screenshot({ path: path.join(dir, 'cohortix-wordmark-dark@2x.png'), omitBackground: true });
  await (await page.locator('#favicon-white')).screenshot({ path: path.join(dir, 'cohortix-icon-white@2x.png'), omitBackground: true });
  await (await page.locator('#favicon-dark')).screenshot({ path: path.join(dir, 'cohortix-icon-dark@2x.png'), omitBackground: true });

  console.log('2x PNGs exported!');
  await browser.close();
})();
