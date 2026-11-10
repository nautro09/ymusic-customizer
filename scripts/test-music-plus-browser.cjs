'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch();
  try {
    for (const platform of ['MacIntel', 'Win32']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
      page.setDefaultTimeout(8000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(platform => {
        Object.defineProperty(navigator, 'platform', { value: platform });
        localStorage.setItem('ymc:last-version', '0.7.7');
        localStorage.setItem('ymc:guide:seen', '0.7.7');
        let installed = null;
        const data = { version: '0.1.0', sources: ['youtube', 'soundcloud', 'vk', 'spotify'] };
        const bridge = {
          async musicPlus(action, payload) {
            if (action === 'install') installed = data;
            if (action === 'remove') installed = null;
            if (action === 'check') return { available: false };
            if (action === 'search') {
              window.lastLookup = payload;
              return { results: [
                { source: 'youtube', rows: [{ source: 'youtube', kind: 'video', title: 'Artist - New track',
                  artist: 'Artist', url: 'https://www.youtube.com/watch?v=ABCDEFGHIJK' }] },
                { source: 'soundcloud', rows: [{ source: 'soundcloud', kind: 'tracks', title: 'New track',
                  artist: 'Artist', url: 'https://soundcloud.com/artist/new-track' },
                { source: 'soundcloud', kind: 'tracks', title: 'Native track',
                  artist: 'Artist', url: 'https://soundcloud.com/artist/native-track' },
                { source: 'soundcloud', kind: 'tracks', title: 'Second track',
                  artist: 'Other Artist', url: 'https://soundcloud.com/other/second-track' }] },
                { source: 'spotify', reason: 'external' }
              ] };
            }
            if (action === 'open') { window.openedSource = payload; return {}; }
            return { installed, connected: { youtube: false, soundcloud: false } };
          }
        };
        if (platform === 'MacIntel') window.ymcMac = bridge;
        else window.ymMods = bridge;
      }, platform);
      await page.goto(pathToFileURL(path.resolve(__dirname, '../macos/demo.html')).href);
      const tab = page.locator('[data-tab="music-plus"]');
      await page.locator('[data-ymc-launcher]').click();
      await page.locator('[data-tab="library"]').click();
      await page.locator('[data-tab="plugins"]').click();
      assert.equal(await tab.isVisible(), false);
      await page.getByRole('button', { name: 'Скачать и установить' }).click();
      await tab.waitFor();
      await tab.click();
      await page.getByRole('button', { name: 'Проверить обновления' }).click();
      await page.locator('#ymc-music-plus-settings').getByText('Установлена актуальная версия.').waitFor();
      await page.locator('#ymc-close').click();
      await page.locator('.Content_root__demo').evaluate(main => {
        main.innerHTML = '<div class="SearchPage_root__test"><input type="search" value="Artist">' +
          '<div class="SearchPage_tabs__test"><button class="SearchPage_tab_selected__test">Треки</button></div>' +
          '<div class="SearchPage_main__test"><div id="native-result" class="CommonTrack_root__test">' +
          '<span class="Meta_title__test">Native track</span><span class="Meta_artists__test">Artist</span>' +
          '<span id="download">↓</span><button aria-label="Нравится">♥</button></div></div></div>';
      });
      const plugin = page.locator('[data-ymc-music-plus]');
      await page.locator('[data-ymc-music-plus-control]').getByRole('button', { name: 'Источники · бета' }).click();
      await plugin.getByRole('button', { name: 'Искать на площадках' }).click();
      await plugin.getByText('Artist - New track').waitFor();
      assert.equal(await page.locator('#download').isVisible(), true);
      assert.equal(await plugin.locator('.badge + .heart').count(), 2);
      assert.equal(await plugin.getByText('Native track').count(), 0);
      assert.equal(await page.evaluate(() => lastLookup.kind), 'tracks');
      await plugin.getByText('Artist - New track').click();
      assert.equal(await page.evaluate(() => openedSource.source), 'youtube');
      const hearts = plugin.getByRole('button', { name: 'Добавить в «Свою волну»' });
      await hearts.first().click();
      await hearts.first().click();
      await page.locator('.SearchPage_root__test input').fill('Other');
      await plugin.getByText('Artist - New track').waitFor({ state: 'hidden' });
      await page.locator('.Content_root__demo').evaluate(main => {
        main.innerHTML = '<div class="ArtistPage_root__test"><header class="ArtistPage_header__test">' +
          '<h1>Test Artist</h1><div class="PageHeader_controls__test">Слушать</div></header></div>';
      });
      await plugin.getByRole('button', { name: 'Другие площадки · бета' }).click();
      await plugin.getByRole('button', { name: 'Искать на площадках' }).click();
      assert.equal(await page.evaluate(() => lastLookup.kind), 'artist');
      await page.locator('.Content_root__demo').evaluate(main => {
        main.innerHTML = '<div style="position:relative;height:440px" class="VibePage_root__test"><h1>Моя волна</h1></div>';
      });
      await plugin.getByRole('button', { name: 'Своя волна · бета' }).click();
      await plugin.getByRole('textbox', { name: 'Любимый артист или трек' }).fill('Artist');
      await plugin.getByRole('button', { name: 'Добавить', exact: true }).click();
      await plugin.getByRole('button', { name: 'Подобрать из сохранённых' }).click();
      await plugin.locator('[data-wave-pick]').waitFor();
      await plugin.getByRole('button', { name: 'Следующая находка' }).click();
      await plugin.getByRole('button', { name: 'Следующая находка' }).click();
      await plugin.getByText('Новых сохранённых треков пока нет.', { exact: false }).waitFor();
      await page.locator('[data-ymc-launcher]').click();
      await tab.click();
      await page.getByRole('button', { name: 'Удалить плагин' }).click();
      await plugin.waitFor({ state: 'detached' });
      assert.equal(await tab.isVisible(), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: opt-in plugin, search and artist anchors, source before heart, native download icon, wave deduplication and removal on macOS/Windows renderer');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
