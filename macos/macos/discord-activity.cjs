'use strict';

const NAME = 'Я. Музыка · nautro';
const BUTTON = 'Открыть трек';

function text(value) {
  if (typeof value !== 'string') return '';
  const clean = value.trim().replace(/\s+/gu, ' ');
  return clean.length <= 128 ? clean : clean.slice(0, 127).replace(/[\uD800-\uDBFF]$/, '') + '…';
}

function id(value) {
  if (Number.isSafeInteger(value)) value = String(value);
  return typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) ? value : '';
}

function coverUrl(value) {
  if (typeof value !== 'string' || value.length > 512) return '';
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.port && !url.username && !url.password &&
        /(^|\.)(yandex\.(net|ru|com)|yastatic\.net)$/.test(url.hostname)) return url.href;
  } catch { /* Artwork is optional. */ }
  return '';
}

function trackData(value) {
  const title = text(value?.title);
  if (!title || typeof value.playing !== 'boolean') return null;
  const trackId = id(value.trackId), albumId = id(value.albumId);
  const url = trackId ? 'https://music.yandex.ru' + (albumId ? '/album/' + albumId : '') + '/track/' + trackId : '';
  const validTime = Number.isFinite(value.duration) && Number.isFinite(value.position) &&
    value.duration > 0 && value.duration < 7 * 24 * 3600 && value.position >= 0 && value.position < value.duration;
  const start = validTime ? Date.now() - Math.round(value.position * 1000) : 0;
  const end = validTime ? start + Math.round(value.duration * 1000) : 0;
  return { title, artist: text(value.artist), album: text(value.album), cover: coverUrl(value.cover),
    playing: value.playing, start, end, url };
}

function activityFor(track, { showPaused = false, showAlbum = false } = {}) {
  if (!track || (!track.playing && !showPaused)) return null;
  const unique = new Set([track.title.normalize('NFKC').toLowerCase()]);
  const lines = [];
  if (!track.playing) lines.push('На паузе');
  for (const value of [track.artist, showAlbum ? track.album : '']) {
    const key = value.normalize('NFKC').toLowerCase();
    if (!value || unique.has(key)) continue;
    unique.add(key);
    lines.push(value);
  }
  const field = value => value.length === 1 ? value + '\u200b' : value;
  const activity = { type: 2, name: NAME, details: field(track.title), instance: false };
  if (lines.length) activity.state = field(text(lines.join(' · ')));
  if (track.cover) activity.assets = { large_image: track.cover };
  if (track.playing && track.start) activity.timestamps = { start: track.start, end: track.end };
  if (track.url) activity.buttons = [{ label: BUTTON, url: track.url }];
  return activity;
}

module.exports = { trackData, activityFor };
