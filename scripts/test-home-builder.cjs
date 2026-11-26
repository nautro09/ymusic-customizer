const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function check(browser, platform) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 820 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(__dirname, '..', platform, 'demo.html')).href);
  const mountHero = () => page.evaluate(() => {
    const hero = document.createElement('section');
    hero.dataset.testId = 'VIBE_PAGE';
    hero.style.cssText = 'position:fixed;inset:40px 15px 110px 120px;container-type:size;background:#181c24';
    hero.innerHTML = '<div data-test-id="VIBE_DYNAMIC_ARTISTS" style="position:absolute;top:100px;left:10%;font-size:32px">Исполнитель</div>' +
      '<button data-test-id="VIBE_PLAYERBAR_TIMECODE_SLIDER" style="position:absolute;bottom:20%;left:30%;width:180px;height:48px">Трек</button>';
    hero.querySelector('button').onclick = () => { window.sliderClicked = true; };
    document.body.append(hero);
    YMusicCustomizer.update({ waveClock:'date', clockStyle:'orbit' });
  });
  await page.waitForFunction(() => window.YMusicCustomizer);
  await mountHero();
  const ui = page.locator('#ymusic-customizer-root');
  const find = id => ui.locator('#ymc-' + id);
  await page.evaluate(() => YMusicCustomizer.open());
  await ui.locator('[data-tab="layout"]').click();
  await find('home-builder').locator('.section-toggle').click();
  await find('builder-open').click();
  const frame = find('builder-frame');
  const block = page.locator('[data-test-id="VIBE_PLAYERBAR_TIMECODE_SLIDER"]');
  const waitPaint = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await find('builder-block').selectOption('timeline');
  await waitPaint();
  const initial = await block.boundingBox();
  const rect = await frame.boundingBox();
  await page.mouse.move(rect.x + 8, rect.y + 8);
  await page.mouse.down();
  await page.mouse.move(rect.x + 98, rect.y - 42, { steps:4 });
  await page.mouse.up();
  await waitPaint();
  const moved = await block.boundingBox();
  assert.ok(Math.abs(moved.x-initial.x-90) < 2 && Math.abs(moved.y-initial.y+50) < 2, JSON.stringify({initial,moved}));
  await find('builder-size').fill('135');
  await waitPaint();
  assert.ok(Math.abs((await block.boundingBox()).width - initial.width*1.35) < 1);
  await find('builder-save').click();
  await find('close').click();
  await block.click();
  assert.equal(await page.evaluate(() => window.sliderClicked), true);
  const saved = await page.evaluate(() => YMusicCustomizer.getTheme().homeLayout);
  assert.equal(JSON.parse(saved).timeline[2], 135);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ymc:theme:v2') || '{}').homeLayout ||
    Object.keys(localStorage).some(key => localStorage.getItem(key).includes('"homeLayout":"{')));
  await page.reload();
  await mountHero();
  await waitPaint();
  assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().homeLayout), saved);
  assert.ok(Math.abs((await block.boundingBox()).width - initial.width*1.35) < 1);
  await page.setViewportSize({ width:840, height:650 });
  await waitPaint();
  const field = await page.locator('[data-test-id="VIBE_PAGE"]').boundingBox();
  const smaller = await block.boundingBox();
  const [relative] = JSON.parse(saved).timeline;
  assert.ok(Math.abs(smaller.x+smaller.width/2-field.x-field.width*relative/1000) < 2);
  await page.evaluate(() => YMusicCustomizer.open());
  await ui.locator('[data-tab="layout"]').click();
  if (await find('home-builder').locator('.section-toggle').getAttribute('aria-expanded') === 'false') {
    await find('home-builder').locator('.section-toggle').click();
  }
  await find('builder-open').click();
  await find('builder-reset').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().homeLayout), saved);
  await find('builder-open').click();
  await find('builder-reset').click();
  await find('builder-save').click();
  assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().homeLayout), '');
  assert.equal((await block.boundingBox()).width, initial.width);
  assert.deepEqual(errors, []);
  console.log('PASS', platform, 'home layout drag, resize, save, reload, responsive geometry, native click, cancel and reset');
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.YMC_CHROMIUM || undefined });
  try {
    for (const platform of ['macos', 'windows']) await check(browser, platform);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
