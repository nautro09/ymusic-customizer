'use strict';

const { createHash, verify } = require('node:crypto');
const { execFile, spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');

const run = promisify(execFile);
const VERSION = '0.7.3';
const RELEASES = 'https://github.com/nautro09/ymusic-customizer/releases';
const LATEST = RELEASES + '/latest/download/';
const KEY = '__YMC_UPDATE_PUBLIC_KEY__';
const PACKAGE = {
  darwin: 'YMusic-Customizer-macOS.zip',
  win32: 'YMusic-Customizer-Windows.zip'
};

async function download(url, maxSize) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok || !response.body) throw Error('Файл обновления недоступен.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxSize) throw Error('Файл обновления превышает допустимый размер.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function readManifest(payload, signature) {
  if (!verify('sha256', payload, KEY, signature)) throw Error('Подпись обновления не совпадает.');
  const manifest = JSON.parse(payload.toString('utf8'));
  const version = manifest?.version;
  if (typeof version !== 'string' || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version)) throw Error('Неизвестный формат версии.');
  const installed = VERSION.split('.').map(Number);
  const difference = version.split('.').map((part, i) => Number(part) - installed[i]).find(Boolean);
  const sha256 = manifest.sha256?.[process.platform];
  if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) throw Error('Сборка для этой системы недоступна.');
  return { version, sha256, available: difference > 0, notes: typeof manifest.notes === 'string' ? manifest.notes.slice(0, 1200) : '' };
}

const quitAndInstallMac = async (app, installer, stage) => {
  const bundle = path.resolve(process.execPath, '../../..');
  const log = path.join(app.getPath('userData'), 'ymc-update.log');
  const handle = await fs.open(log, 'a', 0o600);
  try {
    const worker = spawn('/bin/bash', ['-c', `
stage="$1"
trap 'rm -rf -- "$stage"' EXIT
for ((attempt=0; attempt<40; attempt++)); do
  if ! kill -0 "$2" 2>/dev/null; then
    "$3" --online-update "$4"
    /usr/bin/open "$4"
    exit
  fi
  sleep 1
done
echo 'Яндекс Музыка не завершилась. Установка отложена.'
`, 'ymc-update', stage, String(process.pid), installer, bundle], {
      detached: true, stdio: ['ignore', handle.fd, handle.fd]
    });
    await new Promise((resolve, reject) => {
      worker.once('spawn', resolve);
      worker.once('error', reject);
    });
    worker.unref();
  } finally {
    await handle.close();
  }
  setTimeout(() => app.quit(), 250);
};

function powershell(script, args, extraEnv = {}) {
  const exe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return run(exe, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', script, ...args],
    { windowsHide: true, timeout: 180000, env: { ...process.env, ...extraEnv } });
}

function attachUpdater(app, ipcMain, trusted) {
  const packageName = PACKAGE[process.platform];
  if (!packageName) return;
  let request;
  let installing = false;
  let selected;
  async function check() {
    if (!request) {
      request = Promise.all([
        download(LATEST + 'update.json', 8192),
        download(LATEST + 'update.sig', 1024)
      ]).then(([payload, signature]) => readManifest(payload, signature)).finally(() => { request = null; });
    }
    selected = await request;
    const { available, version, notes } = selected;
    return { available, version, notes };
  }

  ipcMain.handle('ymc:update:check', async event => {
    if (!trusted(event)) return { error: 'Проверка обновлений недоступна.' };
    try { return await check(); }
    catch { return { error: 'Не удалось проверить подписанный релиз. Попробуйте позже.' }; }
  });
  ipcMain.handle('ymc:update:install', async event => {
    if (!trusted(event) || !selected?.available || installing) return { error: 'Обновление недоступно.' };
    const { version, sha256 } = selected;
    installing = true;
    let stage;
    let handedOff = false;
    try {
      const zip = await download(RELEASES + '/download/v' + version + '/' + packageName, 32 * 1024 * 1024);
      if (createHash('sha256').update(zip).digest('hex') !== sha256) throw Error('Контрольная сумма файла не совпадает.');
      stage = await fs.mkdtemp(path.join(app.getPath('temp'), 'ymc-update-'));
      const archive = path.join(stage, packageName);
      await fs.writeFile(archive, zip);
      if (process.platform === 'darwin') {
        await run('/usr/bin/ditto', ['-x', '-k', archive, stage]);
        const installer = path.join(stage, 'YMusic Customizer.app', 'Contents', 'MacOS', 'YMusicCustomizer');
        await run(installer, ['--check-online-update', path.resolve(process.execPath, '../../..')]);
        await quitAndInstallMac(app, installer, stage);
        handedOff = true;
      } else {
        await powershell('-Command', [
          'Expand-Archive -LiteralPath $env:YMC_UPDATE_ZIP -DestinationPath $env:YMC_UPDATE_STAGE -ErrorAction Stop'
        ], { YMC_UPDATE_ZIP: archive, YMC_UPDATE_STAGE: stage });
        await powershell('-File', [path.join(stage, 'scripts', 'install.ps1')]);
        app.relaunch();
        setTimeout(() => app.quit(), 250);
      }
      selected = null;
      return { restarting: true };
    } catch (error) {
      const message = String(error.stdout || error.stderr || error.message).trim();
      return { error: message.slice(0, 500) || 'Не удалось установить обновление.' };
    } finally {
      if (stage && !handedOff) await fs.rm(stage, { recursive: true, force: true }).catch(() => {});
      installing = false;
    }
  });
}

module.exports = { attachUpdater };
