const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'render-transparent.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(2000);

  // Wordmark white (for dark backgrounds)
  const wmWhite = await page.locator('#wordmark-white');
  await wmWhite.screenshot({ path: path.join(__dirname, 'cohortix-wordmark-white.png'), omitBackground: true });

  // Wordmark dark (for light backgrounds)
  const wmDark = await page.locator('#wordmark-dark');
  await wmDark.screenshot({ path: path.join(__dirname, 'cohortix-wordmark-dark.png'), omitBackground: true });

  // Favicon white
  const favWhite = await page.locator('#favicon-white');
  await favWhite.screenshot({ path: path.join(__dirname, 'cohortix-icon-white.png'), omitBackground: true });

  // Favicon dark
  const favDark = await page.locator('#favicon-dark');
  await favDark.screenshot({ path: path.join(__dirname, 'cohortix-icon-dark.png'), omitBackground: true });

  console.log('All PNGs exported with transparent backgrounds!');
  await browser.close();
})();
