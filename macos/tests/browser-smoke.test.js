// Run: node tests/browser-smoke.test.js (requires Playwright and Chromium)
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function run() {
  const executablePath = process.env.YMC_CHROMIUM || undefined;
  const browser = await chromium.launch({ executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 1260, height: 850 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(platform => {
      if (platform) Object.defineProperty(navigator, 'platform', { value: platform });
      const config = { discordRpc: false, discordClientId: '', discordShowPaused: false, discordShowAlbum: false };
      window.ymMods = {
        checkUpdate: async () => ({ available: true, version: '0.7.2', notes: 'Новая версия для проверки' }),
        installUpdate: async () => {
          window.ymcInstallRequested = true;
          return { error: 'Тестовая установка остановлена.' };
        },
        getState: async () => ({ config, discord: config.discordRpc ? 'connected' : 'off' }),
        setConfig: async patch => {
          window.lastDiscordPatch = patch;
          Object.assign(config, patch);
          return { ok: true, discord: config.discordRpc ? 'connected' : 'off' };
        },
        ...(platform === 'Win32' ? {} : { reportTrack: track => { window.lastDiscordTrack = track; } })
      };
      if (!localStorage.getItem('ymc:theme:v1')) {
        localStorage.setItem('ymc:last-version', '0.7.1');
        localStorage.setItem('ymc:theme:v1', JSON.stringify({ version: 1, name: 'Старая тема', round: 9, customCss: 'body{--legacy:1}' }));
      }
    }, process.env.YMC_TEST_PLATFORM);
    await page.goto(pathToFileURL(path.join(__dirname, '../demo.html')).href);
    const ui = page.locator('#ymusic-customizer-root');
    const openSettings = () => ui.evaluate(el => {
      for (const button of el.shadowRoot.querySelectorAll('.section-toggle[aria-expanded=false]')) button.click();
      for (const details of el.shadowRoot.querySelectorAll('.settings-more:not(#ymc-smart-groups)')) details.open = true;
    });
    const launcher = page.locator('[data-ymc-launcher]');
    await launcher.waitFor();
    if (process.env.YMC_TEST_PLATFORM === 'Win32') assert.match(await launcher.getAttribute('title'), /Ctrl\+Shift\+Y/);
    assert.match(await launcher.evaluate(el => el.nextElementSibling.className), /userProfileContainer/);
    const theme = () => page.evaluate(() => window.YMusicCustomizer.getTheme());
    const track = () => ui.locator('#ymc-now-track').textContent();
    const grid = () => page.locator('.DefaultLayout_root__demo').evaluate(el => getComputedStyle(el).gridTemplateAreas);
    assert.equal((await theme()).name, 'Старая тема');
    assert.equal((await theme()).cardRound, 9);
    assert.match(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundImage), /linear-gradient/);
    assert.equal(await grid(), '"navbar content" "navbar playerbar"');

    await page.keyboard.press('Control+Shift+Y');
    assert.equal(await ui.locator('#ymc-editor').isVisible(), true);
    await ui.locator('#ymc-update-summary').getByText('Обновления · v0.7.2').waitFor();
    assert.equal(await page.evaluate(() => window.ymcInstallRequested), undefined);
    await ui.locator('#ymc-update-summary').click();
    assert.equal(await ui.locator('#ymc-update-notes').textContent(), 'Новая версия для проверки');
    await ui.locator('#ymc-update-install').click();
    await ui.locator('#ymc-update-status').getByText('Тестовая установка остановлена.').waitFor();
    assert.equal(await page.evaluate(() => window.ymcInstallRequested), true);
    await ui.locator('#ymc-update-summary').click();
    assert.equal(await ui.locator('#ymc-theme-smart .section-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await ui.locator('#ymc-theme-spectrum .section-toggle').getAttribute('aria-expanded'), 'false');
    await ui.locator('#p-barSpectrum').check();
    await ui.locator('#ymc-spectrum-show-preview').click();
    await page.waitForFunction(() => {
      const shadow = document.querySelector('#ymusic-customizer-root').shadowRoot;
      const canvas = shadow.querySelector('#ymc-spectrum-preview');
      return shadow.querySelector('#ymc-spectrum-preview-label').textContent === 'Макет без звука' &&
        canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(value => value > 0);
    });
    for (const [profile, shape] of [['studio', 'bars'], ['neon', 'line'], ['pixels', 'segments'], ['dots', 'dots'], ['wave', 'wave']]) {
      await ui.locator('#ymc-spectrum-profile').selectOption(profile);
      assert.equal(await ui.locator('[data-prop=spectrumStyle]').inputValue(), shape);
      assert.equal((await theme()).spectrumStyle, 'wave');
    }
    await ui.locator('#ymc-spectrum-show-preview').click();
    await ui.locator('#p-barSpectrum').uncheck();
    assert.equal(await ui.locator('#p-spectrumGain').isDisabled(), true);
    await ui.locator('#p-spectrumGain').waitFor({ state: 'hidden' });
    assert.equal(await ui.locator('#p-barSpectrum').isVisible(), true);
    await openSettings();
    const layout = page.locator('.DefaultLayout_root__demo');
    const panel = ui.locator('#ymc-editor .panel');
    assert.ok((await layout.boundingBox()).x + (await layout.boundingBox()).width <= (await panel.boundingBox()).x);
    assert.equal(await page.locator('#test-audio').isVisible(), true);
    await ui.locator('[data-tab=theme]').click();
    await ui.locator('#p-panelOpacity').fill('0');
    assert.equal(await page.locator('.NavbarDesktop_root__demo').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await page.locator('.NavbarDesktop_root__demo').evaluate(el => getComputedStyle(el).backdropFilter), 'none');
    await ui.locator('#p-panelOpacity').fill('83');
    await ui.locator('#p-separateSurfaces').check();
    await ui.locator('[data-prop=player]').fill('#112233');
    await ui.locator('#p-manualScale').check();
    await ui.locator('#p-scale').fill('110');
    assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).fontSize), '17.6px');
    assert.match(await page.locator('section.PlayerBarDesktop_root__demo').evaluate(el => getComputedStyle(el).backgroundColor), /17, 34, 51/);
    assert.equal(await page.locator('.PlayerBarDesktop_controls__demo').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await ui.locator('[data-tab=player]').click();
    await ui.locator('#p-widePlayer').check();
    assert.equal(await grid(), '"navbar content" "playerbar playerbar"');
    await page.setViewportSize({ width: 620, height: 830 });
    await page.waitForFunction(() => !document.querySelector('[data-ymc-wide]'));
    assert.equal(await grid(), '"content" "playerbar"');
    const narrowClose = await ui.locator('#ymc-close').boundingBox();
    assert.ok(narrowClose && narrowClose.x + narrowClose.width <= 620);
    await page.setViewportSize({ width: 1260, height: 850 });
    await page.waitForFunction(() => Boolean(document.querySelector('[data-ymc-wide]')));
    await ui.locator('[data-tab=theme]').click();
    await ui.locator('#p-visualizer').check();
    await ui.locator('[data-tab=player]').click();
    await ui.locator('#ymc-player-preview').click();
    assert.equal(await track(), 'Неоновая ночь');
    assert.equal(await ui.locator('#ymc-spectrum-start').isDisabled(), true);
    await ui.locator('[data-action=next]').click();
    assert.equal(await track(), 'Синий горизонт');
    await ui.locator('[data-action=like]').click();
    assert.equal(await page.locator('[data-test-id=LIKE_BUTTON]').getAttribute('aria-pressed'), 'true');
    await ui.locator('[data-action=toggle]').click();
    assert.equal(await ui.locator('[data-action=toggle]').textContent(), 'Пауза');
    await ui.locator('#ymc-seek').fill('500');
    assert.equal(await page.locator('[aria-label="Штатный прогресс"]').inputValue(), '104');
    await ui.locator('[data-action=queue]').click();
    assert.equal(await ui.locator('#ymc-now').isHidden(), true);
    assert.match(await page.locator('#demo-status').textContent(), /Очередь макета/);

    await page.locator('#test-audio').click();
    await page.waitForFunction(() => !document.querySelector('#demo-audio').paused);
    await launcher.click();
    await ui.locator('#ymc-player-open').click();
    await ui.locator('#ymc-spectrum-start').click();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#ymusic-customizer-root').shadowRoot.querySelector('#ymc-spectrum');
      return !canvas.hidden && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(v => v > 0);
    });
    await page.keyboard.press('Escape');
    assert.equal(await ui.locator('#ymc-now').isHidden(), true);
    assert.equal(await page.locator('#demo-audio').evaluate(el => el.paused), false);
    await page.locator('#test-audio').click();

    await launcher.click();
    await ui.locator('[data-tab=library]').click();
    await ui.locator('[data-tab=files]').click();
    await ui.locator('#ymc-css').fill('body{--custom: 1}');
    await ui.locator('#ymc-css-apply').click();
    const cssFiles = [
      { name: 'b.css', mimeType: 'text/css', buffer: Buffer.from('body{--addon: 2;--ym-controls-color-primary-default-enabled: #77aa33}') },
      { name: 'a.css', mimeType: 'text/css', buffer: Buffer.from('body{--addon: 1}') }
    ];
    const dismissed = page.waitForEvent('dialog').then(dialog => dialog.dismiss());
    await ui.locator('#ymc-addon-file').setInputFiles(cssFiles);
    await dismissed;
    assert.equal((await theme()).addonEnabled, false);
    page.once('dialog', dialog => dialog.accept());
    await ui.locator('#ymc-addon-file').setInputFiles(cssFiles);
    await page.waitForFunction(() => document.querySelectorAll('[data-ymc-addon]').length === 2);
    assert.deepEqual((await theme()).addonSheets.map(sheet => sheet.name), ['a.css', 'b.css']);
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--addon').trim()), '2');
    const accent = () => page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--ym-controls-color-primary-default-enabled').trim().toLowerCase());
    assert.equal(await accent(), '#77aa33');
    await ui.locator('#p-addonPalette').uncheck();
    assert.equal(await accent(), '#a855f7');
    await ui.locator('#p-addonEnabled').uncheck();
    assert.equal(await page.locator('[data-ymc-addon]').count(), 0);
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--custom').trim()), '1');
    const cssDownload = page.waitForEvent('download');
    await ui.locator('#ymc-css-export').click();
    const exportedCss = await readFile(await (await cssDownload).path(), 'utf8');
    assert.doesNotMatch(exportedCss, /data-ymc-active|--addon/);
    assert.match(exportedCss, /--custom: 1/);

    await ui.locator('#ymc-theme-file').setInputFiles({
      name: 'legacy.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 1, name: 'Импорт v1', round: 7, accent: '#123456' }))
    });
    await page.waitForFunction(() => window.YMusicCustomizer.getTheme().name === 'Импорт v1');
    assert.equal((await theme()).customCss, '');
    assert.equal((await theme()).addonSheets.length, 0);
    assert.equal((await theme()).cardRound, 7);
    assert.equal(await grid(), '"navbar content" "navbar playerbar"');

    await ui.locator('[data-tab=theme]').click();
    await ui.locator('[data-prop=mode]').selectOption('image');
    const png = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 2;
      return canvas.toDataURL().split(',')[1];
    });
    await ui.locator('#ymc-file').setInputFiles({ name: 'wallpaper.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundImage.includes('data:image/jpeg'));
    await ui.locator('[data-prop=mode]').selectOption('cover');
    await page.evaluate(data => {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Тест обложки', artwork: [{ src: 'data:image/png;base64,' + data }]
      });
    }, png);
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundImage.includes('data:image/png'));
    await ui.locator('[data-tab=library]').click();
    await ui.locator('[data-tab=files]').click();
    const download = page.waitForEvent('download');
    await ui.locator('#ymc-export').click();
    const json = JSON.parse(await readFile(await (await download).path(), 'utf8'));
    assert.equal(json.version, 2);
    assert.equal(json.name, 'Импорт v1');
    assert.equal(json.mode, 'cover');

    await ui.locator('[data-tab=theme]').click();
    await ui.locator('#p-enabled').uncheck();
    assert.equal(await page.locator('html').getAttribute('data-ymc-active'), 'no');
    assert.equal(await ui.locator('#ymc-player-open').isHidden(), true);
    await page.reload();
    await openSettings();
    assert.equal((await theme()).name, 'Импорт v1');
    assert.equal((await theme()).enabled, false);
    const mountVibe = () => page.evaluate(() => {
      const cutout = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="27" r="15" fill="#efc4ae"/><path d="M12 73a28 28 0 0 1 56 0Z" fill="#67719d"/></svg>');
      document.querySelector('main').insertAdjacentHTML('afterbegin', `
        <section class="VibePage_meta__fixture" style="position:relative">
          <div class="VibePage_vibeAnimation__fixture">Штатный фон</div>
          <div style="position:relative;z-index:1" class="VibePage_entityMetaBody__fixture">
            <h2>Артист</h2>
            <a data-test-id="VIBE_ARTIST_COVER" class="VibeArtistCover_root__fixture" href="#artist">
              <img id="fixture-portrait" class="VibeArtistCover_cover__fixture" src="${cutout}" width="80" height="80" alt="Портрет">
            </a>
            <div class="VibeArtistCover_root__fixture"><img id="fixture-no-portrait" alt=""></div>
          </div>
          <div data-test-id="VIBE_PLAYERBAR">
            <div class="VibePage_albumCover__fixture">Обложка<img id="fixture-album-art" src="${cutout}" width="22" height="22" alt=""></div>
            <div class="VibePlayerBar_progress__fixture">
              <div class="fixture-track" data-test-id="VIBE_PLAYERBAR_TIMECODE_SLIDER"><span class="VibePlayerbarTrackName_trackNameText__fixture">Трек</span></div>
              <button class="VibePlayerBar_button__fixture" aria-label="Нравится">Лайк</button>
            </div>
          </div>
          <div class="VibePlayerControls_root__fixture"><button>Пауза</button></div>
        </section>`);
    });
    await mountVibe();
    await launcher.click();
    await ui.locator('#p-enabled').check();
    const backdrop = page.locator('[data-ymc-app-media]');
    const original = page.locator('.VibePage_vibeAnimation__fixture');
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    await page.waitForFunction(() => !document.querySelector('#ymusic-customizer-root').shadowRoot.querySelector('#ymc-vibe-pick').disabled);
    await ui.locator('#ymc-vibe-file').setInputFiles({ name: 'vibe.gif', mimeType: 'image/gif', buffer: gif });
    await backdrop.waitFor();
    assert.equal(await backdrop.evaluate(el => el.tagName), 'IMG');
    assert.equal(await backdrop.evaluate(el => el.parentElement.parentElement === document.body), true);
    assert.equal(await original.isVisible(), true);
    await ui.locator('[data-tab=layout]').click();
    await ui.locator('#p-vibeAnimation').uncheck();
    assert.equal(await original.isHidden(), true);
    assert.equal(await page.getByRole('heading', { name: 'Артист', exact: true }).isVisible(), true);
    await ui.locator('#p-vibeAnimation').check();
    assert.equal(await original.isVisible(), true);

    const portrait = page.locator('#fixture-portrait');
    const effect = ui.locator('[data-prop=portraitEffect]');
    const source = ui.locator('[data-prop=portraitColorSource]');
    const previewColor = ui.locator('#ymc-portrait-color');
    const filter = el => decodeURIComponent(getComputedStyle(el).filter);
    await portrait.evaluate(el => el.decode());
    assert.equal(await portrait.evaluate(filter), 'none');
    assert.equal(await source.isDisabled(), true);
    await effect.selectOption('glow');
    assert.equal(await ui.locator('#p-portraitOutline').isDisabled(), true);
    assert.match(await portrait.evaluate(filter), /feGaussianBlur/);
    assert.doesNotMatch(await portrait.evaluate(filter), /result="outline"/);
    await effect.selectOption('outline');
    assert.equal(await ui.locator('#p-portraitSpread').isDisabled(), true);
    assert.match(await portrait.evaluate(filter), /result="outline"/);
    assert.doesNotMatch(await portrait.evaluate(filter), /feGaussianBlur/);
    await effect.selectOption('both');
    await source.selectOption('custom');
    await ui.locator('[data-prop=portraitColor]').fill('#29bb79');
    await ui.locator('#p-portraitSpread').fill('36');
    const width = ui.locator('[data-number=portraitOutline]');
    await width.fill('5');
    await width.press('Enter');
    await ui.locator('#p-portraitIntensity').fill('60');
    assert.equal(await previewColor.textContent(), '#29BB79');
    assert.match(await portrait.evaluate(filter), /flood-color="#29BB79" flood-opacity="0.6"/);
    assert.match(await portrait.evaluate(filter), /stdDeviation="12"/);
    assert.match(await portrait.evaluate(filter), /radius="5" result="edge"/);
    assert.equal(await page.locator('#fixture-album-art').evaluate(filter), 'none');
    assert.equal(await page.locator('#fixture-no-portrait').evaluate(filter), 'none');
    assert.equal(await ui.locator('#ymc-portrait-preview').evaluate(filter), await portrait.evaluate(filter));

    const gifAccent = (await ui.locator('[data-palette-color=portraitAccent]').getAttribute('aria-label')).slice(-7).toUpperCase();
    await source.selectOption('background');
    assert.equal(await previewColor.textContent(), gifAccent);
    assert.match(await portrait.evaluate(filter), new RegExp('flood-color="' + gifAccent + '"', 'i'));
    const beforeWallpaper = await theme();
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#CDEECF';
      ctx.fillRect(0, 0, 4, 4);
      YMusicCustomizer.update({ appMediaEnabled: false, mode: 'image', wallpaper: canvas.toDataURL() });
    });
    await page.waitForFunction(accent => document.querySelector('#ymusic-customizer-root').shadowRoot
      .getElementById('ymc-portrait-color').textContent !== accent, (await theme()).accent);
    assert.match(await portrait.evaluate(filter), new RegExp('flood-color="' + (await previewColor.textContent()) + '"', 'i'));
    await page.evaluate(({ mode, wallpaper }) => YMusicCustomizer.update({ mode, wallpaper }), beforeWallpaper);
    assert.equal(await previewColor.textContent(), (await theme()).accent);
    await page.evaluate(() => YMusicCustomizer.update({ appMediaEnabled: true }));
    await ui.locator('#ymc-compare').click();
    assert.equal(await portrait.evaluate(filter), 'none');
    await ui.locator('#ymc-compare').click();
    assert.match(await portrait.evaluate(filter), /feGaussianBlur/);

    await ui.locator('[data-tab=theme]').click();
    const colorBefore = await panel.evaluate(el => getComputedStyle(el).backgroundColor);
    const swatchBefore = await ui.locator('[data-palette-color=background]').getAttribute('style');
    await ui.locator('[data-palette-variant=light]').click();
    assert.notEqual(await ui.locator('[data-palette-color=background]').getAttribute('style'), swatchBefore);
    assert.equal(await ui.locator('[data-palette-variant]').count(), 6);
    await ui.locator('[data-palette-variant=balanced]').click();
    await ui.locator('#ymc-apply-palette').click();
    assert.notEqual(await panel.evaluate(el => getComputedStyle(el).backgroundColor), colorBefore);
    const pickedPalette = await theme();
    assert.notEqual(pickedPalette.spectrumStart, pickedPalette.spectrumEnd);
    assert.notEqual(pickedPalette.spectrumStart, '#8B5CF6');
    assert.notEqual(pickedPalette.playlistOpacity, 65);
    assert.ok(await ui.locator('#ymc-palette-spectrum').isVisible());
    const themePanel = pickedPalette.panel;
    assert.equal(await ui.evaluate(el => el.style.getPropertyValue('--bg')), themePanel);

    await ui.locator('[data-tab=layout]').click();
    await ui.locator('#p-vibeCoverOpacity').fill('44');
    assert.equal(await page.locator('.VibePage_albumCover__fixture').evaluate(el => getComputedStyle(el).opacity), '0.44');
    for (const [slider, toggle, selector] of [
      ['vibeTrackOpacity', 'hideVibeTrack', '.fixture-track'],
      ['vibeControlsOpacity', 'hideVibeControls', '.VibePlayerBar_button__fixture']
    ]) {
      await ui.locator('#p-' + slider).fill('0');
      const target = page.locator(selector);
      assert.match(await target.evaluate(el => getComputedStyle(el).backgroundColor), /^rgba\(\d+, \d+, \d+, 0\)$/);
      assert.equal(await target.evaluate(el => getComputedStyle(el).opacity), '1');
      await ui.locator('#p-' + toggle).check();
      assert.equal(await target.isHidden(), true);
      await ui.locator('#p-' + toggle).uncheck();
      assert.equal(await target.isVisible(), true);
    }
    await ui.locator('[data-tab=player]').click();
    await ui.locator('#p-barCustom').check();
    await ui.locator('#p-barOpacity').fill('0');
    const bar = page.locator('[data-ymc-bar-backdrop]');
    assert.equal(await bar.evaluate(el => getComputedStyle(el, '::before').opacity), '0');
    await ui.locator('#ymc-bar-file').setInputFiles({ name: 'bar.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.waitForFunction(() => window.YMusicCustomizer.getTheme().barWallpaper.startsWith('data:image/jpeg'));
    assert.match(await bar.evaluate(el => getComputedStyle(el, '::before').backgroundImage), /data:image\/jpeg/);
    await ui.locator('[data-tab=theme]').click();
    await ui.locator('#p-barSpectrum').check();
    await ui.locator('[data-prop=spectrumPlacement]').selectOption('bar');
    await page.evaluate(() => {
      const audio = document.querySelector('#demo-audio');
      const capture = audio.captureStream.bind(audio);
      window.ymcCaptureAttempts = 0;
      audio.captureStream = () => ++window.ymcCaptureAttempts === 1 ? new MediaStream() : capture();
    });
    await page.keyboard.press('Escape');
    await page.locator('#demo-audio').evaluate(el => el.remove());
    await page.locator('#test-audio').click();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[data-ymc-bar-backdrop] canvas');
      return canvas?.dataset.signal === 'live' && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(v => v > 0);
    });
    assert.ok(await page.evaluate(() => window.ymcCaptureAttempts >= 2), 'retries after an empty capture');
    await page.locator('#test-audio').click();
    await page.waitForFunction(() => document.querySelector('[data-ymc-bar-backdrop] canvas')?.dataset.signal === 'idle');
    await launcher.click();
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.body.insertAdjacentHTML('beforeend',
      '<div data-test-id="FULLSCREEN_PLAYER_MODAL" style="position:fixed;inset:0"></div>'));
    await launcher.waitFor({ state: 'hidden' });
    assert.equal(await backdrop.count(), 1);
    await page.locator('[data-test-id=FULLSCREEN_PLAYER_MODAL]').evaluate(el => el.remove());
    await launcher.waitFor();
    await backdrop.waitFor();

    await page.reload();
    await openSettings();
    await backdrop.waitFor();
    assert.equal((await theme()).portraitEffect, 'both');
    assert.equal((await theme()).portraitColorSource, 'background');
    assert.equal(await original.count(), 0);
    await mountVibe();
    await launcher.click();
    const video = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(15);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      const done = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start();
      const paint = setInterval(() => {
        ctx.fillStyle = 'rgb(' + (Date.now() % 255) + ',100,180)';
        ctx.fillRect(0, 0, 32, 32);
      }, 30);
      await new Promise(resolve => setTimeout(resolve, 450));
      recorder.stop();
      await done;
      clearInterval(paint);
      stream.getTracks().forEach(track => track.stop());
      return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
    });
    await ui.locator('#ymc-vibe-file').setInputFiles({ name: 'vibe.webm', mimeType: 'video/webm', buffer: Buffer.from(video) });
    await page.waitForFunction(() => {
      const el = document.querySelector('video[data-ymc-app-media]');
      return el?.loop && el.muted && !el.paused;
    });
    await page.evaluate(() => {
      document.querySelector('.VibePage_meta__fixture').insertAdjacentHTML('beforeend', `
        <h2 class="VibePage_text__fixture">Имя артиста</h2>
        <p class="VibePage_words__fixture">AI-подсказка</p>
        <div class="VibePage_wheel__fixture">Колесо</div>
        <svg id="filled-like"><use href="#liked_xxs"></use></svg>
        <svg id="filled-xlink"><use xlink:href="/icons/sprite.svg#liked_m"></use></svg>
        <svg id="empty-xlink"><use xlink:href="/icons/sprite.svg#like_m"></use></svg>
        <svg id="empty-like"><use href="#like_xxs"></use></svg>
        <div class="PlaylistPage_wrapper__fixture">
          <nav data-test-id="NAVIGATION_CONTROLS">
            <button data-test-id="NAVIGATION_BACKWARD_BUTTON" aria-label="Вернуться назад"><svg viewBox="0 0 12 12" width="12" height="12"><path fill="#000" d="M9 0L2 6l7 6z"/></svg></button>
            <button data-test-id="NAVIGATION_FORWARD_BUTTON" aria-label="Вернуться вперед"><svg viewBox="0 0 12 12" width="12" height="12" fill="none"><path stroke="#000" d="m4 0 6 6-6 6"/></svg></button>
          </nav>
          <div class="PlaylistPage_averageColorBackground__fixture" style="background:linear-gradient(#ddd,transparent)">Градиент</div>
          <div class="PageHeaderPlaylistCover_root__fixture"><img id="playlist-cover" alt="Обложка"></div>
          <div class="CommonPageHeader_controlsContainer__fixture">
            <button class="CommonPageHeader_playControl__fixture">Слушать</button>
            <button data-test-id="PLAYLIST_HEADER_CONTEXT_MENU_BUTTON">Меню</button>
          </div>
          <div class="PlaylistFilters_carousel__fixture"><button role="tab" aria-selected="true">Всё</button><button role="tab" aria-selected="false">Спокойное</button></div>
          <div class="SearchInput_root__fixture"><input data-test-id="SEARCH_PLAYLIST_INPUT" placeholder="Поиск трека"></div>
        </div>
      `);
    });
    const backgroundBox = await page.locator('[data-ymc-app-backdrop]').boundingBox();
    assert.ok(Math.abs(backgroundBox.width - (await panel.boundingBox()).x) < 1);
    await ui.locator('[data-prop=text]').fill('#2244aa');
    assert.equal(await page.locator('.VibePage_text__fixture').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    await ui.locator('#p-contrastGuard').uncheck();
    assert.equal(await page.locator('.VibePage_text__fixture').evaluate(el => getComputedStyle(el).color), 'rgb(34, 68, 170)');
    await ui.locator('[data-tab=layout]').click();
    await ui.locator('#p-aiTrackCards').uncheck();
    assert.equal(await page.locator('.VibePage_words__fixture').isHidden(), true);
    assert.equal(await page.evaluate(async () => {
      try { await fetch('https://api.music.yandex.net/words/cards', { method: 'POST' }); }
      catch (error) { return error.name; }
    }), 'AbortError');
    await ui.locator('#p-showVibeWheel').uncheck();
    assert.equal(await page.locator('.VibePage_wheel__fixture').isHidden(), true);
    await ui.locator('#p-hideVibeLike').check();
    assert.equal(await page.locator('.VibePlayerBar_button__fixture').isHidden(), true);
    await ui.locator('#p-hideVibeLike').uncheck();
    await ui.locator('#p-customVibeButtons').check();
    await ui.locator('[data-prop=vibeFill]').fill('#334455');
    assert.match(await page.locator('.VibePlayerBar_button__fixture').evaluate(el => getComputedStyle(el).backgroundColor), /51, 68, 85/);

    await ui.locator('#ymc-settings-search').fill('плейлисты фон плейлиста');
    await ui.locator('#ymc-settings-results button').filter({ hasText: /^Фон плейлистаПлейлисты/ }).click();
    assert.equal(await ui.locator('[data-tab=playlists]').getAttribute('aria-pressed'), 'true');
    const background = page.locator('.PlaylistPage_averageColorBackground__fixture');
    const image = el => getComputedStyle(el).backgroundImage;
    const backgroundColor = el => getComputedStyle(el).backgroundColor;
    assert.doesNotMatch(await background.evaluate(image), /221, 221, 221/);
    const mode = ui.locator('[data-prop=playlistGradient]');
    await mode.selectOption('native');
    assert.match(await background.evaluate(image), /221, 221, 221/);
    await mode.selectOption('theme');
    await ui.locator('[data-prop=playlistStart]').fill('#203060');
    const angle = ui.locator('[data-number=playlistAngle]');
    await angle.fill('123');
    await angle.press('Enter');
    assert.match(await background.evaluate(image), /123deg.*32, 48, 96/);
    assert.match(await ui.locator('#ymc-playlist-preview').evaluate(image), /123deg.*32, 48, 96/);
    assert.equal(await ui.locator('#p-playlistAngle').inputValue(), '123');
    await mode.selectOption('solid');
    assert.match(await background.evaluate(backgroundColor), /32, 48, 96/);
    assert.equal(await angle.isDisabled(), true);
    await mode.selectOption('off');
    assert.equal(await background.evaluate(image), 'none');
    assert.equal(await background.evaluate(el => getComputedStyle(el).opacity), '0');
    await ui.locator('#ymc-playlist-palette').click();
    assert.match(await background.evaluate(image), /123deg/);

    await ui.locator('#p-playlistCustomButtons').check();
    await ui.locator('[data-prop=playlistPrimary]').fill('#5588dd');
    await ui.locator('[data-prop=playlistSelected]').fill('#dd4411');
    await ui.locator('[data-prop=playlistFilterBorder]').fill('#556677');
    await ui.locator('#p-playlistButtonRound').fill('12');
    const listen = page.locator('.CommonPageHeader_playControl__fixture');
    assert.match(await listen.evaluate(backgroundColor), /85, 136, 221/);
    assert.equal(await listen.evaluate(el => getComputedStyle(el).borderRadius), '12px');
    const filters = page.locator('.PlaylistFilters_carousel__fixture button');
    assert.match(await filters.first().evaluate(el => getComputedStyle(el).boxShadow), /221, 68, 17/);
    assert.match(await filters.last().evaluate(el => getComputedStyle(el).boxShadow), /85, 102, 119/);
    await ui.locator('#p-playlistCoverCustom').check();
    await ui.locator('#p-playlistCoverRound').fill('26');
    assert.equal(await page.locator('#playlist-cover').evaluate(el => getComputedStyle(el).borderRadius), '26px');
    await ui.locator('#p-playlistSearchCustom').check();
    await ui.locator('[data-prop=playlistSearchText]').fill('#42cccc');
    assert.equal(await page.locator('[data-test-id=SEARCH_PLAYLIST_INPUT]').evaluate(el => getComputedStyle(el).color), 'rgb(66, 204, 204)');

    await ui.locator('[data-prop=navigationFill]').fill('#000000');
    await ui.locator('[data-prop=navigationText]').fill('#000000');
    await ui.locator('#p-navigationOpacity').fill('100');
    const backward = page.locator('[data-test-id=NAVIGATION_BACKWARD_BUTTON] path');
    const forward = page.locator('[data-test-id=NAVIGATION_FORWARD_BUTTON] path');
    assert.equal(await backward.evaluate(el => getComputedStyle(el).fill), 'rgb(0, 0, 0)');
    await ui.locator('[data-tab=theme]').click();
    assert.match(await ui.locator('#ymc-contrast-issues').textContent(), /Стрелки навигации · 1\.0:1/);
    await ui.locator('#p-contrastGuard').check();
    assert.equal(await backward.evaluate(el => getComputedStyle(el).fill), 'rgb(255, 255, 255)');
    assert.equal(await forward.evaluate(el => getComputedStyle(el).stroke), 'rgb(255, 255, 255)');
    assert.equal(await forward.evaluate(el => getComputedStyle(el).fill), 'none');
    assert.equal((await theme()).navigationText, '#000000');
    await ui.locator('#ymc-contrast-fix').click();
    assert.equal((await theme()).navigationText, '#FFFFFF');
    await ui.locator('#ymc-undo').click();
    assert.equal((await theme()).navigationText, '#000000');
    await ui.locator('#ymc-redo').click();
    assert.equal((await theme()).navigationText, '#FFFFFF');
    await page.keyboard.press('Control+z');
    assert.equal((await theme()).navigationText, '#000000');
    await ui.locator('#p-contrastGuard').uncheck();
    await ui.locator('#ymc-nav-link').click();
    assert.equal(await ui.locator('[data-tab=playlists]').getAttribute('aria-pressed'), 'true');

    const savedBeforeCompare = await page.evaluate(() => localStorage.getItem('ymc:theme:v2'));
    await ui.locator('#ymc-compare').click();
    assert.equal(await page.locator('html').getAttribute('data-ymc-active'), 'no');
    assert.equal(await backdrop.count(), 0);
    assert.match(await background.evaluate(image), /221, 221, 221/);
    assert.equal((await theme()).enabled, true);
    assert.equal(await page.evaluate(() => localStorage.getItem('ymc:theme:v2')), savedBeforeCompare);
    await ui.locator('#ymc-compare').click();
    assert.match(await background.evaluate(image), /123deg/);
    assert.equal(await backdrop.count(), 1);
    await ui.locator('#ymc-settings-changed').click();
    await ui.locator('#ymc-settings-search').fill('плейлисты угол');
    await ui.locator('#ymc-settings-results button').filter({ hasText: /Угол градиента/ }).click();
    assert.equal(await ui.locator('#p-playlistAngle').evaluate(el => el === el.getRootNode().activeElement), true);
    page.once('dialog', dialog => dialog.accept());
    await ui.locator('#ymc-playlists-gradient .block-reset').click();
    assert.equal((await theme()).playlistAngle, 180);
    assert.equal((await theme()).playlistPrimary, '#5588DD');
    await ui.locator('[data-tab=theme]').click();
    assert.equal(await page.locator('#filled-xlink use').evaluate(el =>
      el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')), '/icons/sprite.svg#liked_m');
    await ui.locator('#p-likedCustom').check();
    await ui.locator('[data-prop=likedColor]').fill('#f23467');
    assert.equal(await page.locator('#filled-xlink').evaluate(el => getComputedStyle(el).color), 'rgb(242, 52, 103)');
    await ui.locator('[data-prop=likedShape]').selectOption('star');
    assert.match(await page.locator('#filled-xlink').evaluate(el => getComputedStyle(el).maskImage), /data:image\/svg/);
    assert.equal(await page.locator('#empty-xlink').evaluate(el => getComputedStyle(el).maskImage), 'none');
    assert.match(await page.locator('#filled-like').evaluate(el => getComputedStyle(el).maskImage), /data:image\/svg/);
    assert.equal(await page.locator('#empty-like').evaluate(el => getComputedStyle(el).maskImage), 'none');
    await ui.locator('#ymc-liked-file').setInputFiles({ name: 'like.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.waitForFunction(() => window.YMusicCustomizer.getTheme().likedShape === 'image');
    assert.match(await page.locator('#filled-like').evaluate(el => getComputedStyle(el).backgroundImage), /data:image\/png/);
    await ui.locator('#p-likedTintImage').check();
    assert.match(await page.locator('#filled-like').evaluate(el => getComputedStyle(el).maskImage), /data:image\/png/);
    await ui.locator('#p-likedTintImage').uncheck();

    await ui.locator('[data-tab=theme]').click();
    await ui.locator('[data-prop=spectrumPlacement]').selectOption('page');
    await ui.locator('[data-prop=spectrumStyle]').selectOption('line');
    await ui.locator('[data-prop=spectrumGradient]').selectOption('horizontal');
    await page.keyboard.press('Escape');
    await page.locator('#test-audio').click();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[data-ymc-page-spectrum] canvas');
      return canvas?.dataset.signal === 'live' && canvas.width >= canvas.clientWidth &&
        canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(value => value > 0);
    });
    await page.locator('#test-audio').click();

    await launcher.click();
    await ui.locator('[data-tab=library]').click();
    await ui.locator('#ymc-library-name').fill('Тема с видео');
    await ui.locator('#ymc-library-save').click();
    await ui.locator('[data-store-card]', { hasText: 'Тема с видео' }).waitFor();
    const packageDownload = page.waitForEvent('download');
    await ui.locator('#ymc-library-export-selected').click();
    const packageBytes = await readFile(await (await packageDownload).path());
    assert.equal(packageBytes.subarray(0, 4).toString(), 'YMC1');
    assert.ok(packageBytes.length > video.length);
    await ui.locator('[data-tab=theme]').click();
    await ui.locator('#ymc-vibe-clear').click();
    await backdrop.waitFor({ state: 'detached' });
    assert.equal(await original.isVisible(), true);
    await ui.locator('[data-tab=library]').click();
    await ui.locator('#ymc-library-import-file').setInputFiles({
      name: 'theme.ymctheme', mimeType: 'application/octet-stream', buffer: packageBytes
    });
    await page.waitForFunction(() => {
      const ui = document.querySelector('#ymusic-customizer-root').shadowRoot;
      return ui.querySelector('#ymc-notice').textContent.includes('Тема импортирована');
    });
    await ui.locator('#ymc-library-apply').click();
    await page.locator('video[data-ymc-app-media]').waitFor();
    assert.equal((await theme()).text, '#2244AA');
    assert.equal((await theme()).spectrumPlacement, 'page');
    assert.ok((await theme()).likedImage.startsWith('data:image/png'));
    assert.ok((await theme()).barWallpaper.startsWith('data:image/jpeg'));
    await ui.locator('[data-store-group=files]').click();
    const options = await ui.locator('[data-store-card] strong').allTextContents();
    assert.ok(options.includes('vibe.gif') && options.includes('vibe.webm'));
    await ui.locator('[data-store-group=presets]').click();
    assert.equal(await ui.locator('[data-store-card]').count(), 24);
    await ui.locator('#ymc-store-category').selectOption('Неон');
    assert.equal(await ui.locator('[data-store-card]').count(), 6);
    const neon = ui.locator('.store-card', { hasText: 'Киберпанк' });
    await neon.locator('[data-store-apply]').click();
    await page.waitForFunction(() => YMusicCustomizer.getTheme().name === 'Киберпанк');
    assert.equal((await theme()).likedShape, 'diamond');
    assert.equal((await theme()).glowIntensity, 78);
    assert.equal((await theme()).likedMotion, 'sparkle');
    await backdrop.waitFor({ state: 'detached' });
    await ui.locator('#ymc-undo').click();
    await page.locator('video[data-ymc-app-media]').waitFor();
    assert.equal((await theme()).text, '#2244AA');
    await ui.locator('#ymc-store-category').selectOption('all');
    await ui.locator('#ymc-store-search').fill('северное');
    assert.equal(await ui.locator('[data-store-card]').count(), 1);
    assert.match(await ui.locator('[data-store-card]').textContent(), /Северное сияние/);
    await ui.locator('#ymc-store-search').fill('');
    const guide = ui.locator('#ymc-guide');
    const offer = ui.locator('#ymc-guide-offer');
    const progress = ui.locator('#ymc-guide-progress');
    const next = ui.locator('#ymc-guide-next');
    await ui.locator('#ymc-guide-open').click();
    await guide.waitFor();
    assert.equal(await progress.textContent(), 'Магазин и CSS · Шаг 1 из 5');
    assert.notEqual(await ui.locator('#ymc-guide-spot').evaluate(el => getComputedStyle(el).boxShadow), 'none');
    await next.click();
    await next.click();
    assert.equal(await ui.locator('#ymc-guide-title').textContent(), 'Свой CSS');
    assert.equal(await ui.locator('[data-tab=files]').getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await guide.isHidden(), true);
    assert.equal(await ui.locator('#ymc-editor').isVisible(), true);
    assert.equal(await offer.isVisible(), true);
    await ui.locator('#ymc-guide-start').click();
    assert.equal(await ui.locator('.tabs [data-tab]').count(), 5);
    const categories = new Set();
    const guideTitles = new Set();
    for (let step = 1; step <= 35; step++) {
      const label = await progress.textContent();
      assert.match(label, new RegExp('Шаг ' + step + ' из 35$'));
      categories.add(label.split(' · ')[0]);
      guideTitles.add(await ui.locator('#ymc-guide-title').textContent());
      await next.click();
    }
    assert.equal(categories.size, 5);
    for (const title of ['Портрет артиста', 'Умная тема по треку', 'Эквалайзер на фоне', 'Редактор анимаций', 'Стрелки назад и вперёд', 'Конструктор нижнего плеера']) {
      assert.ok(guideTitles.has(title), title);
    }
    assert.equal(await guide.isHidden(), true);
    assert.equal(await offer.isHidden(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('ymc:guide:seen')), '0.7.1');
    await page.reload();
    await launcher.click();
    assert.equal(await offer.isHidden(), true);
    await page.evaluate(() => {
      localStorage.setItem('ymc:last-version', '0.5.6');
      localStorage.setItem('ymc:guide:seen', '0.5.6');
    });
    await page.reload();
    await ui.locator('#ymc-whats-new').waitFor();
    assert.match(await ui.locator('#ymc-release-range').textContent(), /v0.5.6 до v0.7.1/);
    assert.match(await ui.locator('#ymc-release-notes').textContent(), /v0.6.0/);
    await ui.locator('#ymc-release-guide').click();
    assert.match(await progress.textContent(), /Шаг 1 из 12/);
    const updatedSections = new Set();
    for (let step = 1; step <= 12; step++) {
      updatedSections.add(await ui.locator('#ymc-guide-title').textContent());
      await next.click();
    }
    for (const title of ['Анимация «Моей волны»', 'Панель навигации', 'Фон шапки плейлиста']) assert.ok(updatedSections.has(title), title);
    assert.equal(updatedSections.has('Свой CSS'), false);
    assert.equal(await offer.isHidden(), true);
    await page.reload();
    assert.equal(await ui.locator('#ymc-whats-new').isHidden(), true);
    await launcher.click();
    await openSettings();
    await page.evaluate(() => {
      const player = document.querySelector('.PlayerBarDesktop_root__demo');
      const sonataState = { entityMeta: { title: 'вклубе', id: '42', albumId: '17' }, position: 27, duration: 99 };
      player.__reactFiber$ymcTest = { memoizedProps: { value: { isRootModel: true, sonataState } } };
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'вклубе', artist: 'тёмный принц', album: ' ВКЛУБЕ ' });
      navigator.mediaSession.playbackState = 'playing';
    });
    await ui.locator('[data-tab=player]').click();
    const discordCard = ui.locator('#ymc-discord-preview');
    const discordDetails = discordCard.locator('#ymc-discord-details');
    await discordCard.getByText('вклубе', { exact: true }).waitFor();
    assert.match(await discordCard.textContent(), /Слушает Я\. Музыка · nautro/);
    assert.equal(await discordDetails.textContent(), 'тёмный принц');
    assert.equal(await discordCard.locator('#ymc-discord-elapsed').textContent(), '0:27');
    assert.equal(await discordCard.locator('#ymc-discord-duration').textContent(), '1:39');
    assert.equal(await discordCard.locator('#ymc-discord-open-track').getAttribute('href'), 'https://music.yandex.ru/album/17/track/42');
    await ui.locator('#ymc-discord-album').check();
    assert.equal(await discordDetails.textContent(), 'тёмный принц');
    await page.evaluate(() => {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'вклубе', artist: 'тёмный принц', album: 'Ночной альбом' });
    });
    await discordCard.getByText('тёмный принц · Ночной альбом', { exact: true }).waitFor();
    if (process.env.YMC_TEST_PLATFORM !== 'Win32') {
      await page.waitForFunction(() => window.lastDiscordTrack?.trackId === '42' && window.lastDiscordTrack.album === 'Ночной альбом');
    }
    await page.evaluate(() => { navigator.mediaSession.playbackState = 'paused'; });
    await discordCard.waitFor({ state: 'hidden' });
    await ui.locator('#ymc-discord-enabled').check();
    await ui.locator('#ymc-discord-save').click();
    assert.equal(await page.evaluate(() => window.lastDiscordPatch), undefined);
    await ui.locator('#ymc-discord-id').fill('123456789012345678');
    await ui.locator('#ymc-discord-paused').check();
    await discordCard.getByText('На паузе · тёмный принц · Ночной альбом', { exact: true }).waitFor();
    assert.ok(await discordCard.locator('#ymc-discord-time').isHidden());
    await ui.locator('#ymc-discord-save').click();
    await page.waitForFunction(() => window.lastDiscordPatch?.discordRpc);
    assert.deepEqual(await page.evaluate(() => window.lastDiscordPatch),
      { discordClientId: '123456789012345678', discordRpc: true, discordShowPaused: true, discordShowAlbum: true });
    await page.evaluate(() => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    });

    await page.evaluate(() => {
      document.body.insertAdjacentHTML('beforeend', `
        <section id="ymc-fixture-bar" data-test-id="PLAYERBAR_DESKTOP" style="width:800px">
          <div class="PlayerBarDesktopWithBackgroundProgressBar_progressBar__fixture"></div>
          <div class="PlayerBarDesktopWithBackgroundProgressBar_player__fixture" style="display:flex">
            <div class="PlayerBarDesktopWithBackgroundProgressBar_info__fixture">
              <div class="PlayerBarDesktopWithBackgroundProgressBar_infoCard__fixture">
                <div data-test-id="PLAYERBAR_DESKTOP_COVER_CONTAINER"></div>
                <div><b class="Meta_title__fixture">Трек</b><small class="Meta_artists__fixture">Артист</small></div>
              </div>
            </div>
            <div class="PlayerBarDesktopWithBackgroundProgressBar_sonata__fixture"><button>Играть</button></div>
            <div class="PlayerBarDesktopWithBackgroundProgressBar_meta__fixture"><button>Очередь</button></div>
          </div>
        </section>`);
    });
    await ui.locator('[data-prop=barLayout]').selectOption('center');
    await ui.locator('#p-barHeight').fill('92');
    await ui.locator('#p-barCoverSize').fill('57');
    await ui.locator('#p-barControlsSize').fill('112');
    await ui.locator('#p-barProgressSize').fill('6');
    await ui.locator('[data-prop=barProgressMode]').selectOption('always');
    const fixtureBar = page.locator('#ymc-fixture-bar');
    assert.equal(await fixtureBar.evaluate(el => getComputedStyle(el).height), '92px');
    assert.equal(await fixtureBar.locator('[class*=ProgressBar_player__]').evaluate(el => getComputedStyle(el).display), 'grid');
    assert.equal(await fixtureBar.locator('[data-test-id=PLAYERBAR_DESKTOP_COVER_CONTAINER]').evaluate(el => getComputedStyle(el).width), '57px');
    assert.equal(await fixtureBar.locator('[class*=ProgressBar_sonata__]').evaluate(el => getComputedStyle(el).zoom), '1.12');
    assert.equal(await fixtureBar.locator('[class*=ProgressBar_progressBar__]').evaluate(el => getComputedStyle(el).height), '6px');
    await ui.locator('#p-hideBarArtist').check();
    assert.equal(await fixtureBar.locator('.Meta_artists__fixture').isHidden(), true);
    await ui.locator('[data-prop=barLayout]').selectOption('native');
    assert.equal(await ui.locator('#p-barHeight').isDisabled(), true);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => YMusicCustomizer.update({
      mode: 'gradient', accent: '#224466', panel: '#244444', background: '#101018', text: '#DDEAFF',
      contrastGuard: true, appMediaEnabled: false, smartTheme: false, smartTransition: 1600, smartStrength: 100, smartPlaylist: false
    }));
    await ui.locator('[data-tab=layout]').click();
    await ui.locator('#p-motionEnabled').check();
    await ui.locator('#p-motionBackground').check();
    await ui.locator('#p-motionBackgroundSpeed').fill('9');
    const bodyMotion = () => page.locator('body').evaluate(el => [getComputedStyle(el).animationName, getComputedStyle(el).animationDuration]);
    assert.deepEqual(await bodyMotion(), ['ymc-background-drift', '9s']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal((await bodyMotion())[0], 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await ui.locator('#p-motionEnabled').uncheck();

    await ui.locator('[data-tab=theme]').click();
    await ui.locator('#p-smartTheme').check();
    await ui.locator('#ymc-smart-groups summary').click();
    await ui.locator('#p-smartAccent').uncheck();
    assert.equal(await ui.locator('#p-smartAccentAmount').isDisabled(), true);
    await ui.locator('#p-smartAccentAmount').waitFor({ state: 'hidden' });
    await ui.locator('#p-smartBackgroundAmount').fill('100');
    const setCover = (sides, center, title) => page.evaluate(([sides, center, title]) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#242424';
      ctx.fillRect(0, 0, 48, 48);
      ctx.fillStyle = sides;
      ctx.fillRect(0, 0, 9, 35);
      ctx.fillRect(39, 0, 9, 35);
      ctx.fillStyle = center;
      ctx.fillRect(13, 11, 22, 22);
      ctx.fillStyle = '#714FCC';
      ctx.fillRect(14, 38, 20, 8);
      navigator.mediaSession.metadata = new MediaMetadata({ title, artwork: [{ src: canvas.toDataURL() }] });
    }, [sides, center, title]);
    const role = name => ui.locator(`#ymc-smart-preview [data-role="${name}"] code`).textContent();
    const channels = hex => hex.slice(1).match(/../g).map(channel => parseInt(channel, 16));
    const cssColor = hex => 'rgb(' + channels(hex).join(', ') + ')';
    const bodyColor = () => page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    const waitBodyColor = expected => page.waitForFunction(expected =>
      getComputedStyle(document.body).backgroundColor === expected, expected);
    await setCover('#158C4D', '#EFBD23', 'Первая обложка');
    await ui.locator('#ymc-smart-preview').waitFor();
    const firstColor = await role('background');
    const firstSpectrum = await ui.locator('#ymc-smart-preview').evaluate(el =>
      el.style.getPropertyValue('--role-spectrum').match(/#[0-9a-f]{6}/gi));
    const firstText = await role('text');
    const firstButtons = await role('vibePlayFill');
    const [red, green, blue] = channels(firstColor);
    assert.ok(green > red && green > blue, firstColor);
    const golden = color => {
      const [r, g, b] = channels(color);
      return r > b + 15 && g > b + 15;
    };
    assert.ok(golden(firstText), 'gold text: ' + firstText);
    assert.ok(golden(firstButtons), 'gold buttons: ' + firstButtons);
    assert.ok(firstSpectrum.every(color => {
      const [r, g, b] = channels(color);
      return g > r + 25 && g > b + 15;
    }), 'one green hue matches the larger cover area: ' + firstSpectrum);
    await page.waitForFunction(end => !['rgb(16, 16, 24)', end].includes(getComputedStyle(document.body).backgroundColor), cssColor(firstColor));
    await waitBodyColor(cssColor(firstColor));
    await page.waitForFunction(expected => getComputedStyle(document.body).color === expected, cssColor(firstText));
    assert.equal(await accent(), '#224466');
    assert.equal((await theme()).background, '#101018');
    assert.equal((await theme()).text, '#DDEAFF');
    assert.match(await ui.locator('#ymc-smart-status').textContent(), /Первая обложка/);
    await ui.locator('[data-prop=smartPaletteStyle]').selectOption('light');
    const lightColor = await role('background');
    assert.ok(channels(lightColor).every((channel, index) => channel > channels(firstColor)[index] + 80));
    await waitBodyColor(cssColor(lightColor));
    await ui.locator('#p-smartText').uncheck();
    assert.equal(await role('text'), '#DDEAFF');
    await ui.locator('#p-smartSpectrum').uncheck();
    assert.equal(await role('spectrumMid'), (await theme()).spectrumMid);
    await ui.locator('[data-prop=smartPaletteStyle]').selectOption('balanced');
    await setCover('#3058C3', '#D83C66', 'Вторая обложка');
    await page.waitForFunction(() => document.querySelector('#ymusic-customizer-root').shadowRoot
      .getElementById('ymc-smart-status').textContent.includes('Вторая обложка') &&
      document.querySelector('#ymusic-customizer-root').shadowRoot.getElementById('ymc-smart-status').textContent.startsWith('Используется'));
    const secondColor = await role('background');
    assert.notEqual(secondColor, firstColor);
    await waitBodyColor(cssColor(secondColor));
    await page.evaluate(() => {
      YMusicCustomizer.update({ smartStrength: 92, gradientEnd: '#50206B',
        portraitColorSource: 'custom', portraitColor: '#A855F7', smartPortrait: true });
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#C41C1B';
      ctx.fillRect(0, 0, 48, 48);
      ctx.fillStyle = '#23185E';
      ctx.fillRect(9, 9, 30, 30);
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Красная рамка', artwork: [{ src: canvas.toDataURL() }] });
    });
    await page.waitForFunction(() => document.querySelector('#ymusic-customizer-root').shadowRoot
      .getElementById('ymc-smart-status').textContent.startsWith('Используется палитра обложки «Красная рамка'));
    const redBackdrop = await role('background');
    const blueGradient = await role('gradientEnd');
    const [backRed, backGreen, backBlue] = channels(redBackdrop);
    const [gradientRed, gradientGreen, gradientBlue] = channels(blueGradient);
    assert.ok(backRed > Math.max(backGreen, backBlue) + 40, 'larger red area supplies the background: ' + redBackdrop);
    assert.ok(gradientBlue > Math.max(gradientRed, gradientGreen) + 45, 'large blue area supplies the gradient end: ' + blueGradient);
    await page.waitForFunction(color => getComputedStyle(document.body).backgroundImage.includes(color), cssColor(blueGradient));
    const [auraRed, auraGreen, auraBlue] = channels(await role('portraitColor'));
    assert.ok(auraRed > auraBlue + 55 && Math.abs(auraGreen - auraBlue) <= 10, 'aura should stay red');
    await ui.locator('#p-smartPortrait').uncheck();
    assert.equal(await role('portraitColor'), '#A855F7');
    await ui.locator('#p-smartPortrait').check();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => YMusicCustomizer.update({
      mode: 'solid', barSpectrum: true, spectrumStyle: 'bars', spectrumGradient: 'vertical', smartSpectrum: true,
      spectrumStart: '#DE2020', spectrumMid: '#28DF35', spectrumEnd: '#254CE0', smartSpectrumAmount: 70
    }));
    const backgroundImage = () => page.locator('body').evaluate(el => getComputedStyle(el).backgroundImage);
    assert.match(await backgroundImage(), /^linear-gradient/, 'smart gradient owns the background even with a saved solid mode');
    await ui.locator('#p-smartGradient').uncheck();
    assert.equal(await backgroundImage(), 'none');
    await ui.locator('#p-smartGradient').check();
    await ui.locator('#ymc-spectrum-show-preview').click();
    await page.waitForFunction(() => {
      const preview = document.querySelector('#ymusic-customizer-root').shadowRoot.querySelector('#ymc-spectrum-preview');
      if (!preview.width || !preview.height) return false;
      const pixels = preview.getContext('2d').getImageData(0, 0, preview.width, preview.height).data;
      let count = 0, dim = 255, bright = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        const [r, g, b, a] = pixels.subarray(i, i + 4);
        if (a < 110 || Math.max(r, g, b) - Math.min(r, g, b) < 25) continue;
        if (r < Math.max(g, b) + 65 || Math.abs(g - b) > 9) return false;
        count++;
        dim = Math.min(dim, r);
        bright = Math.max(bright, r);
      }
      return count > 20 && bright - dim > 25;
    });
    await ui.locator('#p-smartSpectrum').uncheck();
    const manualStops = await ui.locator('#ymc-smart-preview').evaluate(el =>
      el.style.getPropertyValue('--role-spectrum').match(/#[0-9a-f]{6}/gi));
    assert.deepEqual(manualStops, ['#DE2020', '#28DF35', '#254CE0']);
    await page.evaluate(() => YMusicCustomizer.update({ spectrumGradient: 'horizontal' }));
    await page.waitForFunction(() => {
      const preview = document.querySelector('#ymusic-customizer-root').shadowRoot.querySelector('#ymc-spectrum-preview');
      const pixels = preview.getContext('2d').getImageData(0, 0, preview.width, preview.height).data;
      const found = [false, false, false];
      for (let i = 0; i < pixels.length; i += 16) {
        const [r, g, b, a] = pixels.subarray(i, i + 4);
        if (a < 95) continue;
        if (r > Math.max(g, b) + 85) found[0] = true;
        if (g > Math.max(r, b) + 85) found[1] = true;
        if (b > Math.max(r, g) + 85) found[2] = true;
      }
      return found.every(Boolean);
    });
    await ui.locator('#ymc-spectrum-show-preview').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const whiteCover = await page.evaluate(() => {
      YMusicCustomizer.update({ mode: 'gradient', background: '#441159', gradientEnd: '#50206B', accent: '#A855F7',
        smartText: true, smartSpectrum: true, smartSpectrumAmount: 100, smartAccent: true, smartStrength: 92 });
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#F5F4F2';
      ctx.fillRect(0, 0, 48, 48);
      ctx.fillStyle = '#292929';
      ctx.fillRect(18, 15, 8, 25);
      const sheet = document.getElementById('ymc-dynamic-theme');
      window.ymcStyleChanges = 0;
      new MutationObserver(records => { window.ymcStyleChanges += records.length; }).observe(sheet, { childList: true });
      return canvas.toDataURL().split(',')[1];
    });
    let coverAttempts = 0;
    const coverUrl = 'https://avatars.yandex.net/ymc-regression-cover.png';
    await page.route(coverUrl, route => ++coverAttempts === 1
      ? route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' } })
      : route.fulfill({ contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(whiteCover, 'base64') }));
    await page.evaluate(src => {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Белая обложка', artwork: [{ src }] });
    }, coverUrl);
    await page.waitForFunction(() => document.querySelector('#ymusic-customizer-root').shadowRoot
      .getElementById('ymc-smart-status').textContent.startsWith('Используется палитра обложки «Белая'));
    assert.ok(coverAttempts >= 2, 'failed cover should be retried');
    for (const name of ['background', 'gradientEnd', 'text', 'portraitColor', 'spectrumMid']) {
      const hex = await role(name);
      const values = channels(hex);
      assert.ok(Math.max(...values) - Math.min(...values) <= 10, name + ' must be neutral: ' + hex);
    }
    await waitBodyColor(cssColor(await role('background')));
    assert.ok(await page.evaluate(() => window.ymcStyleChanges <= 2), 'palette transition should retain its stylesheet');
    await ui.locator('#p-smartTheme').uncheck();
    assert.equal(await bodyColor(), 'rgb(68, 17, 89)');
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      YMusicCustomizer.update({ barSpectrum: true, spectrumPlacement: 'page', spectrumStyle: 'wave' });
      const button = document.createElement('button');
      button.id = 'test-native-graph';
      button.textContent = 'Проверить штатный аудиограф';
      button.addEventListener('click', async () => {
        const audio = new Audio(testSignal());
        audio.loop = true;
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(audio);
        const gain = ctx.createGain();
        gain.gain.value = .01;
        source.connect(gain).connect(ctx.destination);
        await ctx.resume();
        await audio.play();
        window.testAudioGraph = { audio, ctx };
      });
      document.querySelector('main').prepend(button);
    });
    await page.locator('#test-native-graph').click();
    await page.waitForFunction(() => {
      const diag = YMusicCustomizer.diagnostics();
      return diag.spectrumInput === 'native' && diag.spectrumState === 'live';
    });
    await page.evaluate(async () => {
      const { audio, ctx } = window.testAudioGraph;
      audio.pause();
      await ctx.close();
    });
    assert.deepEqual(errors, []);
    console.log('PASS: spectrum recovery and drawn cover colors, cover gradients and auras, cover retry, stable stylesheet, 35 first-run and 12 upgrade guide steps, existing controls');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
