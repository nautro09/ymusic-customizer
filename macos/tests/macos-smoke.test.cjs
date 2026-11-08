// Run on macOS against a copy built by YMusic Customizer.app. Uses a fresh profile and mock Discord.
const assert = require('node:assert/strict');
const { mkdir, mkdtemp, rm, writeFile } = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { _electron: electron } = require('playwright');

function packet(opcode, message) {
  const body = Buffer.from(JSON.stringify(message));
  const prefix = Buffer.alloc(8);
  prefix.writeUInt32LE(opcode);
  prefix.writeUInt32LE(body.length, 4);
  return Buffer.concat([prefix, body]);
}

async function mockDiscord(directory) {
  const messages = [];
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
    let pending = Buffer.alloc(0);
    socket.on('data', chunk => {
      pending = Buffer.concat([pending, chunk]);
      while (pending.length >= 8) {
        const opcode = pending.readUInt32LE();
        const size = pending.readUInt32LE(4);
        if (pending.length < size + 8) return;
        const message = JSON.parse(pending.subarray(8, size + 8));
        pending = pending.subarray(size + 8);
        messages.push({ opcode, message });
        if (opcode === 0) {
          const ready = packet(1, { cmd: 'DISPATCH', evt: 'READY' });
          socket.write(ready.subarray(0, 5));
          socket.write(ready.subarray(5));
        }
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(path.join(directory, 'discord-ipc-0'), resolve);
  });
  return {
    messages,
    close: () => new Promise(resolve => {
      for (const socket of sockets) socket.destroy();
      server.close(resolve);
    })
  };
}

async function waitFor(predicate) {
  for (let i = 0; i < 100; i++) {
    const result = predicate();
    if (result) return result;
    await delay(100);
  }
  throw Error('Ожидаемое сообщение Discord не получено.');
}

async function run() {
  if (!process.argv[2]) throw Error('Передайте путь к «Яндекс Музыка с Customizer.app».');
  const executablePath = path.resolve(process.argv[2], 'Contents/MacOS/Яндекс Музыка');
  const temporary = await mkdtemp('/tmp/ymc-mac-');
  let app, rpc;
  try {
    rpc = await mockDiscord(temporary);
    const profile = path.join(temporary, 'profile');
    await mkdir(profile);
    await writeFile(path.join(profile, 'ymc-discord.json'), JSON.stringify({
      discordRpc: false, discordClientId: '', discordShowPaused: false
    }));
    app = await electron.launch({
      executablePath,
      args: [`--user-data-dir=${profile}`],
      env: { ...process.env, XDG_RUNTIME_DIR: temporary },
      timeout: 35_000
    });
    const page = await app.firstWindow();
    page.setDefaultTimeout(15_000);
    await page.waitForFunction(() => window.musicDesktop && window.YMusicCustomizer && window.ymcMac);
    assert.equal(await app.evaluate(({ app }) => app.getPath('userData')), profile);
    assert.equal(await page.evaluate(() => location.host), 'desktop');
    assert.equal(await page.evaluate(() => YMusicCustomizer.diagnostics().themeSheet), true);
    assert.equal(await page.evaluate(() => YMusicCustomizer.diagnostics().version), '0.7.1');
    assert.equal(await page.evaluate(async () => (await window.ymcMac.getState()).config.discordShowAlbum), false);

    await page.keyboard.press('Meta+Shift+Y');
    const editor = page.locator('#ymc-editor');
    await editor.waitFor({ state: 'visible' });
    assert.equal(await editor.locator('.tabs [data-tab]').count(), 5);
    assert.equal(await page.locator('#ymc-guide-offer').isVisible(), true);
    await page.evaluate(async () => {
      const frame = document.createElement('div');
      frame.id = 'test-portrait-frame';
      frame.dataset.testId = 'VIBE_ARTIST_COVER';
      frame.style.cssText = 'position:fixed;inset:20px auto auto 20px;z-index:2147483639;width:140px;height:140px;display:grid;place-items:center;background:#000';
      const portrait = new Image(100, 100);
      const cutout = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="25" fill="#ddd"/></svg>';
      portrait.src = 'data:image/svg+xml,' + encodeURIComponent(cutout);
      await portrait.decode();
      frame.append(portrait);
      document.body.append(frame);
    });
    const portraitFrame = page.locator('#test-portrait-frame');
    const snapshot = () => portraitFrame.screenshot({ animations: 'disabled', scale: 'css' });
    const originalPortrait = await snapshot();
    await editor.locator('[data-tab=layout]').click();
    await editor.locator('#ymc-home-portrait .section-toggle').click();
    await page.locator('[data-prop=portraitEffect]').selectOption('both');
    const styledPortrait = await snapshot();
    assert.notDeepEqual(styledPortrait, originalPortrait);
    await page.locator('#ymc-compare').click();
    assert.deepEqual(await snapshot(), originalPortrait);
    await page.locator('#ymc-compare').click();
    await portraitFrame.evaluate(frame => frame.remove());
    await editor.locator('[data-tab=playlists]').click();
    await editor.locator('#ymc-playlists-gradient .section-toggle').click();
    await page.locator('[data-prop=playlistGradient]').selectOption('solid');
    assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().playlistGradient), 'solid');
    await page.locator('#ymc-compare').click();
    assert.equal(await page.locator('html').getAttribute('data-ymc-active'), 'no');
    await page.locator('#ymc-compare').click();
    await editor.locator('[data-tab=theme]').click();
    const remoteCover = process.env.YMC_TEST_COVER;
    await page.evaluate(remoteCover => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 12;
      const draw = canvas.getContext('2d');
      draw.fillStyle = '#FA3012';
      draw.fillRect(0, 0, 12, 12);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Обложка для проверки', artwork: [{ src: remoteCover || canvas.toDataURL() }]
      });
      YMusicCustomizer.update({ smartTheme: true, smartTransition: 500, smartStrength: 100 });
    }, remoteCover);
    await page.waitForFunction(() => document.querySelector('#ymusic-customizer-root').shadowRoot
      .getElementById('ymc-smart-status').textContent.includes('Используется палитра обложки'));
    await page.waitForFunction(() => getComputedStyle(document.body)
      .getPropertyValue('--ym-controls-color-primary-default-enabled').trim().toUpperCase() !== '#A855F7');
    assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().accent), '#A855F7');
    await page.evaluate(() => YMusicCustomizer.update({ smartTheme: false }));
    await editor.locator('#ymc-theme-palette .section-toggle').click();
    await page.locator('#ymc-open-store').click();
    assert.equal(await page.locator('[data-store-card]').count(), 24);
    await page.locator('#ymc-editor [data-tab=player]').click();
    await editor.locator('#ymc-discord .section-toggle').click();
    const id = '123456789012345678';
    await page.locator('#ymc-discord-id').fill(id);
    await page.locator('#ymc-discord-enabled').check();
    await page.locator('#ymc-discord-album').check();
    await page.locator('#ymc-discord-paused').check();
    await page.locator('#ymc-discord-save').click();
    const handshake = await waitFor(() => rpc.messages.find(record => record.opcode === 0));
    assert.deepEqual(handshake.message, { v: 1, client_id: id });
    await page.waitForFunction(async () => (await window.ymcMac.getState())?.discord === 'connected');

    await page.evaluate(() => {
      window.ymcMac.reportTrack({
        title: 'Тестовый трек', artist: 'Тестовый исполнитель', album: ' ТЕСТОВЫЙ  ТРЕК ',
        trackId: '1234', albumId: '5678', playing: true, position: 32, duration: 190,
        cover: 'https://avatars.yandex.net/test-cover'
      });
    });
    const activity = (await waitFor(() => rpc.messages.find(record => record.message.args?.activity?.details === 'Тестовый трек')))
      .message.args.activity;
    assert.equal(activity.type, 2);
    assert.equal(activity.name, 'Я. Музыка · nautro');
    assert.equal(activity.state, 'Тестовый исполнитель');
    assert.equal(activity.assets.large_image, 'https://avatars.yandex.net/test-cover');
    assert.equal(activity.assets.large_text, undefined);
    assert.deepEqual(activity.buttons, [{ label: 'Открыть трек', url: 'https://music.yandex.ru/album/5678/track/1234' }]);
    assert.equal(activity.timestamps.end - activity.timestamps.start, 190_000);
    await page.evaluate(() => window.ymcMac.reportTrack({
      title: 'Тестовый трек', artist: 'Тестовый исполнитель', album: 'Другой альбом', trackId: '1234', playing: false
    }));
    const paused = (await waitFor(() => rpc.messages.find(record => record.message.args?.activity?.state === 'На паузе · Тестовый исполнитель · Другой альбом')))
      .message.args.activity;
    assert.equal(paused.timestamps, undefined);
    assert.equal(paused.buttons[0].url, 'https://music.yandex.ru/track/1234');
    await page.locator('#ymc-discord-enabled').uncheck();
    await page.locator('#ymc-discord-save').click();
    await page.waitForFunction(async () => (await window.ymcMac.getState())?.discord === 'off');
    await waitFor(() => rpc.messages.find(record => record.message.cmd === 'SET_ACTIVITY' && record.message.args.activity === null));

    const outside = await app.evaluate(async ({ BrowserWindow }) => {
      const isolated = new BrowserWindow({ show: false });
      try {
        await isolated.loadURL('data:text/html;charset=utf-8,<p>Untrusted</p>');
        return await isolated.webContents.executeJavaScript('typeof window.ymcMac');
      } finally {
        isolated.destroy();
      }
    });
    assert.equal(outside, 'undefined');

    await page.locator('#ymc-close').click();
    await page.evaluate(() => {
      YMusicCustomizer.update({ barSpectrum: true, spectrumPlacement: 'page', spectrumStyle: 'wave' });
      const trigger = document.createElement('button');
      trigger.id = 'ymc-test-signal';
      trigger.textContent = 'Запустить контрольный сигнал';
      trigger.style.cssText = 'position:fixed;top:12px;left:12px;z-index:2147483639';
      trigger.addEventListener('click', async () => {
        const rate = 16000, samples = rate;
        const wav = new DataView(new ArrayBuffer(44 + samples * 2));
        const label = (offset, value) => [...value].forEach((letter, i) => wav.setUint8(offset + i, letter.charCodeAt(0)));
        label(0, 'RIFF'); wav.setUint32(4, 36 + samples * 2, true); label(8, 'WAVE');
        label(12, 'fmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true);
        wav.setUint32(24, rate, true); wav.setUint32(28, rate * 2, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true);
        label(36, 'data'); wav.setUint32(40, samples * 2, true);
        for (let i = 0; i < samples; i++) {
          const tone = Math.sin(2 * Math.PI * i * 140 / rate) + Math.sin(2 * Math.PI * i * 590 / rate);
          wav.setInt16(44 + i * 2, 3800 * tone, true);
        }
        const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
        const audio = new Audio(url), context = new AudioContext();
        audio.loop = true;
        const silence = context.createGain();
        silence.gain.value = 0;
        context.createMediaElementSource(audio).connect(silence).connect(context.destination);
        await context.resume();
        await audio.play();
        window.ymcTestAudio = { audio, context, url };
      });
      document.body.append(trigger);
    });
    await page.locator('#ymc-test-signal').click();
    await page.waitForFunction(() => {
      const { spectrumState, spectrumInput } = YMusicCustomizer.diagnostics();
      const canvas = document.querySelector('[data-ymc-page-spectrum] canvas');
      if (spectrumInput !== 'native' || spectrumState !== 'live' || !canvas) return false;
      const height = Math.max(1, Math.floor(canvas.height * .89));
      return canvas.getContext('2d').getImageData(0, 0, canvas.width, height).data.some(value => value > 0);
    });
    await page.evaluate(async () => {
      const { audio, context, url } = window.ymcTestAudio;
      audio.pause();
      await context.close();
      URL.revokeObjectURL(url);
      document.querySelector('#ymc-test-signal').remove();
    });
    await page.waitForFunction(() => document.querySelector('[data-ymc-page-spectrum] canvas')?.dataset.signal === 'idle');

    await page.evaluate(() => YMusicCustomizer.update({ accent: '#7891BB', name: 'macOS smoke' }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.YMusicCustomizer?.getTheme().name === 'macOS smoke');
    assert.equal(await page.evaluate(() => YMusicCustomizer.getTheme().accent), '#7891BB');
    console.log('PASS: real macOS client, passive native audio and canvas pixels, smart cover, store, portrait, Discord, isolated profile');
  } finally {
    try { await app?.close(); } finally {
      await rpc?.close();
      await rm(temporary, { recursive: true, force: true });
    }
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
