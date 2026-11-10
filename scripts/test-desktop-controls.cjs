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
          const version = localStorage.getItem('test:next-version') ?? '0.7.6';
          return { available: Boolean(version), version, notes: 'Проверка новой версии' };
        },
        installUpdate: async () => {
          window.updateRequested = true;
          return { error: 'Тестовый ответ установщика' };
        }
      };
    }, navigatorPlatform);
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', platform, 'demo.html')).href);
    const update = partial => page.evaluate(partial => YMusicCustomizer.update(partial), partial);
    const ui = page.locator('#ymusic-customizer-root');
    const toast = ui.locator('#ymc-update-toast');
    await toast.waitFor();
    assert.match(await toast.textContent(), /Вышел Customizer 0\.7\.6/);
    assert.equal(await ui.locator('#ymc-editor').isHidden(), true);
    const toastRect = await toast.boundingBox();
    assert.ok(toastRect.x > 800 && toastRect.y < 65, 'the toast starts in the top right');
    await ui.locator('#ymc-update-toast-close').click();
    await toast.waitFor({ state: 'hidden' });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#ymusic-customizer-root')?.shadowRoot
      .querySelector('#ymc-update-label').textContent.includes('0.7.6'));
    assert.equal(await toast.isHidden(), true, 'the same release stays dismissed');

    const nextRelease = async version => {
      await page.evaluate(version => localStorage.setItem('test:next-version', version), version);
      await page.reload();
      await toast.waitFor();
      assert.match(await ui.locator('#ymc-update-toast-title').textContent(), new RegExp(version.replaceAll('.', '\\.')));
    };
    await nextRelease('0.7.7');
    const label = await ui.locator('#ymc-update-toast-title').boundingBox();
    await page.mouse.move(label.x + 8, label.y + label.height / 2);
    await page.mouse.down();
    await page.mouse.move(label.x + 113, label.y + label.height / 2, { steps: 6 });
    await page.mouse.up();
    await toast.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => localStorage.getItem('ymc:update:dismissed')), '0.7.7');
    await nextRelease('0.7.8');
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

    // The desktop client's startup can replace the body and reset its root styles.
    const themeBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.evaluate(() => {
      const previous = document.body;
      const next = document.createElement('body');
      next.className = previous.className;
      const owned = new Set([
        document.getElementById('ymusic-customizer-root'),
        document.getElementById('ymc-native-wave-tint').ownerSVGElement
      ]);
      next.append(...[...previous.childNodes].filter(node => !owned.has(node)));
      previous.replaceWith(next);
      document.getElementById('ymc-dynamic-theme').remove();
      const root = document.documentElement;
      root.removeAttribute('style');
      root.removeAttribute('data-ymc-active');
      root.removeAttribute('data-ymc-editor-open');
    });
    await page.waitForFunction(background => getComputedStyle(document.body).backgroundColor === background &&
      document.documentElement.hasAttribute('data-ymc-editor-open') &&
      document.documentElement.style.getPropertyValue('--ymc-paint-0'), themeBackground);
    assert.equal(await ui.locator('#ymc-close').isVisible(), true);
    assert.equal(await page.locator('#ymc-native-wave-tint').count(), 1);

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
    const geometries = new Set();
    const readPattern = (layer = pattern) => layer.locator('pattern').evaluate(el => el.innerHTML);
    const options = await picker.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
    assert.equal(options.length, 15);
    for (const option of options) {
      await picker.selectOption(option);
      geometries.add(await readPattern());
      const marks = await pattern.locator('.ymc-pattern-mark').evaluateAll(nodes =>
        nodes.map(el => el.getAttribute('transform')));
      assert.ok(marks.length > 10 && new Set(marks).size === marks.length, option);
    }
    assert.equal(geometries.size, 15, 'all built-in/custom modes draw distinct motifs');
    const artSize = await pattern.locator('pattern').evaluate(el => [el.getAttribute('width'), el.getAttribute('height')].map(Number));
    const view = await pattern.boundingBox();
    assert.deepEqual(artSize, [Math.round(view.width), Math.round(view.height)], 'one random arrangement covers the viewport');
    await ui.locator('[data-prop=patternSymbols]').fill('<&✦');
    assert.match((await pattern.locator('pattern text').allTextContents()).join(''), /[<&]/);
    await picker.selectOption('constellations');
    await ui.locator('[data-prop=patternPalette]').selectOption('custom');
    const fixedArtwork = await readPattern();
    await ui.locator('[data-prop=patternPrimary]').fill('#20d8bb');
    assert.equal(await readPattern(), fixedArtwork, 'changing colors does not rebuild geometry');
    assert.equal(await pattern.locator('.ymc-pattern-mark:not(.accent)').first()
      .evaluate(el => getComputedStyle(el).color), 'rgb(32, 216, 187)');
    await ui.getByText('Движение, свечение и положение', { exact: true }).click();
    await ui.locator('#ymc-pattern-shuffle').click();
    assert.notEqual(await readPattern(), fixedArtwork);
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
      const routes = [
        ['SEARCH', 'Поиск'], ['HOME', 'Моя волна'], ['FOR_YOU_AND_TRENDS', 'Для вас и Тренды'],
        ['CONCERTS', 'Концерты'], ['NON_MUSIC', 'Книги и подкасты'], ['COLLECTION', 'Коллекция']
      ].map(([id, label]) => `<li><a href="#${id}" data-test-id="NAVBAR_NAVIGATION_ITEM_${id}" aria-label="${label}">
        <div><svg width="16" height="16"></svg></div><div><span>${label}</span></div></a></li>`).join('');
      nav.insertAdjacentHTML('afterbegin', `
        <div class="NavbarDesktop_logoWrapper__fixture"><a href="#logo"><div class="NavbarDesktop_logo__fixture">
          <span><svg width="107" height="30"><use href="#musicLogoLeftRu"/></svg></span>
          <span hidden style="display:block"><svg width="30" height="30"><use href="#musicLogo"/></svg></span>
        </div></a></div>
        <div class="NavbarDesktop_scrollableContainer__fixture"><div><nav><ul>${routes}</ul></nav>
          <div><h3>Закреплено</h3><div class="PinItem_root__fixture" style="width:100%">
            <a href="#pin" class="Pin_link__fixture"><div class="Pin_cover__fixture"></div>
              <div class="Pin_meta__fixture"><span class="Pin_title__fixture">Мой плейлист</span></div></a>
            <div class="Pin_contextMenu__fixture"><div><button aria-label="Меню"><svg width="36" height="36"></svg></button></div></div>
          </div></div>
        </div></div>`);
      const root = document.querySelector('#vibe-fixture');
      const cover = root.querySelector('#fixture-track-cover');
      const artist = root.querySelector('[data-test-id=VIBE_DYNAMIC_ARTISTS] a');
      artist.className = 'VibePage_text__fixture';
      artist.style.cssText = 'font-size:56px;line-height:1';
      artist.textContent = 'Имя исполнителя';
      const titleBlock = document.createElement('div');
      titleBlock.className = 'VibePage_textContainer__fixture VibePage_textContainer_withCover__fixture';
      titleBlock.style.cssText = 'display:flex;align-items:flex-end;justify-content:center;height:155px';
      artist.parentElement.before(titleBlock);
      titleBlock.append(artist.parentElement);
      const portrait = root.querySelector('[data-test-id=VIBE_ARTIST_COVER]');
      portrait.style.cssText = 'position:absolute;inset:165px auto auto 50%;transform:translateX(-50%)';
      const stage = document.createElement('div');
      stage.className = 'VibePage_playerBlock__fixture';
      stage.style.cssText = 'position:absolute;inset:auto 0 12px;height:120px';
      stage.innerHTML = '<section class="VibePlayerBar_root__fixture" style="position:relative;height:100%">' +
        '<div class="VibePage_albumCover__fixture AlbumCover_root__fixture" ' +
        'style="position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%);width:96px;height:96px"></div></section>';
      stage.querySelector('.AlbumCover_root__fixture').append(cover);
      cover.style.cssText = 'display:block;width:100%;height:100%';
      root.append(stage);
      root.style.cssText = 'container-type:size;height:580px;position:relative';
      const profile = nav.querySelector('[class*="NavbarDesktopUserWidget_userProfileContainer__"]');
      profile.style.cssText = 'display:flex;width:100%;flex-shrink:0';
      profile.innerHTML = '<div class="UserProfile_root__fixture">' +
        '<button class="UserProfile_avatarContainer__fixture" aria-label="Профиль" style="width:28px;height:28px"></button>' +
        '<div class="UserProfile_meta__fixture"><span class="UserProfile_userName__fixture">Профиль</span></div></div>';
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
    const search = page.locator('[data-test-id=NAVBAR_NAVIGATION_ITEM_SEARCH]');
    const nativeSize = await search.boundingBox();
    await docks.selectOption('top');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-ymc-nav-dock="top"]')).gridAutoFlow === 'column');
    const rows = ui.locator('#ymc-sidebar-items li');
    assert.equal(await rows.count(), 8);
    const dockToggle = navRoot.locator('[data-ymc-nav-toggle]');
    await dockToggle.evaluate(el => el.click());
    assert.equal(await dockToggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await ui.locator('#p-sidebarCompact').isChecked(), false);
    assert.equal(await navRoot.evaluate(el => getComputedStyle(el).scrollbarWidth), 'none');
    assert.equal(await search.evaluate(el => getComputedStyle(el, '::after').content), '"Поиск"');
    const topBar = await navRoot.boundingBox();
    const editorLeft = (await ui.locator('#ymc-editor').boundingBox()).x;
    assert.ok(topBar.width > editorLeft - 45, { topBar, editorLeft });

    await ui.locator('#ymc-close').click();
    const edgeToggle = page.locator('[data-ymc-nav-edge]');
    const layout = page.locator('.DefaultLayout_root__demo');
    const pin = navRoot.locator('.PinItem_root__fixture');
    const assertDock = async (side, compact, align = 'center') => {
      await page.evaluate(settings => YMusicCustomizer.update(settings), { sidebarDock: side, sidebarCompact: compact, sidebarAlign: align });
      const horizontal = side === 'top' || side === 'bottom';
      const geometry = await navRoot.evaluate(el => {
        const size = node => node.getBoundingClientRect().toJSON();
        const symbol = el.querySelector('[data-ymc-nav-symbol] svg');
        const pin = el.querySelector('[data-ymc-nav-cell="pin"]');
        const avatar = el.querySelector('.UserProfile_avatarContainer__fixture');
        const profile = el.querySelector('[data-ymc-nav-cell="profile"]');
        const fold = el.querySelector('[data-ymc-nav-cell="fold"]');
        return {
          panel: size(el), cells: [...el.querySelectorAll('[data-ymc-nav-cell]')].map(size),
          icon: size(symbol), pin: size(pin.querySelector('[data-ymc-nav-symbol]')), avatar: size(avatar),
          profile: size(profile), fold: size(fold),
          scroll: [el.scrollWidth - el.clientWidth, el.scrollHeight - el.clientHeight]
        };
      });
      const { panel, cells, icon, pin, avatar, profile, fold, scroll } = geometry;
      assert.ok(scroll[0] <= 1 && scroll[1] <= 1, JSON.stringify({ side, compact, scroll }));
      assert.ok(cells.every(cell => cell.x >= panel.x && cell.right <= panel.right &&
        cell.y >= panel.y && cell.bottom <= panel.bottom), JSON.stringify({ side, compact, panel, cells }));
      const center = box => horizontal ? box.y + box.height / 2 : box.x + box.width / 2;
      for (const box of [pin, avatar]) assert.ok(Math.abs(center(box) - center(icon)) <= 1, JSON.stringify({ side, compact, icon, box }));
      const gap = horizontal ? fold.x - profile.right : fold.y - profile.bottom;
      assert.ok(gap >= 0 && gap <= 16, JSON.stringify({ side, compact, fold, profile }));
      if (horizontal && align === 'center') {
        assert.ok(Math.min(...cells.map(cell => cell.x)) - panel.x <= 8, { side, panel, cells });
        assert.ok(panel.right - Math.max(...cells.map(cell => cell.right)) <= 8, { side, panel, cells });
      }
      const logo = navRoot.locator('[data-ymc-nav-brand-part="' + (compact ? 'mark' : 'full') + '"] svg');
      const logoBox = await logo.boundingBox();
      const brandCell = await navRoot.locator('[data-ymc-nav-cell="brand"]').boundingBox();
      assert.equal(Math.round(logoBox.width), compact ? 30 : 107);
      assert.equal(logoBox.height, 30);
      assert.ok(Math.abs(logoBox.x + logoBox.width / 2 - brandCell.x - brandCell.width / 2) <= 1);
      assert.equal(await search.evaluate(el => getComputedStyle(el, '::after').content), compact ? 'none' : '"Поиск"');
      return { start: horizontal ? cells[0].x : panel.y, icon };
    };
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const start = await assertDock(side, false, 'start');
      const center = await assertDock(side, false);
      const end = await assertDock(side, false, 'end');
      const horizontal = side === 'top' || side === 'bottom';
      assert.ok((horizontal ? start.start <= center.start + 1 : start.start < center.start) && center.start < end.start,
        JSON.stringify({ side, start, center, end }));
      const compact = await assertDock(side, true);
      if (horizontal) assert.deepEqual(compact.icon, center.icon, 'showing labels must not move the icons');
    }
    await assertDock('top', false);
    const iconSize = () => navRoot.locator('[data-ymc-nav-cell="route"] [data-ymc-nav-symbol] svg').first()
      .evaluate(el => el.getBoundingClientRect().width);
    assert.equal(await iconSize(), 22);
    await update({ sidebarIconSize: 36 });
    assert.equal(await iconSize(), 36);
    await update({ sidebarIconSize: 22 });
    await page.setViewportSize({ width: 960, height: 850 });
    await assertDock('top', false);
    await page.setViewportSize({ width: 760, height: 850 });
    await page.evaluate(() => YMusicCustomizer.update({ sidebarDock: 'top', sidebarCompact: false }));
    await navRoot.hover({ position: { x: 70, y: 24 } });
    await page.mouse.wheel(0, 680);
    await page.waitForFunction(() => document.querySelector('[data-ymc-nav-dock]').scrollLeft > 0);
    assert.ok((await navRoot.locator('.UserProfile_avatarContainer__fixture').boundingBox()).x < 760);
    await page.setViewportSize({ width: 1260, height: 850 });
    await page.evaluate(() => YMusicCustomizer.open());
    await docks.selectOption('top');
    await ui.locator('#p-sidebarCompact').check();
    assert.ok(await search.locator('span').isHidden());
    await rows.filter({ hasText: 'Поиск' }).getByRole('button', { name: 'Скрыть: Поиск' }).click();
    assert.equal(await search.isHidden(), true);
    for (let i = 0; i < 7; i++) {
      await rows.filter({ hasText: 'Мой плейлист' }).getByRole('button', { name: 'Переместить выше: Мой плейлист' }).click();
    }
    assert.match(await rows.first().textContent(), /Мой плейлист/);
    assert.ok((await pin.boundingBox()).x <
      (await page.locator('[data-test-id=NAVBAR_NAVIGATION_ITEM_HOME]').boundingBox()).x);
    for (const side of ['top', 'bottom', 'left', 'right']) {
      await docks.selectOption(side);
      assert.equal(await edgeToggle.getAttribute('data-ymc-nav-edge'), side);
      await edgeToggle.click();
      assert.equal(await navRoot.getAttribute('data-ymc-nav-collapsed'), side);
      assert.ok(await navRoot.evaluate(el => el.inert));
      assert.equal(await edgeToggle.evaluate(el => el.parentElement === document.body), true);
      assert.equal(await layout.evaluate(el => el.style.getPropertyValue('--ymc-nav-reserve')), '0px');
      assert.equal(await edgeToggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await edgeToggle.locator('svg').isHidden(), true);
      const hint = () => edgeToggle.evaluate(el => {
        const css = getComputedStyle(el, '::before');
        return [css.content, css.backgroundColor, Math.min(parseFloat(css.width), parseFloat(css.height))];
      });
      assert.equal((await hint())[2], 3);
      if (side === 'top') {
        await update({ sidebarEdgeCustom: true, sidebarEdgeColor: '#ff3e76' });
        assert.equal((await hint())[1], 'rgb(255, 62, 118)');
        await update({ sidebarEdgeHint: false });
        assert.equal((await hint())[0], 'none');
        await page.mouse.move(240, 200);
        await edgeToggle.focus();
        await page.keyboard.press('Enter');
        await update({ sidebarEdgeHint: true, sidebarEdgeCustom: false });
      } else {
        await edgeToggle.hover();
        await page.waitForFunction(() => document.querySelector('[data-ymc-nav-edge]').getAttribute('aria-expanded') === 'true');
      }
      assert.equal(await navRoot.getAttribute('data-ymc-nav-collapsed'), null);
      assert.equal(await navRoot.evaluate(el => el.inert), false);
      assert.equal(await edgeToggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await edgeToggle.getAttribute('data-ymc-nav-cell'), 'fold');
    }
    await ui.locator('#ymc-sidebar-reset').click();
    assert.equal(await search.isVisible(), true);
    assert.equal(await navRoot.getAttribute('data-ymc-nav-dock'), null);
    assert.equal(await navRoot.locator('[data-ymc-nav-cell],[data-ymc-nav-native-label]').count(), 0);
    await navRoot.evaluate(el => Promise.allSettled(el.getAnimations().map(animation => animation.finished)));
    assert.deepEqual(await search.boundingBox(), nativeSize);

    await ui.locator('#ymc-home-track .section-toggle').click();
    const adaptive = ui.locator('#p-vibeAdaptiveCover');
    const trackArt = wave.locator('#fixture-track-cover');
    const name = artist.locator('a');
    const baseline = await trackArt.boundingBox();
    const titleBaseline = await name.boundingBox();
    await adaptive.check();
    assert.equal(await trackArt.isHidden(), true);
    assert.deepEqual(await name.boundingBox(), titleBaseline);
    await portrait.evaluate(el => { el.removeAttribute('src'); });
    await page.waitForFunction(() => {
      const img = document.querySelector('#fixture-track-cover');
      return getComputedStyle(img).visibility === 'visible' && img.getBoundingClientRect().width > 100;
    });
    const coverWidth = async size => {
      await ui.locator('#p-vibeAdaptiveCoverSize').fill(String(size));
      return (await trackArt.boundingBox()).width;
    };
    const mediumCover = await coverWidth(70);
    const largeCover = await coverWidth(100);
    assert.ok(largeCover > mediumCover * 1.35, { mediumCover, largeCover });
    const assertTitleClear = async () => {
      const cover = await trackArt.boundingBox();
      const title = await name.boundingBox();
      assert.ok(cover.y >= title.y + title.height + 10, { cover, title });
      assert.deepEqual(await name.boundingBox(), titleBaseline);
    };
    await assertTitleClear();
    await wave.evaluate(el => { el.style.height = '450px'; });
    await page.waitForFunction(previous => document.querySelector('#fixture-track-cover').getBoundingClientRect().width < previous - 30, largeCover);
    await assertTitleClear();
    await wave.evaluate(el => { el.style.height = '580px'; });
    await adaptive.uncheck();
    assert.equal(await wave.getAttribute('data-ymc-track-art'), null);
    assert.equal(await wave.locator('[data-ymc-sized-cover]').count(), 0);
    assert.deepEqual(await trackArt.boundingBox(), baseline);
    assert.deepEqual(await name.boundingBox(), titleBaseline);
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
    await ui.locator('[data-prop=waveStyle]').selectOption('custom');
    await testCover('#f02b22');
    await update({ mode: 'solid', background: '#000000', patternNativeOpacity: 100 });
    assert.match(await nativeWave.evaluate(el => getComputedStyle(el).filter), /ymc-native-wave-tint/);
    const nativeMatrix = await page.locator('#ymc-native-wave-tint feColorMatrix').getAttribute('values');
    assert.equal(await nativeWave.isVisible(), true, 'the custom filter keeps the original animation visible');
    await update({ background: '#ffffff' });
    await page.waitForFunction(() => {
      const matrix = document.querySelector('#ymc-native-wave-tint feColorMatrix').getAttribute('values').split(' ').map(Number);
      return matrix[4] - matrix[9] > .08;
    });
    assert.notEqual(await page.locator('#ymc-native-wave-tint feColorMatrix').getAttribute('values'), nativeMatrix);
    await update({ wavePalette: 'custom', waveTint: '#f02030', waveOpacity: 100, background: '#000000' });
    await nativeWave.evaluate(el => {
      el.textContent = '';
      el.style.cssText = 'width:32px;height:32px;background:lime';
    });
    const wavePixels = async () => page.evaluate(async png => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + png;
      await image.decode();
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return [5, 26].map(x => [...context.getImageData(x, 16, 1, 1).data.slice(0, 3)]);
    }, (await nativeWave.screenshot()).toString('base64'));
    const [[renderedRed, renderedGreen]] = await wavePixels();
    assert.ok(renderedRed > renderedGreen + 18, { renderedRed, renderedGreen });
    await ui.locator('[data-prop=waveStyle]').selectOption('native');
    assert.equal(await nativeWave.evaluate(el => getComputedStyle(el).filter), 'none');
    await nativeWave.evaluate(el => {
      el.style.background = 'transparent';
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      canvas.style.display = 'block';
      el.append(canvas);
    });
    const waveCanvas = nativeWave.locator('canvas');
    const pause = wave.locator('button[aria-label=Пауза]');
    const icon = pause.locator('svg');
    await wave.locator('.VibePlayerControls_root__fixture').evaluate(el => el.insertAdjacentHTML('beforeend',
      '<button aria-label="Следующий"><svg style="color:#999" width="14" height="14" fill="none"><path stroke="#999" d="M0 0L12 7L0 14"/></svg></button>'));
    const nextIcon = wave.locator('button[aria-label=Следующий] svg');
    await update({ smartTheme: true, smartStrength: 92, smartPaletteStyle: 'light', smartTransition: 400, contrastGuard: true });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.VibePage_vibeAnimation__fixture canvas'))
      .filter.includes('opacity(0.28)'));
    assert.match(await waveCanvas.evaluate(el => getComputedStyle(el).filter), /ymc-native-wave-tint/);
    assert.equal(await nativeWave.evaluate(el => getComputedStyle(el).filter), 'none', 'native framing keeps its colors');
    assert.equal(await nativeWave.evaluate(el => getComputedStyle(el).opacity), '1', 'stock fades are preserved');
    const clearPixels = await wavePixels();
    await waveCanvas.evaluate(el => {
      const ctx = el.getContext('2d');
      ctx.fillStyle = '#161616';
      ctx.fillRect(0, 0, 16, 32);
      ctx.fillStyle = '#36d9e9';
      ctx.fillRect(16, 0, 16, 32);
    });
    const [floorPixel, wavePixel] = await wavePixels();
    assert.ok(Math.min(...floorPixel) >= 225, floorPixel);
    assert.deepEqual(floorPixel, clearPixels[0], 'the animation’s dark floor leaves the light theme intact');
    assert.ok(wavePixel.some((value, index) => value < clearPixels[1][index] - 15), { wavePixel, clearPixels });
    await update({ smartBackground: false, smartGradient: false, background: '#FFFFFF' });
    assert.match(await waveCanvas.evaluate(el => getComputedStyle(el).filter), /opacity\(0\.28\)/,
      'foreground-only smart colors also protect a manually selected white background');
    await update({ smartBackground: true, smartGradient: true });
    const redPause = await icon.evaluate(el => getComputedStyle(el).color);
    assert.notEqual(redPause, 'rgb(136, 136, 136)');
    assert.equal(await icon.locator('path').evaluate(el => getComputedStyle(el).fill), redPause);
    assert.equal(await icon.evaluate(el => getComputedStyle(el).opacity), '1');
    const redNext = await nextIcon.evaluate(el => getComputedStyle(el).color);
    assert.notEqual(redNext, 'rgb(153, 153, 153)');
    assert.equal(await nextIcon.locator('path').evaluate(el => getComputedStyle(el).stroke), redNext);
    await testCover('#205af2');
    await page.waitForFunction(prior => getComputedStyle(document.querySelector('button[aria-label=Пауза] svg')).color !== prior, redPause);
    await ui.locator('[data-tab=theme]').click();
    await update({ smartStrength: 92 });
    for (const section of ['palette', 'background', 'media']) {
      const toggle = ui.locator('#ymc-theme-' + section + ' .section-toggle');
      assert.equal(await toggle.isDisabled(), true);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    }
    assert.equal(await ui.locator('[data-prop=background]').isDisabled(), true);
    assert.equal(await ui.locator('[data-prop=mode]').isDisabled(), true);
    await update({ smartBackground: false });
    assert.equal(await ui.locator('[data-prop=background]').isEnabled(), true);
    assert.equal(await ui.locator('[data-prop=text]').isDisabled(), true);
    await update({ smartGradient: false });
    assert.equal(await ui.locator('[data-prop=mode]').isEnabled(), true);
    assert.equal(await ui.locator('[data-prop=text]').isDisabled(), true);
    await update({ smartTextAmount: 0 });
    assert.equal(await ui.locator('[data-prop=text]').isEnabled(), true);
    await update({ smartTheme: false, background: '#100c1b', mode: 'gradient' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await ui.locator('[data-tab=layout]').click();

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
    await update({
      motionEnabled: true, motionAura: true, patternStyle: 'grid', patternBeatEffect: 'bend',
      patternBeatStrength: 160, patternBeatSensitivity: 95, waveStyle: 'custom', waveBeat: 140
    });
    assert.equal(await portrait.evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await page.locator('[data-ymc-spectrum]').count(), 0);
    await page.evaluate(() => YMusicCustomizer.open());
    await page.locator('#test-audio').click();
    await page.waitForFunction(() => {
      const portrait = document.querySelector('#vibe-fixture [data-test-id=VIBE_ARTIST_COVER] img');
      return parseFloat(portrait.style.getPropertyValue('--ymc-beat-pulse')) >= 10;
    });
    await page.waitForFunction(() => {
      const effect = document.querySelector('[data-ymc-pattern]');
      const wave = document.querySelector('.VibePage_vibeAnimation__fixture');
      return Number(effect.style.getPropertyValue('--ymc-pattern-beat')) > .10 &&
        effect.querySelector('[data-ymc-bend]').getAttribute('d').includes('Q') &&
        Number(getComputedStyle(wave).scale) > 1.01;
    });
    assert.equal(await page.locator('[data-ymc-spectrum]').count(), 0, 'pulse uses audio without mounting a canvas');
    await ui.locator('#p-portraitBeatStrength').fill('215');
    await aura.selectOption('bloom');
    const filledAura = wave.locator('[data-ymc-portrait-aura]');
    await filledAura.waitFor();
    await page.waitForFunction(() => Number(document.querySelector('[data-ymc-portrait-aura]').style.getPropertyValue('--ymc-aura-beat')) > .10);
    assert.match(await filledAura.evaluate(el => getComputedStyle(el, '::before').backgroundImage), /radial-gradient/);
    const auraBox = await filledAura.boundingBox();
    const portraitBox = await portrait.boundingBox();
    assert.ok(auraBox.y >= portraitBox.y - 1 && auraBox.y + auraBox.height <= portraitBox.y + portraitBox.height + 1);
    await aura.selectOption('glow');

    await page.locator('#demo-audio').evaluate(el => el.pause());
    await page.waitForFunction(() => !document.querySelector('#vibe-fixture [data-test-id=VIBE_ARTIST_COVER] img')
      .style.getPropertyValue('--ymc-beat-pulse'));
    await page.waitForFunction(() => !document.querySelector('[data-ymc-pattern]').style.getPropertyValue('--ymc-pattern-beat') &&
      !document.getElementById('vibe-fixture').style.getPropertyValue('--ymc-wave-beat'));
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
    const realArtwork = await readPattern();
    const beforePattern = await saved();
    await preview('pattern').click();
    await picker.selectOption('stars');
    const sample = ui.locator('#ymc-pattern-sample');
    const sampleSvg = sample.locator('svg');
    await ui.locator('#p-patternOpacity').fill('90');
    const visibleSample = await sample.screenshot();
    await sampleSvg.evaluate(el => { el.style.visibility = 'hidden'; });
    assert.ok(!visibleSample.equals(await sample.screenshot()), 'the SVG pattern renders in the preview');
    await sampleSvg.evaluate(el => { el.style.removeProperty('visibility'); });
    assert.notEqual(await readPattern(sample), realArtwork);
    assert.equal(await readPattern(), realArtwork);
    assert.equal(await saved(), beforePattern);
    await accept.click();
    assert.equal(await applied('patternStyle'), 'stars');
    assert.notEqual(await readPattern(), realArtwork);

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
