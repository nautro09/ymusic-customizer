// Run with Playwright and Chromium: node scripts/test-desktop-controls.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function platformSmoke(browser, platform, navigatorPlatform) {
  const page = await browser.newPage({ viewport: { width: 1260, height: 850 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(navigatorPlatform => {
      Object.defineProperty(navigator, 'platform', { value: navigatorPlatform });
      window.ymMods = {
        checkUpdate: async () => {
          const version = localStorage.getItem('test:next-version') ?? '0.7.1';
          return { available: Boolean(version), version, notes: 'Проверка новой версии' };
        },
        installUpdate: async () => {
          window.updateRequested = true;
          return { error: 'Тестовый ответ установщика' };
        }
      };
    }, navigatorPlatform);
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', platform, 'demo.html')).href);
    const ui = page.locator('#ymusic-customizer-root');
    const toast = ui.locator('#ymc-update-toast');
    await toast.waitFor();
    assert.match(await toast.textContent(), /Вышел Customizer 0\.7\.1/);
    assert.equal(await ui.locator('#ymc-editor').isHidden(), true);
    const toastRect = await toast.boundingBox();
    assert.ok(toastRect.x > 800 && toastRect.y < 65, 'the toast starts in the top right');
    await ui.locator('#ymc-update-toast-close').click();
    await toast.waitFor({ state: 'hidden' });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#ymusic-customizer-root')?.shadowRoot
      .querySelector('#ymc-update-label').textContent.includes('0.7.1'));
    assert.equal(await toast.isHidden(), true, 'the same release stays dismissed');

    const nextRelease = async version => {
      await page.evaluate(version => localStorage.setItem('test:next-version', version), version);
      await page.reload();
      await toast.waitFor();
      assert.match(await ui.locator('#ymc-update-toast-title').textContent(), new RegExp(version.replaceAll('.', '\\.')));
    };
    await nextRelease('0.7.2');
    const label = await ui.locator('#ymc-update-toast-title').boundingBox();
    await page.mouse.move(label.x + 8, label.y + label.height / 2);
    await page.mouse.down();
    await page.mouse.move(label.x + 113, label.y + label.height / 2, { steps: 6 });
    await page.mouse.up();
    await toast.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => localStorage.getItem('ymc:update:dismissed')), '0.7.2');
    await nextRelease('0.7.3');
    await ui.locator('#ymc-update-toast-open').click();
    const editor = ui.locator('#ymc-editor');
    await editor.waitFor();
    const updateCard = ui.locator('#ymc-update-card');
    const panel = ui.locator('#ymc-panel');
    const head = panel.locator('.head');
    assert.equal(await head.locator('#ymc-update-summary').count(), 0);
    assert.equal(await ui.locator('#ymc-preview').count(), 0);
    assert.equal(await ui.locator('.editor-footer #ymc-update-summary').isVisible(), true);
    assert.equal(await updateCard.isVisible(), true);
    assert.match(await updateCard.textContent(), /Проверка новой версии/);
    assert.equal(await page.evaluate(() => window.updateRequested), undefined);
    await ui.locator('#ymc-update-install').click();
    await ui.locator('#ymc-update-status').getByText('Тестовый ответ установщика').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await updateCard.isHidden(), true);
    assert.equal(await editor.isVisible(), true);

    const handle = ui.getByRole('separator', { name: 'Ширина редактора' });
    const width = () => editor.evaluate(node => Math.round(node.getBoundingClientRect().width));
    assert.equal(await width(), 510, 'the previous settings width is the minimum');
    const handleRect = await handle.boundingBox();
    await page.mouse.move(handleRect.x + handleRect.width / 2, handleRect.y + handleRect.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleRect.x - 150, handleRect.y + handleRect.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.ok(await width() >= 650 && await width() <= 680, 'the left edge expands the editor');
    const chosenWidth = await width();
    await ui.locator('[data-tab=library]').click();
    assert.equal(await width(), chosenWidth);
    await page.reload();
    await page.locator('[data-ymc-launcher]').click();
    assert.equal(await width(), chosenWidth);
    await handle.focus();
    await page.keyboard.press('Home');
    assert.equal(await width(), 510);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await width(), 530);
    await page.keyboard.press('End');
    assert.equal(await width(), 1058);
    await page.keyboard.press('Home');
    await page.setViewportSize({ width: 390, height: 760 });
    await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--ymc-dock') === '390px');
    assert.equal(await handle.isHidden(), true);
    await page.setViewportSize({ width: 1260, height: 850 });
    await handle.waitFor();

    await ui.locator('#p-patternEnabled').check();
    const picker = ui.locator('[data-prop=patternStyle]');
    const pattern = page.locator('[data-ymc-pattern]');
    const ink = pattern.locator('.ymc-pattern-ink').first();
    const masks = new Set();
    const readMask = () => ink.evaluate(node => getComputedStyle(node).maskImage);
    const options = await picker.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
    assert.equal(options.length, 15);
    for (const option of options) {
      await picker.selectOption(option);
      const mask = await readMask();
      assert.match(mask, /^url\("data:image\/svg\+xml,/);
      masks.add(mask);
      const visibleArt = await ink.evaluate(async node => {
        const svgUrl = getComputedStyle(node).maskImage.slice(5, -2);
        const decoded = decodeURIComponent(svgUrl.slice(svgUrl.indexOf(',') + 1));
        if (new DOMParser().parseFromString(decoded, 'image/svg+xml').querySelector('parsererror')) return false;
        const image = new Image();
        image.src = svgUrl;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 320;
        const draw = canvas.getContext('2d');
        draw.drawImage(image, 0, 0);
        return draw.getImageData(0, 0, 320, 320).data.some((value, index) => index % 4 === 3 && value > 70);
      });
      assert.equal(visibleArt, true, option);
    }
    assert.equal(masks.size, 15, 'all built-in/custom modes draw distinct masks');
    await ui.locator('[data-prop=patternSymbols]').fill('<&✦');
    assert.match(decodeURIComponent(await readMask()), /&#x3c;|&#x26;/);
    await picker.selectOption('constellations');
    await ui.locator('[data-prop=patternPalette]').selectOption('custom');
    const fixedArtwork = await readMask();
    await ui.locator('[data-prop=patternPrimary]').fill('#20d8bb');
    assert.equal(await readMask(), fixedArtwork, 'changing colors does not rebuild geometry');
    assert.equal(await ink.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(32, 216, 187)');
    await ui.locator('#ymc-theme-pattern summary').click();
    await ui.locator('#ymc-pattern-shuffle').click();
    assert.notEqual(await readMask(), fixedArtwork);
    assert.equal(await pattern.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    assert.ok(Math.abs((await pattern.boundingBox()).width - (await editor.boundingBox()).x) <= 1);
    await ui.locator('[data-prop=patternMotion]').selectOption('both');
    assert.equal(await ink.evaluate(el => getComputedStyle(el).animationName), 'ymc-pattern-travel');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await ink.evaluate(el => getComputedStyle(el).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await ui.locator('[data-prop=patternScope]').selectOption('wave');
    assert.equal(await pattern.count(), 0, 'wave-only pattern stays off other pages');

    await page.evaluate(() => {
      const fixture = document.createElement('section');
      fixture.id = 'vibe-fixture';
      fixture.className = 'VibePage_root__fixture';
      fixture.innerHTML = '<span data-test-id="RESET_VIBE_CONTEXT_STATIC_TEXT">Моя волна</span>' +
        '<div data-test-id="VIBE_DYNAMIC_ARTISTS"><a href="#">Исполнитель</a></div>' +
        '<div data-test-id="VIBE_ARTIST_COVER"><img width="60" height="60" alt=""></div>' +
        '<img id="fixture-track-cover" width="18" height="18" alt="Обложка трека">' +
        '<div class="MainPage_betaSlot__fixture"><span class="ymmods-quality ymmods-in-slot">FLAC</span>' +
        '<button type="button" class="ymmods-modver">Мод 1.5.0</button><button type="button" data-test-id="RELEASE_NOTES_BUTTON">5.125.3</button></div>' +
        '<span class="ymmods-quality" id="format-outside-corner">AAC</span>';
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="22" fill="#ddd"/></svg>';
      for (const image of fixture.querySelectorAll('img')) image.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      document.querySelector('.Content_root__demo').append(fixture);
    });
    await pattern.waitFor();
    const wave = page.locator('#vibe-fixture');
    const portrait = wave.locator('[data-test-id=VIBE_ARTIST_COVER] img');
    const artist = wave.locator('[data-test-id=VIBE_DYNAMIC_ARTISTS]');
    const heading = wave.locator('[data-test-id=RESET_VIBE_CONTEXT_STATIC_TEXT]');
    const version = wave.locator('[data-test-id=RELEASE_NOTES_BUTTON]');
    const mod = wave.locator('.ymmods-modver'), format = wave.locator('.ymmods-in-slot');
    await ui.locator('[data-tab=layout]').click();
    await ui.locator('#ymc-home-hero .section-toggle').click();
    for (const [control, target] of [
      ['showVibePortrait', portrait], ['showVibeArtist', artist], ['showVibeHeading', heading]
    ]) {
      await ui.locator('#p-' + control).uncheck();
      assert.equal(await target.isHidden(), true, control);
      assert.equal(await wave.locator('#fixture-track-cover').isVisible(), true);
      await ui.locator('#p-' + control).check();
      assert.equal(await target.isVisible(), true, control);
    }
    // Exercise production-shaped markup, including hard-coded icon paint and layout clipping.
    await page.evaluate(() => {
      const nav = document.querySelector('.NavbarDesktop_root__demo');
      const slot = document.createElement('div');
      slot.className = 'DefaultLayout_navbar__fixture';
      slot.style.gridArea = 'navbar';
      nav.before(slot);
      slot.append(nav);
      nav.insertAdjacentHTML('afterbegin', '<div class="NavbarDesktop_scrollableContainer__fixture"><nav><ul>' +
        '<li><a href="#search" data-test-id="NAVBAR_NAVIGATION_ITEM_SEARCH" aria-label="Поиск">Поиск</a></li>' +
        '<li><a href="#home" data-test-id="NAVBAR_NAVIGATION_ITEM_HOME" aria-label="Главная">Главная</a></li>' +
        '</ul></nav><div><a class="PinItem_root__fixture" href="#pin" aria-label="Мой плейлист">Мой плейлист</a></div></div>');
      const root = document.querySelector('#vibe-fixture');
      const cover = root.querySelector('#fixture-track-cover');
      cover.classList.add('VibePage_albumCover__fixture');
      root.style.cssText = 'container-type:size;height:440px';
      root.insertAdjacentHTML('afterbegin',
        '<div class="VibePage_vibeAnimation__fixture" style="opacity:1">Анимация</div>' +
        '<div class="VibePlayerControls_root__fixture">' +
        '<button class="VibePlayerControls_playButton__fixture VibePlayerControls_playButton_playing__fixture" aria-label="Пауза">' +
        '<svg class="VibePlayerControls_playButtonIcon__fixture" width="18" height="18" style="color:#888;opacity:.5">' +
        '<path fill="#888" d="M0 0H6V18H0zM12 0H18V18H12z"/></svg></button></div>');
      const main = root.closest('main');
      main.style.overflow = 'hidden';
    });
    const nativeWave = wave.locator('.VibePage_vibeAnimation__fixture');
    const navRoot = page.locator('.NavbarDesktop_root__demo');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('main')).overflow === 'visible');
    assert.equal(await navRoot.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await ui.locator('#ymc-home-sidebar .section-toggle').click();
    const docks = ui.locator('[data-prop=sidebarDock]');
    await docks.selectOption('top');
    await page.waitForFunction(() => document.querySelector('[data-ymc-nav-dock="top"]') &&
      getComputedStyle(document.querySelector('[data-ymc-nav-dock="top"]')).flexDirection === 'row');
    const rows = ui.locator('#ymc-sidebar-items li');
    assert.equal(await rows.count(), 3);
    const search = page.locator('[data-test-id=NAVBAR_NAVIGATION_ITEM_SEARCH]');
    await rows.filter({ hasText: 'Поиск' }).getByRole('button', { name: 'Скрыть: Поиск' }).click();
    assert.equal(await search.isHidden(), true);
    await rows.filter({ hasText: 'Мой плейлист' }).getByRole('button', { name: 'Переместить выше: Мой плейлист' }).click();
    await rows.filter({ hasText: 'Мой плейлист' }).getByRole('button', { name: 'Переместить выше: Мой плейлист' }).click();
    assert.match(await rows.first().textContent(), /Мой плейлист/);
    assert.ok((await page.locator('.PinItem_root__fixture').boundingBox()).x <
      (await page.locator('[data-test-id=NAVBAR_NAVIGATION_ITEM_HOME]').boundingBox()).x);
    await docks.selectOption('right');
    assert.equal(await navRoot.getAttribute('data-ymc-nav-dock'), 'right');
    await ui.locator('#ymc-sidebar-reset').click();
    assert.equal(await search.isVisible(), true);
    assert.equal(await navRoot.getAttribute('data-ymc-nav-dock'), null);

    await ui.locator('#ymc-home-track .section-toggle').click();
    const adaptive = ui.locator('#p-vibeAdaptiveCover');
    const trackArt = wave.locator('#fixture-track-cover');
    await adaptive.check();
    assert.equal(await trackArt.isHidden(), true);
    await portrait.evaluate(el => { el.removeAttribute('src'); });
    await page.waitForFunction(() => {
      const img = document.querySelector('#fixture-track-cover');
      return getComputedStyle(img).visibility === 'visible' && img.getBoundingClientRect().width > 100;
    });
    await adaptive.uncheck();
    await portrait.evaluate((el, src) => { el.src = src; }, await trackArt.getAttribute('src'));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const testCover = async color => page.evaluate(color => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 24;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 24, 24);
      navigator.mediaSession.metadata = new MediaMetadata({ title: color, artwork: [{ src: canvas.toDataURL() }] });
    }, color);
    await ui.locator('#ymc-home-animation .section-toggle').click();
    await ui.locator('[data-prop=waveStyle]').selectOption('mist');
    const ownWave = page.locator('[data-ymc-wave-effect=mist]');
    await testCover('#f02b22');
    const update = partial => page.evaluate(partial => YMusicCustomizer.update(partial), partial);
    const waveInk = () => ownWave.evaluate(el => el.style.getPropertyValue('--ymc-wave-ink'));
    await update({ mode: 'solid', background: '#000000' });
    assert.match(await waveInk(), /^#(..)\1\1$/i);
    assert.equal(await nativeWave.isHidden(), true);
    await update({ background: '#ffffff' });
    await page.waitForFunction(() => {
      const hex = document.querySelector('[data-ymc-wave-effect]').style.getPropertyValue('--ymc-wave-ink');
      return parseInt(hex.slice(1,3),16) - parseInt(hex.slice(3,5),16) > 30;
    });
    assert.equal(await ownWave.locator('i').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    await ui.locator('[data-prop=waveStyle]').selectOption('native');
    assert.equal(await nativeWave.isVisible(), true);
    const pause = wave.locator('button[aria-label=Пауза]');
    const icon = pause.locator('svg');
    await update({ smartTheme: true, smartStrength: 100, smartPaletteStyle: 'light', smartTransition: 400, contrastGuard: true });
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.VibePage_vibeAnimation__fixture')).opacity) < .24);
    const redPause = await icon.evaluate(el => getComputedStyle(el).color);
    assert.notEqual(redPause, 'rgb(136, 136, 136)');
    assert.equal(await icon.locator('path').evaluate(el => getComputedStyle(el).fill), redPause);
    assert.equal(await icon.evaluate(el => getComputedStyle(el).opacity), '1');
    await testCover('#205af2');
    await page.waitForFunction(prior => getComputedStyle(document.querySelector('button[aria-label=Пауза] svg')).color !== prior, redPause);
    assert.equal(await ui.locator('[data-prop=background]').isDisabled(), true);
    await update({ smartBackground: false });
    assert.equal(await ui.locator('[data-prop=background]').isEnabled(), true);
    assert.equal(await ui.locator('[data-prop=text]').isDisabled(), true);
    await update({ smartStrength: 50 });
    assert.equal(await ui.locator('[data-prop=text]').isEnabled(), true, 'a partial blend still accepts manual colors');
    await update({ smartTheme: false, background: '#100c1b', mode: 'gradient' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await ui.locator('#ymc-home-badges .section-toggle').click();
    await ui.locator('#p-showCornerAppVersion').uncheck();
    assert.equal(await version.isHidden(), true);
    assert.equal(await mod.isVisible(), true);
    assert.equal(await format.isVisible(), true);
    await ui.locator('#p-showCornerLoaderVersion').uncheck();
    assert.equal(await mod.isHidden(), true);
    assert.equal(await format.isVisible(), true);
    await ui.locator('#p-showCornerAudioFormat').uncheck();
    assert.equal(await format.isHidden(), true);
    assert.equal(await wave.locator('#format-outside-corner').isVisible(), true);
    await ui.locator('#ymc-compare').click();
    assert.equal(await version.isVisible(), true);
    assert.equal(await mod.isVisible(), true);
    assert.equal(await format.isVisible(), true);
    assert.equal(await pattern.count(), 0);
    await ui.locator('#ymc-compare').click();
    await pattern.waitFor();

    await ui.locator('#ymc-home-portrait .section-toggle').click();
    const aura = ui.locator('[data-prop=portraitEffect]');
    await aura.selectOption('outline');
    assert.equal(await ui.locator('#p-portraitBeat').isDisabled(), true);
    await aura.selectOption('glow');
    await ui.locator('#p-portraitBeat').check();
    await ui.locator('#p-portraitBeatSensitivity').fill('95');
    await ui.locator('#p-portraitBeatStrength').fill('95');
    await page.evaluate(() => YMusicCustomizer.update({ motionEnabled: true, motionAura: true }));
    assert.equal(await portrait.evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await page.locator('[data-ymc-spectrum]').count(), 0);
    await page.evaluate(() => YMusicCustomizer.open());
    await page.locator('#test-audio').click();
    await page.waitForFunction(() => {
      const portrait = document.querySelector('#vibe-fixture [data-test-id=VIBE_ARTIST_COVER] img');
      return parseFloat(portrait.style.getPropertyValue('--ymc-beat-pulse')) >= 10;
    });
    assert.equal(await page.locator('[data-ymc-spectrum]').count(), 0, 'pulse uses audio without mounting a canvas');
    await ui.locator('#p-portraitBeatStrength').fill('215');
    await aura.selectOption('ribbon');
    const ribbon = wave.locator('[data-ymc-portrait-ribbon] path').first();
    const firstCurve = await ribbon.getAttribute('d');
    assert.match(firstCurve, /^M.+Z$/);
    await page.waitForFunction(path => document.querySelector('[data-ymc-portrait-ribbon] path').getAttribute('d') !== path, firstCurve);
    await aura.selectOption('glow');

    await page.locator('#demo-audio').evaluate(el => el.pause());
    await page.waitForFunction(() => !document.querySelector('#vibe-fixture [data-test-id=VIBE_ARTIST_COVER] img')
      .style.getPropertyValue('--ymc-beat-pulse'));
    await ui.locator('#p-portraitBeat').uncheck();
    assert.equal(await portrait.evaluate(el => getComputedStyle(el).animationName), 'ymc-portrait-breathe');
    const preview = kind => ui.locator('[data-appearance-preview="' + kind + '"]');
    const applied = key => page.evaluate(key => YMusicCustomizer.getTheme()[key], key);
    const saved = () => page.evaluate(() => localStorage.getItem('ymc:theme:v2'));
    const accept = ui.locator('#ymc-preview-apply');

    const portraitBaseFilter = el => getComputedStyle(el).filter.split(' drop-shadow(')[0];
    const realPortrait = await portrait.evaluate(portraitBaseFilter);
    const beforePortrait = await saved();
    await preview('portrait').click();
    await aura.selectOption('off');
    assert.equal(await ui.locator('#ymc-portrait-preview').evaluate(el => getComputedStyle(el).filter), 'none');
    assert.equal(await portrait.evaluate(portraitBaseFilter), realPortrait);
    assert.equal(await saved(), beforePortrait);
    await page.keyboard.press('Escape');
    assert.equal(await preview('portrait').getAttribute('aria-pressed'), 'false');
    assert.equal(await aura.inputValue(), 'glow');

    await ui.locator('[data-tab=theme]').click();
    const realMask = await readMask();
    const beforePattern = await saved();
    await preview('pattern').click();
    await picker.selectOption('stars');
    const sampleMask = await ui.locator('#ymc-pattern-sample .ymc-pattern-ink').first()
      .evaluate(el => getComputedStyle(el).maskImage);
    assert.notEqual(sampleMask, realMask);
    assert.equal(await readMask(), realMask);
    assert.equal(await saved(), beforePattern);
    await accept.click();
    assert.equal(await applied('patternStyle'), 'stars');
    assert.equal(await readMask(), sampleMask);

    await ui.locator('#ymc-theme-spectrum .section-toggle').click();
    await preview('spectrum').click();
    await ui.locator('#p-barSpectrum').check();
    await ui.locator('#ymc-spectrum-profile').selectOption('studio');
    await ui.locator('#p-spectrumOpacity').fill('30');
    assert.equal(await applied('barSpectrum'), false);
    assert.equal(await page.locator('[data-ymc-spectrum]').count(), 0);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#ymusic-customizer-root').shadowRoot
      .getElementById('ymc-spectrum-preview')).opacity === '0.3');
    await accept.click();
    assert.equal(await applied('spectrumStyle'), 'bars');
    await page.locator('[data-ymc-spectrum]').waitFor();

    await page.evaluate(() => {
      const playlist = document.createElement('div');
      playlist.dataset.testId = 'PLAYLIST_PAGE';
      const backdrop = document.createElement('div');
      backdrop.className = 'PlaylistPage_averageColorBackground__fixture';
      playlist.append(backdrop);
      document.body.append(playlist);
    });
    await ui.locator('[data-tab=playlists]').click();
    await ui.locator('#ymc-playlists-gradient .section-toggle').click();
    const beforePlaylist = await saved();
    const realBackdrop = page.locator('.PlaylistPage_averageColorBackground__fixture');
    const readBackdrop = el => el.evaluate(node => getComputedStyle(node).backgroundImage);
    const beforeBackdrop = await readBackdrop(realBackdrop);
    await preview('playlists').click();
    await ui.locator('[data-prop=playlistGradient]').selectOption('off');
    assert.equal(await readBackdrop(ui.locator('#ymc-playlist-preview')), 'none');
    assert.equal(await readBackdrop(realBackdrop), beforeBackdrop);
    assert.equal(await saved(), beforePlaylist);
    await ui.locator('[data-tab=theme]').click();
    assert.equal(await ui.locator('#ymc-preview-toolbar').isHidden(), true);
    assert.equal(await saved(), beforePlaylist);
    assert.deepEqual(errors, []);
    console.log('PASS ' + platform + ': update toast, resize, navigation, wave, light contrast, adaptive cover, patterns and audio-reactive aura');
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.YMC_CHROMIUM || undefined });
  try {
    await platformSmoke(browser, 'macos', 'MacIntel');
    await platformSmoke(browser, 'windows', 'Win32');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
