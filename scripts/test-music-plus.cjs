'use strict';

const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');
const fs = require('node:fs/promises');
const { attachMusicPlus, providerUrl, readManifest } = require('../plugins/music-plus/main.cjs');
const manifest = require('../plugins/music-plus/manifest.json');

async function run() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const temp = await fs.mkdtemp('/tmp/ymc-plus-');
  const handlers = new Map(), opened = [], requests = [];
  let blocked;
  const envelope = (overrides = {}) => {
    const payload = Buffer.from(JSON.stringify({ ...manifest, ...overrides }));
    return JSON.stringify({ payload: payload.toString('base64'), signature: sign('sha256', payload, privateKey).toString('base64') });
  };
  let asset = envelope();
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.startsWith('https://github.com/')) return new Response(asset);
    if (url.startsWith('https://secure.soundcloud.com/')) {
      assert.equal(options.headers.Authorization, 'Basic aWQ6c2VjcmV0');
      return Response.json({ access_token: 'test-token', expires_in: 3600 });
    }
    if (url.startsWith('https://api.soundcloud.com/')) {
      assert.equal(options.headers.Authorization, 'OAuth test-token');
      return Response.json({ collection: [
        { title: 'A song', user: { username: 'DJ' }, duration: 65000, permalink_url: 'https://soundcloud.com/dj/song' }
      ] });
    }
    assert.match(url, /^https:\/\/www\.googleapis\.com\/youtube\/v3\/search/);
    assert.equal(options.headers['X-Goog-Api-Key'], 'own-key');
    assert.ok(!url.includes('own-key'));
    if (new URL(url).searchParams.get('q') === 'cancel') {
      await new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
        blocked();
      });
    }
    return Response.json({ items: Array(2).fill({ id: { videoId: 'ABCDEFGHIJK' },
      snippet: { title: 'DJ - A song', channelTitle: 'DJ', thumbnails: { default: { url: 'https://not-youtube.example/x' } } } }) });
  };
  const app = { getPath: () => temp };
  const main = { handle: (name, callback) => handlers.set(name, callback) };
  const attach = () => attachMusicPlus(app, main, event => event === 'local', publicKey, '0.7.7', url => opened.push(url));
  const ipc = (name, data, sender = 'local') => handlers.get('ymc:music-plus:' + name)(sender, data);
  try {
    attach();
    assert.throws(() => readManifest(envelope({ minCustomizer: '9.0.0' }), publicKey, '0.7.7'), /обновите/);
    assert.throws(() => readManifest(envelope({ sources: ['other'] }), publicKey, '0.7.7'), /формат/);
    assert.equal(providerUrl('youtube', 'https://www.youtube.com.evil/watch?v=ABCDEFGHIJK'), null);
    assert.equal(providerUrl('youtube', 'https://user@www.youtube.com/watch?v=ABCDEFGHIJK'), null);
    assert.ok((await ipc('status', null, 'remote')).error);
    assert.equal((await ipc('status')).installed, null);
    asset = JSON.stringify({ ...JSON.parse(asset), payload: Buffer.from('modified').toString('base64') });
    assert.match((await ipc('install')).error, /Подпись/);
    asset = envelope();
    assert.equal((await ipc('install')).installed.version, '0.1.0');
    attach();
    assert.equal((await ipc('status')).installed.version, '0.1.0');
    assert.ok((await ipc('open', { source: 'soundcloud', url: 'file:///tmp/sensitive' })).error);
    await ipc('open', { source: 'spotify', query: 'DJ / & голос' });
    assert.equal(opened[0], 'https://open.spotify.com/search/DJ%20%2F%20%26%20%D0%B3%D0%BE%D0%BB%D0%BE%D1%81');
    const args = { query: 'DJ', kind: 'tracks', sources: manifest.sources };
    assert.deepEqual((await ipc('search', args)).results.map(r => r.reason), ['connect', 'connect', 'external', 'external']);
    await ipc('connect', { source: 'youtube', key: 'own-key' });
    await ipc('connect', { source: 'soundcloud', id: 'id', secret: 'secret' });
    const data = await ipc('search', args);
    assert.equal(data.results[0].rows.length, 1);
    assert.equal(data.results[0].rows[0].image, '');
    assert.equal(data.results[1].rows[0].duration, 65);
    const before = requests.length;
    await ipc('search', args);
    assert.equal(requests.length, before);
    const artist = await ipc('search', { ...args, kind: 'artist' });
    assert.match(requests.at(-1).url, /order=viewCount/);
    assert.equal(artist.results[1].reason, 'external');
    const started = new Promise(resolve => { blocked = resolve; });
    const lookup = ipc('search', { query: 'cancel', kind: 'top', sources: ['youtube'] });
    await started;
    await ipc('cancel');
    assert.equal((await lookup).canceled, true);
    asset = envelope({ version: '0.1.1' });
    assert.equal((await ipc('check')).available, true);
    assert.equal((await ipc('install')).installed.version, '0.1.1');
    asset = envelope();
    assert.equal((await ipc('check')).available, false);
    assert.equal((await ipc('install')).installed.version, '0.1.1');
    assert.equal((await ipc('remove')).installed, null);
    attach();
    assert.equal((await ipc('status')).installed, null);
    console.log('PASS: signed plugin install/update/removal, no rollback, trusted IPC, URL allowlist, provider API contracts, cache and cancellation');
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
