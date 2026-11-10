'use strict';

const { randomUUID, verify } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const ASSET = 'https://github.com/nautro09/ymusic-customizer/releases/download/music-plus-beta/music-plus.json';
const SOURCES = ['youtube', 'soundcloud', 'vk', 'spotify'];
const KINDS = {
  top: ['video', 'tracks'], tracks: ['video', 'tracks'], clips: ['video', null],
  artists: ['channel', 'users'], playlists: ['playlist', 'playlists'],
  artist: ['video', null]
};
const VERSION_FORMAT = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const compare = (a, b) => a.split('.').map((n, i) => Number(n) - Number(b.split('.')[i])).find(Boolean) || 0;
const bounded = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const queryText = value => bounded(value, 120).replace(/\s+/g, ' ');

function readManifest(raw, key, hostVersion) {
  const envelope = JSON.parse(raw);
  const payload = Buffer.from(envelope.payload, 'base64');
  const signature = Buffer.from(envelope.signature, 'base64');
  if (!verify('sha256', payload, key, signature)) throw Error('Подпись плагина не совпадает.');
  const manifest = JSON.parse(payload);
  if (manifest.id !== 'music-plus' || typeof manifest.version !== 'string' || !VERSION_FORMAT.test(manifest.version) ||
      typeof manifest.minCustomizer !== 'string' || !VERSION_FORMAT.test(manifest.minCustomizer) || manifest.api !== 1 ||
      !Array.isArray(manifest.sources) || !manifest.sources.length ||
      new Set(manifest.sources).size !== manifest.sources.length ||
      !manifest.sources.every(source => SOURCES.includes(source))) throw Error('Неизвестный формат плагина.');
  if (compare(hostVersion, manifest.minCustomizer) < 0) throw Error('Сначала обновите Customizer.');
  return {
    version: manifest.version, sources: manifest.sources, notes: bounded(manifest.notes, 1000)
  };
}

function providerUrl(source, value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (source === 'youtube' && url.hostname === 'www.youtube.com' &&
        (/^\/(?:channel\/UC[\w-]{22}|results|playlist)$/.test(url.pathname) ||
         (url.pathname === '/watch' && /^[\w-]{11}$/.test(url.searchParams.get('v') ?? '')))) return url.href;
    if (source === 'soundcloud' && url.hostname === 'soundcloud.com' &&
        /^\/(?:[\w.-]+\/?){1,3}$/.test(url.pathname) && !url.pathname.includes('//')) return url.href;
    if (source === 'vk' && url.hostname === 'vk.com' && url.pathname === '/audio') return url.href;
    if (source === 'spotify' && url.hostname === 'open.spotify.com' && url.pathname.startsWith('/search/')) return url.href;
  } catch {}
  return null;
}

function searchLink(source, query) {
  switch (source) {
    case 'youtube': return 'https://www.youtube.com/results?' + new URLSearchParams({ search_query: query });
    case 'soundcloud': return 'https://soundcloud.com/search?' + new URLSearchParams({ q: query });
    case 'vk': return 'https://vk.com/audio?' + new URLSearchParams({ q: query });
    case 'spotify': return 'https://open.spotify.com/search/' + encodeURIComponent(query);
    default: return null;
  }
}

async function bytes(url, limit, options = {}) {
  const response = await fetch(url, { redirect: 'error', ...options });
  if (!response.ok || !response.body) {
    await response.body?.cancel().catch(() => {});
    const error = Error(({ 401: 'Проверьте данные подключения.', 403: 'Площадка отклонила запрос. Проверьте доступ API и квоту.',
      429: 'Лимит запросов площадки. Попробуйте позже.' })[response.status] || 'Площадка временно недоступна.');
    error.status = response.status;
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw Error('Слишком большой ответ.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

const json = async (url, options) => JSON.parse(await bytes(url, 768 * 1024, options));
const deadline = signal => AbortSignal.any([signal, AbortSignal.timeout(10000)]);
const row = (source, kind, data) => {
  const url = providerUrl(source, data.url);
  const title = bounded(data.title, 250);
  if (!url || !title) return null;
  return { source, kind, title, artist: bounded(data.artist, 180), url,
    image: data.image, duration: Number.isFinite(data.duration) && data.duration > 0 ? data.duration : null };
};

function artwork(value, domains) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        domains.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) return url.href;
  } catch {}
  return '';
}

async function youtube(query, kind, key, signal, orderByViews) {
  const params = new URLSearchParams({ part: 'snippet', q: query, type: kind, maxResults: '10' });
  if (kind === 'video') params.set('videoCategoryId', '10');
  if (kind === 'video' && orderByViews) params.set('order', 'viewCount');
  const result = await json('https://www.googleapis.com/youtube/v3/search?' + params, {
    headers: { 'X-Goog-Api-Key': key }, signal
  });
  return (result.items || []).map(item => {
    const info = item.snippet || {};
    const url = kind === 'video' && /^[\w-]{11}$/.test(item.id?.videoId ?? '')
      ? 'https://www.youtube.com/watch?v=' + item.id.videoId
      : kind === 'channel' && /^UC[\w-]{22}$/.test(item.id?.channelId ?? '')
        ? 'https://www.youtube.com/channel/' + item.id.channelId
        : kind === 'playlist' && /^[\w-]{10,100}$/.test(item.id?.playlistId ?? '')
          ? 'https://www.youtube.com/playlist?list=' + item.id.playlistId : '';
    return row('youtube', kind, {
      url, title: info.title, artist: kind === 'channel' ? '' : info.channelTitle,
      image: artwork(info.thumbnails?.default?.url, ['ytimg.com', 'ggpht.com'])
    });
  }).filter(Boolean);
}

async function soundcloud(query, kind, credentials, signal) {
  if (!credentials.token || credentials.expires <= Date.now()) {
    const auth = 'Basic ' + Buffer.from(credentials.id + ':' + credentials.secret).toString('base64');
    const token = await json('https://secure.soundcloud.com/oauth/token', {
      method: 'POST', signal, headers: {
        Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' })
    });
    if (!bounded(token.access_token, 4096) || !Number.isFinite(token.expires_in)) throw Error('Не получен токен SoundCloud.');
    credentials.token = token.access_token;
    credentials.expires = Date.now() + Math.max(0, token.expires_in - 60) * 1000;
  }
  const params = new URLSearchParams({ q: query, limit: '10', linked_partitioning: 'true' });
  if (kind === 'playlists') params.set('show_tracks', 'false');
  const result = await json('https://api.soundcloud.com/' + kind + '?' + params, {
    headers: { Authorization: 'OAuth ' + credentials.token, Accept: 'application/json' }, signal
  }).catch(error => {
    if (error.status === 401) credentials.token = null;
    throw error;
  });
  return (Array.isArray(result) ? result : result.collection || []).map(item => row('soundcloud', kind, {
    url: item.permalink_url, title: kind === 'users' ? item.username : item.title,
    artist: item.user?.username, image: artwork(item.artwork_url || item.avatar_url, ['sndcdn.com']),
    duration: item.duration ? item.duration / 1000 : null
  })).filter(Boolean);
}

function attachMusicPlus(app, ipcMain, trusted, key, hostVersion, openExternal) {
  const file = path.join(app.getPath('userData'), 'ymc-music-plus.json');
  const cache = new Map();
  let request, operation, installed, pending, youtubeKey, sc;
  const load = () => installed ??= fs.stat(file)
    .then(async stat => stat.size <= 16384 ? readManifest(await fs.readFile(file), key, hostVersion) : null)
    .catch(() => null);
  const status = async () => ({
    installed: await load(), connected: { youtube: Boolean(youtubeKey), soundcloud: Boolean(sc) }
  });
  const reset = () => {
    request?.abort();
    cache.clear();
    youtubeKey = sc = undefined;
  };
  const check = async () => {
    const raw = await bytes(ASSET, 16384, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    return { raw, manifest: readManifest(raw, key, hostVersion) };
  };
  function mutate(callback) {
    if (operation) return operation;
    operation = callback().finally(() => { operation = null; });
    return operation;
  }
  const handle = (name, callback) => ipcMain.handle('ymc:music-plus:' + name, async (event, value) => {
    if (!trusted(event)) return { error: 'Действие недоступно.' };
    try { return await callback(value); }
    catch (error) {
      if (error.name === 'AbortError') return { canceled: true };
      if (error.name === 'TimeoutError') return { error: 'Площадка долго отвечает. Попробуйте позже.' };
      // Fetch can include network diagnostics and credentials in errors. Return only approved messages.
      return { error: error.message && /^(?:Площадка |Лимит |Проверьте |Подпись |Слишком |Неизвестный |Сначала |Не получен )/.test(error.message)
        ? error.message : 'Не удалось выполнить запрос. Попробуйте позже.' };
    }
  });
  handle('status', status);
  handle('check', async () => {
    const current = await load();
    pending = await check();
    return { ...statusOf(current, pending.manifest), latest: pending.manifest };
  });
  const statusOf = (current, next) => ({ available: !current || compare(next.version, current.version) > 0 });
  handle('install', () => mutate(async () => {
    const current = await load();
    const next = pending || await check();
    pending = null;
    if (!statusOf(current, next.manifest).available) return status();
    const temp = file + '.' + randomUUID();
    try {
      await fs.writeFile(temp, next.raw, { flag: 'wx', mode: 0o600 });
      await fs.rename(temp, file);
    } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
    installed = Promise.resolve(next.manifest);
    if (current) {
      request?.abort();
      cache.clear();
    }
    return status();
  }));
  handle('remove', () => mutate(async () => {
    await fs.rm(file, { force: true });
    installed = Promise.resolve(null);
    pending = undefined;
    reset();
    return status();
  }));
  handle('connect', async value => {
    if (!(await load())?.sources.includes(value?.source)) return { error: 'Сначала установите плагин.' };
    request?.abort();
    cache.clear();
    const credential = text => typeof text === 'string' && /^[\w.-]{1,256}$/.test(text.trim()) ? text.trim() : '';
    if (value.source === 'youtube') {
      if (value.disconnect) youtubeKey = undefined;
      else {
        const key = credential(value.key);
        if (!key) return { error: 'Введите ключ YouTube Data API.' };
        youtubeKey = key;
      }
    } else if (value.source === 'soundcloud') {
      if (value.disconnect) sc = undefined;
      else {
        const id = credential(value.id), secret = credential(value.secret);
        if (!id || !secret) return { error: 'Введите Client ID и Client Secret SoundCloud.' };
        sc = { id, secret };
      }
    }
    return status();
  });
  handle('cancel', () => { request?.abort(); return {}; });
  handle('open', async value => {
    const source = value?.source;
    if (!(await load())?.sources.includes(source)) return { error: 'Источник недоступен.' };
    const url = providerUrl(source, value.url || searchLink(source, queryText(value.query)));
    if (!url) return { error: 'Ссылка площадки недоступна.' };
    await openExternal(url);
    return {};
  });
  handle('search', async value => {
    const manifest = await load();
    const query = queryText(value?.query);
    if (!manifest || query.length < 2 || !Object.hasOwn(KINDS, value?.kind)) return { results: [] };
    request?.abort();
    const controller = new AbortController();
    request = controller;
    const signal = deadline(controller.signal);
    const enabled = Array.isArray(value.sources) ? value.sources.slice(0, 4) : [];
    const [ytKind, scKind] = KINDS[value.kind];
    const results = await Promise.all(manifest.sources.filter(source => enabled.includes(source)).map(async source => {
      const kind = source === 'youtube' ? ytKind : source === 'soundcloud' ? scKind : null;
      const credentials = source === 'youtube' ? youtubeKey : sc;
      const link = searchLink(source, query);
      if (!kind || !credentials) return { source, link, reason: !kind ? 'external' : 'connect' };
      const cacheKey = JSON.stringify([source, value.kind, query]);
      const saved = cache.get(cacheKey);
      if (saved && saved.until > Date.now()) return { source, link, rows: saved.rows };
      try {
        const rows = source === 'youtube' ? await youtube(query, kind, credentials, signal, value.kind === 'artist') :
          await soundcloud(query, kind, credentials, signal);
        if (signal.aborted) return { source, link };
        const unique = [...new Map(rows.map(item => [item.url, item])).values()];
        if (cache.size >= 24) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, { rows: unique, until: Date.now() + 120000 });
        return { source, link, rows: unique };
      } catch (error) {
        return { source, link, error: error.status ? error.message : 'Поиск недоступен. Можно открыть площадку.' };
      }
    }));
    if (request === controller) request = undefined;
    return controller.signal.aborted ? { canceled: true } : { results };
  });
}

module.exports = { attachMusicPlus, readManifest, providerUrl, searchLink };
