const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function check(browser, platform) {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(pathToFileURL(path.resolve(__dirname,'..',platform,'demo.html')).href);
  await page.waitForFunction(() => window.YMusicCustomizer);
  const ui = page.locator('#ymusic-customizer-root');
  const original = await page.evaluate(() => {
    YMusicCustomizer.update({name:'До магазина',background:'#263244',waveStyle:'custom',waveRelease:550});
    return YMusicCustomizer.getTheme();
  });
  async function openStore() {
    await page.evaluate(() => YMusicCustomizer.open());
    await ui.locator('#ymc-open-store').evaluate(button => button.click());
    await ui.locator('[data-store-group=presets]').click();
  }
  const apply = ui.locator('.store-card').filter({hasText:'Вкусно — и точка'}).locator('[data-store-apply]');
  await openStore();
  await apply.click();
  await page.waitForFunction(() => YMusicCustomizer.getTheme().navBrand === 'vkusno');
  assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().sidebarDock),'native');
  await ui.locator('#ymc-revert-preset').click();
  assert.deepEqual(await page.evaluate(() => YMusicCustomizer.getTheme()),original);
  await apply.click();
  await page.waitForFunction(() => YMusicCustomizer.getTheme().navBrand === 'vkusno');
  await page.reload();
  await page.waitForFunction(() => window.YMusicCustomizer);
  await openStore();
  await ui.locator('#ymc-undo').click();
  assert.deepEqual(await page.evaluate(() => YMusicCustomizer.getTheme()),original);
  await ui.locator('#ymc-redo').click();
  assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().navBrand),'vkusno');
  if (process.env.YMC_PRESET_SCREENSHOT) {
    await page.keyboard.press('Escape');
    await page.screenshot({path:process.env.YMC_PRESET_SCREENSHOT+'-'+platform+'.png'});
  }
  await page.close();
  console.log('PASS',platform,'store restore, persistent undo and redo, native navigation');
}
(async () => {
  const browser = await chromium.launch({executablePath:process.env.YMC_CHROMIUM || undefined});
  try { for (const platform of ['macos','windows']) await check(browser,platform); }
  finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1});
