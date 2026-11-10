/* Trusted client for the optional Music Plus beta. */
globalThis.__ymcMusicPlus = ({ shadow, request, goTo }) => {
  const title = { youtube: 'YouTube', soundcloud: 'SoundCloud', vk: 'VK Музыка', spotify: 'Spotify' };
  const initials = { youtube: 'YT', soundcloud: 'SC', vk: 'VK', spotify: 'SP' };
  const icons = {
    youtube: '<svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" rx="4" fill="#ff0033"/><path d="m10 4 6 4-6 4Z" fill="#fff"/></svg>',
    soundcloud: '<svg viewBox="0 0 24 16" aria-hidden="true"><path fill="#fa5b16" d="M10 5a6 6 0 0 1 11 2 3 3 0 1 1 0 6H10zM7 6h2v7H7zM4 8h2v5H4zM1 9h2v3H1z"/></svg>'
  };
  const tabs = new Map([
    ['топ', 'top'], ['треки', 'tracks'], ['исполнители', 'artists'], ['альбомы', 'albums'],
    ['моя волна', 'wave'], ['плейлисты', 'playlists'], ['подкасты', 'podcasts'],
    ['аудиокниги', 'audiobooks'], ['клипы', 'clips'], ['концерты', 'concerts'],
    ['top', 'top'], ['tracks', 'tracks'], ['artists', 'artists'], ['playlists', 'playlists'], ['videos', 'clips']
  ]);
  const onlineKinds = new Set(['top', 'tracks', 'artists', 'playlists', 'clips', 'artist']);
  const searchRoot = '[class*="SearchPage_root__"]';
  const searchTabs = '[class*="SearchPage_tabs__"]';
  const searchMain = '[class*="SearchPage_main__"]';
  const nativeTrack = '[class*="CommonTrack_root__"]';
  const nativeTitle = '[class*="Meta_title__"],[class*="Meta_trackTitle__"]';
  const nativeArtist = '[class*="Meta_artists__"]';
  const searchInput = 'input[class*="SearchInput_searchInput__"], [class*="SearchInput_root__"] input, [class*="SearchPage_input__"] input, input[type=search]';
  const artistRoot = '[class*="ArtistPage_root__"]';
  const vibeRoot = '[class*="VibePage_root__"]';
  const ownedSelector = [searchRoot, searchTabs, searchMain, artistRoot, vibeRoot].join(',');
  const setting = 'ymc:music-plus:prefs:1';
  const store = shadow.querySelector('#ymc-music-plus-store');
  const settings = shadow.querySelector('#ymc-music-plus-settings');
  const mainTab = shadow.querySelector('[data-tab="music-plus"]');
  const node = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text) item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  const button = (label, action, className = '') => {
    const item = node('button', label, className);
    item.type = 'button';
    item.addEventListener('click', action);
    return item;
  };
  const paragraph = text => node('p', text, 'muted');
  const normalize = text => text.normalize('NFKC').toLowerCase().replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const labels = values => [...new Map(values.map(value => [normalize(value), value])).values()];
  const limit = (values, max) => (Array.isArray(values) ? values : [])
    .filter(value => typeof value === 'string' && value.trim()).slice(0, max).map(value => value.trim().slice(0, 120));
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(setting)) || {}; } catch {}
  const seeds = labels(limit(prefs.seeds, 24));
  const selected = new Set(Array.isArray(prefs.sources) ? limit(prefs.sources, 4) : ['youtube', 'soundcloud', 'vk', 'spotify']);
  const picks = new Map();
  const seen = new Set();
  const recent = [];
  let connectionKey, snapshot = {}, pending, active = null, panel, detachedControl, timer, updateTime, generation = 0;
  let busy = false, storeMessage = '', settingsMessage = '', currentPick, seedOffset = 0, waveNotice = '';

  function savePrefs() {
    try { localStorage.setItem(setting, JSON.stringify({ seeds, sources: [...selected] })); } catch {}
  }

  const call = async (action, payload) => {
    try { return await request?.(action, payload) || { error: 'Нужна настольная сборка Customizer.' }; }
    catch { return { error: 'Не удалось связаться с плагином.' }; }
  };
  const installed = () => snapshot.installed;
  function statusLine(text) {
    const line = paragraph(text);
    line.setAttribute('role', 'status');
    return line;
  }

  async function syncState() {
    const state = await call('status');
    if (!state.error) snapshot = state;
    mainTab.hidden = !installed();
    syncPage();
    return state;
  }
  async function manage(action) {
    if (busy) return;
    busy = true;
    renderEditor();
    const result = await call(action);
    if (result.error) storeMessage = settingsMessage = result.error;
    else if (action === 'check') {
      pending = result.available ? result.latest : null;
      storeMessage = settingsMessage = pending ? 'Доступна версия ' + pending.version + '. ' + pending.notes :
        'Установлена актуальная версия.';
    } else {
      snapshot = result;
      pending = null;
      storeMessage = settingsMessage = installed() ? 'Установлена версия ' + installed().version + '.' : 'Плагин удалён.';
      if (action === 'remove') {
        settings.replaceChildren();
        connectionKey = undefined;
        picks.clear();
        seen.clear();
        recent.length = 0;
        currentPick = undefined;
        goTo('plugins');
      }
    }
    updateTime = Date.now();
    busy = false;
    mainTab.hidden = !installed();
    syncPage();
    renderEditor();
  }

  function renderEditor() {
    if (!store || !settings) return;
    const current = installed();
    const download = (label, action, style) => {
      const item = button(label, () => manage(action), style);
      item.disabled = busy || !request;
      return item;
    };
    const controls = node('div', '', 'buttons');
    controls.append(current
      ? button('Настроить', () => goTo('music-plus'), 'btn primary')
      : download('Скачать и установить', 'install', 'btn primary'));
    store.replaceChildren(
      node('h3', 'Музыка+ · бета'),
      paragraph('Ищите треки, клипы и исполнителей на других площадках рядом с выдачей Яндекс Музыки.'),
      paragraph('YouTube и SoundCloud поддерживают поиск по API. Для VK Музыки и Spotify открывается поиск на площадке.'),
      statusLine(busy ? 'Подождите…' : storeMessage || (current ? 'Установлена версия ' + current.version : 'Не установлена')),
      controls
    );
    if (!current) return;
    const updates = node('div', '', 'buttons');
    updates.append(download('Проверить обновления', 'check', 'btn'), download('Удалить плагин', 'remove', 'btn'));
    if (pending) updates.prepend(download('Установить ' + pending.version, 'install', 'btn primary'));
    const header = node('div', '', 'music-plus-updates');
    header.append(node('h3', 'Плагин · ' + current.version), statusLine(
      busy ? 'Подождите…' : settingsMessage || 'Обновления проверяются при открытии этой вкладки.'), updates);
    const nextKey = JSON.stringify([current.sources, snapshot.connected]);
    if (nextKey === connectionKey && settings.firstChild) {
      settings.firstChild.replaceWith(header);
      return;
    }
    connectionKey = nextKey;
    settings.replaceChildren(header, paragraph(
      'Данные для API хранятся в памяти до закрытия Яндекс Музыки. При запуске поиска запрос получает выбранная площадка.'));
    for (const source of current.sources) {
      if (source !== 'youtube' && source !== 'soundcloud') continue;
      const group = node('form', '', 'music-plus-connect');
      const connected = snapshot.connected?.[source];
      group.append(node('h3', title[source]), paragraph(connected ? 'Подключено для этого сеанса.' :
        source === 'youtube' ? 'Нужен ключ Google Cloud с включённым YouTube Data API v3.' :
          'Нужны Client ID и Client Secret собственного приложения SoundCloud (Artist Pro).'));
      if (connected) {
        group.append(button('Отключить', () => connect({ source, disconnect: true }), 'btn'));
      } else {
        const fields = source === 'youtube' ? [['key', 'Ключ API']] : [['id', 'Client ID'], ['secret', 'Client Secret']];
        const inputs = fields.map(([name, label]) => {
          const field = node('label', label);
          const input = node('input');
          input.type = 'password';
          input.autocomplete = 'off';
          input.name = name;
          input.required = true;
          input.maxLength = 256;
          field.append(input);
          group.append(field);
          return input;
        });
        const submit = node('button', 'Подключить', 'btn');
        submit.type = 'submit';
        group.append(submit);
        group.addEventListener('submit', event => {
          event.preventDefault();
          const credentials = Object.fromEntries(inputs.map(input => [input.name, input.value]));
          group.reset();
          connect({ source, ...credentials });
        });
      }
      settings.append(group);
    }
  }

  async function connect(credentials) {
    const result = await call('connect', credentials);
    settingsMessage = result.error || (credentials.disconnect ? 'Подключение отключено.' : 'Подключение сохранено для этого сеанса.');
    if (!result.error) {
      snapshot = result;
      if (credentials.disconnect) {
        for (const [key, item] of picks) if (item.source === credentials.source) picks.delete(key);
        if (currentPick?.source === credentials.source) currentPick = undefined;
      }
      resetResults();
    }
    renderEditor();
  }

  const UI_CSS = `
    :host{display:block;box-sizing:border-box;margin:8px 0 14px;color:var(--ym-controls-color-primary-text-enabled,var(--ym-color-text-primary,light-dark(#242126,#fff)));font:inherit;min-width:0}
    :host([hidden]),[hidden]{display:none!important}
    :host([data-ymc-music-plus-control]){display:inline-flex;flex:0 0 auto;margin:0;white-space:nowrap}
    :host([data-mode=search]){margin-inline:var(--ym-spacer-size-l,12px)}
    *{box-sizing:border-box}
    .box{padding:12px;display:grid;gap:10px;border-radius:16px;border:1px solid color-mix(in srgb,currentColor 17%,transparent);
      background:var(--ym-background-color-primary-enabled-popover,light-dark(#faf9fb,#25242a))}
    .toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:7px}
    .toolbar+.box{margin-top:8px}
    button{font:inherit;font-size:13px;min-height:32px;color:inherit;border-radius:9px;padding:6px 10px;cursor:pointer;
      border:1px solid color-mix(in srgb,currentColor 16%,transparent);background:color-mix(in srgb,currentColor 7%,transparent)}
    button:hover,button[aria-pressed=true]{background:color-mix(in srgb,currentColor 14%,transparent)}
    button:focus-visible,input:focus-visible{outline:2px solid currentColor;outline-offset:2px}
    button:disabled{opacity:.48;cursor:default}
    .muted{opacity:.78;font-size:13px;margin:0;overflow-wrap:anywhere}
    .list{margin:0;padding:0;list-style:none;display:grid;gap:3px}
    .row{display:grid;grid-template-columns:40px minmax(0,1fr) 32px 34px auto;gap:8px;align-items:center;
      min-height:48px;padding:4px 6px;border-radius:10px;background:color-mix(in srgb,currentColor 5%,transparent)}
    .row:hover{background:color-mix(in srgb,currentColor 9%,transparent)}
    img,.cover{width:40px;height:40px;display:block;object-fit:cover;border-radius:6px;background:color-mix(in srgb,currentColor 10%,transparent)}
    .details{background:transparent;border:0;text-align:start;min-width:0;padding:4px 0}
    .details span,.details strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .badge{justify-self:center;min-width:27px;text-align:center;border-radius:6px;padding:2px 3px;
      font-size:10px;font-weight:800;letter-spacing:.025em;background:color-mix(in srgb,currentColor 12%,transparent)}
    .badge svg{width:17px;height:14px;vertical-align:middle}
    .heart{width:34px;padding:2px;font-size:18px}
    time{font-size:12px;font-variant-numeric:tabular-nums;opacity:.78}
    h3,h4{font-size:14px;margin:0}
    .provider{display:grid;gap:6px;min-width:0}
    .provider+.provider{border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);padding-top:8px}
    .seeds{display:flex;gap:6px;flex-wrap:wrap}
    input{min-width:110px;flex:1;padding:6px 8px;background:transparent;color:inherit;
      border:1px solid color-mix(in srgb,currentColor 24%,transparent);border-radius:8px;font:inherit}
    :host([data-mode=wave]){position:absolute;inset:clamp(16px,5vh,52px) clamp(12px,4vw,56px) auto auto;z-index:4;
      width:min(380px,calc(100% - 25px));margin:0;pointer-events:none}
    :host([data-mode=wave]) .toolbar{justify-content:flex-end}
    :host([data-mode=wave]) .box{max-height:min(60vh,540px);overflow:auto;box-shadow:0 8px 28px #0004}
    :host([data-mode=wave]) :is(button,.box){pointer-events:auto}
    @media(max-width:470px){.row{grid-template-columns:32px minmax(0,1fr) 28px 34px;gap:5px}
      .cover,img{width:32px;height:32px}time{display:none}}
  `;
  const buttonLabel = { search: 'Источники · бета', artist: 'Другие площадки · бета', wave: 'Своя волна · бета' };

  function unmount() {
    active?.remove();
    detachedControl?.remove();
    active = panel = detachedControl = null;
    resetResults(false);
  }

  function mountPage(mode, parent, before, controlParent) {
    unmount();
    const el = node('div');
    el.dataset.ymcMusicPlus = '';
    el.dataset.mode = mode;
    const ui = el.attachShadow({ mode: 'open' });
    const css = node('style', UI_CSS);
    const toolbar = node('div', '', 'toolbar');
    const box = node('section', '', 'box');
    // A toolbar in the native tabs row must not paint or cover the scrolling results when closed.
    if (controlParent) el.hidden = true;
    box.hidden = true;
    box.setAttribute('aria-label', buttonLabel[mode]);
    box.id = 'ymc-music-plus-page';
    const toggle = button(buttonLabel[mode], () => {
      const open = box.hidden;
      box.hidden = !open;
      if (controlParent) el.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        if (mode !== 'wave') {
          const { kind, query } = searchState();
          panel.dataset.query = kind + '\n' + query;
        }
        draw();
        if (controlParent) box.scrollIntoView({ block: 'nearest' });
      } else resetResults(false);
    });
    if (!controlParent) toggle.setAttribute('aria-controls', box.id);
    toggle.setAttribute('aria-expanded', 'false');
    toolbar.append(toggle);
    if (controlParent) {
      detachedControl = node('div');
      detachedControl.dataset.ymcMusicPlusControl = '';
      const control = detachedControl.attachShadow({ mode: 'open' });
      control.append(node('style', UI_CSS), toolbar);
      controlParent.append(detachedControl);
    } else {
      ui.append(toolbar);
    }
    ui.prepend(css);
    ui.append(box);
    parent.insertBefore(el, before);
    active = el;
    panel = box;
  }
  let results = [], lastQuery = '', resultMessage = '', fetching = false;
  function resetResults(redraw = true) {
    generation++;
    if (fetching) call('cancel');
    fetching = false;
    results = [];
    lastQuery = resultMessage = '';
    if (redraw && panel && !panel.hidden) draw();
  }

  const findRoute = () => {
    const search = document.querySelector(searchRoot);
    if (search?.getClientRects().length) return { mode: 'search', element: search };
    const artist = document.querySelector(artistRoot);
    if (artist?.getClientRects().length) return { mode: 'artist', element: artist };
    const vibe = document.querySelector(vibeRoot);
    if (vibe?.getClientRects().length) return { mode: 'wave', element: vibe };
    return null;
  };

  function syncPage() {
    const route = installed() && !document.hidden && findRoute();
    if (!route) {
      if (document.hidden) {
        if (fetching) resetResults();
        return;
      }
      if (active) unmount();
      return;
    }
    const { mode, element } = route;
    const main = mode === 'search' && element.querySelector(searchMain);
    const controls = main ? element.querySelector(searchTabs) : null;
    const anchor = mode === 'search' && !main ? element.querySelector(searchTabs) :
      mode === 'artist' ? element.querySelector('[class*="PageHeader_controls__"]') || element.querySelector('[class*="ArtistPage_header__"]') : null;
    const parent = main || anchor?.parentNode || element;
    if (active?.parentNode !== parent || active.dataset.mode !== mode || (detachedControl?.parentNode || null) !== controls) {
      mountPage(mode, parent, main ? parent.firstChild : anchor?.nextSibling || null, controls);
    }
  }

  function searchState() {
    if (active.dataset.mode === 'artist') {
      const artist = active.closest(artistRoot);
      const query = artist?.querySelector('h1,[class*="PageHeader_title__"]')?.textContent || '';
      return { query: query.trim().slice(0, 120), kind: 'artist' };
    }
    const root = active.closest(searchRoot);
    const input = root?.querySelector(searchInput);
    const current = root?.querySelector('[class*="SearchPage_tab_selected__"], [role=tab][aria-selected=true]');
    return { query: (input?.value || '').trim().slice(0, 120), kind: current ? tabs.get(current.textContent.trim().toLowerCase()) || 'unknown' : 'top' };
  }

  async function openSource(source, url, query) {
    const result = await call('open', { source, url, query });
    if (result.error && panel && !panel.hidden) {
      panel.querySelector('[role=alert]')?.remove();
      const error = paragraph(result.error);
      error.setAttribute('role', 'alert');
      panel.append(error);
      return false;
    }
    return !result.error;
  }

  async function lookup(state) {
    resetResults(false);
    const token = generation;
    lastQuery = state.query;
    if (!onlineKinds.has(state.kind)) {
      results = [...selected].filter(source => installed().sources.includes(source)).map(source => ({ source, reason: 'external' }));
      draw();
      return;
    }
    panel.dataset.query = state.kind + '\n' + state.query;
    fetching = true;
    draw();
    const result = await call('search', { ...state, sources: [...selected] });
    if (token !== generation || !panel || panel.hidden) return;
    fetching = false;
    results = result.results || [];
    resultMessage = result.error || '';
    draw();
  }

  function trackKey(item) {
    if (item.source === 'youtube') {
      const pair = item.title.split(/\s+[–—-]\s+/);
      if (pair.length === 2) return normalize(pair[0]) + ':' + normalize(pair[1].replace(/\s*\((?:official (?:music )?video|official audio)\)\s*$/i, ''));
    }
    return normalize(item.artist) + ':' + normalize(item.title);
  }

  function renderRow(item, inWave = false) {
    const row = node('li', '', 'row');
    const cover = node(item.image ? 'img' : 'span', '', 'cover');
    if (item.image) {
      cover.alt = '';
      cover.loading = 'lazy';
      cover.decoding = 'async';
      cover.referrerPolicy = 'no-referrer';
      cover.src = item.image;
      cover.addEventListener('error', () => cover.replaceWith(node('span', '', 'cover')), { once: true });
    }
    const details = button('', () => openSource(item.source, item.url), 'details');
    details.title = item.title + ' · открыть на ' + title[item.source];
    details.append(node('strong', item.title), node('span', item.artist, 'muted'));
    const badge = node('span', initials[item.source], 'badge');
    if (icons[item.source]) badge.innerHTML = icons[item.source];
    badge.title = title[item.source];
    badge.setAttribute('aria-label', 'Источник ' + title[item.source]);
    const saved = picks.has(item.url);
    const canSave = item.kind === 'video' || item.kind === 'tracks';
    const heart = button(saved ? '♥' : '♡', () => {
      if (picks.has(item.url)) {
        picks.delete(item.url);
        if (currentPick?.url === item.url) currentPick = undefined;
      } else if (picks.size < 60) {
        picks.set(item.url, { ...item, saved: Date.now() });
      } else {
        resultMessage = 'В «Своей волне» максимум 60 треков за сеанс.';
      }
      draw();
    }, 'heart');
    heart.disabled = !canSave;
    heart.setAttribute('aria-label', !canSave ? 'Сохранение доступно для треков и видео' : saved ?
      'Убрать из «Своей волны»' : 'Добавить в «Свою волну»');
    heart.title = heart.getAttribute('aria-label');
    heart.setAttribute('aria-pressed', String(saved));
    const seconds = Math.floor(item.duration || 0);
    const time = node('time', seconds ? Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') : '');
    row.append(cover, details, badge, heart, time);
    if (inWave) row.dataset.wavePick = '';
    return row;
  }

  function drawResults() {
    const state = searchState();
    const filters = node('div', '', 'toolbar');
    for (const source of installed().sources) {
      const chip = button(title[source], () => {
        if (!selected.delete(source)) selected.add(source);
        savePrefs();
        resetResults();
      });
      chip.setAttribute('aria-pressed', String(selected.has(source)));
      filters.append(chip);
    }
    const search = button(fetching ? 'Ищем…' : 'Искать на площадках', () => lookup(searchState()));
    search.disabled = fetching || state.query.length < 2 || !selected.size;
    filters.append(search, button('Настройки', () => goTo('music-plus')));
    const message = fetching ? 'Запрос отправлен выбранным площадкам.' : resultMessage || (state.query.length < 2 ?
      'Введите запрос в поиске Яндекс Музыки.' : !lastQuery ?
        (state.kind === 'artist' ? 'Ссылки по имени артиста. YouTube сортирует видео по просмотрам.' :
          'Выберите площадки и запустите поиск. Результаты Яндекс Музыки остаются на этой же странице.') : '');
    panel.replaceChildren(filters, statusLine(message));
    const duplicates = new Set();
    if (results.some(result => result.rows?.length)) {
      const root = active.closest(searchRoot + ',' + artistRoot);
      for (const track of root?.querySelectorAll(nativeTrack) || []) {
        const title = track.querySelector(nativeTitle)?.textContent;
        const artist = track.querySelector(nativeArtist)?.textContent;
        if (title && artist) duplicates.add(trackKey({ title, artist }));
      }
    }
    for (const result of results) {
      const section = node('section', '', 'provider');
      const heading = node('div', '', 'toolbar');
      heading.append(node('h4', title[result.source]), button('Открыть поиск', () => openSource(result.source, '', lastQuery)));
      section.append(heading);
      const hint = result.error || (result.reason === 'connect' ? 'Для выдачи здесь подключите API в настройках «Музыка+».' :
        result.reason === 'external' ? 'Эта выдача доступна на площадке.' : !result.rows?.length ? 'По запросу ничего не найдено.' : '');
      if (hint) section.append(paragraph(hint));
      if (result.rows?.length) {
        const list = node('ul', '', 'list');
        for (const item of result.rows) {
          if (item.kind === 'video' || item.kind === 'tracks') {
            const key = trackKey(item);
            if (duplicates.has(key)) continue;
            duplicates.add(key);
          }
          list.append(renderRow(item));
        }
        section.append(list.childElementCount ? list : paragraph('Совпадения уже есть в выдаче выше.'));
      }
      panel.append(section);
    }
  }

  const artistKey = item => normalize(item.source === 'youtube' && item.title.includes(' - ') ? item.title.split(' - ')[0] : item.artist);
  function nextPick() {
    const choices = [...picks.values()].filter(item => !seen.has(trackKey(item)));
    if (!choices.length) {
      currentPick = undefined;
      waveNotice = 'Новых сохранённых треков пока нет. Добавьте их через поиск на площадках.';
      draw();
      return;
    }
    const affinity = item => seeds.some(seed => {
      const wanted = normalize(seed);
      return wanted && (artistKey(item).includes(wanted) || normalize(item.title).includes(wanted));
    });
    const coolOff = choices.filter(item => !recent.includes(artistKey(item)));
    const pool = coolOff.length ? coolOff : choices;
    currentPick = pool.sort((a, b) => Number(affinity(b)) - Number(affinity(a)) || b.saved - a.saved)[0];
    seen.add(trackKey(currentPick));
    recent.push(artistKey(currentPick));
    if (recent.length > 3) recent.shift();
    waveNotice = '';
    draw();
  }

  function drawWave() {
    const intro = paragraph('Выберите любимых артистов или треки. Сохраните находки сердечком в поиске, и волна предложит их без повторов за сеанс.');
    const form = node('form', '', 'toolbar');
    const seed = node('input');
    seed.maxLength = 120;
    seed.placeholder = 'Артист или трек';
    seed.setAttribute('aria-label', 'Любимый артист или трек');
    const add = node('button', 'Добавить');
    add.type = 'submit';
    form.append(seed, add);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = seed.value.trim();
      if (!normalize(value) || seeds.length >= 24 || seeds.some(seed => normalize(seed) === normalize(value))) return;
      seeds.push(value);
      savePrefs();
      draw();
      panel.querySelector('input').focus();
    });
    const seedList = node('div', '', 'seeds');
    for (const value of seeds) {
      const remove = button(value + ' ×', () => {
        seeds.splice(seeds.indexOf(value), 1);
        savePrefs();
        draw();
      });
      remove.setAttribute('aria-label', 'Удалить ' + value);
      seedList.append(remove);
    }
    const controls = node('div', '', 'toolbar');
    controls.append(button(currentPick ? 'Следующая находка' : 'Подобрать из сохранённых', nextPick));
    const available = installed().sources.filter(source => selected.has(source));
    if (seeds.length && available.length) {
      const value = seeds[seedOffset % seeds.length];
      const search = button('Искать «' + value + '»', async () => {
        if (await openSource(source.value, '', value)) {
          seedOffset++;
          draw();
        }
      });
      const source = node('select');
      source.setAttribute('aria-label', 'Площадка для поиска по вкусам');
      for (const id of available) {
        const option = node('option', title[id]);
        option.value = id;
        source.append(option);
      }
      controls.append(source, search);
    }
    panel.replaceChildren(intro, form, seedList, controls,
      statusLine(waveNotice || (picks.size ? 'Сохранено за сеанс · ' + picks.size : 'Пока нет сохранённых находок.')));
    if (currentPick) {
      const list = node('ul', '', 'list');
      list.append(renderRow(currentPick, true));
      panel.append(list);
    }
  }

  function draw() {
    if (active?.dataset.mode === 'wave') drawWave();
    else if (active) drawResults();
  }

  function schedule() {
    if (timer !== undefined || document.hidden || !installed()) return;
    timer = requestAnimationFrame(() => {
      timer = undefined;
      syncPage();
      if (panel && !panel.hidden && active.dataset.mode !== 'wave') {
        const { query, kind } = searchState();
        const key = kind + '\n' + query;
        if (key !== panel.dataset.query) {
          panel.dataset.query = key;
          resetResults();
        }
      }
    });
  }

  function consider(records) {
    if (!installed() || document.hidden) return;
    if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
      node.nodeType === 1 && (node === active || node === detachedControl || node.matches(ownedSelector) || node.querySelector(ownedSelector))))) schedule();
  }
  const nativeInput = event => {
    if (!installed() || !(event.target instanceof Element)) return;
    if (panel?.hidden === false && (event.target.closest(searchRoot) || event.target.closest(artistRoot))) schedule();
  };
  document.addEventListener('input', nativeInput);
  document.addEventListener('click', nativeInput);
  window.addEventListener('popstate', schedule);
  document.addEventListener('visibilitychange', () => { syncPage(); schedule(); });
  window.addEventListener('pagehide', () => resetResults(false));
  window.addEventListener('pageshow', syncPage);

  return {
    consider,
    async open(name) {
      if (name !== 'plugins' && name !== 'music-plus') return;
      if (!busy) {
        await syncState();
        renderEditor();
        if (name === 'music-plus' && installed() && (!updateTime || Date.now() - updateTime >= 6 * 3600000)) manage('check');
      }
    },
    async init() {
      if (request) await syncState();
      renderEditor();
    }
  };
};
