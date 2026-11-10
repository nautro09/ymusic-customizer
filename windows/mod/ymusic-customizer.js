/*
 * YMusic Customizer v0.7.5 for Windows and macOS. MIT.
 * Copyright (c) 2026 YMusic Customizer contributors.
 * See licenses/Next-Music-Client-MIT.txt for the scaling tokens.
 */
(() => {
  'use strict';
  if (typeof document === 'undefined' || window.__YMusicCustomizer) return;
  window.__YMusicCustomizer = true;

  const mac = Boolean(window.ymcMac) || /Mac/i.test(window.navigator?.platform ?? '');
  const discordBridge = window.ymcMac ?? window.ymMods;
  const shortcut = mac ? '⌘⇧Y' : 'Ctrl+Shift+Y';
  const version = '0.7.5';
  const discordName = 'Я. Музыка · nautro';
  const LEGACY_KEY = 'ymc:theme:v1';
  const KEY = 'ymc:theme:v2';
  const GUIDE_SEEN_KEY = 'ymc:guide:seen';
  const RUN_VERSION_KEY = 'ymc:last-version';
  const PENDING_GUIDE_KEY = 'ymc:guide:upgrade';
  const EDITOR_WIDTH_KEY = 'ymc:editor:width';
  const UPDATE_DISMISSED_KEY = 'ymc:update:dismissed';
  const MAX_ADDON = 160_000;
  const MAX_VIBE_MEDIA = 100 * 1024 * 1024;
  const VIBE_MEDIA_TYPES = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm'
  };
  const PALETTE_VARIANTS = {
    balanced: 'Сбалансированная', calm: 'Спокойная', contrast: 'Контрастная',
    dark: 'Тёмная', light: 'Светлая', neon: 'Неоновая'
  };
  const PATTERNS = {
    stars: 'Звёздное небо', constellations: 'Созвездия', grid: 'Координатная сетка',
    hexagons: 'Соты', diamonds: 'Кристаллы', circuits: 'Микросхема', orbits: 'Орбиты',
    ripples: 'Круги на воде', rain: 'Метеорный дождь', snow: 'Снежинки',
    petals: 'Лепестки', bubbles: 'Пузырьки', notes: 'Ноты', pixels: 'Пиксели', symbols: 'Свои символы'
  };
  const PATTERN_DIRECTIONS = {
    right: [1, 0, 'Вправо'], left: [-1, 0, 'Влево'], up: [0, -1, 'Вверх'], down: [0, 1, 'Вниз'],
    upRight: [1, -1, 'Вправо и вверх'], upLeft: [-1, -1, 'Влево и вверх'],
    downRight: [1, 1, 'Вправо и вниз'], downLeft: [-1, 1, 'Влево и вниз']
  };
  const PATTERN_BEAT_EFFECTS = {
    off: 'Без реакции', pulse: 'Пульсация', shake: 'Вибрация',
    echo: 'Эхо', bend: 'Изгиб линий', mixed: 'Смешанные эффекты'
  };
  const SPECTRUM_PROFILES = {
    wave: { label: 'Мягкая лента', settings: { spectrumStyle: 'wave', spectrumBands: 72, spectrumGradient: 'horizontal',
      spectrumLayout: 'flow', spectrumOverlay: 'echo', spectrumOverlayAmount: 32, spectrumGlow: 34, spectrumResponse: 72 } },
    studio: { label: 'Студийные столбцы', settings: { spectrumStyle: 'bars', spectrumBands: 48, spectrumGradient: 'vertical',
      spectrumLayout: 'flow', spectrumOverlay: 'grid', spectrumOverlayAmount: 24, spectrumGlow: 0, spectrumPeaks: true, spectrumResponse: 78 } },
    neon: { label: 'Неоновый контур', settings: { spectrumStyle: 'line', spectrumBands: 80, spectrumGradient: 'diagonal',
      spectrumLayout: 'mirror', spectrumOverlay: 'echo', spectrumOverlayAmount: 40, spectrumGlow: 82, spectrumResponse: 82 } },
    pixels: { label: 'Пиксели', settings: { spectrumStyle: 'segments', spectrumBands: 44, spectrumGradient: 'vertical',
      spectrumLayout: 'mirror', spectrumOverlay: 'none', spectrumGlow: 12, spectrumPeaks: true, spectrumResponse: 94 } },
    dots: { label: 'Россыпь точек', settings: { spectrumStyle: 'dots', spectrumBands: 56, spectrumGradient: 'horizontal',
      spectrumLayout: 'flow', spectrumOverlay: 'none', spectrumGlow: 44, spectrumResponse: 58 } }
  };
  const SMART_GROUPS = {
    smartAccent: { label: 'Акцент', fields: ['accent', 'accentHover', 'accentPress'] },
    smartBackground: { label: 'Основной фон', fields: ['background'] },
    smartGradient: { label: 'Конец градиента', fields: ['gradientEnd'] },
    smartPanels: { label: 'Панели', fields: ['panel', 'sidebar', 'sidebarEnd', 'player'] },
    smartText: { label: 'Текст и подписи', fields: ['text', 'textSecondary'] },
    smartHeart: { label: 'Сердечко', fields: ['likedColor'] },
    smartPortrait: { label: 'Аура портрета', fields: ['portraitColor'] },
    smartSpectrum: { label: 'Эквалайзер', fields: ['spectrumStart', 'spectrumMid', 'spectrumEnd'] },
    smartPlaylist: { label: 'Шапка плейлиста', fields: ['playlistStart', 'playlistEnd'] },
    smartButtons: { label: 'Кнопки и стрелки', fields: [
      'vibeIcon', 'vibeTransport', 'vibeFill', 'vibeHover', 'vibePlayFill',
      'barButtonFill', 'barButtonText', 'barButtonHover', 'playlistPrimary', 'playlistPrimaryText',
      'playlistSecondary', 'playlistSecondaryText', 'playlistFilter', 'playlistFilterText',
      'playlistFilterBorder', 'playlistSelected', 'playlistButtonHover', 'playlistSearchFill', 'playlistSearchText',
      'navigationFill', 'navigationText'
    ] }
  };
  const smartGroups = Object.keys(SMART_GROUPS);
  const DEFAULT = Object.freeze({
    version: 2, name: 'Purple Glass', enabled: true,
    accent: '#A855F7', background: '#100C1B', panel: '#1D1730',
    text: '#F7F4FF', textSecondary: '#CDC2E0', mode: 'gradient', gradientEnd: '#392057',
    blur: 15, round: 16, panelOpacity: 83, backgroundDim: 15,
    gradientAngle: 140, font: 'native', scale: 100, manualScale: false,
    separateSurfaces: false, sidebar: '#20182F', player: '#1D1730',
    cardRound: 16, widePlayer: false, playerOverlay: true,
    visualizer: false, wallpaper: '', customCss: '',
    vibeCoverOpacity: 100, vibeTrackOpacity: 100, vibeControlsOpacity: 100,
    vibeAnimation: true, hideVibeTrack: false, hideVibeControls: false, appMediaEnabled: true,
    showVibePortrait: true, showVibeArtist: true, showVibeHeading: true,
    waveStyle: 'native', wavePalette: 'auto', waveTint: '#9B70EE', waveOpacity: 72, waveTone: 60, waveBeat: 70,
    waveClearRail: true, waveNativeOpacity: 100, vibeAdaptiveCover: false, vibeAdaptiveCoverSize: 78,
    sidebarDock: 'native', sidebarAlign: 'center', sidebarSize: 62, sidebarGap: 5, sidebarInset: 10,
    sidebarCompact: true, sidebarCollapsed: false, sidebarOrder: '', sidebarHidden: '',
    sidebarIconSize: 22, sidebarEdgeHint: true, sidebarEdgeCustom: false, sidebarEdgeColor: '#B5D4FF',
    showCornerAppVersion: true, showCornerLoaderVersion: true, showCornerAudioFormat: true,
    patternEnabled: false, patternStyle: 'stars', patternScope: 'app', patternPalette: 'theme',
    patternPrimary: '#B5D4FF', patternSecondary: '#A88AFF', patternSymbols: '✦ ◇ ♪',
    patternOpacity: 48, patternDensity: 44, patternSize: 100, patternGlow: 0, patternSeed: 173,
    patternMotion: 'still', patternDirection: 'upRight', patternPeriod: 32,
    patternX: 0, patternY: 0, patternNativeOpacity: 32,
    patternBeatEffect: 'off', patternBeatStrength: 85, patternBeatSensitivity: 70, patternBeatRelease: 300,
    barCustom: false, barSpectrum: false, barOpacity: 83, barWallpaper: '',
    spectrumPlacement: 'page', spectrumStyle: 'wave', spectrumGradient: 'horizontal',
    spectrumStart: '#8B5CF6', spectrumMid: '#C688FF', spectrumEnd: '#22D3EE', spectrumOpacity: 81,
    spectrumBands: 72, spectrumHeight: 23, spectrumGain: 125, spectrumResponse: 72,
    spectrumLayout: 'flow', spectrumOverlay: 'echo', spectrumOverlayAmount: 32,
    spectrumGlow: 34, spectrumRound: 5, spectrumIdle: 'line', spectrumTaper: 52,
    spectrumDynamics: 'balanced',
    sidebarGradient: false, sidebarEnd: '#453568',
    customVibeIcons: false, vibeIcon: '#FFFFFF', vibeTransport: '#17111D',
    aiTrackCards: true, showVibeWheel: true, playlistGradient: 'palette',
    playlistStart: '#36294D', playlistEnd: '#17121F', playlistOpacity: 65, playlistButtons: true,
    likedCustom: false, likedColor: '#FF6C9B', likedShape: 'native', likedImage: '', likedTintImage: false,
    addonSheets: Object.freeze([]), addonEnabled: false, addonPalette: true,
    mediaFit: 'cover', mediaX: 50, mediaY: 50, mediaBlur: 0, mediaOpacity: 100,
    sidebarAngle: 160, barFit: 'cover', barImagePosition: 'center',
    customAccentStates: false, accentHover: '#C084FC', accentPress: '#9333EA',
    likedOpacity: 100, likedScale: 100, likedMotion: 'off', likedMotionSpeed: 1800,
    spectrumWidth: 78, spectrumLineWidth: 2, spectrumPeaks: true,
    customVibeButtons: false, vibeFill: '#211A31', vibeHover: '#4D3666', vibePlayFill: '#A855F7',
    vibeButtonRound: 24, vibeWheelOpacity: 100, vibeAiOpacity: 100,
    portraitEffect: 'off', portraitColorSource: 'theme', portraitColor: '#A855F7',
    portraitOutline: 3, portraitSpread: 24, portraitIntensity: 80,
    portraitBeat: false, portraitBeatStrength: 70, portraitBeatSensitivity: 70, portraitBeatRelease: 260,
    smartTheme: false, smartTransition: 2200, smartStrength: 92, smartPaletteStyle: 'balanced',
    ...Object.fromEntries(smartGroups.flatMap(key => [[key, true], [key + 'Amount', 100]])),
    motionEnabled: false, motionDuration: 420, motionCurve: 'smooth', motionCards: true,
    motionCardScale: 103, motionCardLift: 5, motionAura: false, motionAuraSpeed: 3200,
    motionBackground: false, motionBackgroundSpeed: 18, glowIntensity: 0,
    hideVibeVolume: false, hideVibeMenu: false, hideVibeLike: false, hideVibeDislike: false,
    hideVibeSkip: false, hideVibePlay: false,
    hideBarVolume: false, hideBarQueue: false, hideBarCover: false, hideBarTitle: false, hideBarArtist: false,
    barButtonsCustom: false, barButtonFill: '#251C36', barButtonText: '#F7F4FF',
    barButtonHover: '#51366F', barButtonOpacity: 92, barButtonRound: 14,
    barLayout: 'native', barHeight: 80, barCoverSize: 64, barControlsSize: 100,
    barTextScale: 100, barGap: 12, barProgressSize: 3, barProgressMode: 'native',
    playlistAngle: 180, playlistFade: 100, playlistDepth: 48,
    playlistCustomButtons: false, playlistButtonOpacity: 95, playlistButtonRound: 22,
    playlistPrimary: '#A855F7', playlistPrimaryText: '#160D22',
    playlistSecondary: '#261E37', playlistSecondaryText: '#F7F4FF',
    playlistFilter: '#1C1528', playlistFilterText: '#E6D9F6', playlistFilterBorder: '#5D4D76', playlistSelected: '#BC8BFF',
    playlistButtonHover: '#633F8C',
    playlistCoverCustom: false, playlistCoverRound: 14,
    playlistSearchCustom: false, playlistSearchFill: '#201729', playlistSearchText: '#F7F4FF',
    playlistSearchOpacity: 90, playlistSearchRound: 14,
    contrastGuard: true, contrastLevel: 45, navigationCustom: true,
    navigationFill: '#1D1730', navigationText: '#F7F4FF', navigationOpacity: 88,
    navigationRound: 28
  });
  const PRESETS = {
    'Purple Glass': { accent:'#B56CFF',background:'#0E0918',panel:'#211630',text:'#FBF6FF',gradientEnd:'#54247A',
      likedCustom:true,likedColor:'#FF6AAE',portraitEffect:'glow',portraitIntensity:65,panelOpacity:70,blur:22,motionEnabled:true },
    'Deep Blue': { accent:'#3CCBFF',background:'#03131F',panel:'#0D2A3B',text:'#EAF9FF',gradientEnd:'#075986',
      likedCustom:true,likedColor:'#52E0FF',spectrumStart:'#27A8FF',spectrumEnd:'#62FFE3',barSpectrum:true,spectrumStyle:'line' },
    'Forest': { accent:'#63F2A6',background:'#04150E',panel:'#102D20',text:'#EDFFF5',gradientEnd:'#0F5338',
      likedCustom:true,likedColor:'#93FFC0',portraitEffect:'outline',portraitColor:'#61ED9F',portraitColorSource:'custom' },
    'Pure AMOLED': { accent:'#FFFFFF',background:'#000000',panel:'#080808',text:'#FFFFFF',gradientEnd:'#000000',
      mode:'solid',panelOpacity:100,blur:0,round:7,cardRound:7,likedCustom:true,likedColor:'#FF315D',contrastGuard:true },
    'Закат': { accent:'#FFB06B',background:'#251015',panel:'#452329',text:'#FFF4EA',gradientEnd:'#843D45',
      likedCustom:true,likedColor:'#FF6684',spectrumStart:'#FF7A59',spectrumEnd:'#FFD36E',motionEnabled:true,motionBackground:true },
    'Северное сияние': { accent:'#78FFD0',background:'#041B25',panel:'#123B42',text:'#EBFFFA',gradientEnd:'#303A77',
      likedCustom:true,likedColor:'#A6FFED',spectrumStart:'#36E9B1',spectrumEnd:'#A0A8FF',portraitEffect:'both',
      motionEnabled:true,motionAura:true,motionBackground:true,motionBackgroundSpeed:24 },
    'Киберпанк': { accent:'#FF4FE1',background:'#120322',panel:'#30113F',text:'#FFF0FF',gradientEnd:'#101B55',
      likedCustom:true,likedShape:'diamond',likedColor:'#00EEFF',spectrumStart:'#FF40E6',spectrumEnd:'#13EFFF',
      portraitEffect:'both',portraitColor:'#00F0FF',portraitColorSource:'custom',motionEnabled:true,motionAura:true,
      barSpectrum:true,glowIntensity:78,likedMotion:'sparkle',spectrumGradient:'horizontal' },
    'Снежный день': { accent:'#275EA9',background:'#DDEBFB',panel:'#F5F9FF',text:'#13233D',gradientEnd:'#AED9F0',
      panelOpacity:91,likedCustom:true,likedColor:'#D12E6B',playlistFilterBorder:'#45699D',contrastGuard:true },
    'Сакура': { accent:'#BD3F79',background:'#FBE6F0',panel:'#FFF5F9',text:'#3E142C',gradientEnd:'#DCC5F2',
      likedCustom:true,likedColor:'#E52E79',likedShape:'star',portraitEffect:'glow',portraitColor:'#E64A96',portraitColorSource:'custom' },
    'Песок и кофе': { accent:'#F0C183',background:'#211711',panel:'#493327',text:'#FFF0D9',gradientEnd:'#785941',
      likedCustom:true,likedColor:'#E89672',round:12,cardRound:14,barLayout:'compact' },
    'Ночной монохром': { accent:'#E1E7EE',background:'#0C0F13',panel:'#20252C',text:'#F5F7FA',gradientEnd:'#353B45',
      likedCustom:true,likedColor:'#D7DEE8',spectrumStart:'#8899AC',spectrumEnd:'#F0F5FB',motionDuration:650 },
    'Гранат': { accent:'#FF839C',background:'#280B17',panel:'#4A1728',text:'#FFEAF0',gradientEnd:'#70243D',
      likedCustom:true,likedColor:'#FF305F',likedScale:112,portraitEffect:'glow',portraitColor:'#FF4E72',portraitColorSource:'custom',
      likedMotion:'pulse',likedMotionSpeed:2300 },
    'Неоновый лайм': { accent:'#C8FF28',background:'#071006',panel:'#172713',text:'#F7FFE6',gradientEnd:'#304E0D',
      likedCustom:true,likedShape:'star',likedColor:'#E6FF54',spectrumStart:'#B6FF00',spectrumEnd:'#42FFD0',
      portraitEffect:'both',portraitColor:'#B9FF20',portraitColorSource:'custom',motionEnabled:true,motionAura:true,
      barSpectrum:true,glowIntensity:88,likedMotion:'sparkle' },
    'Ультрафиолет': { accent:'#9B61FF',background:'#080318',panel:'#1B0C39',text:'#FAF5FF',gradientEnd:'#3E0877',
      likedCustom:true,likedShape:'diamond',likedColor:'#FF4DDF',spectrumStart:'#843DFF',spectrumEnd:'#FF52E2',
      barButtonsCustom:true,barButtonFill:'#29114C',barButtonHover:'#6231A1',glowIntensity:68 },
    'Лазерная волна': { accent:'#00E7FF',background:'#010C16',panel:'#072438',text:'#E9FCFF',gradientEnd:'#3B065B',
      likedCustom:true,likedColor:'#F343FF',spectrumStart:'#00D9FF',spectrumEnd:'#F33FFF',barSpectrum:true,
      motionEnabled:true,motionBackground:true,motionAura:true,portraitEffect:'glow',portraitColor:'#25E9FF',portraitColorSource:'custom',
      glowIntensity:96,spectrumPlacement:'page',spectrumStyle:'line',spectrumGradient:'horizontal' },
    'Красный импульс': { accent:'#FF465F',background:'#190307',panel:'#380B13',text:'#FFF2F3',gradientEnd:'#720D1E',
      likedCustom:true,likedColor:'#FF163E',likedScale:120,spectrumStart:'#FF1F49',spectrumEnd:'#FF9D47',
      motionEnabled:true,motionCurve:'snappy',motionCardLift:9,barLayout:'center',likedMotion:'pulse',likedMotionSpeed:1300 },
    'Мятное стекло': { accent:'#70E7C0',background:'#071A18',panel:'#16342F',text:'#ECFFFA',gradientEnd:'#28665A',
      panelOpacity:68,blur:24,round:24,cardRound:24,likedCustom:true,likedColor:'#95FFD9',portraitEffect:'glow' },
    'Розовый хром': { accent:'#FF71C8',background:'#180918',panel:'#3D1737',text:'#FFF2FC',gradientEnd:'#771B62',
      likedCustom:true,likedColor:'#FF8AD3',likedShape:'star',customAccentStates:true,accentHover:'#FF9BDB',accentPress:'#D947A1',
      barButtonsCustom:true,barButtonFill:'#4B1D43',barButtonHover:'#84306F',glowIntensity:60 },
    'Янтарная ночь': { accent:'#FFC052',background:'#171007',panel:'#392813',text:'#FFF5DF',gradientEnd:'#6A410E',
      likedCustom:true,likedColor:'#FF8C3B',spectrumStart:'#FF9C31',spectrumEnd:'#FFE37B',portraitEffect:'outline' },
    'Ледяной неон': { accent:'#82D9FF',background:'#04111D',panel:'#102C43',text:'#EDF9FF',gradientEnd:'#184F74',
      likedCustom:true,likedColor:'#B5E9FF',spectrumStart:'#5AC8FF',spectrumEnd:'#D0F4FF',
      portraitEffect:'both',portraitColor:'#7EDAFF',portraitColorSource:'custom',motionEnabled:true,motionAura:true,glowIntensity:72 },
    'Минимализм': { accent:'#F1F1F1',background:'#121212',panel:'#1D1D1D',text:'#F5F5F5',gradientEnd:'#1A1A1A',
      mode:'solid',round:4,cardRound:4,blur:0,barLayout:'compact',motionCards:false,likedCustom:true,likedColor:'#FFFFFF' },
    'Молочный свет': { accent:'#6C4EA0',background:'#F4F0E9',panel:'#FFFDF8',text:'#261D31',gradientEnd:'#D8CEED',
      panelOpacity:94,likedCustom:true,likedColor:'#B33470',playlistFilterBorder:'#75638F',contrastGuard:true },
    'Арктический рассвет': { accent:'#FF8C82',background:'#071922',panel:'#173642',text:'#F1FCFF',gradientEnd:'#4C395D',
      likedCustom:true,likedColor:'#FF8EA1',spectrumStart:'#5ED9DE',spectrumEnd:'#FF9A8D',motionEnabled:true,motionBackground:true },
    'Динамический хамелеон': { accent:'#A855F7',background:'#100C1B',panel:'#1D1730',text:'#F7F4FF',gradientEnd:'#392057',
      smartTheme:true,smartTransition:3600,smartStrength:85,likedCustom:true,likedColor:'#FF6C9B',
      portraitEffect:'both',portraitColorSource:'background',motionEnabled:true,motionAura:true,barSpectrum:true,glowIntensity:35 }
  };
  const PRESET_CATEGORIES = {
    'Purple Glass':'Стекло','Deep Blue':'Природа','Forest':'Природа','Pure AMOLED':'Минимализм',
    'Закат':'Природа','Северное сияние':'Динамика','Киберпанк':'Неон','Снежный день':'Светлые',
    'Сакура':'Светлые','Песок и кофе':'Тёплые','Ночной монохром':'Минимализм','Гранат':'Тёплые',
    'Неоновый лайм':'Неон','Ультрафиолет':'Неон','Лазерная волна':'Неон','Красный импульс':'Динамика',
    'Мятное стекло':'Стекло','Розовый хром':'Неон','Янтарная ночь':'Тёплые','Ледяной неон':'Неон',
    'Минимализм':'Минимализм','Молочный свет':'Светлые','Арктический рассвет':'Природа','Динамический хамелеон':'Динамика'
  };
  const BAR_LAYOUT_PROFILES = {
    compact: { barHeight: 64, barCoverSize: 46, barGap: 7, barControlsSize: 90, barTextScale: 95, barProgressSize: 3 },
    center: { barHeight: 80, barCoverSize: 62, barGap: 11, barControlsSize: 100, barTextScale: 100, barProgressSize: 3 },
    spacious: { barHeight: 96, barCoverSize: 76, barGap: 16, barControlsSize: 110, barTextScale: 112, barProgressSize: 4 }
  };
  const FONTS = {
    native: '', system: 'system-ui, sans-serif', segui: mac ? '"Helvetica Neue", sans-serif' : '"Segoe UI", sans-serif',
    georgia: 'Georgia, serif', mono: mac ? 'Menlo, monospace' : 'Consolas, monospace',
    arial: 'Arial, sans-serif', verdana: 'Verdana, sans-serif'
  };
  const CHOICE = {
    waveStyle: ['native', 'custom'], wavePalette: ['auto', 'cover', 'custom'],
    sidebarDock: ['native', 'left', 'right', 'top', 'bottom'], sidebarAlign: ['start', 'center', 'end'],
    mode: ['solid', 'gradient', 'image', 'cover'], font: Object.keys(FONTS),
    spectrumPlacement: ['bar', 'page'], spectrumStyle: ['bars', 'line', 'wave', 'segments', 'dots'],
    spectrumGradient: ['solid', 'vertical', 'horizontal', 'diagonal'], spectrumLayout: ['flow', 'mirror'],
    spectrumOverlay: ['none', 'grid', 'echo'], spectrumIdle: ['line', 'hide'],
    spectrumDynamics: ['balanced', 'soft', 'punch'],
    playlistGradient: ['native', 'palette', 'theme', 'solid', 'off'],
    likedShape: ['native', 'star', 'diamond', 'image'], likedMotion: ['off', 'pulse', 'sparkle'],
    mediaFit: ['cover', 'contain'], barFit: ['cover', 'contain'], barImagePosition: ['center', 'top', 'bottom'],
    portraitEffect: ['off', 'glow', 'outline', 'both', 'bloom'], portraitColorSource: ['theme', 'background', 'custom'],
    patternStyle: Object.keys(PATTERNS), patternScope: ['app', 'wave'], patternPalette: ['theme', 'custom'],
    patternMotion: ['still', 'drift', 'shimmer', 'both'], patternDirection: Object.keys(PATTERN_DIRECTIONS),
    patternBeatEffect: Object.keys(PATTERN_BEAT_EFFECTS),
    smartPaletteStyle: Object.keys(PALETTE_VARIANTS),
    motionCurve: ['smooth', 'soft', 'snappy', 'linear'], barLayout: ['native', 'compact', 'center', 'spacious'],
    barProgressMode: ['native', 'always', 'minimal']
  };
  const COLORS = ['waveTint', 'accent', 'background', 'panel', 'text', 'textSecondary', 'gradientEnd', 'sidebar', 'player',
    'sidebarEnd', 'spectrumStart', 'spectrumMid', 'spectrumEnd', 'vibeIcon', 'vibeTransport', 'playlistStart', 'playlistEnd', 'likedColor',
    'accentHover', 'accentPress', 'vibeFill', 'vibeHover', 'vibePlayFill', 'playlistPrimary', 'playlistPrimaryText',
    'playlistSecondary', 'playlistSecondaryText', 'playlistFilter', 'playlistFilterText', 'playlistFilterBorder', 'playlistSelected',
    'playlistButtonHover', 'playlistSearchFill', 'playlistSearchText', 'barButtonFill', 'barButtonText', 'barButtonHover',
    'portraitColor', 'navigationFill', 'navigationText', 'patternPrimary', 'patternSecondary', 'sidebarEdgeColor'];
  const RANGES = {
    waveNativeOpacity: [0, 100, '%'], waveOpacity: [0, 100, '%'], waveTone: [10, 100, '%'], waveBeat: [0, 180, '%'],
    vibeAdaptiveCoverSize: [35, 100, '%'], sidebarSize: [44, 120, 'px'], sidebarGap: [0, 28, 'px'], sidebarInset: [0, 36, 'px'],
    sidebarIconSize: [14, 38, 'px'],
    blur: [0, 40, 'px'], round: [0, 40, 'px'], panelOpacity: [0, 100, '%'], barOpacity: [0, 100, '%'],
    backgroundDim: [0, 80, '%'], gradientAngle: [0, 360, '°'], cardRound: [0, 40, 'px'], scale: [85, 125, '%'],
    vibeCoverOpacity: [0, 100, '%'], vibeTrackOpacity: [0, 100, '%'], vibeControlsOpacity: [0, 100, '%'],
    spectrumOpacity: [0, 100, '%'], spectrumBands: [16, 120, ''], spectrumHeight: [6, 45, '%'],
    spectrumGain: [25, 250, '%'], spectrumResponse: [5, 100, '%'], playlistOpacity: [0, 100, '%'],
    mediaX: [0, 100, '%'], mediaY: [0, 100, '%'], mediaBlur: [0, 30, 'px'], mediaOpacity: [0, 100, '%'],
    sidebarAngle: [0, 360, '°'], likedOpacity: [10, 100, '%'], likedScale: [70, 140, '%'], likedMotionSpeed: [500, 5000, 'мс'],
    spectrumWidth: [20, 100, '%'], spectrumLineWidth: [1, 8, 'px'],
    spectrumRound: [0, 14, 'px'], spectrumGlow: [0, 100, '%'], spectrumOverlayAmount: [0, 100, '%'], spectrumTaper: [0, 100, '%'],
    vibeButtonRound: [0, 48, 'px'], vibeWheelOpacity: [15, 100, '%'], vibeAiOpacity: [15, 100, '%'],
    playlistAngle: [0, 360, '°'], playlistFade: [25, 100, '%'], playlistDepth: [0, 100, '%'],
    playlistButtonOpacity: [0, 100, '%'], playlistButtonRound: [0, 48, 'px'], playlistCoverRound: [0, 48, 'px'],
    playlistSearchOpacity: [0, 100, '%'], playlistSearchRound: [0, 40, 'px'],
    barButtonOpacity: [0, 100, '%'], barButtonRound: [0, 48, 'px'],
    portraitOutline: [1, 8, 'px'], portraitSpread: [4, 48, 'px'], portraitIntensity: [0, 100, '%'],
    portraitBeatStrength: [0, 250, '%'], portraitBeatSensitivity: [10, 100, '%'], portraitBeatRelease: [80, 900, 'мс'],
    patternOpacity: [0, 100, '%'], patternDensity: [10, 100, '%'], patternSize: [45, 200, '%'],
    patternGlow: [0, 16, 'px'], patternSeed: [1, 65535, ''], patternPeriod: [6, 90, 'с'],
    patternX: [0, 100, '%'], patternY: [0, 100, '%'], patternNativeOpacity: [0, 100, '%'],
    patternBeatStrength: [0, 200, '%'], patternBeatSensitivity: [10, 100, '%'], patternBeatRelease: [80, 900, 'мс'],
    smartTransition: [400, 8000, 'мс'], smartStrength: [0, 100, '%'],
    ...Object.fromEntries(smartGroups.map(key => [key + 'Amount', [0, 100, '%']])),
    motionDuration: [80, 1600, 'мс'], motionCardScale: [100, 112, '%'], motionCardLift: [0, 20, 'px'],
    motionAuraSpeed: [800, 8000, 'мс'], motionBackgroundSpeed: [4, 60, 'с'], glowIntensity: [0, 100, '%'],
    barHeight: [56, 140, 'px'], barCoverSize: [36, 112, 'px'], barControlsSize: [70, 150, '%'],
    barTextScale: [70, 140, '%'], barGap: [0, 36, 'px'], barProgressSize: [1, 12, 'px'],
    contrastLevel: [30, 70, ':1'], navigationOpacity: [0, 100, '%'], navigationRound: [0, 48, 'px']
  };
  const TOGGLES = ['enabled', 'manualScale', 'separateSurfaces', 'widePlayer', 'playerOverlay', 'visualizer', 'addonEnabled', 'addonPalette',
    'vibeAnimation', 'hideVibeTrack', 'hideVibeControls', 'appMediaEnabled', 'barCustom', 'barSpectrum', 'sidebarGradient',
    'showVibePortrait', 'showVibeArtist', 'showVibeHeading', 'showCornerAppVersion', 'showCornerLoaderVersion',
    'showCornerAudioFormat', 'patternEnabled', 'portraitBeat', 'waveClearRail', 'vibeAdaptiveCover', 'sidebarCompact', 'sidebarCollapsed',
    'sidebarEdgeHint', 'sidebarEdgeCustom',
    'customVibeIcons', 'aiTrackCards', 'showVibeWheel', 'playlistButtons', 'likedCustom', 'likedTintImage',
    'customAccentStates', 'spectrumPeaks', 'customVibeButtons', 'hideVibeVolume', 'hideVibeMenu', 'hideVibeLike',
    'hideVibeDislike', 'hideVibeSkip', 'hideVibePlay', 'hideBarVolume', 'hideBarQueue', 'hideBarCover', 'hideBarTitle', 'hideBarArtist',
    'playlistCustomButtons', 'playlistCoverCustom', 'playlistSearchCustom', 'barButtonsCustom',
    'smartTheme', ...smartGroups,
    'motionEnabled', 'motionCards', 'motionAura', 'motionBackground',
    'contrastGuard', 'navigationCustom'];
  const isDataImage = s => typeof s === 'string' && s.length < 3_500_000 &&
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(s);
  const bounded = (n, min, max, fallback) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;

  const navIds = raw => typeof raw === 'string' ? [...new Set(raw.slice(0, 12000).split('|')
    .filter(key => /^[A-Za-z0-9_.:/%~-]{1,150}$/.test(key)))].slice(0, 80) : [];

  function sanitizeTheme(input) {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const safe = { ...DEFAULT };
    for (const key of COLORS) {
      const raw = value[key];
      if (typeof raw === 'string' && /^#[\da-f]{6}$/i.test(raw)) safe[key] = raw.toUpperCase();
    }
    if (!/^#[\da-f]{6}$/i.test(value.spectrumMid) && (value.spectrumStart || value.spectrumEnd)) {
      safe.spectrumMid = mixHex(safe.spectrumStart, safe.spectrumEnd, .5);
    }
    if (!/^#[\da-f]{6}$/i.test(value.textSecondary) && value.text) {
      safe.textSecondary = mixHex(safe.text, safe.background, .15);
    }
    for (const [key, [min, max]] of Object.entries(RANGES)) {
      const raw = key === 'cardRound' && value.version === 1 ? value.round : value[key];
      safe[key] = bounded(raw, min, max, DEFAULT[key]);
    }
    for (const [key, values] of Object.entries(CHOICE)) {
      if (values.includes(value[key])) safe[key] = value[key];
    }
    // Imported 0.7.0 themes retain an effect after the old animation and contour are replaced.
    if (['mist', 'ribbons', 'orbits'].includes(value.waveStyle)) safe.waveStyle = 'custom';
    if (value.portraitEffect === 'ribbon') safe.portraitEffect = 'bloom';
    for (const key of TOGGLES) {
      if (typeof value[key] === 'boolean') safe[key] = value[key];
    }
    for (const [key, max] of Object.entries({ name: 60, customCss: 20_000 })) {
      if (typeof value[key] === 'string') safe[key] = value[key].slice(0, max);
    }
    if (typeof value.patternSymbols === 'string') {
      safe.patternSymbols = Array.from(value.patternSymbols.slice(0, 96).replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu, ''))
        .slice(0, 16).join('');
    }
    for (const key of ['sidebarOrder', 'sidebarHidden']) safe[key] = navIds(value[key]).join('|');
    safe.wallpaper = isDataImage(value.wallpaper) ? value.wallpaper : '';
    safe.barWallpaper = isDataImage(value.barWallpaper) ? value.barWallpaper : '';
    safe.likedImage = isDataImage(value.likedImage) ? value.likedImage : '';
    if (Array.isArray(value.addonSheets) && value.addonSheets.length <= 24) {
      let remaining = MAX_ADDON;
      const sheets = [];
      for (const sheet of value.addonSheets) {
        if (typeof sheet?.name !== 'string' || typeof sheet?.css !== 'string' ||
          !sheet.css.trim() || sheet.css.includes('\0') || sheet.css.length > remaining) break;
        sheets.push({ name: sheet.name.slice(0, 100), css: sheet.css });
        remaining -= sheet.css.length;
      }
      if (sheets.length === value.addonSheets.length) safe.addonSheets = sheets;
    }
    safe.addonEnabled = safe.addonEnabled && safe.addonSheets.length > 0;
    return safe;
  }

  function readTheme() {
    for (const [key, version] of [[KEY, 2], [LEGACY_KEY, 1]]) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value?.version === version) return sanitizeTheme(value);
      } catch { /* A damaged entry should not block the legacy theme. */ }
    }
    return { ...DEFAULT };
  }

  const PLAYLIST = ':is([class*="PlaylistPage_wrapper__"],[class*="PlaylistPage_root__"],[data-test-id="PLAYLIST_PAGE"])';
  const PLAYLIST_HEADER = `${PLAYLIST} [class*="CommonPageHeader_controlsContainer__"]`;
  const PLAYLIST_PLAY = ':is([class*="CommonPageHeader_playControl__"],[data-test-id="PLAY_BUTTON"],[data-test-id="PAUSE_BUTTON"])';
  const PLAYLIST_FILTER = `${PLAYLIST} [class*="PlaylistFilters_carousel__"] button`;
  const PLAYLIST_SELECTED = PLAYLIST_FILTER + ':is([aria-pressed="true"],[aria-selected="true"],[aria-current="true"])';
  const PLAYLIST_SEARCH = ':is(input[data-test-id="PLAYLIST_SEARCH_INPUT"],input[data-test-id="SEARCH_PLAYLIST_INPUT"],input[aria-label="Поиск трека"],input[placeholder="Поиск трека"])';
  const VIBE_PLAY = 'button:is([class*="VibePlayerControls_playButton__"],[class*="VibePlayerControls_playButton_playing__"],[class*="VibePlayerBar_button_play__"],[class*="VibePlayerBar_playButton__"],[data-test-id="PLAY_BUTTON"],[data-test-id="PAUSE_BUTTON"],[aria-label="Пауза" i],[aria-label="Играть" i],[aria-label="Воспроизвести" i],[aria-label="Pause" i],[aria-label="Play" i])';
  const VIBE_ALBUM = '[class*="VibePage_albumCover__"]:not([class*="VibePage_albumCover_hidden__"])';
  const VIBE_TRANSPORT = ':is([data-test-id="VIBE_PLAYERBAR"],[class*="VibePlayerBar_root__"],[class*="VibePlayerControls_root__"])';
  const VIBE_DYNAMIC_HEADING = '[data-test-id="VIBE_DYNAMIC_TITLE_VIBE"]';
  const VIBE_OTHER_TITLES = ':is(' + VIBE_DYNAMIC_HEADING + ',[data-test-id="VIBE_DYNAMIC_TITLE_GENERATIVE"],[data-test-id="VIBE_DYNAMIC_TITLE_NON_MUSIC_ENTITY_TITLE"])';
  const VIBE_HERO = '[class*="VibePage_root__"], [data-test-id="VIBE_PAGE"]';
  const PORTRAIT = ':is([data-test-id="VIBE_ARTIST_COVER"],[class*="VibeArtistCover_root__"])';
  const SELECTOR = {
    layout: '[class*="DefaultLayout_root"]',
    surface: '[class*="DefaultLayout_root"], [class^="Content_root"], [class*=" Content_root"], [class*="MainPage_root"], [class*="MainPage_content"], [class^="Layout_root"], [class*=" Layout_root"]',
    sidebar: '[class*="NavbarDesktop_root"], [class*="Navbar_root"], [class*="Sidebar_root"], [class*="MainPage_sidebar"]',
    player: ':is(section[class*="PlayerBarDesktop"],[data-test-id="PLAYERBAR_DESKTOP"])',
    vibe: ':is([data-test-id="VIBE_PLAYERBAR"],[class*="VibePlayerBar_root__"])',
    vibeAnimation: '[class*="VibePage_vibeAnimation__"], [class*="VibeBlock_vibeAnimation__"]',
    vibeTrack: '[data-test-id="VIBE_PLAYERBAR_TIMECODE_SLIDER"]',
    vibeButtons: 'button:is([class*="VibePlayerBar_button__"],[class*="VibePlayerBar_playButton__"],[data-test-id="VIBE_CONTEXT_MENU_BUTTON"])',
    vibePlay: '[class*="VibePlayerControls_playButton__"]',
    vibeControls: '[class*="VibePlayerControls_root__"]',
    vibeAi: '[class*="VibePage_words__"], [data-test-id="WORDS_CARD_FULLSCREEN_MESSAGE"]',
    vibeWheel: '[class*="VibePage_wheel__"], [data-test-id="WHEEL_DESKTOP"], [data-test-id="WHEEL_MOBILE"]',
    portrait: PORTRAIT + ' img:is([src]:not([src=""]),[srcset]:not([srcset=""]))',
    vibeArtist: ':is([data-test-id="VIBE_DYNAMIC_ARTISTS"],[class*="VibeDynamicArtists_root__"]):not(:has(' + VIBE_OTHER_TITLES + '))',
    vibeHeading: VIBE_DYNAMIC_HEADING + ', [data-test-id="RESET_VIBE_CONTEXT_STATIC_TEXT"]',
    cornerVersion: '[class*="MainPage_betaSlot"] [data-test-id="RELEASE_NOTES_BUTTON"]',
    cornerLoader: '[class*="MainPage_betaSlot"] .ymmods-modver',
    cornerFormat: '[class*="MainPage_betaSlot"] .ymmods-quality.ymmods-in-slot',
    vibeText: '[class*="VibePage_text__"], [class*="VibePage_words__"], [class*="VibePage_words__"] :is(button,a,p,span), [data-test-id="WORDS_CARD_TEXT"], [class*="WordsCard_text__"], [data-test-id="VIBE_DYNAMIC_ARTISTS"], [data-test-id="VIBE_DYNAMIC_ARTISTS"] a, [data-test-id="WHEEL_ITEM_TITLE"], [data-test-id="WHEEL_ITEM_DESCRIPTION"], [data-test-id="WHEEL_ITEM_TITLE"] *, [class*="VibePlayerbarTrackName_trackNameText__"]',
    barText: '[class*="PlayerBarDesktopWithBackgroundProgressBar_description__"], [class*="PlayerBarDesktopWithBackgroundProgressBar_description__"] a, [class*="PlayerBarDesktopWithBackgroundProgressBar_artists__"], [class*="PlayerBarDesktopWithBackgroundProgressBar_artistLink__"], [class*="PlayerBarDesktopWithBackgroundProgressBar_description__"] [class*="Meta_title__"], [class*="PlayerBarDesktopWithBackgroundProgressBar_description__"] [class*="Meta_artists__"]',
    playlistBackdrop: `[class*="PlaylistPage_averageColorBackground__"], ${PLAYLIST} [class*="AverageColorBackground_root__"]`,
    playlistPlay: `${PLAYLIST_HEADER} ${PLAYLIST_PLAY}`,
    playlistSecondary: `${PLAYLIST_HEADER} button:not(${PLAYLIST_PLAY})`,
    playlistCover: `${PLAYLIST} :is(img[class*="CommonPageHeader_cover__"],[class*="CommonPageHeader_coverContainer__"] img,[class*="PageHeaderPlaylistCover_root__"] img)`,
    playlistSearch: `${PLAYLIST} ${PLAYLIST_SEARCH}`,
    navigation: 'button:is([data-test-id="NAVIGATION_BACKWARD_BUTTON"],[data-test-id="NAVIGATION_FORWARD_BUTTON"],[aria-label="Вернуться назад"],[aria-label="Вернуться вперед"],[aria-label="Go back"],[aria-label="Go forward"])',
    barRow: '[class*="PlayerBarDesktopWithBackgroundProgressBar_player__"]',
    barInfo: '[class*="PlayerBarDesktopWithBackgroundProgressBar_info__"]',
    barInfoCard: '[class*="PlayerBarDesktopWithBackgroundProgressBar_infoCard__"]',
    barTitle: ':is([class*="Meta_title__"],[class*="Meta_trackTitle__"])',
    barArtist: ':is([class*="Meta_artists__"],[class*="PlayerBarDesktopWithBackgroundProgressBar_artists__"])',
    barControls: '[class*="PlayerBarDesktopWithBackgroundProgressBar_sonata__"]',
    barActions: '[class*="PlayerBarDesktopWithBackgroundProgressBar_meta__"]',
    barCover: ':is([data-test-id="PLAYERBAR_DESKTOP_COVER_CONTAINER"],[class*="PlayerBarDesktopWithBackgroundProgressBar_coverContainer__"])',
    barProgress: '[class*="PlayerBarDesktopWithBackgroundProgressBar_progressBar__"]',
    barThumb: '[class*="PlayerBarDesktopWithBackgroundProgressBar_thumb__"]',
    hoverButtons: '[class*="ArtistCard_playButton__"], [class*="PlaylistCard_playButton__"], [class*="TrackCard_playButton__"], [class*="ArtistCard_root__"] [class*="CardControls_"] button, [class*="PlaylistCard_root__"] [class*="CardControls_"] button, [class*="Track"][class*="_playButtonCell__"] button, [class*="TrackCard_root__"] [class*="CardControls_"] button',
    liked: 'svg:has(use[*|href*="#liked_"],use[*|href*="#likedVariant_"])',
    navbar: '[class*="NavbarDesktop_root__"]',
    profile: '[class*="NavbarDesktopUserWidget_userProfileContainer__"], [class*="NavbarDesktopUserWidget_unauthorizedBar__"]',
    fullscreen: '[data-test-id="FULLSCREEN_PLAYER_MODAL"], [class*="FullscreenPlayerDesktop_root__"]',
    cards: '[class*="PlaylistCard_root"], [class*="AlbumCard_root"], [class*="ArtistCard_root"]',
    track: '[class*="PlayerBarDesktopWithBackgroundProgressBar_meta"], [class*="Meta_root"]',
    progress: 'input[type="range"][class*="PlayerBarDesktopWithBackgroundProgressBar_slider"], input[type="range"][class*="FullscreenPlayerDesktopContent_slider"]'
  };
  const testId = id => `[data-test-id="${id}"]`;
  const PLAYER_ACTIONS = {
    prev: ['PREVIOUS_TRACK_BUTTON', 'PREV_TRACK_BUTTON'],
    toggle: ['PAUSE_BUTTON', 'PLAY_BUTTON'],
    next: ['NEXT_TRACK_BUTTON'],
    like: ['LIKE_BUTTON'],
    queue: ['PLAYERBAR_DESKTOP_PLAY_QUEUE_BUTTON', 'VIBE_CONTEXT_MENU_PLAY_QUEUE_ITEM']
  };
  const VIBE_VISIBILITY = {
    hideVibeVolume: ':is([class*="ChangeVolume_root__"],[class*="VibePlayerBar_changeVolume__"],button[aria-label*="звук" i],button[aria-label*="volume" i])',
    hideVibeMenu: 'button:is([data-test-id="CONTEXT_MENU_BUTTON"],[data-test-id="VIBE_CONTEXT_MENU_BUTTON"],[aria-label="Контекстное меню" i],[aria-label="Context menu" i],[aria-label="More options" i])',
    hideVibeLike: 'button:is([data-test-id="LIKE_BUTTON"],[aria-label="Нравится" i],[aria-label="Убрать лайк" i],[aria-label="Больше не нравится" i],[aria-label="Like" i],[aria-label="Unlike" i])',
    hideVibeDislike: 'button:is([data-test-id="DISLIKE_BUTTON"],[aria-label="Не нравится" i],[aria-label="Убрать дизлайк" i],[aria-label="Dislike" i],[aria-label="Remove dislike" i])',
    hideVibeSkip: ':is([class*="VibePlayerControls_skipButton__"],[data-test-id="NEXT_TRACK_BUTTON"],[data-test-id="PREVIOUS_TRACK_BUTTON"],[data-test-id="PREV_TRACK_BUTTON"])',
    hideVibePlay: VIBE_PLAY
  };
  const BAR_VISIBILITY = {
    hideBarVolume: ':is([class*="ChangeVolume_root__"],[class*="ChangeVolume_button__"],[class*="PlayerBarDesktopWithBackgroundProgressBar_volume__"])',
    hideBarQueue: '[data-test-id="PLAYERBAR_DESKTOP_PLAY_QUEUE_BUTTON"]',
    hideBarCover: SELECTOR.barCover,
    hideBarTitle: SELECTOR.barTitle,
    hideBarArtist: SELECTOR.barArtist
  };

  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
  const rgba = (hex, percent) => `rgba(${rgb(hex)},${percent / 100})`;
  const linearChannel = Array.from({ length: 256 }, (_, i) => {
    const n = i / 255;
    return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
  });
  const luminance = hex => {
    const value = parseInt(hex.slice(1), 16);
    return .2126 * linearChannel[value >> 16] + .7152 * linearChannel[value >> 8 & 255] + .0722 * linearChannel[value & 255];
  };

  function readableText(text, surface, minimum = 4.5) {
    const foreground = luminance(text), background = luminance(surface);
    const contrast = (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
    return contrast >= minimum ? text : contrastRatio('#000000', surface) >= contrastRatio('#FFFFFF', surface) ? '#000000' : '#FFFFFF';
  }
  const contrastRatio = (foreground, background) => {
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  };
  const mixHex = (from, to, amount) => {
    return '#' + [1, 3, 5].map(i => {
      const a = parseInt(from.slice(i, i + 2), 16);
      const b = parseInt(to.slice(i, i + 2), 16);
      return Math.round(a + (b - a) * amount).toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  };
  function tintedInk(ink, surfaces, minimum = 4.5) {
    const levels = surfaces.map(luminance);
    const score = color => {
      const inkLevel = luminance(color) + .05;
      return Math.min(...levels.map(level => Math.max(inkLevel, level + .05) / Math.min(inkLevel, level + .05)));
    };
    if (score(ink) >= minimum) return ink;
    const candidates = ['#FFFFFF', '#000000'].map(end => {
      if (score(end) < minimum) return { color: end, amount: 1 };
      let low = 0, high = 1;
      for (let step = 0; step < 9; step++) {
        const mid = (low + high) / 2;
        if (score(mixHex(ink, end, mid)) >= minimum) high = mid;
        else low = mid;
      }
      return { color: mixHex(ink, end, high), amount: high };
    });
    const passing = candidates.filter(({ color }) => score(color) >= minimum).sort((a, b) => a.amount - b.amount);
    if (passing.length) return passing[0].color;
    return [ink, ...candidates.map(({ color }) => color)].sort((a, b) => score(b) - score(a))[0];
  }
  const smartGroupEnabled = (t, group) => Boolean(t.enabled && t.smartTheme && t[group] && t[group + 'Amount'] && t.smartStrength);
  const smartOn = (t, group) => Boolean(t.coverColors && smartGroupEnabled(t, group));
  const smartOwnsBackdrop = t => smartGroupEnabled(t, 'smartBackground') || smartGroupEnabled(t, 'smartGradient');
  const guardedInk = (t, ink, fill) => t.contrastGuard ? readableText(ink, fill, t.contrastLevel / 10) : ink;
  const blendedFill = (fill, opacity, behind) => mixHex(behind, fill, opacity / 100);
  const panelFill = (t, fill = t.panel) => blendedFill(fill, t.panelOpacity, t.background);
  const motionCurve = value => ({ smooth:'cubic-bezier(.22,1,.36,1)', soft:'ease-in-out',
    snappy:'cubic-bezier(.2,.9,.3,1.25)', linear:'linear' }[value]);
  const ACTIVE = 'html[data-ymc-active="yes"]';
  const scoped = selectors => selectors.split(', ').map(s => `${ACTIVE} ${s}`).join(', ');
  // Rem tokens adapted from Next-Music-Client v3.11.1, src/inject/noAutoZoom.css (MIT).
  const SCALE_TOKENS = `
    --ym-font-size-label-xs: 0.75rem;
    --ym-font-size-label-s: 0.8125rem;
    --ym-font-size-label-m: 0.875rem;
    --ym-font-size-label-l: 1rem;
    --ym-font-size-headline-xs: 1.25rem;
    --ym-font-size-headline-s: 1.375rem;
    --ym-font-size-headline-m: 1.5rem;
    --ym-font-size-headline-l: 1.625rem;
    --ym-font-size-headline-xl: 2rem;
    --ym-spacer-size-xs: 0.5rem;
    --ym-spacer-size-s: 0.625rem;
    --ym-spacer-size-m: 0.75rem;
    --ym-spacer-size-l: 1rem;
    --ym-spacer-size-xl: 1.25rem;
    --ym-spacer-size-xxl: 1.5rem;
    --ym-icon-size-xxs: 1.25rem;
    --ym-icon-size-xs: 1.5rem;
    --ym-icon-size-s: 1.75rem;
    --ym-icon-size-m: 2rem;
    --header-height: 3.75rem;
    --player-bar-height: 5rem;
  `.trim().split('\n').map(line => line.trim().replace(/;$/, ' !important;')).join('\n');
  const cssUrl = url => `url("${url.replace(/["\\\n\r\f]/g, c => `\\${c.codePointAt(0).toString(16)} `)}")`;
  const assetUrls = new Map();
  function assetPaint(url, paint) {
    if (paint === literal) return cssUrl(url);
    if (!assetUrls.has(url)) {
      if (assetUrls.size >= 4) assetUrls.delete(assetUrls.keys().next().value);
      assetUrls.set(url, cssUrl(url));
    }
    return paint(assetUrls.get(url));
  }

  function likedMask(t) {
    if (t.likedShape === 'image') return t.likedImage;
    const path = { star: 'M12 1 15.5 8 23 9 17.5 14.5 19 22 12 18.3 5 22 6.5 14.5 1 9 8.5 8Z',
      diamond: 'M12 1 23 12 12 23 1 12Z' }[t.likedShape];
    return path ? 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="' + path + '"/></svg>') : '';
  }

  function playlistBackground(t) {
    if (t.playlistGradient === 'native' && !smartOn(t, 'smartPlaylist')) return '';
    if (t.playlistGradient === 'off') return 'none';
    const fromPalette = t.playlistGradient === 'palette' && !t.coverColors;
    const start = fromPalette ? t.panel : t.playlistStart;
    const end = fromPalette ? t.background : t.playlistEnd;
    if (t.playlistGradient === 'solid') return rgba(start, t.playlistOpacity);
    return `linear-gradient(${t.playlistAngle}deg,${rgba(start,t.playlistOpacity)} 0%,${rgba(end,t.playlistOpacity * t.playlistDepth / 100)} ${t.playlistFade * .62}%,transparent ${t.playlistFade}%)`;
  }

  function playlistColors(t) {
    const custom = t.playlistCustomButtons, painted = custom || t.coverColors;
    const opacity = custom ? t.playlistButtonOpacity : Math.max(65, t.panelOpacity);
    const primary = painted ? t.playlistPrimary : t.accent;
    const secondary = painted ? t.playlistSecondary : t.panel;
    const filter = painted ? t.playlistFilter : t.panel;
    const ink = (chosen, fill, alpha) => {
      const surface = blendedFill(fill, alpha, t.background);
      const minimum = t.contrastGuard ? t.contrastLevel / 10 : custom ? 0 : 4.5;
      return smartOn(t, 'smartButtons') ? tintedInk(chosen, [surface], minimum) : readableText(chosen, surface, minimum);
    };
    return {
      primary,
      primaryText: ink(painted ? t.playlistPrimaryText : t.background, primary, custom ? opacity : 100),
      secondary,
      secondaryText: ink(painted ? t.playlistSecondaryText : t.text, secondary, opacity),
      filter,
      filterText: ink(painted ? t.playlistFilterText : t.text, filter, opacity),
      filterBorder: custom || smartOn(t, 'smartButtons') ? t.playlistFilterBorder : null,
      selected: painted ? t.playlistSelected : t.accent,
      hover: painted ? t.playlistButtonHover : t.accent,
      opacity,
      radius: custom ? t.playlistButtonRound : null
    };
  }

  const literal = value => value;
  function buttonRules(selector, { fill, ink, hover, opacity, radius, behind = fill, minimum = 4.5, tonal = false }, paint = literal) {
    const hoverSurface = blendedFill(hover, opacity, behind);
    return `${scoped(selector)} {
      background-color:${paint(rgba(fill, opacity))} !important; color:${paint(ink)} !important;
      ${radius === null ? '' : `border-radius:${radius}px !important;`}
    }
    ${scoped(selector + ':is(:hover,:focus-visible):not(:disabled,[aria-disabled="true"])')} {
      background-color:${paint(rgba(hover, opacity))} !important;
      color:${paint(tonal ? tintedInk(ink, [hoverSurface], minimum) : readableText(ink, hoverSurface, minimum))} !important;
    }`;
  }

  function playlistStyles(t, useCustomizerPalette, paint) {
    const background = playlistBackground(t);
    const paintButtons = t.playlistButtons && (useCustomizerPalette || t.playlistCustomButtons);
    const c = playlistColors(t);
    const smartButtons = smartOn(t, 'smartButtons');
    const minimum = t.contrastGuard ? t.contrastLevel / 10 : 0;
    const shape = { hover: c.hover, opacity: c.opacity, radius: c.radius, behind: t.background, minimum, tonal: smartButtons };
    const searchSurface = blendedFill(t.playlistSearchFill, t.playlistSearchOpacity, t.background);
    const searchInk = smartButtons ? tintedInk(t.playlistSearchText, [searchSurface], minimum)
      : guardedInk(t, t.playlistSearchText, searchSurface);
    const searchContainer = `${PLAYLIST} [class*="SearchInput_root__"]:has(${PLAYLIST_SEARCH})`;
    return `
      ${background ? `${scoped(SELECTOR.playlistBackdrop)} {
        background:${paint(background)} !important; opacity:${background === 'none' ? 0 : 1} !important;
      }` : ''}
      ${paintButtons ? `
        ${buttonRules(SELECTOR.playlistSecondary, { ...shape, fill: c.secondary, ink: c.secondaryText }, paint)}
        ${buttonRules(SELECTOR.playlistPlay, { ...shape, fill: c.primary, ink: c.primaryText, opacity: c.radius === null ? 100 : c.opacity }, paint)}
        ${buttonRules(PLAYLIST_FILTER, { ...shape, fill: c.filter, ink: c.filterText }, paint)}
        ${c.filterBorder ? `${scoped(PLAYLIST_FILTER)} { border-color:${paint(c.filterBorder)} !important; box-shadow:inset 0 0 0 1px ${paint(c.filterBorder)} !important; }` : ''}
        ${scoped(PLAYLIST_SELECTED)} {
          border-color:${paint(c.selected)} !important;
          ${t.playlistCustomButtons ? `box-shadow:inset 0 0 0 1px ${paint(c.selected)} !important;` : ''}
        }
      ` : ''}
      ${t.playlistCoverCustom ? `${scoped(SELECTOR.playlistCover)} { border-radius:${t.playlistCoverRound}px !important; }` : ''}
      ${t.playlistSearchCustom || (smartButtons && t.playlistButtons) ? `
        ${scoped(searchContainer)}, ${scoped(SELECTOR.playlistSearch)} {
          background-color:${paint(rgba(t.playlistSearchFill,t.playlistSearchOpacity))} !important;
          color:${paint(searchInk)} !important;
          ${t.playlistSearchCustom ? `border-radius:${t.playlistSearchRound}px !important;` : ''}
        }
        ${scoped(searchContainer + ' input')} { background-color:transparent !important; }
        ${scoped(SELECTOR.playlistSearch + '::placeholder')} { color:${paint(searchInk)} !important; opacity:.72; }
      ` : ''}
    `;
  }

  function visibilityRules(scope, controls, t) {
    const hidden = Object.entries(controls).filter(([key]) => t[key]).map(([, selector]) => `${scope} ${selector}`);
    return hidden.length ? `${scoped(hidden.join(', '))} { display:none !important; }` : '';
  }

  function portraitEffectColor(t, backgroundColor) {
    if (smartOn(t, 'smartPortrait')) return t.portraitColor;
    if (t.portraitColorSource === 'custom') return t.portraitColor;
    return (t.portraitColorSource === 'background' && backgroundColor) || t.accent;
  }

  function portraitFilter(t, color) {
    if (['off', 'bloom'].includes(t.portraitEffect) || t.portraitIntensity === 0) return 'none';
    const glow = t.portraitEffect !== 'outline' ? `
      <feMorphology in="SourceAlpha" operator="dilate" radius="${t.portraitSpread / 6}" result="spread"/>
      <feGaussianBlur in="spread" stdDeviation="${t.portraitSpread / 3}" result="soft"/>
      <feComposite in="paint" in2="soft" operator="in" result="glow"/>` : '';
    const outline = t.portraitEffect !== 'glow' ? `
      <feMorphology in="SourceAlpha" operator="dilate" radius="${t.portraitOutline}" result="edge"/>
      <feComposite in="paint" in2="edge" operator="in" result="outline"/>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><filter id="portrait" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
      <feFlood flood-color="${color}" flood-opacity="${t.portraitIntensity / 100}" result="paint"/>
      ${glow}${outline}
      <feMerge>${glow ? '<feMergeNode in="glow"/>' : ''}${outline ? '<feMergeNode in="outline"/>' : ''}<feMergeNode in="SourceGraphic"/></feMerge>
    </filter></svg>`;
    return cssUrl('data:image/svg+xml,' + encodeURIComponent(svg) + '#portrait');
  }

  const hasPortraitAura = t => t.showVibePortrait && t.portraitIntensity > 0 && ['glow', 'both', 'bloom'].includes(t.portraitEffect);
  const hasBeatAura = t => hasPortraitAura(t) && t.portraitBeat && t.portraitBeatStrength > 0;

  const navigationFill = t => t.navigationCustom ? blendedFill(t.navigationFill, t.navigationOpacity, t.background) : t.background;
  function navigationStyles(t, paint) {
    if (!t.navigationCustom && !t.contrastGuard) return '';
    const chosen = t.navigationCustom ? t.navigationText : t.text;
    const fill = navigationFill(t);
    const ink = smartOn(t, 'smartButtons') && t.contrastGuard ? tintedInk(chosen, [fill], t.contrastLevel / 10)
      : guardedInk(t, chosen, fill);
    const icon = SELECTOR.navigation + ' svg';
    return `
      ${scoped(SELECTOR.navigation)} {
        color:${paint(ink)} !important;
        ${t.navigationCustom ? `background-color:${paint(rgba(t.navigationFill, t.navigationOpacity))} !important;
        border-radius:${t.navigationRound}px !important;` : ''}
      }
      ${scoped(icon)} {
        color:${paint(ink)} !important;
        filter:drop-shadow(0 0 1px ${paint(readableText(ink, ink))}) !important;
      }
      ${scoped(icon + ' :is(use,path,polygon):not([fill="none"],[stroke])')} { fill:currentColor !important; }
      ${scoped(icon + ' [fill]:not([fill="none"])')} { fill:currentColor !important; }
      ${scoped(icon + '[stroke]:not([stroke="none"]), ' + icon + ' [stroke]:not([stroke="none"])')} { stroke:currentColor !important; }
      ${scoped(SELECTOR.navigation + ':focus-visible')} { outline:2px solid currentColor !important; outline-offset:2px; }
    `;
  }

  function barLayoutStyles(t) {
    const { player, barRow, barInfo, barInfoCard, barControls, barActions, barCover, barProgress, barThumb, barTitle, barArtist } = SELECTOR;
    const inner = selector => scoped(`${player} ${selector}`);
    const padded = t.barLayout === 'spacious' ? 22 : t.barLayout === 'compact' ? 6 : 10;
    const progress = `
      ${inner(barProgress)} { height:${t.barProgressSize}px !important; }
      ${inner(barProgress + '::before')} { height:100% !important; }
      ${t.barProgressMode === 'always' ? `${inner(barProgress)} { opacity:1 !important; }` : ''}
      ${t.barProgressMode === 'minimal' ? `
        ${scoped(`${player}:focus-within ${barProgress}`)} { opacity:1 !important; }
        ${scoped(`${player}:not(:focus-within) :is(${barProgress},${barThumb})`)} { opacity:0 !important; }
      ` : ''}
    `;
    if (t.barLayout === 'native') return t.barProgressMode === 'native' ? '' : progress;
    return `
      ${scoped(player)} {
        --player-bar-height:${t.barHeight}px !important;
        height:var(--player-bar-height) !important; min-height:var(--player-bar-height) !important;
        container-type:inline-size;
      }
      ${inner(barRow)} {
        --player-cover-size:min(${t.barCoverSize}px, calc(var(--player-bar-height) - 8px)) !important;
        gap:${t.barGap}px !important; padding-inline:${padded}px !important;
      }
      ${inner(barInfoCard)} { gap:${t.barGap}px !important; padding-inline-end:0 !important; }
      ${inner(barCover)} { width:var(--player-cover-size); height:var(--player-cover-size); }
      ${inner(barControls)} { zoom:${t.barControlsSize / 100}; gap:${t.barGap}px !important; }
      ${inner(barActions)} { min-width:0; padding-inline:0 !important; gap:${t.barGap}px !important; }
      ${inner(barTitle)} { font-size:${.875 * t.barTextScale / 100}rem !important; }
      ${inner(barArtist)} { font-size:${.75 * t.barTextScale / 100}rem !important; }
      ${t.barLayout === 'center' ? `
        @container (min-width:38rem) {
          ${inner(barRow)} { display:grid !important; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) !important; }
          ${inner(barInfo)} { grid-column:1; grid-row:1; min-width:0; width:100%; }
          ${inner(barControls)} { grid-column:2; grid-row:1; justify-self:center; }
          ${inner(barActions)} { grid-column:3; grid-row:1; justify-self:stretch; }
        }
      ` : ''}
      ${progress}
    `;
  }

  function waveButtonInk(t, paint, ordinaryInk, playInk) {
    const controls = VIBE_TRANSPORT + ' :is(button,[role="button"])';
    const play = VIBE_TRANSPORT + ' ' + VIBE_PLAY;
    const styledHeart = t.likedCustom || smartOn(t, 'smartHeart');
    const svg = ':is(svg' + (styledHeart ? ':not(' + SELECTOR.liked + ')' : '') + ')';
    const paintInk = (selector, color) => `
      ${scoped(selector)} { --accent-color:${paint(color)} !important; color:var(--accent-color) !important; }
      ${scoped(selector + ' ' + svg)} { --accent-color:inherit !important; color:var(--accent-color) !important; opacity:1 !important; }
      ${scoped(selector + ' ' + svg + ':not([fill="none"]), ' + selector + ' ' + svg + ' :is([fill]:not([fill="none"]),use:not([stroke],[fill="none"]))')} { fill:currentColor !important; }
      ${scoped(selector + ' ' + svg + '[stroke]:not([stroke="none"]), ' + selector + ' ' + svg + ' [stroke]:not([stroke="none"])')} { stroke:currentColor !important; }
    `;
    return paintInk(controls + ':not(' + VIBE_PLAY + ')', ordinaryInk) + paintInk(play, playInk);
  }

  function waveStyles(t, paint) {
    const wavePage = '[data-ymc-on-wave]';
    const clear = t.waveClearRail && t.vibeAnimation;
    const custom = recoloredWave(t);
    const smartLight = smartLightWave(t);
    const tint = custom || smartLight ? 'url(#ymc-native-wave-tint) ' : '';
    // Recolor the native renderer without tinting its framing and fade layers.
    const target = selectors => tint ? selectors.split(', ').map(selector =>
      `${selector} canvas, ${selector}:not(:has(canvas))`).join(', ') : selectors;
    const smartBackground = !(t.addonEnabled && t.addonPalette) &&
      (smartOn(t, 'smartBackground') || smartOn(t, 'smartGradient'));
    const nativeAlpha = Math.min(t.waveNativeOpacity / 100, smartLight ? .28 : smartBackground ? .38 : 1);
    const patternAlpha = Math.min(nativeAlpha, t.patternNativeOpacity / 100);
    const boost = custom && t.waveBeat > 0 ? 'var(--ymc-wave-beat,0)' : '0';
    const filter = custom ? `${tint}opacity(min(1,calc(${paint(String(t.waveOpacity / 100))} * (1 + ${boost} * .52))))`
      : tint || nativeAlpha < 1 ? `${tint}opacity(${paint(String(nativeAlpha))})` : '';
    return `
      ${t.vibeAnimation && filter ? `
        ${scoped(target(SELECTOR.vibeAnimation))} { filter:${filter} !important; }
      ` : ''}
      ${t.vibeAnimation && !custom && t.patternEnabled && t.patternOpacity > 0 && patternAlpha < nativeAlpha ? `
        ${scoped(target(t.patternScope === 'wave' ? '[class*="VibePage_vibeAnimation__"]' : SELECTOR.vibeAnimation))} {
          filter:${tint}opacity(${paint(String(patternAlpha))}) !important;
        }
      ` : ''}
      ${custom && t.waveBeat > 0 ? `
        @media (prefers-reduced-motion:no-preference) {
          ${scoped('[class*="VibePage_vibeAnimation__"]')} { scale:calc(1 + ${boost} * .065); }
        }
      ` : ''}
      ${clear ? `
        ${ACTIVE}${wavePage} :is([class*="DefaultLayout_navbar__"],${SELECTOR.navbar}) {
          background:transparent !important; backdrop-filter:none !important; box-shadow:none !important;
        }
        ${ACTIVE}${wavePage} [class*="NavbarDesktop_scrollableContainer__"]::before,
        ${ACTIVE}${wavePage} [class*="NavbarDesktop_scrollableContainer__"]::after { background:none !important; }
        ${ACTIVE}${wavePage} { overflow-x:clip; }
        ${ACTIVE}${wavePage} :is([class*="Content_root__"],[class*="Content_main__"]):has([class*="VibePage_vibeAnimation__"]) {
          overflow:visible !important;
        }
      ` : ''}
      ${t.vibeAdaptiveCover ? `
        ${scoped('[data-ymc-track-art="portrait"] ' + VIBE_ALBUM)} {
          visibility:hidden !important; pointer-events:none !important;
        }
        ${scoped('[data-ymc-track-art="cover"] [data-ymc-sized-cover]')} {
          --album-cover-size:var(--ymc-large-art) !important;
          width:var(--ymc-large-art) !important; height:var(--ymc-large-art) !important;
        }
        ${scoped('[data-ymc-track-art="cover"] [data-ymc-sized-cover] img')} {
          width:100% !important; height:100% !important; object-fit:cover;
        }
        ${scoped('[data-ymc-track-art="cover"] [data-ymc-art-no-room]')} {
          visibility:hidden !important; pointer-events:none !important;
        }
      ` : ''}
    `;
  }

  const AURA_STYLE = `
    [data-ymc-aura-host] { position:relative; isolation:isolate; }
    [data-ymc-portrait-aura] {
      position:absolute; z-index:-1; overflow:clip; pointer-events:none;
      opacity:clamp(0,calc(var(--ymc-aura-alpha,.8) * (.82 + var(--ymc-aura-beat,0) * .45)),1);
      --ymc-aura-wide:calc(38% + var(--ymc-aura-spread,24) * .22%);
      --ymc-aura-tall:calc(37% + var(--ymc-aura-spread,24) * .26%);
      mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,black 55%,transparent 100%);
    }
    [data-ymc-portrait-aura]::before {
      content:""; position:absolute; inset:0;
      background:
        radial-gradient(ellipse var(--ymc-aura-wide) var(--ymc-aura-tall) at 50% 47%,var(--ymc-aura-color) 10%,transparent 100%),
        radial-gradient(ellipse 30% 42% at 35% 57%,var(--ymc-aura-color),transparent 100%),
        radial-gradient(ellipse 31% 40% at 66% 58%,var(--ymc-aura-color),transparent 100%);
      transform:scale(calc(1 + var(--ymc-aura-beat,0) * .20));
    }
  `;

  let waveMatrix, waveSample, waveKey = '', waveAbort, waveRetry = 0, waveFailures = 0, activeHero, portraitNode;

  function waveBackground(t) {
    const sample = t.appMediaEnabled && vibeMedia ? suggestedPalette?.sample : t.mode === 'image' ? portraitWallpaper.sample : null;
    if (!sample || t.addonEnabled && t.addonPalette) return t.background;
    const swatch = sample.neutralBackdrop || !sample.backdrop ? neutralTone(sample.neutralBias, sample.backdropLight)
      : coverTone(sample.backdrop, 1, sample.backdrop.light);
    const mediaAlpha = t.appMediaEnabled && vibeMedia ? t.mediaOpacity / 100 : 1;
    return mixHex(t.background, swatch, mediaAlpha * (1 - t.backgroundDim / 100));
  }

  const recoloredWave = t => t.vibeAnimation && t.waveStyle === 'custom';
  function smartLightWave(t) {
    if (!t.smartTheme || t.addonEnabled && t.addonPalette || t.appMediaEnabled && vibeMedia) return false;
    return luminance(t.background) >= .56 &&
      (t.mode === 'solid' || t.mode === 'gradient' && luminance(t.gradientEnd) >= .56);
  }
  const waveUsesTint = t => recoloredWave(t) || t.vibeAnimation && smartLightWave(t);
  const waveColorSource = t => recoloredWave(t) ? t.wavePalette : 'auto';
  function waveNeedsCover(t, background = waveBackground(t)) {
    const source = waveColorSource(t);
    return source === 'cover' || source === 'auto' && (smartLightWave(t) || luminance(background) >= .63);
  }

  function paintCustomWave(t) {
    if (!waveMatrix || !waveUsesTint(t)) return;
    const background = waveBackground(t);
    const bright = luminance(background) >= .56;
    const backgroundTone = hueOf(...rgb(background).split(',').map(Number));
    const source = waveColorSource(t);
    const coverInk = waveSample && (waveSample.sample.achromatic ? waveSample.spectrumMid : waveSample.portraitAccent);
    const base = backgroundTone.chroma < .055 ? (bright ? '#444444' : '#EEEEEE')
      : coverTone(backgroundTone, 1.18, bright ? .36 : Math.max(.50, backgroundTone.light + .24));
    const contrast = recoloredWave(t) ? t.waveTone / 100 : .60;
    const seed = waveNeedsCover(t, background) && coverInk || base;
    const ink = source === 'custom' ? t.waveTint : tintedInk(seed, [background], 1.8 + contrast * 3);
    const gain = 1.25 + contrast * 2.45;
    const cutoff = (bright ? .20 : .075) + contrast * .055;
    // Use the shader's light as a mask, leaving its dark floor transparent.
    const matrix = rgb(ink).split(',').flatMap(channel => [0, 0, 0, 0, Number(channel) / 255])
      .concat(.28 * gain, .48 * gain, .24 * gain, 0, -cutoff * gain).map(value => value.toFixed(4)).join(' ');
    if (waveMatrix.getAttribute('values') !== matrix) waveMatrix.setAttribute('values', matrix);
  }

  async function syncWavePalette(track, shared = false) {
    const sources = track?.sampleCovers || [track?.cover].filter(Boolean);
    const key = sources.join('\n');
    if (key !== waveKey) {
      waveKey = key;
      waveAbort?.abort();
      waveAbort = undefined;
      waveSample = undefined;
      waveFailures = waveRetry = 0;
      paintCustomWave(visualTheme());
    }
    if (shared || !sources.length || waveSample || waveAbort || waveFailures >= 3 || performance.now() < waveRetry) return;
    const controller = new AbortController();
    waveAbort = controller;
    try {
      for (const source of sources) {
        const sample = await loadCoverPalette(source, controller.signal);
        if (controller.signal.aborted) return;
        if (sample) {
          waveSample = sample;
          paintCustomWave(visualTheme());
          return;
        }
      }
      waveRetry = performance.now() + 1000 * ++waveFailures;
    } finally {
      if (waveAbort === controller) waveAbort = undefined;
    }
  }

  const WAVE_TITLES = '[class*="VibePage_text__"],[data-test-id="VIBE_DYNAMIC_TITLE_VIBE"],[data-test-id="VIBE_DYNAMIC_TITLE_GENERATIVE"]';
  let sizedArt, sizedHero, artObserver, artTargets = [];

  function resizeAdaptiveArt() {
    if (!sizedArt?.isConnected || !sizedHero?.isConnected) return;
    const frame = sizedHero.getBoundingClientRect();
    const player = sizedArt.closest(SELECTOR.vibe);
    const art = sizedArt.getBoundingClientRect();
    if (!player) return;
    const artBottom = Math.min(art.bottom, player.getBoundingClientRect().top);
    let titleBottom = frame.top;
    for (const title of artTargets.slice(2)) {
      const box = title.getBoundingClientRect();
      if (box.height && getComputedStyle(title).visibility === 'visible') titleBottom = Math.max(titleBottom, box.bottom);
    }
    const room = Math.floor(Math.min(352, frame.width * .66, artBottom - titleBottom - 12));
    const size = Math.max(0, Math.floor(room * theme.vibeAdaptiveCoverSize / 100));
    sizedArt.toggleAttribute('data-ymc-art-no-room', size < 16);
    const css = Math.max(1, size) + 'px';
    if (sizedArt.style.getPropertyValue('--ymc-large-art') !== css) sizedArt.style.setProperty('--ymc-large-art', css);
  }

  function syncAdaptiveArt(hero, portrait) {
    const cover = hero && !portrait ? hero.querySelector(VIBE_ALBUM) : null;
    const art = cover?.closest(SELECTOR.vibe) ? cover : null;
    if (sizedArt !== art) {
      sizedArt?.removeAttribute('data-ymc-sized-cover');
      sizedArt?.removeAttribute('data-ymc-art-no-room');
      sizedArt?.style.removeProperty('--ymc-large-art');
      sizedArt = art;
    }
    sizedHero = hero;
    const titles = art ? [...hero.querySelectorAll(WAVE_TITLES)] : [];
    const targets = art ? [hero, art.closest(SELECTOR.vibe) || art, ...titles] : [];
    if (targets.length !== artTargets.length || targets.some((node, index) => node !== artTargets[index])) {
      artObserver?.disconnect();
      artTargets = targets;
      if (art) {
        artObserver ||= new ResizeObserver(resizeAdaptiveArt);
        for (const node of new Set(targets)) artObserver.observe(node);
      }
    }
    if (art) {
      // Measure the native anchor before applying the new dimensions on the first pass.
      resizeAdaptiveArt();
      art.setAttribute('data-ymc-sized-cover', '');
    }
  }

  function syncWaveMount(fullscreen) {
    const hero = !fullscreen && isStyled() ? [...document.querySelectorAll(VIBE_HERO)]
      .find(node => node.getClientRects().length && !node.closest('[aria-hidden="true"]')) : null;
    if (activeHero && activeHero !== hero) {
      activeHero.removeAttribute('data-ymc-track-art');
      paintWaveBeat(0);
      resetBeatEnvelope(waveBeatState);
    }
    activeHero = hero;
    document.documentElement.toggleAttribute('data-ymc-on-wave', Boolean(hero));
    portraitNode = hero && theme.showVibePortrait && (theme.vibeAdaptiveCover || hasBeatAura(theme)) ? [...hero.querySelectorAll(SELECTOR.portrait)]
      .find(img => img.complete && img.naturalWidth > 0 && img.getClientRects().length &&
        getComputedStyle(img).visibility === 'visible') : undefined;
    const adaptiveHero = theme.vibeAdaptiveCover && !hero?.matches('[class*="VibePage_bigCardPanel_opened__"]') ? hero : null;
    if (adaptiveHero) adaptiveHero.dataset.ymcTrackArt = portraitNode ? 'portrait' : 'cover';
    else hero?.removeAttribute('data-ymc-track-art');
    syncAdaptiveArt(adaptiveHero, portraitNode);
    if (hero && waveUsesTint(visualTheme())) paintCustomWave(visualTheme());
    else if (waveKey) syncWavePalette(null);
  }

  const NAV_ENTRY = '[data-test-id^="NAVBAR_NAVIGATION_ITEM_"],[data-test-id="PIN_ITEM"],[class*="PinItem_root__"],[class*="NavbarDesktop_logoWrapper__"],[class*="NavbarDesktop_disabledNavigationItem__"]';
  const NAV_SLOT = '[class*="DefaultLayout_navbar__"]';
  const NAV_AVATAR = '[data-test-id="USER_PROFILE_AVATAR_CONTAINER"],[class*="UserProfile_avatarContainer__"]';
  const NAV_STYLES = `
    [data-ymc-nav-hide] { display:none !important; }
    [data-ymc-native-nav-order] { order:var(--ymc-nav-order) !important; }
    [data-ymc-nav-sized]:not([data-ymc-nav-dock]) :is([data-test-id^="NAVBAR_NAVIGATION_ITEM_"],[data-ymc-launcher]) svg {
      inline-size:var(--ymc-nav-icon-size) !important; block-size:var(--ymc-nav-icon-size) !important; flex:none;
    }

    [data-ymc-nav-dock] {
      --ymc-nav-top:max(32px,var(--ymc-nav-inset)); --ymc-nav-bottom:var(--ymc-nav-inset);
      --ymc-icon-box:calc(var(--ymc-nav-icon-size) + 8px);
      --ymc-cell-height:calc(var(--ymc-icon-box) + 34px);
      position:fixed !important; z-index:12; box-sizing:border-box !important; margin:0 !important;
      display:grid !important; gap:var(--ymc-nav-gap) !important; reading-flow:grid-rows;
      padding:6px !important; overflow:auto !important; scrollbar-width:none; overscroll-behavior:contain;
      border-radius:var(--ym-radius-size-m,16px); backdrop-filter:none !important;
    }
    [data-ymc-nav-dock]::-webkit-scrollbar { display:none; }
    [data-ymc-nav-dock] [data-ymc-nav-path] { display:contents !important; }
    [data-ymc-nav-dock] [data-ymc-nav-path]::before, [data-ymc-nav-dock] [data-ymc-nav-path]::after { content:none !important; }
    /* The native spacers and headings are sized for the left sidebar. Leave them in its DOM. */
    [data-ymc-nav-dock] > :not([data-ymc-nav-cell],[data-ymc-nav-path]),
    [data-ymc-nav-dock] [data-ymc-nav-path] > :not([data-ymc-nav-cell],[data-ymc-nav-path]) { display:none !important; }

    :is([data-ymc-nav-dock="left"],[data-ymc-nav-dock="right"]) {
      inset-block:var(--ymc-nav-top) var(--ymc-nav-bottom);
      inline-size:var(--ymc-nav-width) !important; min-inline-size:0 !important; max-inline-size:none !important;
      block-size:max-content !important; min-block-size:0 !important;
      max-block-size:calc(100dvh - var(--ymc-nav-top) - var(--ymc-nav-bottom)) !important;
      margin-block:auto !important; overflow-x:hidden !important;
      grid-template:none / minmax(0,1fr) !important; grid-auto-flow:row !important; grid-auto-rows:max-content !important;
    }
    [data-ymc-nav-dock="left"] { left:var(--ymc-nav-inset); right:auto; }
    [data-ymc-nav-dock="right"] { right:calc(var(--ymc-nav-inset) + var(--ymc-reserved-width)); left:auto; }
    :is([data-ymc-nav-dock="left"],[data-ymc-nav-dock="right"])[data-ymc-nav-align="start"] { margin-block-start:0 !important; }
    :is([data-ymc-nav-dock="left"],[data-ymc-nav-dock="right"])[data-ymc-nav-align="end"] { margin-block-end:0 !important; }
    :is([data-ymc-nav-dock="left"],[data-ymc-nav-dock="right"])[data-ymc-nav-compact] {
      --ymc-cell-height:max(42px,calc(var(--ymc-icon-box) + 12px));
    }

    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]) {
      --ymc-cell-min:max(64px,calc(var(--ymc-icon-box) + 10px));
      --ymc-cell-width:max(var(--ymc-cell-min),calc((100dvw - var(--ymc-reserved-width) - 2 * var(--ymc-nav-inset) -
        38px - var(--ymc-nav-brand-width) - var(--ymc-nav-profile-width) - var(--ymc-nav-gaps) * var(--ymc-nav-gap)) / var(--ymc-nav-item-count)));
      inset-inline:var(--ymc-nav-inset) calc(var(--ymc-nav-inset) + var(--ymc-reserved-width));
      inline-size:auto !important; min-inline-size:0 !important; max-inline-size:none !important;
      block-size:max(var(--ymc-nav-depth),calc(var(--ymc-cell-height) + 12px)) !important;
      min-block-size:0 !important; max-block-size:none !important;
      scroll-padding-inline:6px; overflow-y:hidden !important;
      grid-template:var(--ymc-cell-height) / none !important; grid-auto-flow:column !important; grid-auto-columns:max-content !important;
      align-content:center !important; justify-content:safe center !important;
    }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]):not([data-ymc-nav-align="center"]) {
      --ymc-cell-width:max(var(--ymc-cell-min),88px);
    }
    [data-ymc-nav-dock="top"] { top:var(--ymc-nav-top); bottom:auto; }
    [data-ymc-nav-dock="bottom"] { bottom:var(--ymc-nav-bottom); top:auto; }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"])[data-ymc-nav-align="start"] { justify-content:safe start !important; }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"])[data-ymc-nav-align="end"] { justify-content:safe end !important; }

    [data-ymc-nav-dock] [data-ymc-nav-cell] {
      order:var(--ymc-nav-order) !important; grid-area:auto !important; place-self:stretch !important;
      display:grid !important; grid-template:minmax(0,1fr) / minmax(0,1fr); position:relative !important;
      box-sizing:border-box !important; inline-size:100% !important; block-size:var(--ymc-cell-height) !important;
      min-inline-size:0 !important; max-inline-size:none !important; min-block-size:0 !important; max-block-size:none !important;
      padding:0 !important; margin:0 !important; border-radius:10px; overflow:visible !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell][data-ymc-nav-hide] { display:none !important; }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]) [data-ymc-nav-cell] { inline-size:var(--ymc-cell-width) !important; }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]) [data-ymc-nav-cell="brand"] { inline-size:var(--ymc-nav-brand-width) !important; }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]) [data-ymc-nav-cell="profile"] { inline-size:var(--ymc-nav-profile-width) !important; }

    [data-ymc-nav-dock] [data-ymc-nav-action] {
      display:grid !important; grid-template:var(--ymc-icon-box) minmax(0,1fr) / minmax(0,1fr) !important;
      justify-items:center !important; align-items:center !important; gap:0 !important;
      box-sizing:border-box !important; padding:3px 4px !important; margin:0 !important;
      min-inline-size:0 !important; max-inline-size:none !important;
      min-block-size:0 !important; overflow:visible !important; font-size:0 !important; line-height:0 !important;
      text-align:center !important; border-radius:10px !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-action]:not([data-ymc-nav-cell]) { inline-size:100% !important; block-size:100% !important; }
    :is([data-ymc-nav-dock="left"],[data-ymc-nav-dock="right"])[data-ymc-nav-compact] [data-ymc-nav-action] {
      grid-template:minmax(0,1fr) / minmax(0,1fr) !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-symbol] {
      grid-row:1; grid-column:1; display:grid !important; place-items:center; padding:0 !important; margin:0 !important;
      inline-size:var(--ymc-icon-box) !important; block-size:var(--ymc-icon-box) !important;
      min-inline-size:0 !important; max-inline-size:none !important; min-block-size:0 !important; max-block-size:none !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-symbol] svg,
    [data-ymc-nav-dock] svg[data-ymc-nav-symbol] { inline-size:var(--ymc-nav-icon-size) !important; block-size:var(--ymc-nav-icon-size) !important; }
    [data-ymc-nav-dock] :is([data-ymc-nav-action],[data-ymc-nav-symbol],[data-ymc-nav-brand-link]) {
      transform:none !important; translate:none !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-native-label] { display:none !important; }
    [data-ymc-nav-dock]:not([data-ymc-nav-compact]) [data-ymc-nav-caption]::after {
      content:attr(data-ymc-nav-caption); grid-row:2; grid-column:1; align-self:start;
      max-inline-size:min(100%,120px); max-block-size:26px; margin-block-start:1px; overflow:hidden;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
      font:600 11px/13px var(--ym-font-text,system-ui,sans-serif);
      color:inherit; white-space:normal; overflow-wrap:anywhere; text-align:center; pointer-events:none;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="pin"] [class*="Pin_contextMenu__"] {
      position:absolute !important; inset:0 0 auto auto !important; z-index:2; padding:0 !important; margin:0 !important;
      inline-size:20px !important; block-size:20px !important; opacity:0; pointer-events:none;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="pin"]:is(:hover,:focus-within) [class*="Pin_contextMenu__"] {
      opacity:1; pointer-events:auto;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="pin"] [class*="Pin_contextMenu__"] > div {
      inline-size:100%; block-size:100%;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="pin"] [class*="Pin_contextMenu__"] button {
      display:grid !important; place-items:center; box-sizing:border-box;
      inline-size:100% !important; block-size:100% !important;
      min-inline-size:0 !important; min-block-size:0 !important; padding:0 !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="pin"] [class*="Pin_contextMenu__"] svg {
      inline-size:13px !important; block-size:13px !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="pin"] [data-ymc-nav-action] { color:inherit; }
    [data-ymc-nav-dock] [data-ymc-nav-symbol] [class*="PinItem_cover__"] {
      inline-size:100% !important; block-size:100% !important;
    }

    [data-ymc-nav-dock] [data-ymc-nav-cell="brand"] [class*="NavbarDesktop_collapseButton__"] { display:none !important; }
    [data-ymc-nav-dock] [data-ymc-nav-brand-link] {
      display:grid !important; place-items:center !important; inline-size:100% !important; min-inline-size:0 !important;
      padding:0 !important; margin:0 !important; overflow:visible !important;
    }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]) [data-ymc-nav-brand-link] {
      place-self:start center !important; block-size:var(--ymc-icon-box) !important; margin-block-start:3px !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-brand-link] [class*="NavbarDesktop_logo__"] {
      inline-size:auto !important; padding:0 !important;
      --icon-size:30px !important; --icon-height:30px !important; --collapsed-icon-size:30px !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-brand-part] {
      display:grid !important; place-items:center; place-self:center; position:relative !important; inset:auto !important;
      block-size:30px !important; overflow:visible !important;
      opacity:1 !important; visibility:visible !important; animation:none !important; transform:none !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-brand-part="full"] { inline-size:calc(30px * var(--icon-ratio,3.5625)) !important; }
    [data-ymc-nav-dock] [data-ymc-nav-brand-part="mark"] {
      inline-size:var(--ymc-icon-box) !important; block-size:var(--ymc-icon-box) !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-brand-part] svg { display:block; inline-size:100% !important; block-size:100% !important; }
    [data-ymc-nav-dock][data-ymc-nav-compact] [data-ymc-nav-brand-part="full"],
    [data-ymc-nav-dock]:not([data-ymc-nav-compact]) [data-ymc-nav-brand-part="mark"] { display:none !important; }

    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] :is([class*="UserProfile_root__"],[class*="NavbarDesktopUserWidget_userProfileContainer__"]) {
      display:grid !important; grid-template:var(--ymc-icon-box) minmax(0,1fr) / minmax(0,1fr) !important;
      justify-items:center; align-items:center; gap:0 !important; padding:3px 4px !important; margin:0 !important;
      inline-size:100% !important; block-size:100% !important; box-sizing:border-box !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"]:has([class*="UserProfile_root__"]) [class*="NavbarDesktopUserWidget_userProfileContainer__"],
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"][class*="NavbarDesktopUserWidget_userProfileContainer__"]:has([class*="UserProfile_root__"]) {
      grid-template:minmax(0,1fr) / minmax(0,1fr) !important; padding:0 !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] [class*="UserProfile_meta__"] {
      display:grid !important; justify-items:center; align-self:start; gap:1px !important; inline-size:100%; min-inline-size:0;
      opacity:1 !important; visibility:visible !important; animation:none !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] [class*="UserProfile_userName__"] { max-inline-size:100%; font-size:11px !important; line-height:12px !important; }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] [class*="UserProfile_plusLink__"] { display:block; line-height:0; }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] [data-test-id="USER_PROFILE_PLUS_BADGE"] { zoom:.78; }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] [class*="UserProfile_userId__"] {
      --user-id-size:calc(var(--ymc-icon-box) - 2px) !important;
    }
    [data-ymc-nav-dock] [data-ymc-nav-cell="profile"] :is(${NAV_AVATAR}) {
      inline-size:calc(var(--ymc-icon-box) - 2px) !important; block-size:calc(var(--ymc-icon-box) - 2px) !important;
      justify-self:center !important; align-self:center !important;
    }
    :is([data-ymc-nav-dock="left"],[data-ymc-nav-dock="right"])[data-ymc-nav-compact] [data-ymc-nav-cell="profile"] [class*="UserProfile_root__"] {
      grid-template:minmax(0,1fr) / minmax(0,1fr) !important;
    }
    [data-ymc-nav-dock][data-ymc-nav-compact] [data-ymc-nav-cell="profile"] [class*="UserProfile_meta__"] { display:none !important; }

    [data-ymc-nav-dock] [data-ymc-nav-toggle] {
      place-items:center !important; border:0; background:transparent; color:inherit; cursor:pointer;
    }
    [data-ymc-nav-dock] [data-ymc-nav-action]:is(:hover,:focus-visible), [data-ymc-nav-dock] [data-ymc-nav-toggle]:is(:hover,:focus-visible) {
      background-color:var(--ym-controls-color-secondary-default-hovered,#ffffff12);
    }
    [data-ymc-nav-dock] [data-ymc-nav-action]:focus-visible,
    [data-ymc-nav-dock] [data-ymc-nav-toggle]:focus-visible,
    [data-ymc-nav-dock] [data-ymc-nav-brand-link]:focus-visible { outline:2px solid currentColor; outline-offset:-2px; }

    [data-ymc-nav-slot] { width:0 !important; min-width:0 !important; margin:0 !important; }
    [data-ymc-nav-layout] { box-sizing:border-box; }
    [data-ymc-nav-layout]:has([data-ymc-nav-slot]) { grid-template-columns:0 minmax(0,1fr) !important; }
    @media (max-width:600px) {
      [data-ymc-nav-layout]:has([data-ymc-nav-slot]) { grid-template-columns:1fr !important; }
    }
    [data-ymc-nav-layout="left"] { padding-inline-start:var(--ymc-nav-reserve) !important; }
    [data-ymc-nav-layout="right"] { padding-inline-end:var(--ymc-nav-reserve) !important; }
    [data-ymc-nav-layout="top"] { padding-block-start:calc(var(--ymc-nav-safe-top,32px) + var(--ymc-nav-reserve)) !important; }
    [data-ymc-nav-layout="bottom"] { padding-block-end:var(--ymc-nav-reserve) !important; }

    [data-ymc-nav-dock], [data-ymc-nav-collapsed] { transition:opacity .18s ease,transform .18s ease,visibility .18s; }
    [data-ymc-nav-collapsed] { visibility:hidden !important; opacity:0 !important; pointer-events:none !important; }
    [data-ymc-nav-collapsed="left"] { transform:translateX(calc(-100% - var(--ymc-nav-inset,0px))) !important; }
    [data-ymc-nav-collapsed="right"] { transform:translateX(calc(100% + var(--ymc-nav-inset,0px))) !important; }
    [data-ymc-nav-collapsed="top"] { transform:translateY(calc(-100% - var(--ymc-nav-top,32px))) !important; }
    [data-ymc-nav-collapsed="bottom"] { transform:translateY(calc(100% + var(--ymc-nav-inset,0px))) !important; }
    [data-ymc-nav-edge] {
      z-index:13; display:grid; place-items:center; width:26px; height:26px; padding:0;
      border:0; border-radius:6px;
      color:var(--ym-controls-color-primary-text-enabled,light-dark(#28252c,#eee));
      background:transparent; cursor:pointer; opacity:.66; -webkit-app-region:no-drag;
    }
    [data-ymc-nav-edge]:not([data-ymc-nav-cell]) { position:fixed; }
    [data-ymc-nav-dock] [data-ymc-nav-cell="fold"] {
      place-self:center !important; inline-size:26px !important; block-size:26px !important; border-radius:6px;
    }
    :is([data-ymc-nav-dock="top"],[data-ymc-nav-dock="bottom"]) [data-ymc-nav-cell="fold"] {
      align-self:start !important;
      margin-block-start:calc(3px + (var(--ymc-icon-box) - 26px) / 2) !important;
    }
    [data-ymc-nav-edge]:hover, [data-ymc-nav-edge]:focus-visible { opacity:1; }
    [data-ymc-nav-edge][aria-expanded="true"]:hover { background:color-mix(in srgb,currentColor 9%,transparent); }
    [data-ymc-nav-edge]:focus-visible { outline:2px solid currentColor; outline-offset:2px; }
    [data-ymc-nav-edge] svg { width:14px; height:14px; rotate:var(--ymc-edge-rotation,0deg); }
    [data-ymc-nav-edge="left"] { --ymc-edge-rotation:180deg; }
    [data-ymc-nav-edge="top"] { --ymc-edge-rotation:-90deg; }
    [data-ymc-nav-edge="bottom"] { --ymc-edge-rotation:90deg; }
    [data-ymc-nav-edge="left"][aria-expanded="true"]:not([data-ymc-nav-cell]) {
      left:var(--ymc-edge-offset,4px); top:var(--ymc-edge-anchor,calc(100% - 28px)); translate:0 -50%;
    }
    [data-ymc-nav-edge][aria-expanded="false"] {
      color:var(--ymc-edge-color,var(--ym-controls-color-secondary-text-enabled,currentColor)); opacity:1;
    }
    [data-ymc-nav-edge][aria-expanded="false"] svg { display:none; }
    [data-ymc-nav-edge][aria-expanded="false"]:is([data-edge-hint],:focus-visible)::before {
      content:""; border-radius:10px; background:currentColor; opacity:.62;
    }
    [data-ymc-nav-edge][aria-expanded="false"]:is(:hover,:focus-visible)::before { opacity:1; }
    :is([data-ymc-nav-edge="left"],[data-ymc-nav-edge="right"])[aria-expanded="false"] {
      width:16px; height:100px; top:var(--ymc-edge-anchor,50%); translate:0 -50%;
    }
    :is([data-ymc-nav-edge="left"],[data-ymc-nav-edge="right"])[aria-expanded="false"]::before { width:3px; height:34px; }
    [data-ymc-nav-edge="left"][aria-expanded="false"] { left:0; justify-items:start; padding-left:2px; }
    [data-ymc-nav-edge="right"][aria-expanded="false"] { right:var(--ymc-reserved-width); justify-items:end; padding-right:2px; }
    :is([data-ymc-nav-edge="top"],[data-ymc-nav-edge="bottom"])[aria-expanded="false"] {
      width:132px; height:17px; translate:-50% 0;
      left:clamp(66px,var(--ymc-edge-anchor,50%),max(66px,calc(100dvw - var(--ymc-reserved-width) - 66px)));
    }
    :is([data-ymc-nav-edge="top"],[data-ymc-nav-edge="bottom"])[aria-expanded="false"]::before { width:44px; height:3px; }
    [data-ymc-nav-edge="top"][aria-expanded="false"] { top:0; align-items:start; padding-top:2px; }
    [data-ymc-nav-edge="bottom"][aria-expanded="false"] { bottom:0; align-items:end; padding-bottom:2px; }
    @media (prefers-reduced-motion:reduce) {
      [data-ymc-nav-dock], [data-ymc-nav-collapsed] { transition:none; }
    }
  `;

  let navRoot, navLayout, navSlot, navObserver, navToggle, navEdgeToggle, navRevealTimer;
  let navEntries = [], navMarks = new Map(), navMenuKey = '', navView = '';
  function navKey(prefix, value) {
    if (!value) return prefix + ':';
    let hash = 2166136261;
    for (const char of value) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
    return prefix + ':' + (hash >>> 0).toString(36);
  }
  function discoverNav(nav) {
    const nodes = [...nav.querySelectorAll(NAV_ENTRY)];
    // Each pinned tile and route keeps its original node, including its context menu.
    const entries = [];
    for (const node of nodes) {
      if (entries.some(item => item.node.contains(node))) continue;
      const pinned = node.matches('[data-test-id="PIN_ITEM"],[class*="PinItem_root__"]');
      const brand = node.matches('[class*="NavbarDesktop_logoWrapper__"]');
      const control = pinned ? node.querySelector('[class*="Pin_link__"]') || node :
        node.matches('a,button') ? node : node.querySelector('a[href],button') || node;
      const pinTitle = pinned ? node.querySelector('[class*="Pin_title__"]')?.textContent.trim() : '';
      const label = (brand ? 'Логотип Яндекс Музыки' : pinTitle || control?.getAttribute('aria-label') ||
        node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent.trim() ||
        control?.getAttribute('title') || '').slice(0, 100);
      const test = node.dataset.testId;
      const href = control?.getAttribute('href');
      const key = brand ? 'logo' : pinned ? navKey('pin', href || label) : navKey('link', test || href || label);
      if (key.endsWith(':') || entries.some(item => item.key === key)) continue;
      const kind = brand ? 'brand' : pinned ? 'pin' : 'route';
      entries.push({ node, control, kind, key, label: label || (pinned ? 'Закреплённая карточка' : test?.split('ITEM_').at(-1) || 'Раздел') });
    }
    return entries;
  }

  function orderedNav(t, entries = navEntries) {
    const order = navIds(t.sidebarOrder);
    const index = key => { const i = order.indexOf(key); return i < 0 ? 1000 : i; };
    return [...entries].sort((a, b) => index(a.key) - index(b.key));
  }

  function renderNavMenu() {
    if (editorTab !== 'layout' || activeDialog !== 'editor') return;
    const list = $('ymc-sidebar-items');
    const rows = orderedNav(theme);
    const hidden = new Set(navIds(theme.sidebarHidden));
    const key = JSON.stringify([theme.sidebarDock, rows.map(({ key, label }) => [key, label, hidden.has(key)])]);
    if (key === navMenuKey) return;
    navMenuKey = key;
    const focused = shadow.activeElement;
    const refocus = focused?.closest('li')?.dataset.navKey;
    const action = focused?.dataset.navAction;
    const fragment = document.createDocumentFragment();
    for (const [i, { key: id, label }] of rows.entries()) {
      const row = document.createElement('li');
      row.dataset.navKey = id;
      const name = document.createElement('span');
      name.textContent = label;
      row.append(name);
      for (const [command, text, description] of [
        ['visibility', hidden.has(id) ? 'Показать' : 'Скрыть', hidden.has(id) ? 'Показать' : 'Скрыть'],
        ['up', '↑', 'Переместить выше'], ['down', '↓', 'Переместить ниже']
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn';
        button.textContent = text;
        button.setAttribute('aria-label', description + ': ' + label);
        button.dataset.navAction = command;
        button.disabled = command === 'up' && !i || command === 'down' && i === rows.length - 1;
        row.append(button);
      }
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    const status = theme.sidebarDock === 'native' ? 'В штатном режиме разделы и закреплённое сохраняют свои группы.' :
      'Профиль и кнопка Customizer остаются доступны.';
    setText($('ymc-sidebar-status'), rows.length ? status : 'Пункты появятся, когда клиент загрузит панель.');
    if (refocus) [...list.children].find(el => el.dataset.navKey === refocus)
      ?.querySelector('[data-nav-action="' + action + '"]:not(:disabled)')?.focus({ preventScroll: true });
  }

  function markNav(next, node, name, value = '') {
    if (!node) return;
    let properties = next.get(node);
    if (!properties) next.set(node, properties = new Map());
    properties.set(name, String(value));
  }

  function syncNavMarks(next) {
    for (const [node, properties] of navMarks) {
      for (const [name, oldValue] of properties) {
        if (next.get(node)?.has(name)) continue;
        if (name.startsWith('--')) node.style.removeProperty(name);
        else if (node.getAttribute(name) === oldValue) node.removeAttribute(name);
      }
    }
    for (const [node, properties] of next) {
      for (const [name, value] of properties) {
        if (name.startsWith('--')) {
          if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
        } else if (node.getAttribute(name) !== value) node.setAttribute(name, value);
      }
    }
    navMarks = next;
  }

  function navCell(nav, entry) {
    if (entry.kind !== 'route') return entry.node;
    const row = entry.node.closest('li');
    return row && nav.contains(row) ? row : entry.node;
  }

  function planDockCell(next, nav, cell, kind, order) {
    if (!cell) return;
    markNav(next, cell, 'data-ymc-nav-cell', kind);
    markNav(next, cell, '--ymc-nav-order', order);
    for (let parent = cell.parentElement; parent && parent !== nav; parent = parent.parentElement) {
      markNav(next, parent, 'data-ymc-nav-path');
    }
  }

  function planDockBrand(next, link) {
    if (!link) return;
    markNav(next, link, 'data-ymc-nav-brand-link');
    const full = link.querySelector('svg:has(use[*|href*="#musicLogoLeft"],use[*|href*="#musicLogoRight"])');
    const mark = link.querySelector('svg:has(use[*|href$="#musicLogo"])');
    if (!full || !mark) return;
    for (const [part, name] of [[full, 'full'], [mark, 'mark']]) {
      // Yandex layers a full wordmark and a compact mark in the same native logo.
      const wrapper = part.parentElement;
      markNav(next, wrapper !== link && wrapper.children.length === 1 ? wrapper : part, 'data-ymc-nav-brand-part', name);
    }
  }

  function planDockAction(next, action, kind, label) {
    if (!action) return;
    const children = [...action.children];
    const symbol = kind === 'pin' ? action.querySelector('[class*="Pin_cover__"],[data-test-id="PIN_COVER"]') ||
      children.find(child => child.matches('img')) :
      children.find(child => child.matches('svg,img') || child.querySelector('svg,img'));
    markNav(next, action, 'data-ymc-nav-action');
    markNav(next, action, 'data-ymc-nav-caption', label);
    markNav(next, symbol, 'data-ymc-nav-symbol');
    const labels = kind === 'pin' ? [...action.querySelectorAll('[class*="Pin_meta__"]')] :
      children.filter(child => child !== symbol && child.textContent.trim());
    for (const node of labels) markNav(next, node, 'data-ymc-nav-native-label');
    for (const name of ['aria-label', 'title']) {
      const existing = action.getAttribute(name);
      if (!existing || navMarks.get(action)?.get(name) === existing) markNav(next, action, name, label);
    }
  }

  function decorateNav(nav, profile, { available, move, edit, collapsed }) {
    const next = new Map();
    if (available && (move || theme.sidebarIconSize !== DEFAULT.sidebarIconSize)) {
      markNav(next, nav, '--ymc-nav-icon-size', theme.sidebarIconSize + 'px');
      if (!move) markNav(next, nav, 'data-ymc-nav-sized');
    }
    if (edit) {
      const hidden = new Set(navIds(theme.sidebarHidden));
      const entries = orderedNav(theme);
      for (const [index, entry] of entries.entries()) {
        const cell = navCell(nav, entry);
        if (hidden.has(entry.key)) markNav(next, cell, 'data-ymc-nav-hide');
        if (move) {
          planDockCell(next, nav, cell, entry.kind, index);
          if (entry.kind === 'brand') planDockBrand(next, entry.control);
          else planDockAction(next, entry.control, entry.kind, entry.label);
        } else if (theme.sidebarOrder) {
          // Keep the native route and pinned groups. CSS order works within each group.
          markNav(next, cell, 'data-ymc-native-nav-order');
          markNav(next, cell, '--ymc-nav-order', index);
        }
      }
      if (move) {
        const shown = entries.filter(entry => !hidden.has(entry.key));
        const brand = shown.some(entry => entry.kind === 'brand');
        const columns = shown.length - Number(brand) + 2;
        const { sidebarSize, sidebarCompact, sidebarGap, sidebarInset, sidebarIconSize } = theme;
        const width = sidebarCompact ? Math.max(50, sidebarSize, sidebarIconSize + 28) : Math.max(118, sidebarSize + 44);
        markNav(next, nav, '--ymc-nav-inset', sidebarInset + 'px');
        markNav(next, nav, '--ymc-nav-width', width + 'px');
        markNav(next, nav, '--ymc-nav-depth', sidebarSize + 'px');
        markNav(next, nav, '--ymc-nav-gap', sidebarGap + 'px');
        markNav(next, nav, '--ymc-nav-brand-width', brand ? '114px' : '0px');
        markNav(next, nav, '--ymc-nav-profile-width', profile ? Math.max(58, sidebarIconSize + 24) + 'px' : '0px');
        markNav(next, nav, '--ymc-nav-gaps', shown.length + 2 + Number(Boolean(profile)));
        markNav(next, nav, '--ymc-nav-item-count', columns);
        planDockCell(next, nav, launcher, 'customizer', entries.length);
        planDockAction(next, launcher, 'route', 'Customizer');
        planDockCell(next, nav, navToggle, 'labels', entries.length + 1);
        markNav(next, navToggle, 'data-ymc-nav-action');
        markNav(next, navToggle, 'data-ymc-nav-caption', 'Подписи');
        markNav(next, navToggle.firstElementChild, 'data-ymc-nav-symbol');
        planDockCell(next, nav, profile, 'profile', entries.length + 2);
        if (!collapsed) planDockCell(next, nav, navEdgeToggle, 'fold', entries.length + 3);
      }
    }
    syncNavMarks(next);
  }

  const horizontalDock = dock => dock === 'top' || dock === 'bottom';
  let collapsedNav, wasNavInert;

  function setNavCollapsed(nav, edge) {
    if (collapsedNav && collapsedNav !== nav) {
      collapsedNav.removeAttribute('data-ymc-nav-collapsed');
      collapsedNav.inert = wasNavInert;
      collapsedNav = null;
    }
    if (!nav) return;
    if (!collapsedNav) {
      collapsedNav = nav;
      wasNavInert = nav.inert;
      nav.inert = true;
    }
    if (nav.dataset.ymcNavCollapsed !== edge) nav.dataset.ymcNavCollapsed = edge;
  }

  function syncDockGeometry() {
    if (!navRoot || !navEdgeToggle?.isConnected) return;
    const dock = navRoot.dataset.ymcNavDock;
    const rect = navRoot.getBoundingClientRect();
    const collapsed = navRoot.hasAttribute('data-ymc-nav-collapsed');
    const { sidebarInset } = theme;
    if (horizontalDock(dock)) {
      navLayout?.style.setProperty('--ymc-nav-safe-top', Math.max(32, sidebarInset) + 'px');
      navLayout?.style.setProperty('--ymc-nav-reserve', collapsed ? '0px' : Math.ceil(rect.height + 6) + 'px');
    } else if (dock) {
      navLayout?.style.setProperty('--ymc-nav-reserve', collapsed ? '0px' : Math.ceil(rect.width + sidebarInset * 2) + 'px');
    }
    if (navEdgeToggle.parentElement === navRoot) return;
    const profile = navRoot.querySelector(NAV_AVATAR) || navRoot.querySelector(SELECTOR.profile);
    const avatar = profile?.getBoundingClientRect();
    const align = theme.sidebarAlign;
    const fraction = align === 'start' ? .18 : align === 'end' ? .82 : .5;
    const anchor = horizontalDock(dock) ? rect.left + rect.width * fraction :
      Math.min(innerHeight - (collapsed ? 52 : 14), Math.max(collapsed ? 52 : 14,
        avatar?.height ? avatar.y + avatar.height / 2 : rect.bottom - 24));
    navEdgeToggle.style.setProperty('--ymc-edge-anchor', Math.round(anchor) + 'px');
    if (!dock && !collapsed) navEdgeToggle.style.setProperty('--ymc-edge-offset', Math.ceil(rect.right + 3) + 'px');
    else navEdgeToggle.style.removeProperty('--ymc-edge-offset');
  }

  function scrollDock(event) {
    const dock = event.currentTarget;
    if (!horizontalDock(dock.dataset.ymcNavDock) || dock.scrollWidth <= dock.clientWidth ||
        event.ctrlKey || event.metaKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    event.preventDefault();
    dock.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? dock.clientWidth : 1);
  }

  function desktopNavbar() {
    const nodes = [...document.querySelectorAll(SELECTOR.navbar)];
    return nodes.find(node => node.getClientRects().length) || nodes[0];
  }

  function syncSidebar(nav, fullscreen) {
    const profile = nav?.querySelector(SELECTOR.profile);
    const available = Boolean(isStyled() && !fullscreen && nav && (theme.sidebarDock !== 'native' || nav.getClientRects().length));
    const move = available && theme.sidebarDock !== 'native';
    const collapsed = available && theme.sidebarCollapsed;
    const edit = available && Boolean(move || theme.sidebarOrder || theme.sidebarHidden);
    const edge = move ? theme.sidebarDock : 'left';
    const layout = move || collapsed ? nav.closest(SELECTOR.layout) : null;
    const slot = move || collapsed ? nav.closest(NAV_SLOT) : null;
    if (!collapsed) clearTimeout(navRevealTimer);
    if (navRoot !== nav) {
      navRoot?.removeAttribute('data-ymc-nav-dock');
      navRoot?.removeAttribute('data-ymc-nav-align');
      navRoot?.removeAttribute('data-ymc-nav-compact');
      navRoot?.removeEventListener('wheel', scrollDock);
      navObserver?.disconnect();
      navRoot = nav;
      navView = '';
      if (navRoot) {
        navObserver ||= new ResizeObserver(syncDockGeometry);
        navObserver.observe(navRoot);
        navRoot.addEventListener('wheel', scrollDock, { passive: false });
      }
    }
    if (navLayout !== layout) {
      navLayout?.removeAttribute('data-ymc-nav-layout');
      navLayout?.style.removeProperty('--ymc-nav-reserve');
      navLayout?.style.removeProperty('--ymc-nav-safe-top');
    }
    if (navSlot !== slot) navSlot?.removeAttribute('data-ymc-nav-slot');
    navLayout = layout;
    navSlot = slot;
    if (slot && !slot.hasAttribute('data-ymc-nav-slot')) slot.setAttribute('data-ymc-nav-slot', '');
    setNavCollapsed(collapsed ? nav : null, edge);

    if (launcher.hidden !== fullscreen) launcher.hidden = fullscreen;
    if (move && launcher.parentElement !== nav) nav.append(launcher);
    else if (!move && profile && launcher.nextElementSibling !== profile) profile.before(launcher);
    else if (!move && !profile) launcher.remove();

    if (available) {
      const destination = move && !collapsed ? nav : document.body;
      if (navEdgeToggle.parentElement !== destination) destination.append(navEdgeToggle);
      navEdgeToggle.dataset.ymcNavEdge = edge;
      navEdgeToggle.setAttribute('aria-expanded', String(!collapsed));
      navEdgeToggle.toggleAttribute('data-edge-hint', theme.sidebarEdgeHint);
      navEdgeToggle.title = collapsed ? 'Развернуть панель навигации' : 'Свернуть панель навигации';
      navEdgeToggle.setAttribute('aria-label', navEdgeToggle.title);
      if (layout) layout.dataset.ymcNavLayout = move ? edge : 'native-collapsed';
    } else navEdgeToggle.remove();

    if (move) {
      nav.dataset.ymcNavDock = theme.sidebarDock;
      nav.dataset.ymcNavAlign = theme.sidebarAlign;
      nav.toggleAttribute('data-ymc-nav-compact', theme.sidebarCompact);
      if (navToggle.parentElement !== nav) nav.append(navToggle);
      navToggle.setAttribute('aria-expanded', String(!theme.sidebarCompact));
      navToggle.title = theme.sidebarCompact ? 'Показать подписи' : 'Скрыть подписи';
      navToggle.setAttribute('aria-label', navToggle.title);
    } else {
      navToggle.remove();
      nav?.removeAttribute('data-ymc-nav-dock');
      nav?.removeAttribute('data-ymc-nav-align');
      nav?.removeAttribute('data-ymc-nav-compact');
    }

    navEntries = nav && (edit || editorTab === 'layout' && activeDialog === 'editor') ? discoverNav(nav) : [];
    decorateNav(nav, profile, { available, move, edit, collapsed });
    const view = move ? [theme.sidebarDock, theme.sidebarAlign, theme.sidebarCompact].join('/') : '';
    if (view !== navView) {
      navView = view;
      if (nav) {
        nav.scrollLeft = 0;
        nav.scrollTop = 0;
      }
    }
    syncDockGeometry();
    renderNavMenu();
  }

  function makeStyles(t, cover = '', portraitBackground = '', paint = literal) {
    if (!t.enabled) return '';
    const gradient = () => `linear-gradient(${t.gradientAngle}deg,${paint(t.background)},${paint(t.gradientEnd)})`;
    const image = t.mode === 'image' ? t.wallpaper : t.mode === 'cover' ? cover : '';
    const tint = image ? paint(rgba(t.background, t.backgroundDim)) : '';
    const backdrop = image ? `linear-gradient(${tint},${tint}),${assetPaint(image, paint)},${gradient()}`
      : t.mode === 'solid' ? 'none' : gradient();
    const surface = hex => `background-color:${paint(rgba(hex, t.panelOpacity))} !important;
      backdrop-filter:${t.panelOpacity ? `blur(${t.blur}px)` : 'none'} !important; border-radius:${t.round}px !important;`;
    const separate = t.separateSurfaces || smartOn(t, 'smartPanels');
    const player = separate ? t.player : t.panel;
    const sidebar = separate ? t.sidebar : t.panel;
    const useCustomizerPalette = !(t.addonEnabled && t.addonPalette);
    const replacement = t.likedCustom ? likedMask(t) : '';
    const portraitColor = portraitEffectColor(t, portraitBackground);
    const portrait = portraitFilter(t, portraitColor);
    const portraitRule = portrait === 'none' ? 'none' : paint(portrait);
    const beatPortrait = hasBeatAura(t) && t.portraitEffect !== 'bloom';
    const pulsePortrait = t.motionEnabled && t.motionAura && hasPortraitAura(t) && t.portraitEffect !== 'bloom' && !beatPortrait;
    const hiddenElements = [
      [t.showVibePortrait, PORTRAIT], [t.showVibeArtist, SELECTOR.vibeArtist], [t.showVibeHeading, SELECTOR.vibeHeading],
      [t.showCornerAppVersion, SELECTOR.cornerVersion], [t.showCornerLoaderVersion, SELECTOR.cornerLoader],
      [t.showCornerAudioFormat, SELECTOR.cornerFormat]
    ].filter(([visible]) => !visible).map(([, selector]) => selector).join(', ');
    const originalImageColors = t.likedShape === 'image' && !t.likedTintImage;
    const moveBackground = t.motionEnabled && t.motionBackground && t.mode === 'gradient';
    const minimum = t.contrastGuard ? t.contrastLevel / 10 : 0;
    const smartText = smartOn(t, 'smartText');
    const textMinimum = smartText && smartLightWave(t) ? Math.max(minimum, 5.5) : minimum;
    const bodySurfaces = t.mode === 'solid' ? [t.background] : [t.background, t.gradientEnd];
    const textInk = (ink, surfaces) => smartText
      ? tintedInk(ink, surfaces, textMinimum)
      : guardedInk(t, ink, surfaces[0]);
    const bodyText = textInk(t.text, bodySurfaces);
    const bodySecondary = textInk(t.textSecondary, bodySurfaces);
    const panelText = textInk(t.text, [panelFill(t, sidebar)]);
    const panelSecondary = textInk(t.textSecondary, [panelFill(t, sidebar)]);
    const playerText = textInk(t.text, [panelFill(t, player)]);
    const playerSecondary = textInk(t.textSecondary, [panelFill(t, player)]);
    const smartButtons = smartOn(t, 'smartButtons');
    const buttonInk = (ink, surface) => smartButtons ? tintedInk(ink, [surface], minimum) : guardedInk(t, ink, surface);
    const styleVibeButtons = t.customVibeButtons || smartButtons;
    const chosenIcon = t.customVibeIcons || smartButtons ? t.vibeIcon : bodyText;
    const vibeInk = buttonInk(chosenIcon,
      styleVibeButtons ? blendedFill(t.vibeFill, t.vibeControlsOpacity, t.background) : t.background);
    const playSurface = styleVibeButtons ? blendedFill(t.vibePlayFill, t.vibeControlsOpacity, t.background) : t.accent;
    const playInk = styleVibeButtons ? buttonInk(t.customVibeIcons && !smartButtons ? t.vibeTransport : chosenIcon, playSurface)
      : textInk(t.customVibeIcons ? t.vibeTransport : chosenIcon, bodySurfaces);
    const textTokens = (ink, subtext) => {
      const primary = paint(ink), secondary = paint(subtext);
      return `
      --ym-controls-color-primary-text-enabled:${primary} !important;
      --ym-controls-color-primary-text-enabled_variant:${primary} !important;
      --ym-controls-color-secondary-text-enabled:${secondary} !important;
      --ym-controls-color-secondary-text-enabled_variant:${secondary} !important;
      --ym-controls-color-secondary-text-hovered:${primary} !important;
      `;
    };
    const painting = useCustomizerPalette ? `
      ${scoped('body, .ym-dark-theme, .ym-light-theme')} {
        --ym-controls-color-primary-default-enabled:${paint(t.accent)} !important;
        --ym-controls-color-primary-default-hovered:${paint(t.customAccentStates || smartOn(t, 'smartAccent') ? t.accentHover : t.accent)} !important;
        --ym-controls-color-primary-default-pressed:${paint(t.customAccentStates || smartOn(t, 'smartAccent') ? t.accentPress : t.accent)} !important;
        --ym-controls-color-primary-outline-selected_stroke:${paint(t.accent)} !important;
        --ym-logo-color-primary-variant:${paint(t.accent)} !important;
        --ym-logo-color-primary-player:${paint(t.accent)} !important;
        ${textTokens(bodyText, bodySecondary)}
        ${smartButtons ? `
          --ym-controls-color-primary-on_default-enabled:${paint(buttonInk(t.vibeTransport, t.accent))} !important;
          --ym-controls-color-secondary-default-enabled:${paint(rgba(t.vibeFill, 88))} !important;
          --ym-controls-color-secondary-default-hovered:${paint(rgba(t.vibeHover, 94))} !important;
          --ym-controls-color-secondary-on_default-enabled:${paint(vibeInk)} !important;
        ` : ''}
        --ym-background-color-primary-enabled-content:transparent !important;
        --ym-background-color-primary-enabled-basic:transparent !important;
        --ym-background-color-primary-enabled-vibe:transparent !important;
        --ym-background-color-primary-enabled-player:${paint(rgba(player, t.panelOpacity))} !important;
        --ym-background-color-primary-enabled-popover:${paint(t.panel)} !important;
        --ym-background-color-primary-enabled-menu:${paint(t.panel)} !important;
      }
      ${scoped('body')} {
        color:${paint(bodyText)};
        background-color:${paint(t.background)} !important;
        background-image:${backdrop} !important;
        background-position:${image ? `center,${t.mediaX}% ${t.mediaY}%,center` : 'center'}${moveBackground ? '' : ' !important'};
        background-size:${image ? `cover,${t.mediaFit},cover` : moveBackground ? '152% 152%' : 'cover'} !important;
        background-repeat:no-repeat !important;
        background-attachment:fixed !important;
        ${FONTS[t.font] ? `font-family:${FONTS[t.font]} !important;` : ''}
      }
      ${scoped(SELECTOR.surface + ', [class*="VibePage_root__"]')} { background:transparent !important; }
      ${smartText ? `
        ${scoped(SELECTOR.vibeTrack)} { --accent-color:${paint(bodyText)} !important; color:${paint(bodyText)} !important; }
      ` : ''}
      ${scoped(SELECTOR.sidebar)} { ${surface(sidebar)}
        ${textTokens(panelText, panelSecondary)}
        ${t.separateSurfaces && t.sidebarGradient ? `background:linear-gradient(${t.sidebarAngle}deg,${paint(rgba(sidebar,t.panelOpacity))},${paint(rgba(t.sidebarEnd,t.panelOpacity))}) !important;` : ''}
      }
      ${scoped(SELECTOR.player)} { ${surface(player)}
        ${textTokens(playerText, playerSecondary)}
      }
      ${scoped(SELECTOR.cards)} { border-radius:${t.cardRound}px !important; }
      ${FONTS[t.font] ? `${scoped('button, input, textarea, select')} { font-family:${FONTS[t.font]} !important; }` : ''}
    ` : '';
    return `
      ${pulsePortrait ? '@property --ymc-aura-pulse { syntax:"<percentage>"; inherits:false; initial-value:0%; }' : ''}
      ${painting}
      ${t.sidebarEdgeCustom ? `${scoped('[data-ymc-nav-edge]')} { --ymc-edge-color:${paint(t.sidebarEdgeColor)}; }` : ''}
      ${t.panelOpacity === 0 ? `${scoped('[class*="DefaultLayout_navbar__"], ' + SELECTOR.sidebar)} {
        background:transparent !important; backdrop-filter:none !important; box-shadow:none !important;
      }` : ''}
      ${useCustomizerPalette ? `
        ${scoped(SELECTOR.vibeText)} { color:${paint(bodyText)} !important; }
        ${scoped('[data-test-id="RESET_VIBE_CONTEXT_STATIC_TEXT"], [class*="VibePage_context__"], [data-test-id="VIBE_PAGE_CONTEXT_MENU_BUTTON"]')} { color:${paint(bodySecondary)} !important; }
        ${scoped(SELECTOR.barText)} { color:${paint(playerText)} !important; }
        ${scoped(`${SELECTOR.player} ${SELECTOR.barArtist}, ${SELECTOR.player} ${SELECTOR.barArtist} a`)} { color:${paint(playerSecondary)} !important; }
        ${smartText && (image || t.appMediaEnabled) ? `
          ${scoped(SELECTOR.vibeText)} { text-shadow:0 1px 4px ${paint(rgba(readableText(bodyText, bodyText), 65))}; }
        ` : ''}
      ` : ''}
      ${!t.aiTrackCards ? `${scoped(SELECTOR.vibeAi)} { display:none !important; }` : ''}
      ${hiddenElements ? `${scoped(hiddenElements)} { display:none !important; }` : ''}
      ${!t.showVibeWheel ? `${scoped(SELECTOR.vibeWheel)} { display:none !important; }` : ''}
      ${t.showVibeWheel && t.vibeWheelOpacity < 100 ? `${scoped(SELECTOR.vibeWheel)} { opacity:${t.vibeWheelOpacity / 100} !important; }` : ''}
      ${t.aiTrackCards && t.vibeAiOpacity < 100 ? `${scoped(SELECTOR.vibeAi)} { opacity:${t.vibeAiOpacity / 100} !important; }` : ''}
      ${portrait !== 'none' ? `${scoped(SELECTOR.portrait)} { filter:${portraitRule} !important; }` : ''}
      @media (prefers-reduced-motion:no-preference) {
        ${beatPortrait ? `
          ${scoped(SELECTOR.portrait)} {
            filter:${portraitRule} drop-shadow(0 0 calc(${Math.max(4, t.portraitSpread * .65)}px + var(--ymc-beat-spread,0px))
              color-mix(in srgb,${paint(portraitColor)} var(--ymc-beat-pulse,0%),transparent)) !important;
          }
        ` : ''}
        ${t.motionEnabled ? `
          ${scoped('body, .ym-dark-theme, .ym-light-theme')} { --ym-duration-transition:${t.motionDuration}ms !important; }
          ${scoped(SELECTOR.navigation + ', ' + SELECTOR.player + ' button, ' + SELECTOR.vibe + ' button, ' + SELECTOR.playlistPlay)} {
            transition-timing-function:${motionCurve(t.motionCurve)} !important;
          }
          ${t.motionCards ? `
            ${scoped(SELECTOR.cards)} { transition:translate ${t.motionDuration}ms ${motionCurve(t.motionCurve)}, scale ${t.motionDuration}ms ${motionCurve(t.motionCurve)} !important; }
            ${scoped(SELECTOR.cards.split(', ').map(s => s + ':hover').join(', '))} {
              translate:0 -${t.motionCardLift}px !important; scale:${t.motionCardScale / 100} !important;
            }
          ` : ''}
          ${pulsePortrait ? `
            @keyframes ymc-portrait-breathe{from{--ymc-aura-pulse:0%}to{--ymc-aura-pulse:${Math.round(t.portraitIntensity * .5)}%}}
            ${scoped(SELECTOR.portrait)} {
              filter:${portraitRule} drop-shadow(0 0 ${t.portraitSpread / 3}px color-mix(in srgb,${paint(portraitColor)} var(--ymc-aura-pulse),transparent)) !important;
              animation:ymc-portrait-breathe ${t.motionAuraSpeed}ms ease-in-out infinite alternate !important;
            }
          ` : ''}
          ${moveBackground ? `
            @keyframes ymc-background-drift{from{background-position:13% 25%}to{background-position:87% 75%}}
            ${scoped('body')} { animation:ymc-background-drift ${t.motionBackgroundSpeed}s ease-in-out infinite alternate !important; }
          ` : ''}
        ` : ''}
        ${t.likedCustom && t.likedMotion !== 'off' ? `
          @keyframes ymc-heart-pulse{0%,54%,100%{transform:scale(1)}18%{transform:scale(1.16)}}
          @keyframes ymc-heart-sparkle{0%,100%{filter:brightness(1)}50%{filter:brightness(1.55)}}
          ${scoped(SELECTOR.liked)} { animation:ymc-heart-${t.likedMotion} ${t.likedMotionSpeed}ms ease-in-out infinite !important; }
        ` : ''}
      }
      ${navigationStyles(t, paint)}
      ${t.glowIntensity ? `
        ${scoped(SELECTOR.playlistPlay + ', ' + SELECTOR.navigation + ':hover, ' + SELECTOR.vibe + ' ' + VIBE_PLAY + ', ' + SELECTOR.player + ' ' + VIBE_PLAY)} {
          box-shadow:0 0 ${Math.round(t.glowIntensity * .24)}px ${paint(rgba(t.accent, t.glowIntensity * .66))} !important;
        }
      ` : ''}
      ${visibilityRules(':is([data-test-id="VIBE_PLAYERBAR"],[class*="VibePlayerControls_root__"])', VIBE_VISIBILITY, t)}
      ${visibilityRules(SELECTOR.player, BAR_VISIBILITY, t)}
      ${t.barButtonsCustom || smartButtons ? buttonRules(`${SELECTOR.player} button:not([data-ymc-launcher])`, {
        fill: t.barButtonFill, ink: buttonInk(t.barButtonText, blendedFill(t.barButtonFill, t.barButtonOpacity, panelFill(t, player))),
        hover: t.barButtonHover, opacity: t.barButtonOpacity, radius: t.barButtonsCustom ? t.barButtonRound : null,
        behind: panelFill(t, player), minimum, tonal: smartButtons
      }, paint) : ''}
      ${waveStyles(t, paint)}
      ${playlistStyles(t, useCustomizerPalette, paint)}
      ${t.playlistButtons && useCustomizerPalette ? `
        ${scoped(SELECTOR.hoverButtons)} {
          background-color:${paint(rgba(t.panel, Math.max(65,t.panelOpacity)))} !important;
          color:${paint(readableText(t.text, t.panel))} !important;
        }
        ${scoped(`${SELECTOR.hoverButtons.split(', ').map(s => s + ':hover').join(', ')}`)} {
          background-color:${paint(t.accent)} !important;
          color:${paint(readableText(t.background,t.accent))} !important;
        }
      ` : ''}
      ${t.likedCustom || t.coverColors && t.smartHeart && t.smartHeartAmount && t.smartStrength ? `${scoped(SELECTOR.liked)} {
        color:${paint(t.likedColor)} !important; fill:${paint(t.likedColor)} !important;
        ${t.likedOpacity < 100 ? `opacity:${t.likedOpacity / 100} !important;` : ''}
        ${t.likedScale !== 100 ? `scale:${t.likedScale / 100} !important;` : ''}
        ${replacement ? originalImageColors
          ? `background:${assetPaint(replacement, paint)} center / contain no-repeat !important;`
          : `background:${paint(t.likedColor)} !important; mask:${assetPaint(replacement, paint)} center / contain no-repeat;` : ''}
      }
      ${replacement ? `${scoped(SELECTOR.liked)} use { opacity:0 !important; }` : ''}` : ''}
      ${t.manualScale ? `${ACTIVE} {
        --html-font-size:${t.scale * 16 / 100}px !important;
        font-size:var(--html-font-size) !important;
        ${SCALE_TOKENS}
      }` : ''}
      ${t.vibeCoverOpacity < 100 ? `${scoped('[class*="VibePage_albumCover__"]:not([class*="VibePage_albumCover_hidden__"])')} {
        opacity:${t.vibeCoverOpacity / 100};
      }` : ''}
      ${!t.vibeAnimation ? `${scoped(SELECTOR.vibeAnimation)} { visibility:hidden !important; }` : ''}
      ${t.vibeTrackOpacity < 100 ? `
        ${scoped(SELECTOR.vibeTrack)} { background-color:${paint(rgba(t.panel, .08 * t.vibeTrackOpacity))} !important; }
        ${scoped(SELECTOR.vibeTrack)}::before { background:${paint(rgba(t.accent, .1 * t.vibeTrackOpacity))} !important; }
      ` : ''}
      ${t.vibeControlsOpacity < 100 ? `
        ${scoped(`${SELECTOR.vibe} ${SELECTOR.vibeButtons}`)} { background-color:${paint(rgba(t.panel, .08 * t.vibeControlsOpacity))} !important; }
        ${scoped(SELECTOR.vibePlay)}, ${scoped(`${SELECTOR.vibeButtons}[class*="VibePlayerBar_button_play__"]`)} {
          background-color:color-mix(in srgb,var(--ym-logo-color-primary-player,${paint(t.accent)}) ${t.vibeControlsOpacity}%,transparent) !important;
          ${t.vibeControlsOpacity < 50 && !t.customVibeIcons ? `color:${paint(t.text)} !important;` : ''}
        }
      ` : ''}
      ${styleVibeButtons ? `
        ${buttonRules(`:is(${SELECTOR.vibe} ${SELECTOR.vibeButtons},${SELECTOR.vibeControls} button):not(${VIBE_PLAY})`, {
          fill: t.vibeFill, ink: vibeInk, hover: t.vibeHover, opacity: t.vibeControlsOpacity,
          radius: t.customVibeButtons ? t.vibeButtonRound : null, behind: t.background, minimum, tonal: smartButtons
        }, paint)}
        ${buttonRules(`:is(${SELECTOR.vibe},${SELECTOR.vibeControls}) ${VIBE_PLAY}`, {
          fill: t.vibePlayFill, ink: playInk, hover: t.vibeHover, opacity: t.vibeControlsOpacity,
          radius: t.customVibeButtons ? t.vibeButtonRound : null, behind: t.background, minimum, tonal: smartButtons
        }, paint)}
      ` : ''}
      ${useCustomizerPalette || t.customVibeIcons || styleVibeButtons || smartText ? waveButtonInk(t, paint, vibeInk, playInk) : ''}
      ${scoped('[class*="VibePage_bigCardPanel_opened__"] [class*="VibePage_vibeAnimation__"]')} { opacity:0 !important; }
      ${t.hideVibeTrack ? `${scoped(SELECTOR.vibeTrack)} { visibility:hidden !important; pointer-events:none !important; }` : ''}
      ${t.hideVibeControls ? `${scoped(`${SELECTOR.vibe} ${SELECTOR.vibeButtons}, ${SELECTOR.vibeControls}`)} {
        visibility:hidden !important; pointer-events:none !important;
      }` : ''}
      ${t.barCustom ? `
        ${scoped(SELECTOR.player)}:has(> [data-ymc-bar-backdrop]) {
          background:none !important; backdrop-filter:none !important;
        }
        ${scoped(SELECTOR.player)} > [data-ymc-bar-backdrop]::before {
          background-color:${paint(player)};
          ${t.barWallpaper ? `background-image:${assetPaint(t.barWallpaper, paint)};` : ''}
          background-size:${t.barFit}; background-position:${t.barImagePosition};
          opacity:${t.barOpacity / 100};
        }
        ${t.barOpacity === 0 ? `${scoped('[class*="PlayerBarDesktopWithBackgroundProgressBar_player__"]')} {
          border-color:transparent !important;
        }
        ${scoped('[class*="PlayerBarDesktopWithBackgroundProgressBar_progressBar__"], [class*="BarBelow_root__"]')} {
          background:transparent !important; backdrop-filter:none !important;
        }
        ${scoped('[class*="PlayerBarDesktopWithBackgroundProgressBar_player__"]')}::before {
          background:transparent !important; box-shadow:none !important; backdrop-filter:none !important;
        }` : ''}
      ` : ''}
      ${barLayoutStyles(t)}
      ${t.widePlayer ? `${ACTIVE} [data-ymc-wide] { grid-template-areas:var(--ymc-wide-areas) !important; }` : ''}
    `;
  }

  function artworkUrl(value) {
    if (typeof value !== 'string' || !value) return '';
    if (isDataImage(value)) return value;
    try {
      const url = new URL(value, location.href);
      if (url.protocol === 'https:' && !url.username && !url.password &&
        /(^|\.)(yandex\.(net|ru|com)|yastatic\.net)$/.test(url.hostname)) return url.href;
      if (url.protocol === 'blob:' && (
        url.origin !== 'null' && url.origin === location.origin ||
        location.protocol === 'music-application:' && location.host === 'desktop' &&
          url.href.startsWith('blob:music-application://desktop/')
      )) return url.href;
    } catch { /* Unknown cover sources use the configured gradient. */ }
    return '';
  }

  function expandGrid(areas) {
    const rows = [...areas.matchAll(/"([^"]+)"/g)].map(match => match[1].trim().split(/\s+/));
    if (!rows.length || rows.some(row => row.length !== 2)) return '';
    const playerRows = rows.filter(row => row.includes('playerbar'));
    if (playerRows.length !== 1 || playerRows[0][1] !== 'playerbar' ||
      !['navbar', '.'].includes(playerRows[0][0])) return '';
    // A navbar spanning this row can be shortened only if it remains present above it.
    if (playerRows[0][0] === 'navbar' && !rows.some(row => row !== playerRows[0] && row[0] === 'navbar')) return '';
    playerRows[0][0] = 'playerbar';
    return rows.map(row => `"${row.join(' ')}"`).join(' ');
  }

  function nativePlayer() {
    const candidates = [...document.querySelectorAll(`${SELECTOR.player}, ${SELECTOR.vibe}`)]
      .filter(node => node.getClientRects().length && getComputedStyle(node).visibility === 'visible');
    return candidates.find(node => node.matches(SELECTOR.vibe)) || candidates[0] || null;
  }

  function nativeButton(player, action) {
    if (!player) return null;
    for (const id of PLAYER_ACTIONS[action]) {
      const node = player.querySelector(testId(id));
      if (node instanceof HTMLElement && !node.matches(':disabled,[aria-disabled="true"]') &&
        node.getClientRects().length && getComputedStyle(node).visibility === 'visible') return node;
    }
    return null;
  }

  function nativeRange(player) {
    const input = player?.querySelector(SELECTOR.progress);
    return input && !input.disabled && input.getClientRects().length ? input : null;
  }

  function isTrackCardRequest(input) {
    try {
      const url = new URL(input?.url ?? input, location.href);
      return (url.origin === location.origin || /(^|\.)yandex\.(ru|net|com)$/i.test(url.hostname)) &&
        /(?:^|\/)words\/(?:cards(?:\/feedback)?|big-cards)\/?$/.test(url.pathname);
    } catch {
      return false;
    }
  }

  const pendingTrackCards = new Set();
  function blockDisabledTrackCards() {
    const nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      if (!isTrackCardRequest(input)) return Reflect.apply(nativeFetch, this, arguments);
      if (isStyled() && !theme.aiTrackCards) {
        return Promise.reject(new DOMException('AI-подсказки отключены в Customizer.', 'AbortError'));
      }
      const controller = new AbortController();
      const sourceSignal = init?.signal ?? input?.signal;
      const signal = sourceSignal ? AbortSignal.any([sourceSignal, controller.signal]) : controller.signal;
      pendingTrackCards.add(controller);
      return nativeFetch.call(this, input, { ...init, signal }).finally(() => pendingTrackCards.delete(controller));
    };
  }

  const recentAudio = new Set();
  const playerAudioNodes = new WeakMap();
  const audioEvents = ['playing', 'loadeddata', 'emptied', 'pause', 'ended', 'volumechange'];
  let audioRefreshFrame;

  function wakeAudio() {
    if (!shadow || audioRefreshFrame !== undefined || document.hidden) return;
    audioRefreshFrame = requestAnimationFrame(() => {
      audioRefreshFrame = undefined;
      spectrumCheckAt = 0;
      refresh();
    });
  }

  function rememberAudio(media) {
    if (recentAudio.delete(media)) {
      recentAudio.add(media);
      return;
    }
    recentAudio.add(media);
    for (const event of audioEvents) media.addEventListener(event, wakeAudio);
    if (recentAudio.size > 12) {
      const oldest = recentAudio.values().next().value;
      recentAudio.delete(oldest);
      for (const event of audioEvents) oldest.removeEventListener(event, wakeAudio);
    }
  }

  function observeAudioPlayback() {
    // The desktop player also calls play() on audio elements outside the DOM.
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      const result = Reflect.apply(nativePlay, this, args);
      if (this instanceof HTMLAudioElement) {
        rememberAudio(this);
        wakeAudio();
      }
      return result;
    };
    const audioPrototype = window.AudioContext?.prototype;
    const createSource = audioPrototype?.createMediaElementSource;
    if (createSource) audioPrototype.createMediaElementSource = function (media) {
      const source = Reflect.apply(createSource, this, [media]);
      if (media instanceof HTMLAudioElement) {
        playerAudioNodes.set(media, source);
        rememberAudio(media);
        wakeAudio();
      }
      return source;
    };
    for (const event of audioEvents) {
      document.addEventListener(event, ({ target }) => {
        if (target instanceof HTMLAudioElement) wakeAudio();
      }, true);
    }
  }

  function audioCandidates() {
    return [...new Set([...recentAudio].reverse().concat([...document.querySelectorAll('audio')]))]
      .filter(media => (media.currentSrc || media.srcObject) && !media.ended);
  }

  function currentMedia() {
    const candidates = audioCandidates();
    const playing = candidates.filter(media => !media.paused);
    return playing.find(media => media.readyState >= 2) ?? playing[0] ?? candidates[0] ?? null;
  }

  function trackInfo(player, sampleCover = false) {
    const session = navigator.mediaSession;
    const metadata = session?.metadata;
    const meta = player?.querySelector(SELECTOR.track);
    const title = metadata?.title || meta?.querySelector('[class*="Meta_title"], [class*="Meta_albumLink"]')?.textContent.trim() || '';
    const artist = metadata?.artist || meta?.querySelector('[class*="Meta_artists"]')?.textContent.trim() || '';
    const art = (metadata?.artwork || []).map(item => artworkUrl(item.src)).filter(Boolean);
    const coverImage = player?.querySelector(SELECTOR.barCover + ' img') ||
      document.querySelector(SELECTOR.barCover + ' img') || meta?.querySelector('img');
    const waveImage = activeHero?.querySelector(VIBE_ALBUM + ' img, img' + VIBE_ALBUM);
    const nativeCover = artworkUrl(coverImage?.currentSrc || coverImage?.src);
    const waveCover = artworkUrl(waveImage?.currentSrc || waveImage?.src);
    const cover = art.at(-1) || waveCover || nativeCover;
    const toggle = nativeButton(player, 'toggle');
    const playing = toggle ? toggle.matches(testId('PAUSE_BUTTON')) : session?.playbackState === 'playing';
    const samples = sampleCover ? [...new Set([art[1], art[0], cover, waveCover, nativeCover].filter(Boolean))].slice(0, 4) : null;
    return { title, artist, cover, playing, ...(sampleCover ? { sampleCovers: samples } : {}) };
  }

  let theme = readTheme();
  let dynamicColors;
  let smartCovers = [];
  let smartAbort, smartRetryAt = 0, smartFailures = 0;
  let smartTitle = '', smartReady = false;
  let smartPalette;
  let smartDestination;
  let smartRequest = 0;
  let smartFrame;
  let smartStatus = '';
  const coverPalettes = new Map();
  let visualBase, visualColors, visualSnapshot;
  function visualTheme() {
    if (visualBase !== theme || visualColors !== dynamicColors) {
      visualBase = theme;
      visualColors = dynamicColors;
      visualSnapshot = { ...theme, coverColors: Boolean(dynamicColors) };
      for (const [group, { fields }] of Object.entries(SMART_GROUPS)) {
        if (smartOn(visualSnapshot, group)) for (const field of fields) visualSnapshot[field] = dynamicColors[field];
      }
      if (smartOwnsBackdrop(theme)) {
        visualSnapshot.mode = smartGroupEnabled(theme, 'smartGradient') ? 'gradient' : 'solid';
        visualSnapshot.gradientAngle = DEFAULT.gradientAngle;
        visualSnapshot.appMediaEnabled = false;
      }
    }
    return visualSnapshot;
  }
  const cloneTheme = value => ({ ...value, addonSheets: value.addonSheets.map(sheet => ({ ...sheet })) });
  const undoStack = [];
  const redoStack = [];
  let historyBusy = false;
  let lastHistoryKey = '';
  let lastHistoryAt = 0;
  const snapshot = () => ({ settings: theme, background: vibeMedia?.file ?? null });
  const sameTheme = (a, b) => Object.keys(DEFAULT).every(key => key === 'addonSheets'
    ? a.addonSheets.length === b.addonSheets.length &&
      a.addonSheets.every((sheet, i) => sheet.name === b.addonSheets[i].name && sheet.css === b.addonSheets[i].css)
    : a[key] === b[key]);
  let compareNative = false;
  const isStyled = () => theme.enabled && !compareNative;
  let host, shadow, launcher, baseStyle, customStyle, nativeStyle, waveFilter, wideLayout;
  const addonStyles = [];
  let cover = '';
  let saveError = '';
  let persistTimer;
  const $ = id => shadow?.getElementById(id);

  function setSheet(sheet, css) {
    if (sheet.textContent !== css) sheet.textContent = css;
  }
  const paintNames = [];
  let paintCount = 0;
  let paintValues = [];
  function paintToken(value) {
    const index = paintValues.push(value) - 1;
    const name = paintNames[index] ??= '--ymc-paint-' + index;
    return `var(${name})`;
  }
  function syncPaint(style) {
    for (let index = 0; index < paintValues.length; index++) {
      const name = paintNames[index];
      if (style.getPropertyValue(name) !== paintValues[index]) style.setProperty(name, paintValues[index]);
    }
    for (let index = paintValues.length; index < paintCount; index++) {
      style.removeProperty(paintNames[index]);
    }
    paintCount = paintValues.length;
    paintValues = [];
  }
  let motionPreference;
  const reducedMotion = () => (motionPreference ??= window.matchMedia('(prefers-reduced-motion: reduce)')).matches;

  function apply(colorOnly = false) {
    const active = isStyled();
    const styledTheme = visualTheme();
    if (!colorOnly) samplePortraitWallpaper();
    const portraitBackground = portraitBackgroundColor();
    const root = document.documentElement;
    if (!colorOnly) root.setAttribute('data-ymc-active', active ? 'yes' : 'no');
    setSheet(baseStyle, active ? makeStyles(styledTheme, cover, portraitBackground, shadow ? paintToken : literal) : '');
    if (shadow) syncPaint(root.style);
    if (!colorOnly) {
      const sheets = active && styledTheme.addonEnabled ? styledTheme.addonSheets : [];
      while (addonStyles.length > sheets.length) addonStyles.pop().remove();
      for (const [index, sheet] of sheets.entries()) {
        if (!addonStyles[index]) {
          const style = document.createElement('style');
          style.dataset.ymcAddon = String(index);
          customStyle.before(style);
          addonStyles.push(style);
        }
        setSheet(addonStyles[index], sheet.css);
      }
      setSheet(customStyle, active ? styledTheme.customCss : '');
    }
    if (!shadow) return;
    const nativePalette = !active || (styledTheme.addonEnabled && styledTheme.addonPalette);
    const native = nativePalette ? getComputedStyle(document.body) : null;
    const color = (token, fallback) => {
      const value = native?.getPropertyValue(token).trim();
      return value && CSS.supports('color', value) && value !== 'transparent' ? value : fallback;
    };
    const panel = color('--ym-background-color-primary-enabled-popover', styledTheme.panel);
    host.style.setProperty('--bg', panel);
    const distinctPlayer = styledTheme.separateSurfaces || smartOn(styledTheme, 'smartPanels');
    host.style.setProperty('--player-bg', distinctPlayer && !nativePalette ? styledTheme.player : panel);
    host.style.setProperty('--fg', color('--ym-controls-color-primary-text-enabled', readableText(styledTheme.text, styledTheme.panel)));
    host.style.setProperty('--player-fg', nativePalette ? 'var(--fg)' : readableText(styledTheme.text, distinctPlayer ? styledTheme.player : styledTheme.panel));
    host.style.setProperty('--accent', color('--ym-controls-color-primary-default-enabled', styledTheme.accent));
    host.style.setProperty('--store-cta-fg', readableText(styledTheme.background, styledTheme.accent));
    host.style.setProperty('--art-end', styledTheme.gradientEnd);
    host.style.setProperty('--art-start', styledTheme.background);
    if (!colorOnly) {
      root.style.setProperty('--ymc-spectrum-height', styledTheme.spectrumHeight + 'vh');
      root.style.setProperty('--ymc-spectrum-alpha', String(styledTheme.spectrumOpacity / 100));
    }
    if (!colorOnly && active && !theme.aiTrackCards) {
      for (const controller of pendingTrackCards) controller.abort();
    }
    if (appBackdrop) {
      const mediaStyle = appBackdrop.style;
      mediaStyle.setProperty('--ymc-media-dim', rgba(styledTheme.background, styledTheme.backgroundDim));
      if (!colorOnly) {
        mediaStyle.setProperty('--ymc-media-fit', styledTheme.mediaFit);
        mediaStyle.setProperty('--ymc-media-position', `${styledTheme.mediaX}% ${styledTheme.mediaY}%`);
        mediaStyle.setProperty('--ymc-media-blur', `${styledTheme.mediaBlur}px`);
        mediaStyle.setProperty('--ymc-media-opacity', String(styledTheme.mediaOpacity / 100));
      }
    }
    paintCustomWave(styledTheme);
    if (portraitAura) paintAura(styledTheme, portraitEffectColor(styledTheme, portraitBackground));
    if (theme.patternEnabled) paintPattern(patternLayer, styledTheme, !colorOnly);
    if (previewSession?.kind === 'pattern') paintPattern($('ymc-pattern-sample'), previewVisual('pattern'), !colorOnly, .56);
    if (!colorOnly) {
      setText($('ymc-status'), compareNative ? 'Показано штатное оформление' : !active ? 'Оформление выключено'
        : theme.addonEnabled && theme.addonPalette ? 'Оформление из CSS-темы' : 'Оформление включено');
      const compare = $('ymc-compare');
      compare.disabled = !theme.enabled;
      compare.setAttribute('aria-pressed', String(compareNative));
      setText(compare, compareNative ? 'Вернуть тему' : 'Оригинал');
    }
    if (!colorOnly || activeDialog === 'editor' && editorTab === 'layout') syncPortraitPreview(portraitBackground, previewVisual('portrait'));
    if (previewSession?.kind === 'playlists') syncPlaylistPreview();
    if (spectrumSignal === 'idle') syncSpectrumAnimation(true);
  }

  function persist() {
    clearTimeout(persistTimer);
    persistTimer = undefined;
    try {
      localStorage.setItem(KEY, JSON.stringify(theme));
      saveError = '';
    } catch {
      saveError = 'Не удалось сохранить настройки. Экспортируйте тему или освободите место, убрав изображение.';
    }
    if (shadow) $('ymc-save-error').textContent = saveError;
  }

  function recordHistory(previous, key = '') {
    const now = Date.now();
    if (!key || key !== lastHistoryKey || now - lastHistoryAt >= 850) {
      undoStack.push(previous);
      if (undoStack.length > 60) undoStack.shift();
    }
    redoStack.length = 0;
    lastHistoryKey = key;
    lastHistoryAt = now;
  }

  function setTheme(value, { immediate = true, sync = true, history = true, historyKey = '', previous = snapshot() } = {}) {
    const next = sanitizeTheme(value);
    if (history && (!sameTheme(previous.settings, next) || previous.background !== snapshot().background)) {
      recordHistory(previous, historyKey);
    }
    theme = next;
    if (!theme.smartTheme || !theme.enabled) {
      cancelAnimationFrame(smartFrame);
      smartRequest++;
      smartAbort?.abort();
      smartAbort = undefined;
      dynamicColors = undefined;
      smartCovers = [];
      smartRetryAt = smartFailures = 0;
      smartReady = false;
      smartPalette = undefined;
      smartDestination = undefined;
      syncSmartPreview(null);
    } else if (smartPalette) {
      animateSmartTheme(smartTarget(smartPalette));
    }
    if (!theme.enabled) compareNative = false;
    clearTimeout(persistTimer);
    if (immediate) persist();
    else persistTimer = setTimeout(persist, 220);
    apply();
    if (shadow) {
      syncControls(sync);
      refresh();
    }
  }

  function update(partial, options = {}) {
    setTheme({ ...theme, ...partial }, options);
  }

  async function moveHistory(from, to, message) {
    if (!from.length || historyBusy || vibeBusy || libraryBusy || previewSession) return;
    const current = snapshot();
    const next = from.at(-1);
    const restoreMedia = next.background !== current.background;
    historyBusy = true;
    if (restoreMedia) $('ymc-editor').inert = true;
    syncHistoryButtons();
    try {
      if (restoreMedia && !await changeVibeMedia(next.background, false, { history: false })) return;
      from.pop();
      to.push(current);
      lastHistoryKey = '';
      setTheme(next.settings, { history: false });
      notice(message);
    } finally {
      historyBusy = false;
      if (restoreMedia) $('ymc-editor').inert = false;
      syncHistoryButtons();
    }
  }
  const undoTheme = () => moveHistory(undoStack, redoStack, 'Изменение отменено.');
  const redoTheme = () => moveHistory(redoStack, undoStack, 'Изменение возвращено.');

  function setWideLayout(layout) {
    if (wideLayout) {
      wideLayout.removeAttribute('data-ymc-wide');
      wideLayout.style.removeProperty('--ymc-wide-areas');
    }
    wideLayout = layout;
    if (!layout) return false;
    const areas = expandGrid(getComputedStyle(layout).gridTemplateAreas);
    if (!areas) return false;
    layout.style.setProperty('--ymc-wide-areas', areas);
    layout.setAttribute('data-ymc-wide', '');
    return true;
  }

  let checkedLayout;
  let checkedClass;
  function syncLayout(player) {
    const layout = isStyled() && theme.widePlayer && player?.matches(SELECTOR.player)
      ? player.closest(SELECTOR.layout) : null;
    const candidate = layout?.matches('[class*="NewVibe"]') ? null : layout;
    if (checkedLayout !== candidate || checkedClass !== candidate?.className) {
      checkedLayout = candidate;
      checkedClass = candidate?.className;
      setWideLayout(candidate);
    }
    return Boolean(wideLayout?.hasAttribute('data-ymc-wide'));
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function importTheme(file, isCurrent) {
    if (file.size > 4_000_000) throw Error('Файл темы больше 4 МБ.');
    const source = JSON.parse(await file.text());
    if (!source || ![1, 2].includes(source.version) || Array.isArray(source)) {
      throw Error('Поддерживаются JSON-темы Customizer версии 1 и 2.');
    }
    if (!isCurrent()) return;
    const imported = sanitizeTheme(source);
    if ((imported.customCss.trim() || imported.addonSheets.length) &&
        !confirm('В теме есть пользовательский CSS. Он может менять интерфейс и загружать внешние ресурсы. Доверяете этому файлу?')) return;
    setTheme(imported);
    notice('Тема импортирована.');
  }

  async function importAddon(files, isCurrent) {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    if (sorted.length > 24 || sorted.some(file => !/\.css$/i.test(file.name)) ||
        sorted.reduce((total, file) => total + file.size, 0) > MAX_ADDON) {
      throw Error('Выберите до 24 файлов .css общим размером до 160 КБ.');
    }
    const sheets = await Promise.all(sorted.map(async file => ({ name: file.name, css: await file.text() })));
    if (!isCurrent()) return;
    if (sheets.some(sheet => !sheet.css.trim() || sheet.css.includes('\0'))) throw Error('CSS пуст или повреждён.');
    if (!confirm('CSS дополнения может менять интерфейс и загружать внешние ресурсы. Доверяете выбранным файлам?')) return;
    update({ addonSheets: sheets, addonEnabled: true });
    notice('CSS дополнения подключён.');
  }

  async function imageToDataUrl(file, maxDimension = 1600, preserveAlpha = false) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Выберите PNG, JPG или WebP.');
    if (file.size > 12_000_000) throw Error('Изображение больше 12 МБ.');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL(preserveAlpha ? 'image/png' : 'image/jpeg', 0.72);
      if (!isDataImage(data)) throw Error('Изображение не удалось сжать до допустимого размера.');
      return data;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  let vibeMedia;
  let vibeBusy = true;
  let vibeError = '';
  let vibePlayPending = false;

  async function localStorageRequest(storeName, mode, operation) {
    const db = await new Promise((resolve, reject) => {
      const open = indexedDB.open('ymc:local-media', 2);
      open.onupgradeneeded = event => {
        for (const name of ['backgrounds', 'themes', 'files']) {
          if (!open.result.objectStoreNames.contains(name)) open.result.createObjectStore(name);
        }
        if (event.oldVersion === 1) {
          const active = open.transaction.objectStore('backgrounds').get('vibe');
          active.onsuccess = () => {
            if (!active.result) return;
            const record = { id: libraryId(), file: active.result };
            open.transaction.objectStore('files').put(record, record.id);
          };
        }
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = operation(tx.objectStore(storeName));
        tx.oncomplete = () => resolve(request.result);
        tx.onabort = () => reject(tx.error ?? Error('Операция с локальным хранилищем прервана.'));
      });
    } finally {
      db.close();
    }
  }

  function vibeMediaStorage(mode, file) {
    // Keep the original slot so existing installs retain their background.
    return localStorageRequest('backgrounds', mode, store =>
      mode === 'readonly' ? store.get('vibe') : file ? store.put(file, 'vibe') : store.delete('vibe'));
  }

  const libraryId = () => [...crypto.getRandomValues(new Uint32Array(4))].join('-');
  let libraryThemes = [], libraryFiles = [], libraryBusy = false;
  let libraryGroup = 'presets', libraryThemeId = '', libraryFileId = '';
  const themeLibrary = () => [
    ...Object.entries(PRESETS).map(([name, values], index) => ({
      id: 'preset-' + index, name,
      settings: sanitizeTheme({ ...BAR_LAYOUT_PROFILES[values.barLayout], navigationFill: values.panel, navigationText: values.text, ...values, name }),
      background: null,
      builtIn: true, category: PRESET_CATEGORIES[name] || 'Другие'
    })),
    ...libraryThemes
  ];

  async function refreshLibrary() {
    [libraryThemes, libraryFiles] = await Promise.all([
      localStorageRequest('themes', 'readonly', store => store.getAll()),
      localStorageRequest('files', 'readonly', store => store.getAll())
    ]);
    renderThemeStore();
  }

  const selectedTheme = () => themeLibrary().find(item => item.id === libraryThemeId);
  const selectedFile = () => libraryFiles.find(item => item.id === libraryFileId);
  function presetBadges(item) {
    const t = item.settings;
    const badges = [item.category];
    if (t.glowIntensity && item.category !== 'Неон') badges.push('неон');
    if (t.smartTheme) badges.push('по обложке');
    if (t.barSpectrum) badges.push('эквалайзер');
    if (t.likedMotion !== 'off' || (t.motionEnabled && (t.motionAura || t.motionBackground))) badges.push('анимация');
    if (t.portraitEffect !== 'off') badges.push(t.portraitEffect === 'outline' ? 'обводка' : 'аура');
    if (t.likedCustom) badges.push({ star:'звезда', diamond:'ромб', native:'сердечко' }[t.likedShape] || 'лайк');
    return badges;
  }

  function renderThemeStore() {
    const presets = themeLibrary().filter(item => item.builtIn);
    const groups = { presets, saved: libraryThemes, files: libraryFiles };
    const names = { presets: 'Пресеты', saved: 'Мои темы', files: 'Файлы' };
    for (const button of shadow.querySelectorAll('[data-store-group]')) {
      const group = button.dataset.storeGroup;
      setText(button, names[group] + ' · ' + groups[group].length);
      button.setAttribute('aria-pressed', String(group === libraryGroup));
    }
    const isFiles = libraryGroup === 'files';
    const query = normalizeSearch($('ymc-store-search').value);
    const category = $('ymc-store-category').value;
    const records = groups[libraryGroup].filter(item => {
      if (libraryGroup === 'presets' && category !== 'all' && item.category !== category) return false;
      const name = isFiles ? item.file.name : item.name;
      const terms = item.builtIn ? [name, ...presetBadges(item)].join(' ') : name;
      return normalizeSearch(terms).includes(query);
    });
    let selectedId = isFiles ? libraryFileId : libraryThemeId;
    if (!records.some(item => item.id === selectedId)) {
      selectedId = records[0]?.id || '';
      if (isFiles) libraryFileId = selectedId;
      else libraryThemeId = selectedId;
    }
    const grid = $('ymc-store-cards');
    const focused = shadow.activeElement?.dataset.storeCard;
    grid.replaceChildren(...records.map(item => {
      const tile = document.createElement('article');
      tile.className = 'store-card';
      const card = document.createElement('button');
      card.className = 'store-card-pick';
      card.type = 'button';
      card.dataset.storeCard = item.id;
      card.setAttribute('aria-pressed', String(item.id === selectedId));
      const preview = document.createElement('span');
      preview.className = 'store-preview';
      if (isFiles) {
        preview.textContent = item.file.type.startsWith('video/') ? '▶' : '▧';
      } else {
        const { accent, background, gradientEnd, likedCustom, likedShape, likedColor, glowIntensity } = item.settings;
        preview.style.background = `radial-gradient(circle at 80% 16%,${accent},transparent 47%),linear-gradient(140deg,${background},${gradientEnd})`;
        if (likedCustom) {
          preview.textContent = { star:'★', diamond:'◆', native:'♥' }[likedShape] || '♥';
          preview.style.color = likedColor;
          if (glowIntensity) preview.style.textShadow = `0 0 ${Math.round(glowIntensity / 8)}px ${likedColor}`;
        }
      }
      const title = document.createElement('strong');
      title.textContent = isFiles ? item.file.name : item.name;
      const subtitle = document.createElement('small');
      if (isFiles) subtitle.textContent = `${Math.max(.01, item.file.size / 1048576).toFixed(2)} МиБ`;
      else subtitle.textContent = item.builtIn ? presetBadges(item).join(' · ')
        : item.background ? 'Тема с фоном' : 'Сохранённая тема';
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'store-card-action';
      action.dataset.storeApply = item.id;
      action.textContent = isFiles ? 'Выбрать файл' : 'Применить';
      action.disabled = libraryBusy;
      card.append(preview, title, subtitle);
      tile.append(card, action);
      return tile;
    }));
    if (focused) [...grid.querySelectorAll('[data-store-card]')].find(card => card.dataset.storeCard === focused)?.focus({ preventScroll: true });
    $('ymc-store-empty').hidden = records.length > 0;
    $('ymc-store-empty').textContent = query ? 'По этому запросу ничего нет.' : 'Здесь появятся сохранённые элементы.';
    $('ymc-store-theme-actions').hidden = isFiles;
    $('ymc-store-file-actions').hidden = !isFiles;
    $('ymc-store-category-label').hidden = libraryGroup !== 'presets';
    syncLibraryButtons();
  }

  function selectStoreGroup(group) {
    libraryGroup = group;
    $('ymc-store-search').value = '';
    if (group === 'presets') $('ymc-store-category').value = 'all';
    if (group === 'files' && !selectedFile()) libraryFileId = libraryFiles[0]?.id ?? '';
    if (group === 'presets') libraryThemeId = themeLibrary().find(item => item.builtIn)?.id ?? '';
    if (group === 'saved' && !libraryThemes.some(item => item.id === libraryThemeId)) libraryThemeId = libraryThemes[0]?.id ?? '';
    renderThemeStore();
  }

  function syncLibraryButtons() {
    const selected = selectedTheme();
    for (const action of shadow.querySelectorAll('[data-store-apply]')) action.disabled = libraryBusy;
    for (const id of ['apply', 'export-selected', 'remove-theme']) {
      $('ymc-library-' + id).disabled = libraryBusy || !selected || (id === 'remove-theme' && selected.builtIn);
    }
    for (const id of ['use-file', 'remove-file']) {
      $('ymc-library-' + id).disabled = libraryBusy || !selectedFile();
    }
    for (const id of ['save', 'export-current', 'import']) $('ymc-library-' + id).disabled = libraryBusy;
  }

  async function rememberFile(file) {
    const existing = libraryFiles.find(item => item.file.name === file.name &&
      item.file.size === file.size && item.file.lastModified === file.lastModified && item.file.type === file.type);
    if (existing) return;
    const record = { id: libraryId(), file };
    try {
      await localStorageRequest('files', 'readwrite', store => store.put(record, record.id));
      await refreshLibrary();
    } catch {
      notice('Файл применён, но сохранить его в библиотеке не удалось.', true);
    }
  }

  const MAX_THEME_HEADER = 12 * 1024 * 1024;
  const PACKAGE_MAGIC = 'YMC1';

  function currentThemeRecord(name = theme.name) {
    return { id: libraryId(), name: name.trim().slice(0, 60) || 'Моя тема',
      settings: { ...theme }, background: vibeMedia?.file ?? null };
  }

  function exportThemePackage(record) {
    const type = 'application/octet-stream';
    const media = record.background;
    const metadata = new TextEncoder().encode(JSON.stringify({
      name: record.name, settings: record.settings,
      background: media ? { name: media.name, type: media.type, size: media.size } : null
    }));
    if (metadata.length > MAX_THEME_HEADER) throw Error('Настройки темы слишком велики для экспорта.');
    const prefix = new Uint8Array(8);
    prefix.set(new TextEncoder().encode(PACKAGE_MAGIC));
    new DataView(prefix.buffer).setUint32(4, metadata.length, true);
    const safeName = record.name.replace(/[^\p{L}\p{N} _-]/gu, '_');
    download((safeName || 'ymusic-theme') + '.ymctheme', new Blob(media ? [prefix, metadata, media] : [prefix, metadata], { type }), type);
  }

  async function readThemePackage(file) {
    if (file.size < 8 || file.size > 8 + MAX_THEME_HEADER + MAX_VIBE_MEDIA) throw Error('Недопустимый размер файла темы.');
    const prefix = await file.slice(0, 8).arrayBuffer();
    if (new TextDecoder().decode(prefix.slice(0, 4)) !== PACKAGE_MAGIC) throw Error('Выберите файл темы .ymctheme.');
    const length = new DataView(prefix).getUint32(4, true);
    if (!length || length > MAX_THEME_HEADER || 8 + length > file.size) throw Error('Повреждён заголовок темы.');
    const record = JSON.parse(await file.slice(8, 8 + length).text());
    if (!record || record.settings?.version !== 2 || typeof record.name !== 'string') throw Error('Неизвестный формат темы.');
    const payload = file.slice(8 + length);
    const metadata = record.background;
    let background = null;
    if (metadata) {
      const name = typeof metadata.name === 'string' ? metadata.name.slice(-160) : '';
      if (!name || !payload.size || payload.size !== metadata.size || payload.size > MAX_VIBE_MEDIA) {
        throw Error('Повреждён файл фона в теме.');
      }
      background = new File([payload], name, { type: typeof metadata.type === 'string' ? metadata.type : '' });
      const prepared = await prepareVibeMedia(background);
      releaseVibeMedia(prepared);
    } else if (payload.size) throw Error('Лишние данные в файле темы.');
    return { id: libraryId(), name: record.name.trim().slice(0, 60) || 'Импортированная тема',
      settings: sanitizeTheme(record.settings), background };
  }

  async function runLibrary(operation) {
    if (libraryBusy) return;
    libraryBusy = true;
    syncLibraryButtons();
    syncHistoryButtons();
    notice();
    try { await operation(); }
    catch (error) { notice(error.message || 'Не удалось выполнить операцию с библиотекой.', true); }
    finally {
      libraryBusy = false;
      syncLibraryButtons();
      syncHistoryButtons();
    }
  }

  async function applyLibraryTheme(record) {
    if (!record) return;
    const settings = sanitizeTheme(record.settings);
    if ((settings.customCss.trim() || settings.addonSheets.length) &&
        !confirm('В этой теме есть пользовательский CSS. Применить его?')) return;
    const { background } = snapshot();
    if (!await changeVibeMedia(record.background, false, { history: false })) return;
    setTheme(settings, { previous: { settings: theme, background } });
    notice('Применена тема «' + record.name + '».');
  }

  async function applyLibraryFile(file, target) {
    if (target === 'background') return changeVibeMedia(file);
    if (target === 'liked') {
      const likedImage = await imageToDataUrl(file, 128, true);
      update({ likedImage, likedCustom: true, likedShape: 'image' });
    } else {
      const barWallpaper = await imageToDataUrl(file, 800);
      update({ barWallpaper, barCustom: true });
    }
    return true;
  }

  async function prepareVibeMedia(file) {
    const type = VIBE_MEDIA_TYPES[file.name.split('.').pop().toLowerCase()];
    if (typeof type !== 'string' || !file.size || file.size > MAX_VIBE_MEDIA) {
      throw Error('Выберите PNG, JPG, WebP, GIF, MP4 или WebM размером до 100 МиБ.');
    }
    const isVideo = type.startsWith('video/');
    const element = document.createElement(isVideo ? 'video' : 'img');
    const url = URL.createObjectURL(file.type === type ? file : file.slice(0, file.size, type));
    element.dataset.ymcAppMedia = '';
    element.setAttribute('aria-hidden', 'true');
    if (isVideo) {
      element.muted = true;
      element.loop = true;
      element.playsInline = true;
      element.preload = 'auto';
    } else {
      element.alt = '';
    }
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => finish(false), 12_000);
        const ready = isVideo ? 'loadeddata' : 'load';
        const loaded = () => finish(!isVideo || element.videoWidth > 0);
        const failed = () => finish(false);
        function finish(ok) {
          clearTimeout(timer);
          element.removeEventListener(ready, loaded);
          element.removeEventListener('error', failed);
          if (ok) resolve();
          else reject(Error('Этот файл не удалось открыть. Для видео попробуйте MP4 (H.264) или WebM.'));
        }
        element.addEventListener(ready, loaded);
        element.addEventListener('error', failed);
        element.src = url;
      });
      return { element, url, name: file.name, file };
    } catch (error) {
      element.removeAttribute('src');
      if (isVideo) element.load();
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  function releaseVibeMedia(media) {
    if (!media) return;
    media.element.remove();
    media.element.removeAttribute('src');
    if (media.element.tagName === 'VIDEO') media.element.load();
    URL.revokeObjectURL(media.url);
  }

  function syncVibeControls() {
    const locked = smartOwnsBackdrop(theme);
    $('ymc-vibe-pick').disabled = vibeBusy || locked;
    $('ymc-vibe-clear').disabled = locked || vibeBusy || (!vibeMedia && !vibeError);
    $('ymc-vibe-status').textContent = vibeBusy ? 'Подождите…'
      : vibeError || vibeMedia?.name || 'Файл фона пока не выбран.';
    syncHistoryButtons();
  }

  async function loadVibeMedia() {
    try {
      const file = await vibeMediaStorage('readonly');
      if (file) vibeMedia = await prepareVibeMedia(file);
      showPaletteSuggestion();
    } catch {
      vibeError = 'Не удалось восстановить сохранённый фон. Выберите файл заново.';
    } finally {
      vibeBusy = false;
      syncVibeControls();
      apply();
      syncControls(false);
      refresh();
    }
  }

  async function changeVibeMedia(file, activate = true, { history = true } = {}) {
    if (vibeBusy) return false;
    if ((file ?? null) === snapshot().background && !vibeError) {
      if (file && activate && !theme.appMediaEnabled) update({ appMediaEnabled: true }, { history });
      return true;
    }
    vibeBusy = true;
    vibeError = '';
    syncVibeControls();
    let next;
    try {
      if (file) next = await prepareVibeMedia(file);
      try {
        await vibeMediaStorage('readwrite', file);
      } catch {
        throw Error('Не удалось сохранить фон. Проверьте доступное место.');
      }
      if (history) recordHistory(snapshot());
      releaseVibeMedia(vibeMedia);
      vibeMedia = next;
      showPaletteSuggestion();
      if (file && activate && !theme.appMediaEnabled) update({ appMediaEnabled: true }, { history: false });
      return true;
    } catch (error) {
      releaseVibeMedia(next);
      vibeError = error.message;
      notice(vibeError, true);
      return false;
    } finally {
      vibeBusy = false;
      syncVibeControls();
      apply();
      syncControls(false);
      refresh();
    }
  }

  let appBackdrop;
  function syncAppBackground() {
    const visible = isStyled() && visualTheme().appMediaEnabled && Boolean(vibeMedia);
    if (!visible) appBackdrop.remove();
    else if (!appBackdrop.isConnected) document.body.append(appBackdrop);
    const element = vibeMedia?.element;
    if (visible && element.parentElement !== appBackdrop) appBackdrop.replaceChildren(element);
    if (element?.tagName !== 'VIDEO') return;
    if (!visible || document.hidden) element.pause();
    else if (element.paused && !vibePlayPending) {
      vibePlayPending = true;
      element.play().catch(() => {}).finally(() => { vibePlayPending = false; });
    }
  }

  const STROKE = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const sparkle = '<path d="M0-13Q1-1 11 0Q1 1 0 13Q-1 1-11 0Q-1-1 0-13Z"/>';
  const patternMarks = {
    stars: i => i % 7 === 0 ? sparkle : '<circle r="3"/>',
    orbits: i => '<ellipse rx="21" ry="9" ' + STROKE + '/><circle r="' + (i % 2 ? 4.5 : 2.5) +
      '"/><circle cx="15" cy="-6" r="2.3"/>',
    ripples: i => '<circle r="6" ' + STROKE + '/><circle r="12" ' + STROKE +
      ' opacity=".72"/><circle r="19" ' + STROKE + ' opacity=".4"/>' + (i % 2 ? '<circle r="2"/>' : ''),
    snow: i => i % 4 ? '<path d="M-10 0h20M-5-8.7 5 8.7M-5 8.7 5-8.7 M-7-2l2 2-2 2m14-4-2 2 2 2" ' + STROKE + '/>' : '<circle r="2.4"/>',
    petals: i => '<path d="M0 14C-16 6-13-8-3-14Q12-12 10 0 8 8 0 14Z" ' +
      (i % 2 ? STROKE : 'opacity=".7"') + '/><path d="M0 11Q-5 3 1-7" ' + STROKE + '/>',
    bubbles: i => '<circle r="' + (i % 3 ? 12 : 17) + '" ' + STROKE +
      '/><path d="M-7-2q1-4 5-5" ' + STROKE + ' stroke-width="1.5"/><circle cx="13" cy="11" r="1.3"/>',
    notes: i => i % 2 ? '<path d="M-4 8v-19l14-4V4" ' + STROKE +
      ' stroke-width="2"/><ellipse cx="-8" cy="8" rx="5" ry="3"/><ellipse cx="6" cy="4" rx="5" ry="3"/>' :
      '<path d="M1 10v-23q6 7 11 7" ' + STROKE + ' stroke-width="2"/><ellipse cx="-4" cy="10" rx="6" ry="4"/>',
    pixels: i => '<rect x="-6" y="-6" width="12" height="12" rx="1.5"/>' +
      (i % 3 ? '<rect x="8" y="-10" width="5" height="5" rx="1"/>' : '<rect x="-14" y="8" width="6" height="6" rx="1"/>'),
    symbols: (i, glyphs) => '<text text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="24">' +
      glyphs[i % glyphs.length] + '</text>'
  };
  const hexagon = x => [[x, -13], [x + 11, -6.5], [x + 11, 6.5], [x, 13], [x - 11, 6.5], [x - 11, -6.5], [x, -13]];
  const patternLines = {
    grid: (i, span) => [
      [[-span, -6], [span, -6]], [[-span * .72, 6], [span * .82, 6]], [[-5, -span * .72], [-5, span]],
      ...(i % 3 ? [[[5, -span], [5, span * .67]]] : [])
    ],
    hexagons: i => i % 3 ? [hexagon(0)] : [hexagon(-11), hexagon(11)],
    circuits: (i, span) => [[[-span, 8], [-6, 8], [4, -5], [span, -5]], ...(i % 2 ? [[[4, -5], [4, -span]]] : [])],
    constellations: i => i % 2 ? [[[-16, 4], [-7, -8], [3, -5], [11, 9], [21, 3]]] :
      [[[-13, -5], [-3, 4], [4, -7], [14, -3]], [[-3, 4], [10, 14]]],
    rain: (_i, span) => [[[-span, span], [span, -span]]],
    diamonds: () => [[[0, -14], [12, 0], [0, 14], [-12, 0], [0, -14]],
      [[-12, 0], [12, 0]], [[0, -14], [5, 0], [0, 14], [-5, 0], [0, -14]]]
  };
  const patternEffects = Object.keys(PATTERN_BEAT_EFFECTS).filter(key => !['off', 'mixed'].includes(key));

  function patternPath(lines, bend = 0) {
    return lines.map(points => 'M' + points[0].join(' ') + points.slice(1).map(([x, y], i) => {
      if (!bend) return `L${x} ${y}`;
      const [px, py] = points[i];
      const cx = (px + x) / 2 - (y - py) * bend;
      const cy = (py + y) / 2 + (x - px) * bend;
      return `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x} ${y}`;
    }).join('')).join('');
  }

  function patternArtwork(t, width, height, scale, id) {
    let seed = t.patternSeed;
    const random = () => {
      let bits = seed = (seed + 0x6D2B79F5) >>> 0;
      bits = Math.imul(bits ^ bits >>> 15, bits | 1);
      bits ^= bits + Math.imul(bits ^ bits >>> 7, bits | 61);
      return ((bits ^ bits >>> 14) >>> 0) / 0x100000000;
    };
    const density = t.patternDensity / 100;
    const fine = ['stars', 'rain', 'snow', 'pixels'].includes(t.patternStyle);
    const size = t.patternSize * scale / 100;
    const area = width * height / size ** 2;
    const count = Math.max(2, Math.min(460, Math.round(area * (fine ? .00010 + density * .00058 : .000065 + density * .00027))));
    const clusters = Array.from({ length: 9 }, () => [random() * width, random() * height]);
    const glyphs = Array.from(t.patternSymbols.replace(/\s/gu, '') || DEFAULT.patternSymbols.replaceAll(' ', ''))
      .map(value => '&#x' + value.codePointAt(0).toString(16) + ';');
    const markup = [], wrapped = [], bends = [];
    for (let i = 0; i < count; i++) {
      const clustered = random() < .28;
      const center = clusters[Math.floor(random() * clusters.length)];
      const x = (clustered ? (center[0] + (random() + random() - 1) * width * .22 + width) % width : random() * width);
      const y = (clustered ? (center[1] + (random() + random() - 1) * height * .22 + height) % height : random() * height);
      const roll = Math.floor(random() * 0x10000);
      const span = 9 + Math.floor(random() * 13);
      const weight = (.42 + random() ** 1.45 * .78) * size;
      const angle = (random() - .5) * (t.patternStyle === 'rain' ? 42 : 180);
      const opacity = .28 + random() * .70;
      const accent = random() < .32;
      const motion = patternEffects[Math.floor(random() * patternEffects.length)];
      const effect = t.patternBeatEffect === 'mixed' ? motion : t.patternBeatEffect;
      const strength = .30 + random() * .70;
      const direction = random() * Math.PI * 2;
      const dx = Math.cos(direction) * (4 + strength * 10);
      const dy = Math.sin(direction) * (4 + strength * 10);
      const turn = (random() - .5) * 40;
      const lines = patternLines[t.patternStyle]?.(roll, span);
      const outline = lines ? patternPath(lines) : '';
      const bend = effect === 'bend' && lines;
      if (bend) bends.push({ lines, outline, amount: turn / 34 });
      const art = lines ? `<path ${bend ? 'data-ymc-bend' : ''} d="${outline}" ${STROKE} stroke-width="${(.9 + strength * 1.1).toFixed(2)}"/>` +
        (['constellations', 'circuits', 'rain'].includes(t.patternStyle) ? lines[0].map(([x, y], j) =>
          `<circle cx="${x}" cy="${y}" r="${(j % 2 ? 1.3 : 2.2) * strength + .4}"/>`).join('') : '')
        : patternMarks[t.patternStyle](roll, glyphs);
      const margin = weight * 52;
      const xs = x < margin ? [width] : x > width - margin ? [-width] : [];
      const ys = y < margin ? [height] : y > height - margin ? [-height] : [];
      const markId = xs.length || ys.length ? `${id}-${i}` : '';
      const style = `--ymc-mark-x:${dx.toFixed(2)}px;--ymc-mark-y:${dy.toFixed(2)}px;--ymc-mark-turn:${turn.toFixed(1)}deg;--ymc-mark-strength:${strength.toFixed(2)}`;
      markup.push(`<g ${markId ? 'id="' + markId + '"' : ''} class="ymc-pattern-mark${accent ? ' accent' : ''}" opacity="${opacity.toFixed(2)}"
        transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${weight.toFixed(3)})">` +
        `<g data-effect="${effect}" class="ymc-pattern-glyph" style="${style}">${art}` +
        (effect === 'echo' ? `<g class="ymc-pattern-echo">${art}</g>` : '') + '</g></g>');
      for (const offsetX of [0, ...xs]) for (const offsetY of [0, ...ys]) {
        if (offsetX || offsetY) wrapped.push(`<use href="#${markId}" x="${offsetX}" y="${offsetY}"/>`);
      }
    }
    return { markup: markup.concat(wrapped).join(''), bends };
  }

  function patternMarkup(id) {
    return `<svg class="ymc-pattern-inner" aria-hidden="true">
      <defs><pattern id="${id}" patternUnits="userSpaceOnUse"></pattern></defs>
      <rect class="ymc-pattern-ink" fill="url(#${id})"></rect>
    </svg>`;
  }

  function patternRules(layer) {
    return `
      ${layer} .ymc-pattern-inner { position:absolute; inset:0; width:100%; height:100%; opacity:var(--ymc-pattern-alpha); }
      ${layer}[data-glow] .ymc-pattern-inner { filter:drop-shadow(0 0 var(--ymc-pattern-glow) var(--ymc-pattern-accent)); }
      ${layer} .ymc-pattern-mark { color:var(--ymc-pattern-color); fill:currentColor; }
      ${layer} .ymc-pattern-mark.accent, ${layer} .ymc-pattern-echo { color:var(--ymc-pattern-accent); }
      ${layer} .ymc-pattern-echo { opacity:0; }
      @media (prefers-reduced-motion:no-preference) {
        @keyframes ymc-pattern-travel { to { translate:var(--ymc-pattern-dx) var(--ymc-pattern-dy); } }
        @keyframes ymc-pattern-shimmer {
          0%,100% { opacity:var(--ymc-pattern-alpha); }
          50% { opacity:calc(var(--ymc-pattern-alpha) * .53); }
        }
        ${layer}:is([data-motion="drift"],[data-motion="both"]) .ymc-pattern-ink {
          animation:ymc-pattern-travel var(--ymc-pattern-period) linear infinite;
        }
        ${layer}:is([data-motion="shimmer"],[data-motion="both"]) .ymc-pattern-inner {
          animation:ymc-pattern-shimmer var(--ymc-pattern-period) ease-in-out infinite;
        }
        ${layer}[data-paused] :is(.ymc-pattern-ink,.ymc-pattern-inner) { animation-play-state:paused; }
        ${layer} [data-effect="pulse"] {
          scale:calc(1 + var(--ymc-pattern-beat,0) * var(--ymc-mark-strength) * .62);
          opacity:clamp(.40,calc(.63 + var(--ymc-pattern-beat,0) * var(--ymc-mark-strength)),1);
        }
        ${layer} [data-effect="shake"] {
          translate:calc(var(--ymc-mark-x) * var(--ymc-pattern-shake-x,0)) calc(var(--ymc-mark-y) * var(--ymc-pattern-shake-y,0));
          rotate:calc(var(--ymc-mark-turn) * var(--ymc-pattern-shake-y,0));
        }
        ${layer} .ymc-pattern-echo {
          translate:calc(var(--ymc-mark-x) * var(--ymc-pattern-beat,0)) calc(var(--ymc-mark-y) * var(--ymc-pattern-beat,0));
          scale:calc(1 + var(--ymc-pattern-beat,0) * .54);
          opacity:min(.76,calc(var(--ymc-pattern-beat,0) * var(--ymc-mark-strength)));
        }
        ${layer} [data-effect="bend"] {
          scale:calc(1 + var(--ymc-pattern-beat,0) * .22) calc(1 - var(--ymc-pattern-beat,0) * .12);
          rotate:calc(var(--ymc-mark-turn) * var(--ymc-pattern-beat,0) * .38);
        }
      }
    `;
  }

  let patternLayer, patternObserver;
  const patternStates = new WeakMap();
  const patternVisible = () => isStyled() && theme.patternEnabled && theme.patternOpacity > 0;

  function sizePattern(surface, state) {
    const { theme: t, scale, svg, tile, ink } = state;
    const { clientWidth: width, clientHeight: height } = surface;
    if (!width || !height) return;
    const key = [width, height, t.patternStyle, t.patternSeed, t.patternDensity, t.patternSymbols, t.patternSize, t.patternBeatEffect].join('/');
    if (key !== state.key) {
      state.key = key;
      const { markup, bends } = patternArtwork(t, width, height, scale, tile.id);
      tile.innerHTML = markup;
      state.bends = [...tile.querySelectorAll('[data-ymc-bend]')].map((node, i) => ({ node, ...bends[i] }));
      state.bendStep = 0;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      tile.setAttribute('width', width);
      tile.setAttribute('height', height);
      ink.setAttribute('x', -width);
      ink.setAttribute('y', -height);
      ink.setAttribute('width', width * 3);
      ink.setAttribute('height', height * 3);
    }
    const [dx, dy] = PATTERN_DIRECTIONS[t.patternDirection];
    tile.setAttribute('x', Math.round(width * t.patternX / 100));
    tile.setAttribute('y', Math.round(height * t.patternY / 100));
    surface.style.setProperty('--ymc-pattern-dx', dx * width + 'px');
    surface.style.setProperty('--ymc-pattern-dy', dy * height + 'px');
  }

  function paintPattern(surface, t, geometry, scale = 1) {
    const style = surface.style;
    if (geometry) {
      let state = patternStates.get(surface);
      if (!state) {
        const svg = surface.firstElementChild;
        state = { svg, tile: svg.querySelector('pattern'), ink: svg.querySelector('rect'), scale };
        patternStates.set(surface, state);
        patternObserver ||= new ResizeObserver(entries => {
          for (const { target } of entries) sizePattern(target, patternStates.get(target));
        });
        patternObserver.observe(surface);
      }
      state.theme = t;
      surface.dataset.motion = t.patternMotion;
      surface.toggleAttribute('data-glow', t.patternGlow > 0);
      style.setProperty('--ymc-pattern-period', t.patternPeriod + 's');
      style.setProperty('--ymc-pattern-glow', t.patternGlow + 'px');
      style.setProperty('--ymc-pattern-alpha', String(t.patternOpacity / 100));
      sizePattern(surface, state);
    }
    const color = t.patternPalette === 'custom' ? t.patternPrimary : mixHex(t.accent, t.text, .43);
    const accent = t.patternPalette === 'custom' ? t.patternSecondary : t.accent;
    if (style.getPropertyValue('--ymc-pattern-color') !== color) style.setProperty('--ymc-pattern-color', color);
    if (style.getPropertyValue('--ymc-pattern-accent') !== accent) style.setProperty('--ymc-pattern-accent', accent);
  }

  function paintPatternBeat(surface, level, now = 0) {
    const state = patternStates.get(surface);
    if (!state || !level && !state.beat) return;
    if (level && now - (state.paintedAt ?? -Infinity) < 30) return;
    state.paintedAt = now;
    const style = surface.style;
    if (!level) {
      for (const name of ['beat', 'shake-x', 'shake-y']) style.removeProperty('--ymc-pattern-' + name);
    } else {
      style.setProperty('--ymc-pattern-beat', level.toFixed(3));
      style.setProperty('--ymc-pattern-shake-x', (level * Math.sin(now * .046)).toFixed(3));
      style.setProperty('--ymc-pattern-shake-y', (level * Math.cos(now * .057)).toFixed(3));
    }
    state.beat = level;
    const step = Math.round(level * 20);
    if (step !== state.bendStep) {
      state.bendStep = step;
      for (const { node, lines, outline, amount } of state.bends || []) {
        node.setAttribute('d', step ? patternPath(lines, step * amount / 20) : outline);
      }
    }
  }

  function syncPatternMount(fullscreen) {
    if (fullscreen || !patternVisible() || theme.patternScope === 'wave' && !activeHero) {
      patternLayer.remove();
      return;
    }
    const wasMounted = patternLayer.isConnected;
    if (appBackdrop.isConnected) {
      if (appBackdrop.nextElementSibling !== patternLayer) appBackdrop.after(patternLayer);
    } else if (!patternLayer.isConnected) document.body.append(patternLayer);
    if (!wasMounted) paintPattern(patternLayer, visualTheme(), true);
    patternLayer.toggleAttribute('data-paused', document.hidden);
  }

  const wrapHue = hue => (hue + 360) % 360;
  const hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

  function hueOf(red, green, blue) {
    const r = red / 255, g = green / 255, b = blue / 255;
    const high = Math.max(r, g, b), low = Math.min(r, g, b);
    const chroma = high - low, light = (high + low) / 2;
    if (!chroma) return { hue: 0, saturation: 0, chroma, light };
    const hue = high === r ? (g - b) / chroma : high === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
    return { hue: wrapHue(hue * 60), saturation: chroma / (1 - Math.abs(2 * light - 1)), chroma, light };
  }

  function coverTone(color, saturation, light) {
    const s = Math.min(.99, saturation * (.60 + color.saturation * .45));
    const l = Math.max(.025, Math.min(.965, light));
    const a = s * Math.min(l, 1 - l);
    const channel = shift => {
      const k = (shift + color.hue / 30) % 12;
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
    };
    return ('#' + [0, 8, 4].map(channel).join('')).toUpperCase();
  }

  function extractCoverColors(pixels, width, height) {
    const binCount = 36;
    const region = () => ({
      bins: Array.from({ length: binCount }, () => ({ weight: 0, indices: [], middleCount: 0, rgb: [0, 0, 0] })),
      count: 0, middleCount: 0
    });
    const all = region(), left = region(), right = region(), center = region(), top = region(), bottom = region();
    const backdropBins = Array.from({ length: binCount }, () => ({ count: 0, red: 0, green: 0, blue: 0 }));
    const backdropNeutral = { count: 0, red: 0, green: 0, blue: 0, light: 0 };
    function add(area, index, red, green, blue, bucket, weight, inMiddle = false) {
      area.count++;
      if (inMiddle) area.middleCount++;
      if (weight) {
        const bin = area.bins[bucket];
        bin.weight += weight;
        bin.indices.push(index);
        if (inMiddle) bin.middleCount++;
        bin.rgb[0] += red * weight;
        bin.rgb[1] += green * weight;
        bin.rgb[2] += blue * weight;
      }
    }
    let lightSum = 0, bottomLightSum = 0, squared = 0, achromaticCount = 0, brightNeutralCount = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 140) continue;
      const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2];
      const y = (Math.floor(i / (4 * width)) + .5) / height, x = (i / 4 % width + .5) / width;
      const brightness = (red * .2126 + green * .7152 + blue * .0722) / 255;
      lightSum += brightness;
      squared += brightness ** 2;
      const { hue, chroma, saturation, light } = hueOf(red, green, blue);
      if (brightness >= .76 && chroma <= .105) brightNeutralCount++;
      // Highlights and shadows need more chroma before they establish a hue.
      const minimumChroma = .055 + .16 * (2 * Math.abs(brightness - .5)) ** 2;
      const bucket = Math.round(hue * binCount / 360) % binCount;
      // Count muted colors by area so shadows compete with smaller vivid details.
      const backdropBin = chroma >= Math.max(.04, light * .085 + .02) ? backdropBins[bucket] : backdropNeutral;
      backdropBin.count++;
      backdropBin.red += red;
      backdropBin.green += green;
      backdropBin.blue += blue;
      if (backdropBin === backdropNeutral) backdropNeutral.light += brightness;
      const vividness = chroma * (.75 + .25 * saturation);
      const weight = chroma < minimumChroma ? 0
        : (.22 + vividness * (2.1 + 2.2 * vividness)) * (1 - 1.1 * Math.abs(light - .5));
      if (!weight) achromaticCount++;
      add(all, i, red, green, blue, bucket, weight);
      if (x < .26) add(left, i, red, green, blue, bucket, weight);
      if (x > .74) add(right, i, red, green, blue, bucket, weight);
      if (x > .23 && x < .77 && y > .15 && y < .85) {
        const focus = (1 - 2.5 * Math.abs(x - .5)) * (1 - 1.9 * Math.abs(y - .5));
        add(center, i, red, green, blue, bucket, weight * focus);
      }
      if (y < .34) add(top, i, red, green, blue, bucket, weight, x > .30 && x < .70);
      if (y > .65) {
        bottomLightSum += brightness;
        add(bottom, i, red, green, blue, bucket, weight);
      }
    }
    const { count } = all;
    if (!count) return null;
    const backdropColors = backdropBins.flatMap((bin, index) => {
      if (!bin.count) return [];
      let area = 0, red = 0, green = 0, blue = 0;
      for (let offset = -2; offset <= 2; offset++) {
        const neighbor = backdropBins[(index + offset + binCount) % binCount];
        area += neighbor.count;
        red += neighbor.red;
        green += neighbor.green;
        blue += neighbor.blue;
      }
      return [{ ...hueOf(red / area, green / area, blue / area), share: area / count }];
    }).sort((a, b) => b.share - a.share);
    const leadingBackdrop = backdropColors[0];
    const mutedBackdrop = leadingBackdrop?.share >= .58 && leadingBackdrop.chroma >= .055 ? leadingBackdrop : null;
    function ranked({ bins, count: regionCount, middleCount }, minimum) {
      return bins.map((bin, i) => {
        if (!bin.indices.length) return null;
        const before = bins[(i + binCount - 1) % binCount], after = bins[(i + 1) % binCount];
        const area = bin.indices.length + before.indices.length + after.indices.length;
        if (area < minimum) return null;
        const weight = bin.weight + (before.weight + after.weight) * .56;
        const [red, green, blue] = bin.rgb.map((value, channel) =>
          (value + (before.rgb[channel] + after.rgb[channel]) * .56) / weight);
        // Use a color present in the dominant band, even if its average falls between colors.
        let closest = bin.indices[0], bestDistance = Infinity;
        for (const index of bin.indices) {
          const distance = (pixels[index] - red) ** 2 + (pixels[index + 1] - green) ** 2 + (pixels[index + 2] - blue) ** 2;
          if (distance < bestDistance) {
            closest = index;
            bestDistance = distance;
          }
        }
        return {
          ...hueOf(pixels[closest], pixels[closest + 1], pixels[closest + 2]),
          weight, area, share: area / regionCount,
          centerShare: middleCount ? (bin.middleCount + before.middleCount + after.middleCount) / middleCount : 0
        };
      }).filter(Boolean).sort((a, b) => b.weight - a.weight);
    }
    const candidates = ranked(all, Math.max(1, count * .028));
    const dominant = area => ranked(area, Math.max(1, count * .018, area.count * .16))[0];
    const leftColor = dominant(left), rightColor = dominant(right);
    const centerColor = dominant(center), topColor = dominant(top), bottomColor = dominant(bottom);
    const regional = [leftColor, rightColor, centerColor, topColor, bottomColor];
    const substantialRegion = regional.some(color => color && color.area >= count * .045 && color.share >= .30);
    const achromatic = !mutedBackdrop && (!candidates.length || (achromaticCount > count * .91 && !substantialRegion));
    const distinct = [];
    for (const color of achromatic ? [] : candidates) {
      if (!distinct.some(other => hueDistance(other.hue, color.hue) < 24)) distinct.push(color);
      if (distinct.length === 5) break;
    }
    if (mutedBackdrop && !distinct.length) distinct.push(mutedBackdrop);
    let vivid, vividScore = 0;
    for (const color of achromatic ? [] : [...candidates, ...regional]) {
      if (!color || color.area < count * .05 || (color.area < count * .075 && color.share < .30)) continue;
      // Once a color has enough support, let chroma outrank sheer coverage.
      const score = color.chroma * (.55 + .45 * color.saturation) * Math.sqrt(Math.min(.18, color.area / count));
      if (score > vividScore) {
        vivid = color;
        vividScore = score;
      }
    }
    const mean = lightSum / count;
    const brightBackdrop = brightNeutralCount >= count * .46 && backdropNeutral.count >= count * .52;
    const neutralBackdrop = brightBackdrop || achromatic || !leadingBackdrop || leadingBackdrop.share < .18 || backdropNeutral.count >= count * .58;
    const backdrop = neutralBackdrop ? undefined : leadingBackdrop;
    const backdropEnd = backdrop && backdropColors.find(color =>
      color.share >= Math.max(.19, backdrop.share * .60) && hueDistance(color.hue, backdrop.hue) >= 42);
    const neutralRGB = [backdropNeutral.red, backdropNeutral.green, backdropNeutral.blue];
    const neutralCount = backdropNeutral.count;
    const neutralMean = neutralCount ? neutralRGB.reduce((sum, value) => sum + value, 0) / (3 * neutralCount) : 0;
    const neutralBias = neutralCount ? neutralRGB.map(value => Math.max(-4, Math.min(4, (value / neutralCount - neutralMean) * .32))) : [0, 0, 0];
    const backdropLight = neutralCount ? backdropNeutral.light / neutralCount : mean;
    return {
      colors: distinct, achromatic, neutralBackdrop, brightBackdrop, neutralBias, backdrop, backdropEnd, backdropLight,
      center: centerColor, top: topColor, vivid,
      mean, bottomLight: bottom.count ? bottomLightSum / bottom.count : mean,
      detail: Math.sqrt(Math.max(0, squared / count - mean ** 2))
    };
  }

  // Each style sets independent surface, accent, text and spectrum tones.
  const PALETTE_RECIPES = {
    balanced: { surface: .17, depth: .13, highlight: .48, saturation: .72, accent: .63, vivid: .86, text: .86, spectrum: .64 },
    calm: { surface: .24, depth: .09, saturation: .36, accent: .75, vivid: .51, text: .92, spectrum: .73 },
    contrast: { surface: .08, depth: .13, highlight: .56, saturation: .62, accent: .71, vivid: .94, text: .89, spectrum: .71 },
    dark: { surface: .075, depth: .065, saturation: .75, accent: .56, vivid: .72, text: .81, spectrum: .56 },
    light: { surface: .965, depth: -.067, saturation: .60, accent: .42, vivid: .83, text: .16, spectrum: .38 },
    neon: { surface: .105, depth: .17, highlight: .59, saturation: .91, accent: .64, vivid: .99, text: .84, spectrum: .65 }
  };

  const NEUTRAL_SURFACES = {
    balanced: { bright: [.955, -.06], dim: [.16, .13] },
    calm: { bright: [.962, -.045], dim: [.23, .11] },
    contrast: { bright: [.946, -.09], dim: [.075, .11] },
    dark: { bright: [.16, .09], dim: [.065, .08] },
    light: { bright: [.965, -.045], dim: [.95, -.06] },
    neon: { bright: [.14, .16], dim: [.10, .13] }
  };

  function neutralTone(bias, light) {
    const gray = 255 * Math.max(.025, Math.min(.965, light));
    return '#' + bias.map(offset => Math.max(0, Math.min(255, Math.round(gray + offset)))
      .toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function coverGradient(color, recipe, baseLight) {
    if (!recipe.highlight) return coverTone(color, recipe.saturation, baseLight);
    const prominence = Math.max(0, Math.min(1, (color.chroma - .16) / .38));
    const strength = recipe.saturation + (Math.max(recipe.saturation, color.saturation) - recipe.saturation) * prominence;
    let low = .025;
    let high = baseLight + (Math.max(recipe.highlight, Math.min(color.light, .65)) - baseLight) * prominence;
    let highlight = coverTone(color, strength, high);
    const maximumLuminance = .158;
    if (luminance(highlight) <= maximumLuminance) return highlight;
    // Leave room for tinted text to meet contrast without becoming white.
    highlight = coverTone(color, strength, low);
    for (let step = 0; step < 9; step++) {
      const middle = (low + high) / 2;
      const candidate = coverTone(color, strength, middle);
      if (luminance(candidate) <= maximumLuminance) {
        highlight = candidate;
        low = middle;
      } else high = middle;
    }
    return highlight;
  }

  function coverAccentTone(color, light, vivid, lightSurface) {
    const prominence = Math.max(color.chroma, color.saturation * .85);
    const boost = Math.max(0, Math.min(1, (prominence - .18) / .36));
    const saturation = Math.min(.98, color.saturation + boost * .44 * vivid);
    const sourceLight = Math.max(.46, Math.min(.76, color.light));
    const brightness = lightSurface ? light : light + (sourceLight - light) * .72;
    return coverTone(color, saturation / (.60 + color.saturation * .45), brightness);
  }

  function spectrumTones(color) {
    return {
      spectrumStart: mixHex(color, '#000000', .25),
      spectrumMid: color,
      spectrumEnd: mixHex(color, '#FFFFFF', .17)
    };
  }

  function paletteFromSample(sample, style) {
    const recipe = PALETTE_RECIPES[style] || PALETTE_RECIPES.balanced;
    const { saturation, vivid } = recipe;
    const achromatic = sample.achromatic || !sample.colors.length;
    const neutralBackdrop = achromatic || sample.neutralBackdrop || !sample.backdrop;
    const neutralRecipe = NEUTRAL_SURFACES[style] || NEUTRAL_SURFACES.balanced;
    const [surface, depth] = neutralBackdrop
      ? neutralRecipe[sample.brightBackdrop || sample.backdropLight >= .64 ? 'bright' : 'dim']
      : [recipe.surface, recipe.depth];
    const dominant = sample.colors[0];
    const center = sample.center || dominant;
    const top = !achromatic && sample.top?.share >= .26 && sample.top.centerShare >= .30
      && sample.top.chroma >= (sample.vivid?.chroma || 0) * .56 ? sample.top : null;
    const feature = top || sample.vivid || center;
    const alternate = !achromatic && sample.colors.find(color => hueDistance(color.hue, feature.hue) >= 22);
    const backdrop = sample.backdrop;
    const backdropEnd = sample.backdropEnd || backdrop;
    const secondary = alternate || feature;
    const neutral = light => neutralTone(sample.neutralBias, light);
    const tone = (color, light, strength = saturation) => achromatic ? neutral(light) : coverTone(color, strength, light);
    const surfaceTone = (color, light) => neutralBackdrop ? neutral(light) : tone(color, light);
    const background = surfaceTone(backdrop, surface);
    const gradientEnd = neutralBackdrop ? neutral(surface + depth) : coverGradient(backdropEnd, recipe, surface + depth);
    const panel = surfaceTone(backdrop, surface + depth * .5);
    const lightSurface = surface > .5;
    const accentLight = lightSurface ? Math.min(recipe.accent, .44) : recipe.accent;
    const textLight = lightSurface ? Math.min(recipe.text, .16) : recipe.text;
    const spectrumLight = lightSurface ? Math.min(recipe.spectrum, .40) : recipe.spectrum;
    const featuredTone = (color, light) => achromatic ? neutral(light) : coverAccentTone(color, light, vivid, lightSurface);
    const accent = featuredTone(feature, accentLight);
    const ink = !achromatic && (top || sample.vivid) && !lightSurface
      ? featuredTone(feature, textLight) : tone(feature, textLight, vivid * .85);
    const text = tintedInk(ink, [background, gradientEnd, panel], lightSurface ? 6 : 4.5);
    const textSecondary = tintedInk(tone(secondary, textLight + (lightSurface ? .08 : -.09), vivid * .71),
      [background, gradientEnd, panel], 3.5);
    const range = lightSurface ? -.07 : .07;
    const spectrumColor = !neutralBackdrop && hueDistance(backdrop.hue, feature.hue) > 24 ? backdrop : feature;
    return {
      sample,
      accent, background, gradientEnd, panel, text, textSecondary,
      sidebar: surfaceTone(backdrop, surface + depth * .36), sidebarEnd: surfaceTone(backdropEnd, surface + depth * .77),
      player: surfaceTone(backdrop, surface + depth * .43),
      portraitAccent: featuredTone(top || sample.vivid || dominant, accentLight + range),
      likedColor: featuredTone(feature, accentLight + range),
      playlistStart: surfaceTone(backdrop, surface + depth * .86), playlistEnd: surfaceTone(backdropEnd, surface + depth * .27),
      vibeIcon: tintedInk(textSecondary, [panel]), vibeTransport: tintedInk(text, [accent]),
      ...spectrumTones(featuredTone(spectrumColor, spectrumLight + range)),
      panelOpacity: Math.round(60 + sample.mean * 20 + sample.detail * 20),
      barOpacity: Math.round(53 + sample.bottomLight * 22 + sample.detail * 21),
      backgroundDim: Math.round(15 + sample.mean * 23 + sample.detail * 20),
      vibeTrackOpacity: Math.round(41 + sample.mean * 28 + sample.detail * 28),
      vibeControlsOpacity: Math.round(52 + sample.mean * 23 + sample.detail * 24),
      playlistOpacity: Math.round(48 + sample.mean * 23 + sample.detail * 25),
      spectrumOpacity: Math.round(69 + sample.detail * 28)
    };
  }

  function suggestPalette(media) {
    if (!media) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 48;
      const draw = canvas.getContext('2d', { willReadFrequently: true });
      draw.drawImage(media.element, 0, 0, 48, 48);
      const sample = extractCoverColors(draw.getImageData(0, 0, 48, 48).data, 48, 48);
      return sample ? paletteFromSample(sample, 'balanced') : null;
    } catch {
      return null;
    }
  }

  let portraitWallpaper = { source: '', color: '' };

  function samplePortraitWallpaper() {
    const visible = visualTheme().mode === 'image' && !(visualTheme().appMediaEnabled && vibeMedia) &&
      !(theme.addonEnabled && theme.addonPalette);
    const forAura = theme.portraitEffect !== 'off' && theme.portraitColorSource === 'background';
    const forWave = theme.vibeAnimation && theme.waveStyle !== 'native' && theme.wavePalette === 'auto';
    const source = visible && (forAura || forWave) ? theme.wallpaper : '';
    if (source === portraitWallpaper.source) return;
    const sample = { source, color: '' };
    portraitWallpaper = sample;
    if (!source) return;
    const element = new Image();
    element.src = source;
    element.decode().then(() => {
      if (portraitWallpaper !== sample) return;
      const palette = suggestPalette({ element });
      sample.color = palette?.portraitAccent || '';
      sample.sample = palette?.sample;
      if (smartPalette) animateSmartTheme(smartTarget(smartPalette));
      apply();
    }).catch(() => {});
  }

  function portraitBackgroundColor() {
    return theme.appMediaEnabled && vibeMedia ? suggestedPalette?.portraitAccent : portraitWallpaper.color;
  }

  function smartBaseColors(t = theme) {
    const playlist = playlistColors({ ...t, contrastGuard: false });
    return {
      ...Object.fromEntries(COLORS.map(key => [key, t[key]])),
      accentHover: t.customAccentStates ? t.accentHover : t.accent,
      accentPress: t.customAccentStates ? t.accentPress : t.accent,
      sidebar: t.separateSurfaces ? t.sidebar : t.panel,
      player: t.separateSurfaces ? t.player : t.panel,
      portraitColor: portraitEffectColor(t, portraitBackgroundColor()),
      playlistStart: t.playlistGradient === 'palette' ? t.panel : t.playlistStart,
      playlistEnd: t.playlistGradient === 'palette' ? t.background : t.playlistEnd,
      playlistPrimary: playlist.primary, playlistPrimaryText: playlist.primaryText,
      playlistSecondary: playlist.secondary, playlistSecondaryText: playlist.secondaryText,
      playlistFilter: playlist.filter, playlistFilterText: playlist.filterText,
      playlistSelected: playlist.selected, playlistButtonHover: playlist.hover,
      vibeIcon: t.customVibeIcons ? t.vibeIcon : t.text,
      vibeTransport: t.customVibeIcons ? t.vibeTransport : readableText(t.background, t.accent),
      vibeFill: t.customVibeButtons ? t.vibeFill : t.panel,
      vibeHover: t.customVibeButtons ? t.vibeHover : t.gradientEnd,
      vibePlayFill: t.customVibeButtons ? t.vibePlayFill : t.accent
    };
  }

  function smartTarget(sample, t = theme) {
    const target = smartBaseColors(t);
    const palette = makePaletteVariant(sample, t.smartPaletteStyle);
    const derived = {
      ...palette,
      accentHover: mixHex(palette.accent, '#FFFFFF', .15),
      accentPress: mixHex(palette.accent, '#000000', .2),
      portraitColor: palette.portraitAccent,
      vibeIcon: palette.vibeIcon, vibeTransport: palette.vibeTransport,
      vibeFill: palette.panel, vibeHover: palette.gradientEnd, vibePlayFill: palette.accent,
      barButtonFill: palette.player, barButtonText: palette.text, barButtonHover: palette.gradientEnd,
      playlistPrimary: palette.accent, playlistPrimaryText: palette.vibeTransport,
      playlistSecondary: palette.panel, playlistSecondaryText: palette.text,
      playlistFilter: palette.panel, playlistFilterText: palette.textSecondary,
      playlistFilterBorder: mixHex(palette.panel, palette.text, .36),
      playlistSelected: palette.accent, playlistButtonHover: palette.gradientEnd,
      playlistSearchFill: palette.panel, playlistSearchText: palette.text,
      navigationFill: palette.panel, navigationText: palette.text
    };
    const keepLightSurfaces = palette.sample.neutralBackdrop || t.smartPaletteStyle === 'light';
    for (const [toggle, { fields }] of Object.entries(SMART_GROUPS)) {
      const strength = t[toggle] ? t.smartStrength * t[toggle + 'Amount'] / 10_000 : 0;
      if (!strength) continue;
      const faithful = ['smartGradient', 'smartPortrait', 'smartSpectrum', 'smartAccent', 'smartHeart', 'smartButtons', 'smartText'].includes(toggle)
        || palette.sample.achromatic
        || keepLightSurfaces && ['smartBackground', 'smartPanels', 'smartPlaylist'].includes(toggle);
      const amount = faithful ? strength + strength ** 2 * (1 - strength) : strength;
      if (toggle === 'smartSpectrum') {
        const { light } = hueOf(...rgb(palette.spectrumMid).split(',').map(Number));
        const base = neutralTone([0, 0, 0], light);
        Object.assign(target, spectrumTones(mixHex(base, palette.spectrumMid, amount)));
        continue;
      }
      for (const field of fields) {
        target[field] = mixHex(target[field], derived[field], amount);
      }
    }
    return target;
  }

  function animateSmartTheme(target) {
    if (smartDestination && COLORS.every(key => smartDestination[key] === target[key])) return;
    smartDestination = target;
    syncSmartPreview(target);
    cancelAnimationFrame(smartFrame);
    const start = dynamicColors ?? smartBaseColors();
    const monoSpectrum = theme.smartSpectrum && theme.smartSpectrumAmount && theme.smartStrength;
    const fields = COLORS.filter(key => start[key] !== target[key] &&
      !(monoSpectrum && (key === 'spectrumStart' || key === 'spectrumEnd')));
    if (!fields.length || reducedMotion()) {
      dynamicColors = target;
      smartFrame = undefined;
      if (isStyled()) apply(true);
      return;
    }
    const begun = performance.now();
    const duration = theme.smartTransition;
    let lastPaint = -Infinity;
    const frame = now => {
      const progress = Math.min(1, Math.max(0, (now - begun) / duration));
      if (progress === 1 || now - lastPaint >= 15) {
        lastPaint = now;
        const amount = (1 - Math.cos(Math.PI * progress)) / 2;
        dynamicColors = progress === 1 ? target : { ...target };
        if (progress < 1) {
          for (const field of fields) dynamicColors[field] = mixHex(start[field], target[field], amount);
          if (monoSpectrum) Object.assign(dynamicColors, spectrumTones(dynamicColors.spectrumMid));
        }
        if (isStyled()) apply(true);
      }
      smartFrame = progress < 1 ? requestAnimationFrame(frame) : undefined;
    };
    smartFrame = requestAnimationFrame(frame);
  }

  async function loadCoverPalette(source, signal) {
    if (signal.aborted) return null;
    if (coverPalettes.has(source)) return coverPalettes.get(source);
    const image = new Image();
    if (source.startsWith('https:')) image.crossOrigin = 'anonymous';
    let deadline;
    const cancel = () => image.removeAttribute('src');
    signal.addEventListener('abort', cancel, { once: true });
    try {
      image.src = source;
      await Promise.race([image.decode(), new Promise((_, reject) => {
        deadline = setTimeout(() => reject(Error('cover timeout')), 1800);
      })]);
      if (signal.aborted) return null;
      const palette = suggestPalette({ element: image });
      if (!palette) return null;
      if (source.startsWith('https:')) {
        coverPalettes.set(source, palette);
        if (coverPalettes.size > 20) coverPalettes.delete(coverPalettes.keys().next().value);
      }
      return palette;
    } catch {
      image.removeAttribute('src');
      return null;
    } finally {
      clearTimeout(deadline);
      signal.removeEventListener('abort', cancel);
    }
  }

  async function syncSmartTheme(track) {
    const candidates = track.sampleCovers || [track.cover].filter(Boolean);
    smartTitle = track.title ? '«' + track.title + '»' : 'текущего трека';
    const changed = candidates.length !== smartCovers.length || candidates.some((candidate, i) => candidate !== smartCovers[i]);
    if (changed) {
      smartCovers = candidates;
      smartAbort?.abort();
      smartAbort = undefined;
      smartRequest++;
      smartFailures = smartRetryAt = 0;
      smartReady = false;
    }
    if (!candidates.length) {
      setText($('ymc-smart-status'), 'Ожидание обложки текущего трека.');
      return;
    }
    if (!changed && (smartReady || smartAbort || smartFailures >= 3 || performance.now() < smartRetryAt)) {
      setText($('ymc-smart-status'), smartReady ? 'Используется палитра обложки ' + smartTitle + '.' : smartStatus);
      return;
    }
    const controller = new AbortController();
    smartAbort = controller;
    const request = ++smartRequest;
    smartStatus = 'Подбор цветов по обложке ' + smartTitle + '…';
    setText($('ymc-smart-status'), smartStatus);
    for (const candidate of candidates) {
      const palette = await loadCoverPalette(candidate, controller.signal);
      if (request !== smartRequest || !theme.smartTheme) return;
      if (!palette) continue;
      smartPalette = palette;
      smartReady = true;
      smartAbort = undefined;
      animateSmartTheme(smartTarget(palette));
      smartStatus = 'Используется палитра обложки ' + smartTitle + '.';
      setText($('ymc-smart-status'), smartStatus);
      return;
    }
    smartAbort = undefined;
    smartRetryAt = performance.now() + 900 * ++smartFailures;
    smartStatus = smartFailures < 3 ? 'Не удалось прочитать обложку. Повторяем попытку…'
      : 'Цвета этой обложки недоступны. Текущее оформление сохранено.';
    setText($('ymc-smart-status'), smartStatus);
  }

  let suggestedPalette, paletteUsesSeparateSurfaces, paletteVariant = 'balanced';

  function makePaletteVariant(base, variant) {
    return base && variant !== 'balanced' ? paletteFromSample(base.sample, variant) : base;
  }

  function syncSmartPreview(target) {
    const preview = $('ymc-smart-preview');
    if (!preview) return;
    preview.hidden = !target;
    if (!target) return;
    for (const tile of preview.querySelectorAll('[data-role]')) {
      const role = tile.dataset.role;
      const color = target[role];
      tile.style.setProperty('--role-color', color);
      tile.querySelector('code').textContent = color;
    }
    preview.style.setProperty('--role-spectrum', `linear-gradient(90deg,${target.spectrumStart},${target.spectrumMid},${target.spectrumEnd})`);
  }
  function showPaletteSuggestion(resample = true) {
    if (resample) {
      suggestedPalette = suggestPalette(vibeMedia);
      if (smartPalette) animateSmartTheme(smartTarget(smartPalette));
    }
    else if (paletteUsesSeparateSurfaces === theme.separateSurfaces) return;
    paletteUsesSeparateSurfaces = theme.separateSurfaces;
    $('ymc-palette').hidden = !suggestedPalette;
    if (suggestedPalette) {
      const color = makePaletteVariant(suggestedPalette, paletteVariant);
      $('ymc-palette-spectrum').style.background = `linear-gradient(90deg,${color.spectrumStart},${color.spectrumMid},${color.spectrumEnd})`;
      $('ymc-palette-spectrum').style.color = readableText(theme.text, color.spectrumStart);
      $('ymc-palette-sidebar').hidden = !theme.separateSurfaces;
      $('ymc-palette-sidebar').style.background = `linear-gradient(90deg,${color.sidebar},${color.sidebarEnd})`;
      $('ymc-palette-sidebar').style.color = readableText(theme.text, color.sidebar);
    }
    const variantPalette = makePaletteVariant(suggestedPalette, paletteVariant);
    const colors = Object.entries(variantPalette ?? {}).filter(([key, value]) =>
      typeof value === 'string' && (theme.separateSurfaces || !['sidebar', 'sidebarEnd', 'player'].includes(key)));
    $('ymc-palette-opacity').textContent = suggestedPalette
      ? `Вариант «${PALETTE_VARIANTS[paletteVariant]}» · панели ${variantPalette.panelOpacity}% · плеер ${variantPalette.barOpacity}% · затемнение ${variantPalette.backgroundDim}% · строка ${variantPalette.vibeTrackOpacity}% · кнопки ${variantPalette.vibeControlsOpacity}% · плейлист ${variantPalette.playlistOpacity}% · эквалайзер ${variantPalette.spectrumOpacity}%` : '';
    $('ymc-palette-swatches').replaceChildren(...colors.map(([name, hex]) => {
      const chip = document.createElement('span');
      chip.style.backgroundColor = hex;
      const labels = { spectrumStart: 'Эквалайзер · начало', spectrumMid: 'Эквалайзер · середина', spectrumEnd: 'Эквалайзер · конец',
        sidebar: 'Начало боковой панели', sidebarEnd: 'Конец боковой панели', likedColor: 'Лайки',
        portraitAccent: 'Аура портрета',
        panel: 'Панели', text: 'Текст', textSecondary: 'Подписи', accent: 'Акцент', background: 'Фон', gradientEnd: 'Градиент фона',
        player: 'Плеер', vibeIcon: 'Иконки волны', vibeTransport: 'Кнопки воспроизведения',
        playlistStart: 'Плейлист · верх', playlistEnd: 'Плейлист · низ' };
      chip.dataset.paletteColor = name;
      chip.title = (labels[name] ?? name) + ' ' + hex;
      chip.setAttribute('aria-label', chip.title);
      return chip;
    }));
    for (const button of shadow.querySelectorAll('[data-palette-variant]')) {
      button.setAttribute('aria-pressed', String(button.dataset.paletteVariant === paletteVariant));
    }
  }

  let barBackdrop, barCanvas, pageSpectrum;
  let spectrumInput, spectrumContext, spectrumFrame, spectrumCheckAt = 0;
  let spectrumPreferred, spectrumSource, spectrumRetryAt = 0, spectrumFailures = 0;
  let rejectedNative = new WeakSet();
  let spectrumSignal = 'idle', overlaySpectrum = false;
  let lastSpectrumFrame = 0;
  const spectrumSurfaces = new WeakMap();
  const spectrumLevels = new Float32Array(120);
  const spectrumPeaks = new Float32Array(120);
  const previewLevels = new Float32Array(120);
  const previewPeaks = new Float32Array(120);
  const demoLevels = new Float32Array(120);
  let portraitAura, auraImage, auraHost, auraObserver;

  function paintAura(t, color, layer = portraitAura) {
    if (!layer) return;
    layer.style.setProperty('--ymc-aura-color', color);
    layer.style.setProperty('--ymc-aura-alpha', String(t.portraitIntensity / 100));
    layer.style.setProperty('--ymc-aura-spread', String(t.portraitSpread));
  }

  function sizeAura() {
    if (!auraImage || !portraitAura?.isConnected) return;
    const host = auraHost.getBoundingClientRect();
    const image = auraImage.getBoundingClientRect();
    if (!(image.width && image.height && host.width && host.height)) return;
    const pad = Math.min(image.width, image.height) * .13;
    const left = Math.max(0, image.left - host.left - pad);
    const top = Math.max(0, image.top - host.top);
    const width = Math.min(host.width - left, image.right - host.left + pad - left);
    const height = Math.min(host.height - top, image.height);
    Object.assign(portraitAura.style, {
      left: left.toFixed(1) + 'px', top: top.toFixed(1) + 'px',
      width: width.toFixed(1) + 'px', height: height.toFixed(1) + 'px'
    });
  }

  function syncPortraitAura(portrait) {
    const image = theme.portraitEffect === 'bloom' && hasPortraitAura(theme) ? portrait : null;
    if (image === auraImage) return;
    auraObserver?.disconnect();
    auraHost?.removeAttribute('data-ymc-aura-host');
    portraitAura?.remove();
    portraitAura = null;
    auraImage = image;
    auraHost = image?.closest(PORTRAIT);
    resetBeat();
    if (!auraHost) return;
    auraHost.setAttribute('data-ymc-aura-host', '');
    portraitAura = document.createElement('div');
    portraitAura.setAttribute('data-ymc-portrait-aura', '');
    portraitAura.setAttribute('aria-hidden', 'true');
    auraHost.prepend(portraitAura);
    auraObserver ||= new ResizeObserver(sizeAura);
    auraObserver.observe(auraHost);
    auraObserver.observe(image);
    const t = visualTheme();
    paintAura(t, portraitEffectColor(t, portraitBackgroundColor()));
    sizeAura();
  }

  let beatPortrait, beatValue = 0, waveBeatValue = 0;
  const beatEnvelope = () => ({ source: undefined, average: 0, recent: 0, impulse: 0, level: 0, cooldown: 0 });
  const portraitBeatState = beatEnvelope(), patternBeatState = beatEnvelope(), waveBeatState = beatEnvelope();
  const patternPreviewBeatState = beatEnvelope();

  function resetBeatEnvelope(state) {
    state.source = undefined;
    state.average = state.recent = state.impulse = state.level = state.cooldown = 0;
  }

  function bassEnvelope(bins, sampleRate) {
    if (!bins) return 0;
    const binHz = sampleRate / (bins.length * 2);
    const from = Math.max(1, Math.ceil(35 / binHz));
    const to = Math.min(bins.length, Math.max(from + 1, Math.ceil(185 / binHz)));
    let peak = 0, power = 0;
    for (let bin = from; bin < to; bin++) {
      const energy = Math.min(1, Math.max(0, (bins[bin] + 79) / 59));
      peak = Math.max(peak, energy);
      power += energy ** 2;
    }
    return to > from ? peak * .67 + Math.sqrt(power / (to - from)) * .33 : 0;
  }

  function stepBeat(state, bass, dt, sensitivity, decay) {
    const threshold = .035 + (1 - sensitivity / 100) * .10;
    const prominence = bass - state.average;
    state.cooldown = Math.max(0, state.cooldown - dt);
    // Follow low-frequency onsets above a rolling average, without flashing for a steady tone.
    if (!state.cooldown && prominence > threshold && bass - state.recent > threshold * .5) {
      state.impulse = Math.max(state.impulse, Math.min(1, (prominence - threshold * .5) * (2.4 + sensitivity / 62)));
      state.cooldown = 115;
    }
    state.average += (bass - state.average) * (1 - Math.exp(-dt / 480));
    state.recent += (bass - state.recent) * (1 - Math.exp(-dt / 78));
    state.level += (state.impulse - state.level) * (1 - Math.exp(-dt / (state.impulse > state.level ? 30 : 75)));
    state.impulse *= Math.exp(-dt / decay);
    if (state.level < .004 && state.impulse < .004) state.level = state.impulse = 0;
    return state.level;
  }

  function followBeat(state, source, bass, dt, sensitivity, decay) {
    if (source !== state.source) {
      state.average = state.recent = state.cooldown = 0;
      state.source = source;
    }
    return stepBeat(state, bass, dt, sensitivity, decay);
  }

  function resetBeat() {
    if (beatValue) {
      beatPortrait?.style.removeProperty('--ymc-beat-pulse');
      beatPortrait?.style.removeProperty('--ymc-beat-spread');
    }
    portraitAura?.style.removeProperty('--ymc-aura-beat');
    beatValue = 0;
    resetBeatEnvelope(portraitBeatState);
  }

  function syncBeatPortrait(fullscreen) {
    const enabled = !fullscreen && !document.hidden && isStyled() && hasBeatAura(theme) && !reducedMotion();
    const next = enabled ? portraitNode : undefined;
    if (next !== beatPortrait) {
      resetBeat();
      beatPortrait = next;
      spectrumCheckAt = 0;
    }
  }

  function paintBeat(t, input, bass, dt) {
    const level = followBeat(portraitBeatState, input, bass, dt, t.portraitBeatSensitivity, t.portraitBeatRelease);
    const value = Math.round(level * t.portraitBeatStrength);
    if (value !== beatValue) {
      if (portraitAura) portraitAura.style.setProperty('--ymc-aura-beat', (value / 100).toFixed(2));
      else {
        if (value) {
          beatPortrait.style.setProperty('--ymc-beat-pulse', Math.min(100, value) + '%');
          beatPortrait.style.setProperty('--ymc-beat-spread', (value * .23).toFixed(1) + 'px');
        } else {
          beatPortrait.style.removeProperty('--ymc-beat-pulse');
          beatPortrait.style.removeProperty('--ymc-beat-spread');
        }
      }
      beatValue = value;
    }
    return level > 0;
  }

  function paintWaveBeat(level) {
    const value = Math.round(level * 100);
    if (value === waveBeatValue) return;
    waveBeatValue = value;
    if (value) activeHero?.style.setProperty('--ymc-wave-beat', String(value / 100));
    else activeHero?.style.removeProperty('--ymc-wave-beat');
  }

  function clearVisualBeats() {
    resetBeat();
    resetBeatEnvelope(patternBeatState);
    resetBeatEnvelope(waveBeatState);
    resetBeatEnvelope(patternPreviewBeatState);
    paintPatternBeat(patternLayer, 0);
    paintPatternBeat($('ymc-pattern-sample'), 0);
    paintWaveBeat(0);
  }

  function releaseSpectrumInput() {
    const input = spectrumInput;
    spectrumInput = undefined;
    if (!input) return;
    // For a native Web Audio graph, disconnect only our analyser branch.
    if (input.node && input.analyser) {
      try { input.node.disconnect(input.analyser); } catch { /* The player already disconnected this node. */ }
    }
    input.stream?.getTracks().forEach(track => track.stop());
  }

  function connectSpectrumInput(input, node) {
    const analyser = node.context.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = .12;
    node.connect(analyser);
    Object.assign(input, { node, analyser, bins: new Float32Array(analyser.frequencyBinCount) });
  }

  function retrySpectrum() {
    spectrumFailures = 0;
    rejectedNative = new WeakSet();
    spectrumRetryAt = spectrumCheckAt = 0;
    releaseSpectrumInput();
    if (spectrumContext?.state === 'suspended') spectrumContext.resume().catch(() => {});
    wakeAudio();
  }

  function syncSpectrumInput(now) {
    const playing = audioCandidates().filter(media => !media.paused && media.readyState >= 2);
    const preferred = playing[0];
    const source = preferred?.currentSrc || preferred?.srcObject;
    if (preferred !== spectrumPreferred || source !== spectrumSource) {
      spectrumPreferred = preferred;
      spectrumSource = source;
      spectrumFailures = 0;
      spectrumRetryAt = 0;
      rejectedNative = new WeakSet();
      releaseSpectrumInput();
    }
    if (!preferred) return 'idle';
    if (!window.AudioContext) return 'unavailable';
    const available = playing.filter(media => media.captureStream || playerAudioNodes.get(media)?.context.state === 'running');
    if (!available.length) {
      releaseSpectrumInput();
      return playing.some(media => playerAudioNodes.get(media)?.context.state === 'suspended') ? 'connecting' : 'unavailable';
    }
    const media = available[spectrumFailures % available.length];
    const native = playerAudioNodes.get(media);
    const nativeSource = native?.context.state === 'running' && !rejectedNative.has(media) ? native : null;
    const mediaSource = media.currentSrc || media.srcObject;
    if (spectrumInput && (spectrumInput.media !== media || spectrumInput.source !== mediaSource)) releaseSpectrumInput();
    if (spectrumInput && !spectrumInput.stream && !nativeSource && media.captureStream) releaseSpectrumInput();
    if (!spectrumInput && now >= spectrumRetryAt) {
      const input = { media, source: mediaSource, signalAt: now };
      try {
        if (nativeSource) {
          connectSpectrumInput(input, nativeSource);
        } else {
          if (!media.captureStream) return 'unavailable';
          if (!navigator.userActivation?.hasBeenActive && !spectrumContext) return 'activation';
          if (!spectrumContext || spectrumContext.state === 'closed') {
            spectrumContext = new AudioContext();
            spectrumContext.resume().catch(() => {});
          }
          input.stream = media.captureStream();
        }
        spectrumInput = input;
      } catch {
        input.stream?.getTracks().forEach(track => track.stop());
        if (nativeSource && media.captureStream) {
          rejectedNative.add(media);
          spectrumRetryAt = now + 120;
        } else {
          spectrumFailures++;
          spectrumRetryAt = now + Math.min(3500, 200 * 2 ** Math.min(spectrumFailures, 5));
        }
      }
    }
    const input = spectrumInput;
    if (!input) return 'retry';
    if (input.stream) {
      const track = input.stream.getAudioTracks().find(item => item.readyState === 'live');
      if (track && track !== input.track) {
        try {
          if (input.node) input.node.disconnect(input.analyser);
          connectSpectrumInput(input, spectrumContext.createMediaStreamSource(new MediaStream([track])));
          input.track = track;
          input.signalAt = now;
        } catch { input.signalAt = Math.min(input.signalAt, now - 1100); }
      }
      if (spectrumContext.state === 'suspended') return 'activation';
    }
    const fallbackReady = input.stream && input.track?.readyState === 'live' && input.heard;
    const silentFor = input.heard ? 8000 : input.analyser ? 1600 : 750;
    if (!fallbackReady && now - input.signalAt > silentFor) {
      releaseSpectrumInput();
      if (!input.stream && media.captureStream) {
        rejectedNative.add(media);
        spectrumRetryAt = now + 120;
      } else {
        // A native branch may recover after the fallback has failed.
        if (input.stream) rejectedNative.delete(media);
        spectrumFailures++;
        spectrumRetryAt = now + Math.min(3500, 180 * 2 ** Math.min(spectrumFailures, 5));
      }
      return 'retry';
    }
    return 'connecting';
  }

  function mountSpectrumCanvas() {
    barCanvas = document.createElement('canvas');
    barCanvas.dataset.ymcSpectrum = '';
    barCanvas.setAttribute('aria-hidden', 'true');
    pageSpectrum = document.createElement('div');
    pageSpectrum.dataset.ymcPageSpectrum = '';
    pageSpectrum.setAttribute('aria-hidden', 'true');
  }

  function spectrumSurface(canvas) {
    let surface = spectrumSurfaces.get(canvas);
    if (surface) return surface;
    surface = { draw: canvas.getContext('2d'), width: canvas.clientWidth, height: canvas.clientHeight };
    new ResizeObserver(([entry]) => {
      surface.width = entry.contentRect.width;
      surface.height = entry.contentRect.height;
      syncSpectrumAnimation(true);
    }).observe(canvas);
    spectrumSurfaces.set(canvas, surface);
    return surface;
  }

  let bandKey = '', bandMap = [];
  function spectrumBands(count, sampleRate, length) {
    const key = `${count}/${sampleRate}/${length}`;
    if (key === bandKey) return bandMap;
    bandKey = key;
    const topHz = Math.min(16000, sampleRate * .46);
    const binHz = sampleRate / (2 * length);
    bandMap = Array.from({ length: count }, (_, i) => {
      const low = 32 * (topHz / 32) ** (i / count) / binHz;
      const high = 32 * (topHz / 32) ** ((i + 1) / count) / binHz;
      const middle = (low + high) * .5, index = Math.floor(middle);
      return { index, fraction: middle - index, from: Math.ceil(low), to: high - low > 1.25 ? Math.ceil(high) : 0 };
    });
    return bandMap;
  }

  function updateSpectrumLevels(t, bins, sampleRate, dt, levels = spectrumLevels, peaks = spectrumPeaks) {
    const count = t.spectrumBands, response = t.spectrumResponse / 100;
    const attack = 1 - Math.exp(-dt / (12 + (1 - response) * 155));
    const release = 1 - Math.exp(-dt / (72 + (1 - response) * 350));
    const bands = bins && spectrumBands(count, sampleRate, bins.length);
    const curve = t.spectrumDynamics === 'punch' ? 1.9 : t.spectrumDynamics === 'soft' ? 1.05 : 1.4;
    const gain = t.spectrumGain * .0142;
    for (let i = 0; i < count; i++) {
      let target = 0;
      if (bins) {
        const { index, fraction, from, to } = bands[i];
        const a = Math.max(-110, bins[index]), b = Math.max(-110, bins[index + 1]);
        let energy = a + (b - a) * fraction;
        for (let bin = from; bin < to; bin++) energy = Math.max(energy, bins[bin] - 3);
        const norm = Math.max(0, (energy + 83 + i / count * 9) / 62);
        target = 1 - Math.exp(-(norm ** curve) * gain);
      }
      const previous = levels[i];
      const level = previous + (target - previous) * (target > previous ? attack : release);
      levels[i] = level < .001 ? 0 : level;
      peaks[i] = Math.max(level, peaks[i] - dt / (370 + (1 - response) * 480));
    }
  }

  function spectrumGradient(draw, width, base, crest, t, coverColors) {
    if (t.spectrumGradient === 'solid') return coverColors ? t.spectrumMid : t.spectrumStart;
    const horizontal = t.spectrumGradient === 'horizontal';
    const startY = horizontal ? 0 : base;
    const endX = t.spectrumGradient === 'vertical' ? 0 : width;
    const fill = draw.createLinearGradient(0, startY, endX, horizontal ? 0 : crest);
    fill.addColorStop(0, t.spectrumStart);
    fill.addColorStop(.5, t.spectrumMid);
    fill.addColorStop(1, t.spectrumEnd);
    return fill;
  }

  function spectrumCurve(points, width, base, share = 1) {
    const path = new Path2D();
    const y = point => base + (point.y - base) * share;
    path.moveTo(0, y(points[0]));
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      path.quadraticCurveTo(a.x, y(a), (a.x + b.x) / 2, (y(a) + y(b)) / 2);
    }
    path.quadraticCurveTo(points.at(-1).x, y(points.at(-1)), width, y(points.at(-1)));
    return path;
  }

  function paintSpectrum(canvas, t, levels, peaks, signal) {
    const surface = spectrumSurface(canvas);
    const { draw, width, height } = surface;
    if (!width || !height || !draw) return;
    const ratio = Math.min(devicePixelRatio || 1, 3);
    const pixelWidth = Math.max(1, Math.round(width * ratio)), pixelHeight = Math.max(1, Math.round(height * ratio));
    const resized = canvas.width !== pixelWidth || canvas.height !== pixelHeight;
    if (resized) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    if (resized || width !== surface.scaledWidth || height !== surface.scaledHeight) {
      draw.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      surface.scaledWidth = width;
      surface.scaledHeight = height;
    }
    const base = height;
    const count = t.spectrumBands, step = width / count;
    const coverColors = smartOn(t, 'smartSpectrum');
    let highest = base;
    const points = signal ? Array.from({ length: count }, (_, i) => {
      const fraction = (i + .5) / count;
      const index = t.spectrumLayout === 'mirror' ? Math.floor(Math.abs(2 * fraction - 1) * count) : i;
      const taper = 1 - t.spectrumTaper / 100 * (1 - Math.sin(Math.PI * fraction) ** .65);
      const extent = (height - Math.max(9, height * .09)) * taper;
      const y = base - levels[index] * extent;
      highest = Math.min(highest, y);
      return { x: step * (i + .5), y, peak: base - peaks[index] * extent };
    }) : [];
    const fitGradient = coverColors && signal && (t.spectrumGradient === 'vertical' || t.spectrumGradient === 'diagonal');
    if (fitGradient) {
      const previousCrest = resized ? highest : surface.crest ?? highest;
      surface.crest = previousCrest + (highest - previousCrest) * .25;
    } else surface.crest = undefined;
    const fillCrest = fitGradient ? Math.max(0, Math.min(base - 1, Math.round(surface.crest / 8) * 8)) : 0;
    const key = [width, base, fillCrest, ratio, coverColors, t.spectrumGradient, t.spectrumStart, t.spectrumMid, t.spectrumEnd].join('/');
    const idleKey = signal ? '' : key + '/' + t.spectrumIdle + '/' + t.spectrumLineWidth;
    if (idleKey && surface.idleKey === idleKey && !resized) return;
    surface.idleKey = idleKey;
    if (surface.colorKey !== key) {
      surface.colorKey = key;
      surface.fill = spectrumGradient(draw, width, base, fillCrest, t, coverColors);
    }
    const fadeKey = [height, ratio, coverColors].join('/');
    if (surface.fadeKey !== fadeKey) {
      surface.fadeKey = fadeKey;
      const fade = draw.createLinearGradient(0, height, 0, 0);
      fade.addColorStop(0, coverColors ? '#0009' : '#0005');
      fade.addColorStop(.44, coverColors ? '#000F' : '#000D');
      fade.addColorStop(1, '#000');
      surface.fade = fade;
    }
    draw.clearRect(0, 0, width, height);
    draw.save();
    const barWidth = Math.max(1, step * t.spectrumWidth / 100);
    const overlay = t.spectrumOverlayAmount / 100;
    const fill = surface.fill;
    draw.fillStyle = draw.strokeStyle = fill;
    draw.lineWidth = t.spectrumLineWidth;
    draw.lineJoin = draw.lineCap = 'round';
    if (!signal) {
      if (t.spectrumIdle === 'line') {
        draw.globalAlpha = .33;
        const line = Math.max(1, t.spectrumLineWidth * .55);
        draw.fillRect(0, base - line, width, line);
      }
      draw.restore();
      return;
    }
    if (t.spectrumOverlay === 'grid' && overlay) {
      draw.globalAlpha = overlay * .52;
      draw.lineWidth = 1;
      draw.beginPath();
      for (let row = 1; row <= 4; row++) {
        const y = Math.round(base * row / 5) + .5;
        draw.moveTo(0, y);
        draw.lineTo(width, y);
      }
      draw.stroke();
    }
    if (t.spectrumOverlay === 'echo' && overlay) {
      draw.globalAlpha = overlay * .56;
      draw.lineWidth = Math.max(1, t.spectrumLineWidth * .7);
      draw.stroke(spectrumCurve(points, width, base, .58));
    }
    draw.globalAlpha = .95;
    draw.lineWidth = t.spectrumLineWidth;
    draw.shadowColor = rgba(t.spectrumMid, 70);
    draw.shadowBlur = t.spectrumGlow * .21 * ratio;
    if (t.spectrumStyle === 'wave' || t.spectrumStyle === 'line') {
      const crest = spectrumCurve(points, width, base);
      if (t.spectrumStyle === 'wave') {
        const ribbon = new Path2D(crest);
        ribbon.lineTo(width, base);
        ribbon.lineTo(0, base);
        ribbon.closePath();
        draw.globalAlpha = .42;
        draw.fill(ribbon);
        draw.globalAlpha = .97;
      }
      draw.stroke(crest);
    } else {
      const shape = new Path2D(), tips = new Path2D();
      const segmentHeight = Math.max(2, height / 18);
      for (const { x, y, peak } of points) {
        const length = base - y;
        if (length < 1) continue;
        const left = x - barWidth / 2;
        const round = Math.min(t.spectrumRound, barWidth / 2);
        if (t.spectrumStyle === 'dots') {
          const radius = Math.min(barWidth * .45, 1.8 + length * .055);
          shape.moveTo(x + radius, y);
          shape.arc(x, y, radius, 0, 2 * Math.PI);
        } else if (t.spectrumStyle === 'segments') {
          for (let offset = 0; offset < length; offset += segmentHeight + 2) {
            const size = Math.min(segmentHeight, length - offset);
            if (size > 1) shape.roundRect(left, base - offset - size, barWidth, size, Math.min(round, size / 2));
          }
        } else {
          shape.roundRect(left, y, barWidth, length, [Math.min(round, length / 2), Math.min(round, length / 2), 0, 0]);
        }
        if (t.spectrumPeaks && t.spectrumStyle !== 'dots' && base - peak > 4) {
          tips.roundRect(left, Math.max(1, peak - 3), barWidth, 1.6, .8);
        }
      }
      draw.fill(shape);
      draw.shadowBlur = 0;
      draw.fill(tips);
    }
    draw.shadowBlur = 0;
    draw.globalAlpha = 1;
    draw.globalCompositeOperation = 'destination-in';
    draw.fillStyle = surface.fade;
    draw.fillRect(0, 0, width, height);
    draw.restore();
  }

  function syncBottomBar(fullscreen) {
    const enabled = isStyled() && !fullscreen;
    const onPage = enabled && theme.barSpectrum && theme.spectrumPlacement === 'page';
    const inBar = enabled && theme.barSpectrum && theme.spectrumPlacement === 'bar';
    const player = enabled && (theme.barCustom || inBar)
      ? [...document.querySelectorAll(SELECTOR.player)].find(el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible') : null;
    if (player && !barBackdrop) {
      barBackdrop = document.createElement('div');
      barBackdrop.dataset.ymcBarBackdrop = '';
      barBackdrop.setAttribute('aria-hidden', 'true');
    }
    if (player && barBackdrop.parentElement !== player) player.prepend(barBackdrop);
    if (!player) barBackdrop?.remove();
    if ((onPage || (inBar && player)) && !barCanvas) mountSpectrumCanvas();
    if (onPage && !pageSpectrum.isConnected) document.body.append(pageSpectrum);
    if (!onPage) pageSpectrum?.remove();
    const spectrumParent = onPage ? pageSpectrum : inBar && player ? barBackdrop : null;
    if (spectrumParent && barCanvas.parentElement !== spectrumParent) spectrumParent.append(barCanvas);
    if (!spectrumParent) barCanvas?.remove();
    const status = $('ymc-bar-status');
    if (!isStyled() || !theme.barSpectrum) setText(status, '');
    else if (!spectrumParent) setText(status, 'Эквалайзер появится, когда откроется выбранная область.');
    syncSpectrumAnimation();
  }

  const SPECTRUM_STATUS = {
    idle: 'Запустите трек, чтобы увидеть реакцию на звук.',
    connecting: 'Подключаемся к звуку. В тишине рисунок плавно затихает.',
    activation: 'Нажмите «Подключить звук» или запустите трек кнопкой плеера.',
    retry: 'Сигнал пока недоступен. Подключение повторится автоматически.',
    unavailable: 'У этого источника нет доступного аудиопотока.',
    live: 'Эквалайзер реагирует на звук.'
  };
  let spectrumConnection = 'idle';
  const previewActive = () => previewSession?.kind === 'spectrum' && activeDialog === 'editor' &&
    editorTab === 'theme' && !$('ymc-spectrum-preview').closest('.settings-content')?.inert;
  const backgroundSpectrumActive = () => Boolean(barCanvas?.isConnected);
  const patternReacts = t => t.patternBeatEffect !== 'off' && t.patternBeatStrength > 0 && t.patternOpacity > 0;

  function activeAudioEffects() {
    if (reducedMotion()) return [];
    const sample = $('ymc-pattern-sample');
    const preview = previewSession?.kind === 'pattern' && activeDialog === 'editor' && editorTab === 'theme' &&
      !sample.hidden && !sample.closest('.settings-content')?.inert && patternReacts(editorTheme());
    return [beatPortrait?.isConnected, patternLayer?.isConnected && patternReacts(theme),
      activeHero?.isConnected && recoloredWave(theme) && theme.waveBeat > 0 && theme.waveOpacity > 0, preview];
  }

  function paintAudioEffects([portrait, pattern, wave, preview], t, input, bins, dt, now) {
    const bass = portrait || pattern || wave || preview ? bassEnvelope(bins, input?.analyser?.context.sampleRate || 48000) : 0;
    const patternLevel = (state, settings, signal) => followBeat(state, input, signal, dt,
      settings.patternBeatSensitivity, settings.patternBeatRelease) * settings.patternBeatStrength / 100;
    const portraitFading = portrait && paintBeat(t, input, bass, dt);
    const livePattern = pattern ? patternLevel(patternBeatState, t, bass) : 0;
    const liveWave = wave ? followBeat(waveBeatState, input, bass, dt, 74, 235) * t.waveBeat / 100 : 0;
    if (!pattern) resetBeatEnvelope(patternBeatState);
    if (!wave) resetBeatEnvelope(waveBeatState);
    paintPatternBeat(patternLayer, livePattern, now);
    paintWaveBeat(liveWave);
    if (preview) {
      const pulse = bins ? bass : Math.exp(-8 * (now / 720 % 1));
      paintPatternBeat($('ymc-pattern-sample'), patternLevel(patternPreviewBeatState, editorTheme(), pulse), now);
    } else {
      resetBeatEnvelope(patternPreviewBeatState);
      paintPatternBeat($('ymc-pattern-sample'), 0);
    }
    return portraitFading || livePattern > 0 || liveWave > 0 || preview;
  }

  function spectrumTick(now) {
    spectrumFrame = undefined;
    const background = backgroundSpectrumActive();
    const overlay = overlaySpectrum && theme.visualizer && activeDialog === 'now';
    const preview = previewActive();
    const effects = activeAudioEffects();
    if (document.hidden || !(background || overlay || preview || effects.some(Boolean))) {
      clearVisualBeats();
      releaseSpectrumInput();
      spectrumSignal = 'idle';
      return;
    }
    if (now >= spectrumCheckAt) {
      spectrumCheckAt = now + 100;
      if (isStyled()) spectrumConnection = syncSpectrumInput(now);
      else {
        releaseSpectrumInput();
        spectrumConnection = 'idle';
      }
    }
    const input = spectrumInput;
    let bins;
    if (input?.analyser?.context.state === 'running' && !input.media.paused) {
      input.analyser.getFloatFrequencyData(input.bins);
      if (input.bins.some(value => value > -88)) {
        bins = input.bins;
        input.signalAt = now;
        input.heard = true;
      }
    }
    spectrumSignal = bins ? 'live' : spectrumConnection;
    const t = visualTheme();
    const dt = Math.min(70, now - (lastSpectrumFrame || now - 16));
    lastSpectrumFrame = now;
    const drawSpectrum = background || overlay;
    if (drawSpectrum) updateSpectrumLevels(t, bins, input?.analyser?.context.sampleRate || 48000, dt);
    const fading = drawSpectrum && spectrumLevels.subarray(0, t.spectrumBands).some(level => level > .004);
    const beatFading = paintAudioEffects(effects, t, input, bins, dt, now);
    if (background && activeDialog !== 'now') {
      if (barCanvas.dataset.signal !== spectrumSignal) barCanvas.dataset.signal = spectrumSignal;
      setText($('ymc-bar-status'), SPECTRUM_STATUS[spectrumSignal]);
      paintSpectrum(barCanvas, t, spectrumLevels, spectrumPeaks, fading);
    }
    if (overlay) paintSpectrum($('ymc-spectrum'), t, spectrumLevels, spectrumPeaks, fading);
    if (preview) {
      const sample = previewVisual('spectrum');
      if (bins) updateSpectrumLevels(sample, bins, input.analyser.context.sampleRate, dt, previewLevels, previewPeaks);
      else {
        const time = reducedMotion() ? 0 : now / 900;
        for (let i = 0; i < sample.spectrumBands; i++) {
          const position = i / sample.spectrumBands;
          const envelope = .65 * Math.exp(-position * 2.4) + .20;
          const signal = envelope * (.56 + .22 * Math.cos(position * 25 + time) + .16 * Math.sin(position * 52 - time * 1.4));
          demoLevels[i] = Math.min(1, signal * sample.spectrumGain / 125);
        }
      }
      const previewCanvas = $('ymc-spectrum-preview');
      previewCanvas.style.opacity = String(sample.spectrumOpacity / 100);
      paintSpectrum(previewCanvas, sample, bins ? previewLevels : demoLevels, bins ? previewPeaks : demoLevels, true);
      setText($('ymc-spectrum-preview-label'), bins ? 'Сигнал текущего трека' : 'Макет без звука');
    }
    if (spectrumSignal !== 'idle' || fading || beatFading || preview && !reducedMotion()) {
      spectrumFrame = requestAnimationFrame(spectrumTick);
    } else {
      // Refresh and media events wake the canvas; a paused track needs no frame loop.
      spectrumCheckAt = now + 350;
    }
  }

  function syncSpectrumAnimation(force = false) {
    if (!shadow) return;
    if (!document.hidden && (backgroundSpectrumActive() || overlaySpectrum || previewActive() || activeAudioEffects().some(Boolean))) {
      if (spectrumFrame === undefined && (force || performance.now() >= spectrumCheckAt)) {
        if (force) spectrumCheckAt = 0;
        spectrumFrame = requestAnimationFrame(spectrumTick);
      }
      return;
    }
    if (spectrumFrame !== undefined) cancelAnimationFrame(spectrumFrame);
    spectrumFrame = undefined;
    spectrumSignal = 'idle';
    clearVisualBeats();
    releaseSpectrumInput();
    spectrumCheckAt = lastSpectrumFrame = 0;
    spectrumPreferred = spectrumSource = undefined;
  }

  function stopSpectrum() {
    overlaySpectrum = false;
    syncSpectrumAnimation();
  }

  const STYLE = `
    :host{all:initial;color-scheme:dark;--bg:#15131c;--player-bg:var(--bg);--fg:#f6f1ff;--accent:#bd8cff;--art-start:var(--bg);--art-end:var(--accent);--muted:color-mix(in srgb,var(--fg) 78%,var(--bg));--border:color-mix(in srgb,var(--fg) 18%,var(--bg));--control:color-mix(in srgb,var(--fg) 7%,var(--bg));--hover:color-mix(in srgb,var(--accent) 24%,var(--bg));font:14px/1.45 system-ui,"Segoe UI",sans-serif;color:var(--fg)}
    *,*::before,*::after{box-sizing:border-box}
    [hidden]{display:none!important}
    button,input,select,textarea{font:inherit}
    button{cursor:pointer}
    button:disabled{opacity:.45;cursor:default}
    :focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .btn{padding:8px 12px;border:1px solid var(--border);border-radius:9px;background:var(--control);color:var(--fg);font-weight:600}
    .btn:hover:not(:disabled){background:var(--hover)}
    .head-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .btn.primary{background:var(--hover);border-color:var(--accent)}
    .shade{position:fixed;inset:0;background:#090610ad;pointer-events:auto}
    #ymc-editor{position:fixed;inset:0 0 0 auto;width:var(--ymc-dock);pointer-events:auto;display:flex;flex-direction:column}
    .panel{position:relative;flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;background:var(--bg);border-left:1px solid var(--border);padding:0 clamp(10px,2vw,20px) 24px}
    #ymc-resize{position:absolute;inset:0 auto 0 -6px;width:12px;z-index:5;cursor:ew-resize;touch-action:none;user-select:none}
    #ymc-resize::after{content:"";position:absolute;top:50%;left:4px;width:4px;height:44px;translate:0 -50%;border-radius:6px;background:var(--muted);opacity:.45}
    #ymc-resize:is(:hover,:focus-visible)::after,#ymc-editor[data-resizing] #ymc-resize::after{height:58px;background:var(--accent);opacity:1}
    .editor-footer{position:relative;z-index:4;flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;
      padding:8px clamp(10px,2vw,20px);background:var(--bg);border-top:1px solid var(--border);border-left:1px solid var(--border)}
    .editor-footer .muted{margin:0;font-variant-numeric:tabular-nums}
    .update-trigger{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;font-size:12px}
    .update-trigger svg{width:15px;height:15px}
    .update-trigger[data-available]{border-color:var(--accent)}
    .update-card{position:absolute;inset:auto 10px calc(100% + 8px);padding:12px;max-height:min(54vh,440px);
      overflow:auto;overscroll-behavior:contain;background:var(--bg);border:1px solid var(--border);
      border-radius:13px;box-shadow:0 8px 28px #0007}
    .update-card .buttons{margin-bottom:0}
    #ymc-update-notes{white-space:pre-wrap}
    .update-toast{position:fixed;top:36px;right:clamp(12px,calc(var(--ymc-reserved-width) + 12px),max(12px,calc(100vw - 354px)));
      z-index:8;width:min(342px,calc(100vw - 24px));padding:12px;pointer-events:auto;touch-action:pan-y;
      background:var(--bg);border:1px solid var(--accent);border-radius:13px;box-shadow:0 8px 26px #0006}
    .update-toast-head{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}
    .update-toast-head strong{font-size:13px}
    .update-toast .muted{margin:2px 0 0}
    .update-toast .btn{padding:5px 9px;font-size:12px}
    #ymc-update-toast-open{margin-top:8px}
    .head{position:sticky;top:0;background:var(--bg);padding:14px 0 9px;border-bottom:1px solid var(--border);z-index:2}
    .headrow,.line,.tabs{display:flex;align-items:center;gap:10px}
    .headrow,.line{justify-content:space-between}
    .head .headrow{flex-wrap:wrap;row-gap:6px}
    .tabs,.shop-nav,.editor-tools{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
    .tabs{padding:8px 0;margin-top:6px;border-radius:11px}
    .tabs button,.shop-nav button,.editor-tools button{white-space:nowrap;font-size:12px;padding:6px 8px}
    .tabs [aria-pressed=true],.shop-nav [aria-pressed=true],.editor-tools [aria-pressed=true]{border-color:var(--accent);background:var(--hover)}
    .head-actions button:is(#ymc-undo,#ymc-redo){padding:5px 10px;font-size:17px;line-height:1.2}
    .head-actions .head-icon{min-width:32px;padding:5px 8px;font-size:16px;line-height:1.25}
    .editor-tools input{flex:1 1 120px;min-width:100px;font-size:12px}
    .shop-nav{margin-top:8px}
    .settings-results{max-height:25vh;overflow:auto;overscroll-behavior:contain;margin-top:7px;padding:6px;border:1px solid var(--border);border-radius:9px;background:var(--control)}
    .settings-results button{display:block;width:100%;text-align:start;padding:6px 8px;border:0;border-radius:6px;background:transparent;color:var(--fg);font-size:12px}
    .settings-results button:hover,.settings-results button:focus-visible{background:var(--hover)}
    .settings-results small{display:block;color:var(--muted);font-size:11px}
    .settings-results p{margin:4px 8px}
    .pane-intro{padding:15px 0 6px;color:var(--muted)}
    .pane-intro h2{color:var(--fg);font-size:16px;letter-spacing:0}
    .pane-intro p{font-size:12px}
    .section-label{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:18px 0 7px}
    .settings-section{border:1px solid var(--border);border-radius:12px;background:var(--control);margin:7px 0;padding:0;overflow:clip}
    .settings-section[data-feature]{border-color:color-mix(in srgb,var(--accent) 33%,var(--border))}
    .settings-heading{display:flex;align-items:center;gap:10px;padding-inline-end:12px}
    .settings-heading h3{flex:1;min-width:0;margin:0;text-transform:none;letter-spacing:0}
    .section-toggle{width:100%;display:flex;align-items:center;gap:10px;justify-content:space-between;text-align:start;
      background:transparent;color:var(--fg);border:0;padding:10px 12px;border-radius:10px}
    .section-toggle:hover{background:var(--hover)}
    .section-toggle strong,.section-toggle small{display:block;overflow-wrap:anywhere}
    .section-toggle strong{font-size:13px;font-weight:675}
    .section-toggle small{font-size:11px;font-weight:400;color:var(--muted);margin-top:1px}
    .section-arrow{flex:none;font-size:16px;line-height:1;transition:rotate .18s ease;color:var(--muted)}
    .section-toggle[aria-expanded=true] .section-arrow{rotate:90deg}
    .section-switch{margin:0!important}
    .section-switch label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    .section-switch input{appearance:none;margin:0;width:34px;height:20px;border:1px solid var(--border);
      border-radius:14px;background:var(--bg);display:grid;align-items:center;padding:2px;cursor:pointer}
    .section-switch input::before{content:"";width:14px;height:14px;border-radius:50%;background:var(--muted);transition:translate .17s ease}
    .section-switch input:checked{background:var(--accent);border-color:var(--accent)}
    .section-switch input:checked::before{translate:13px;background:var(--store-cta-fg,var(--bg))}
    .settings-fold{--fold-duration:205ms;--fold-easing:cubic-bezier(.22,.7,.25,1);display:grid;grid-template-rows:1fr;opacity:1;visibility:visible;
      transition:grid-template-rows var(--fold-duration) var(--fold-easing),opacity 155ms ease;min-width:0}
    .settings-fold[inert]{grid-template-rows:0fr;opacity:0;pointer-events:none;visibility:hidden;
      transition:grid-template-rows var(--fold-duration) var(--fold-easing),opacity 155ms ease,visibility 0s var(--fold-duration)}
    .settings-fold[data-jump],.settings-fold[data-jump] .settings-fold{transition:none}
    .settings-inner{min-height:0;overflow:hidden;min-width:0}
    .settings-content>.settings-inner>.settings-pad{padding:7px 12px 12px}
    .settings-content>.settings-inner>.settings-pad::after{content:"";display:block;clear:both}
    .settings-section :is(input[type=color],input[type=text],select,textarea){background:var(--bg)}
    .settings-section .block-reset{float:none;margin:10px 0 0}
    .settings-more{border:1px solid var(--border);border-radius:9px;margin:10px 0 0;padding:8px 10px}
    .settings-more summary{cursor:pointer;color:var(--fg);font-size:12px;font-weight:650}
    .settings-more[open] summary{margin-bottom:8px}
    .settings-more .grid{margin-bottom:7px}
    #ymc-theme-status{padding:9px 0 6px;border:0}
    #ymc-theme-status h3{display:none}
    #ymc-theme-status .line{margin:0 0 7px}
    #ymc-smart-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0}
    #ymc-smart-preview span{min-width:0;display:grid;gap:2px;padding:4px 5px;border:1px solid var(--border);
      border-radius:6px;color:var(--muted);font-size:10px}
    #ymc-smart-preview span::before{content:"";height:10px;background:var(--role-color);border-radius:4px}
    #ymc-smart-preview span[data-role=spectrumMid]::before{background:var(--role-spectrum)}
    #ymc-smart-preview code{font-size:10px;overflow:hidden;text-overflow:ellipsis}
    .spectrum-sample{margin:7px 0;border:1px solid var(--border);border-radius:9px;overflow:hidden;background:linear-gradient(155deg,var(--art-start),var(--art-end))}
    #ymc-spectrum-preview{display:block;width:100%;height:112px;margin:0;opacity:var(--ymc-spectrum-alpha,1)}
    .spectrum-sample p{margin:0;padding:4px 7px;background:var(--bg)}
    @media(prefers-reduced-motion:reduce){.settings-fold,.settings-fold[inert],.section-arrow,.section-switch input::before{transition:none}}
    .guide-offer{margin-top:12px;padding:12px;border:1px solid var(--accent);border-radius:12px;background:var(--hover);color:var(--fg)}
    .guide-offer p{font-size:12px}
    .guide-offer .buttons{margin-bottom:0}
    h2{font-size:20px;letter-spacing:-.4px;margin:0}
    h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin:0 0 12px}
    p{margin:6px 0}
    section{padding:16px 0;border-bottom:1px solid var(--border)}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
    label{display:flex;flex-direction:column;gap:5px;color:var(--muted);font-size:12px}
    input[type=color]{width:100%;height:34px;padding:3px;background:var(--control);border:1px solid var(--border);border-radius:8px;cursor:pointer}
    input[type=range],input[type=checkbox]{accent-color:var(--accent)}
    .line{margin:8px 0}.line input[type=range]{width:min(40%,200px)}.line label{flex:1}
    .range-value{display:flex;align-items:center;min-width:59px;gap:3px;font-size:11px;color:var(--muted)}
    .range-value input{width:53px;padding:3px 4px;border:1px solid var(--border);border-radius:6px;background:var(--control);color:var(--fg);font-size:12px;font-variant-numeric:tabular-nums}
    input:disabled,select:disabled{opacity:.48;cursor:default}
    .block-reset{float:right;font-size:11px;padding:3px 7px;margin:-4px 0 3px 8px}
    input[type=text],input[type=search],select,textarea{width:100%;padding:8px;background:var(--control);color:var(--fg);border:1px solid var(--border);border-radius:9px}
    textarea{min-height:150px;resize:vertical;font:12px/1.4 Consolas,monospace}
    .buttons{display:flex;flex-wrap:wrap;gap:7px;margin:9px 0}
    .muted,.notice,.error{font-size:12px;color:var(--muted);overflow-wrap:anywhere}
    .error{color:#ffb4b4}.error:empty,.notice:empty{display:none}
    .pill{font-size:11px;color:var(--fg);background:var(--control);border-radius:99px;padding:4px 8px;display:inline-block}
    .preview-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:7px;padding:6px 8px;border:1px solid var(--accent);
      border-radius:9px;background:var(--control)}
    .preview-toolbar p{flex:1 1 130px;margin:0}
    .preview-toolbar .btn{padding:5px 8px;font-size:12px}
    .pattern-sample{position:relative;height:110px;isolation:isolate;overflow:hidden;margin:9px 0;border:1px solid var(--border);
      border-radius:10px;background:linear-gradient(145deg,var(--art-start),var(--art-end))}
    ${patternRules('.pattern-sample')}
    .pattern-seed{display:flex;align-items:end;gap:8px;flex-wrap:wrap;margin:8px 0}
    .pattern-seed input{padding:5px;max-width:98px;border:1px solid var(--border);border-radius:7px;background:var(--bg);color:var(--fg)}
    .portrait-preview{display:flex;align-items:center;gap:10px;min-height:116px;margin:9px 0 12px;padding:4px 12px;border:1px solid var(--border);border-radius:12px;background:linear-gradient(135deg,var(--art-start),var(--art-end));overflow:hidden}
    .portrait-preview svg{flex:none;width:108px;height:108px}
    .portrait-preview-label{padding:5px 8px;border-radius:8px;background:var(--bg);color:var(--fg);font-size:12px}
    .portrait-chip{display:inline-block;width:10px;height:10px;margin-inline-end:5px;border:1px solid var(--fg);border-radius:50%}
    .playlist-preview{display:grid;gap:9px;padding:13px;margin:10px 0 12px;border:1px solid var(--border);border-radius:12px;color:var(--playlist-ink)}
    .playlist-preview-nav{display:flex;gap:6px}
    .playlist-preview-nav span{display:grid;place-items:center;width:25px;height:25px;font-size:18px;line-height:1;background:var(--playlist-nav);color:var(--playlist-nav-ink);border-radius:var(--playlist-nav-round)}
    .playlist-preview-title,.playlist-preview-controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
    .playlist-preview-title small,.playlist-preview-title strong{display:block}
    .playlist-preview-title strong{font-size:16px}
    .playlist-preview-cover{width:42px;height:42px;display:grid;place-items:center;border-radius:var(--playlist-cover,9px);background:linear-gradient(135deg,#ef795e,#9d2334);color:#ffe2da;font-size:21px}
    .playlist-preview-controls span{padding:5px 9px;border-radius:var(--playlist-round,20px);background:var(--button-fill);color:var(--button-ink);font-size:11px;font-weight:700}
    .playlist-preview-controls span:hover{background:var(--button-hover);color:var(--button-hover-ink)}
    .playlist-preview-controls [data-preview=filter]{box-shadow:inset 0 0 0 1px var(--playlist-filter-border)}
    .playlist-preview-controls [data-selected]{box-shadow:inset 0 0 0 1px var(--playlist-selected)}
    .playlist-preview-search{border-radius:var(--playlist-search-round);padding:5px 9px;background:var(--playlist-search);color:var(--playlist-search-ink);font-size:11px}
    .swatches{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 10px}
    .smart-group+.smart-group{border-top:1px solid var(--border)}
    #ymc-contrast-issues{padding-inline-start:18px;margin-block:6px}
    #ymc-palette-variants .btn{padding:4px 7px;font-size:11px}
    #ymc-palette-variants [aria-pressed=true]{background:var(--hover);border-color:var(--accent)}
    .store-heading,.store-tools,.store-save{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}
    .store-heading h2{font-size:24px}.store-heading h2 span{color:var(--accent)}
    .store-tools{margin:9px 0 15px}
    .store-groups{display:flex;gap:5px;flex-wrap:wrap}
    .store-groups button{padding:6px 9px;border-radius:20px}
    .store-groups [aria-pressed=true]{border-color:var(--accent);background:var(--hover)}
    #ymc-store-search{width:min(240px,100%)}
    .store-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,145px),1fr));gap:9px}
    .store-card{display:grid;gap:6px;min-width:0;padding:7px;border:1px solid var(--border);border-radius:10px;background:var(--control);color:var(--fg)}
    .store-card:hover,.store-card:has([aria-pressed=true]){border-color:var(--accent);background:var(--hover)}
    .store-card-pick{display:grid;grid-template-rows:54px auto auto;gap:4px;text-align:left;padding:0;border:0;background:none;color:inherit;min-width:0}
    .store-card-action{border:0;border-radius:20px;background:var(--accent);color:var(--store-cta-fg);font-weight:700;padding:4px 8px;font-size:11px}
    .store-card-action:hover:not(:disabled){filter:brightness(1.1)}
    .store-card strong,.store-card small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-inline:3px}
    .store-card small{color:var(--muted);white-space:normal;font-size:11px;line-height:1.2}
    .store-preview{display:grid;place-items:center;border-radius:6px;background:linear-gradient(140deg,var(--hover),var(--bg));font-size:22px;color:var(--accent)}
    .palette-gradients{display:flex;flex-wrap:wrap;gap:6px}
    .palette-gradients span{border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:700}
    .store-empty{padding:14px 0}
    .store-save label{flex:1;min-width:min(100%,210px)}
    .head-actions .btn{text-decoration:none}
    .buttons a.btn{text-decoration:none}
    ${AURA_STYLE}
    .portrait-preview-art{position:relative;isolation:isolate;flex:none;width:108px;height:108px}
    #ymc-aura-preview{inset:0}
    .sidebar-items{display:grid;gap:6px;list-style:none;padding:0;margin:10px 0}
    .sidebar-items li{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center;gap:5px}
    .sidebar-items li span{overflow-wrap:anywhere}
    .sidebar-items .btn{padding:5px 8px;min-height:32px}
    [data-auto-locked]{display:none !important}
    .settings-group + .settings-group{margin-top:18px}
    .settings-group > .section-label{margin:0 0 6px 4px}
    [data-section-lock] .section-toggle{opacity:1;cursor:default}
    [data-section-lock] .section-toggle small{display:none}
    [data-section-lock] .section-toggle strong::after{content:"Умная тема";margin-inline-start:8px;font-size:10px;color:var(--muted);font-weight:500}
    [data-section-lock] .section-arrow{visibility:hidden}
    .release-dialog{pointer-events:auto;box-sizing:border-box;width:min(510px,calc(100vw - 32px));max-height:calc(100dvh - 40px);
      border:1px solid var(--border,#8887);border-radius:22px;padding:24px;color:var(--fg,#f8f6ff);background:var(--bg,#21182e);
      box-shadow:0 20px 80px #0006;}
    .release-dialog::backdrop{background:#08061177}
    .release-dialog h2{margin:6px 0;font-size:24px}
    .release-dialog li+li{margin-top:8px}
    .release-dialog header{display:flex;align-items:center;justify-content:space-between;gap:12px}
    @media (prefers-reduced-motion:no-preference){
      .release-dialog[open]{animation:ymc-release-in .22s ease-out both}
      @keyframes ymc-release-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
    }
    .guide-layer{position:fixed;inset:0;z-index:3;pointer-events:none}
    .guide-spot{position:fixed;top:0;left:0;border:2px solid var(--accent);border-radius:12px;box-shadow:0 0 12px var(--hover)}
    .guide-card{position:fixed;top:0;left:0;width:min(316px,calc(100vw - 24px));max-height:min(62dvh,calc(100dvh - 20px));
      overflow:auto;overscroll-behavior:contain;padding:15px;pointer-events:auto;border:1px solid var(--accent);
      border-radius:14px;background:var(--bg);color:var(--fg);box-shadow:0 12px 36px #0008}
    .guide-card h3{font-size:14px;letter-spacing:0;text-transform:none;color:var(--fg);margin:4px 0}
    .guide-card .buttons{margin-bottom:0}
    .guide-all{margin-top:8px;font-size:12px}
    .guide-example{height:49px;display:flex;align-items:center;justify-content:center;gap:5px;overflow:hidden;border:1px solid var(--border);border-radius:8px;margin-top:9px;background:var(--control)}
    .guide-example i{display:block;width:16px;height:23px;border-radius:4px;background:var(--accent);animation:ymc-guide-pulse 1.45s ease-in-out infinite alternate}
    .guide-example i:nth-child(2){animation-delay:-.8s}
    .guide-example i:nth-child(3){animation-delay:-.25s}
    .guide-example i:nth-child(4){animation-delay:-1s}
    .guide-example[data-demo="theme"]{background:linear-gradient(115deg,var(--art-start),var(--art-end),var(--accent))}
    .guide-example[data-demo="cover"]{background:linear-gradient(110deg,#203D32,#394423,#54552A)}
    .guide-example[data-demo="cover"] i{width:27px;height:26px;background:#EFD475;animation:none}
    .guide-example[data-demo="cover"] i:nth-child(1){background:#588D62}
    .guide-example[data-demo="cover"] i:nth-child(3){background:#FBE8AE}
    .guide-example[data-demo="cover"] i:nth-child(4){background:linear-gradient(90deg,#64B97F,#F2D75D,#F3945A)}
    .guide-example[data-demo="spectrum"] i{width:7px;height:28px;background:linear-gradient(var(--accent),#21B3C4);border-radius:8px}
    .guide-example[data-demo="layout"] i{width:32px;border-radius:50%}
    .guide-example[data-demo="library"] i{height:30px;width:44px;background:linear-gradient(140deg,var(--accent),var(--art-end))}
    .guide-example[data-demo="discord"] i{width:26px;height:26px;border-radius:6px}
    .guide-example[data-demo="discord"] b{font-size:11px;margin-left:5px}
    .discord-preview{display:grid;gap:10px;padding:12px;border:1px solid #51525d;border-radius:13px;background:#393a43;color:#f2f3f5}
    .discord-preview-head{font-size:13px;line-height:1.35}
    .discord-preview-body{display:grid;grid-template-columns:62px minmax(0,1fr);gap:10px;align-items:center}
    .discord-art{display:grid;place-items:center;position:relative;width:62px;aspect-ratio:1;border-radius:9px;overflow:hidden;background:#2b2d36;color:#d2d4e0;font-size:24px}
    .discord-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .discord-preview-meta{display:grid;gap:4px;min-width:0;font-size:13px;line-height:1.35}
    .discord-preview-meta>span,.discord-preview-meta>strong{overflow-wrap:anywhere}
    .discord-preview-state{color:#dbdce3}
    .discord-preview-time{display:flex;gap:6px;align-items:center;margin-top:3px;font:11px/1.4 monospace}
    .discord-preview-time progress{flex:1 1 0;min-width:20px;height:5px;accent-color:#f2f3f5}
    .discord-preview .btn{justify-self:start;background:#535563;color:#f2f3f5;border-color:#686a77}
    @keyframes ymc-guide-pulse{from{transform:scaleY(.5);opacity:.65}to{transform:scaleY(1.18);opacity:1}}
    @media(prefers-reduced-motion:reduce){.guide-example i{animation:none}}
    .swatches span{width:25px;height:25px;border:1px solid var(--border);border-radius:5px}
    .focus{display:grid;place-items:center;overflow:auto;padding:18px}
    .now{width:min(500px,100%);max-height:100%;overflow:auto;overscroll-behavior:contain;background:var(--player-bg);--fg:var(--player-fg);color:var(--fg);border:1px solid var(--border);border-radius:20px;padding:18px;box-shadow:0 14px 55px #000a}
    .art{aspect-ratio:1;width:min(44vh,100%);margin:12px auto;border-radius:15px;background:linear-gradient(140deg,var(--art-end),var(--art-start));overflow:hidden;display:grid;place-items:center;color:var(--muted);font-size:44px}
    .art img{width:100%;height:100%;object-fit:cover;grid-area:1/1}.art span{grid-area:1/1}
    .track{text-align:center;overflow-wrap:anywhere}.track h3{font-size:20px;text-transform:none;letter-spacing:0;color:var(--fg);margin:0}
    .controls{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:12px 0}
    .controls svg{display:block;width:16px;height:16px;fill:currentColor}
    .controls [aria-pressed=true]{border-color:var(--accent);color:var(--accent)}
    .timeline{display:flex;align-items:center;gap:9px;font-size:12px;font-variant-numeric:tabular-nums}
    .timeline input,.timeline progress{flex:1;min-width:0}
    canvas{width:100%;height:48px;display:block;margin-top:8px}
  `;

  const range = (key, label) => {
    const [min, max, unit] = RANGES[key];
    const factor = key === 'contrastLevel' ? 10 : 1;
    return `<div class="line"><label for="p-${key}">${label}</label><input type="range" id="p-${key}" data-prop="${key}" min="${min}" max="${max}">
      <span class="range-value"><input type="number" data-number="${key}" min="${min / factor}" max="${max / factor}" step="${1 / factor}" aria-label="${label}, точное значение${unit ? ' (' + unit + ')' : ''}"><span aria-hidden="true">${unit}</span></span></div>`;
  };
  const check = (key, label) => `<div class="line"><label for="p-${key}">${label}</label><input type="checkbox" id="p-${key}" data-prop="${key}"></div>`;
  const swatch = (key, label) => `<label>${label}<input type="color" data-prop="${key}"></label>`;
  const whenAvailable = (key, enable, content) => `<div class="settings-fold" data-available="${key}" data-enable="${enable}">
    <div class="settings-inner">${content}</div></div>`;
  const PANES = {
    theme: ['Тема', 'Цвета по обложке, эквалайзер и узоры на фоне.'],
    layout: ['Главная', 'Всё, что видно на экране «Моей волны».'],
    player: ['Плеер', 'Нижняя панель, расширенное окно и Discord.'],
    playlists: ['Плейлисты', 'Шапка, кнопки и поиск. Настройки действуют и на «Мне нравится».'],
    library: ['Магазин и CSS', 'Готовые темы, ваши сохранения и файлы. Редактор CSS находится в соседнем разделе этой вкладки.'],
    files: ['CSS и файлы', 'Свои правила, совместимый CSS Next Music и обмен файлами темы.']
  };
  const mainPane = pane => pane === 'files' ? 'library' : pane;
  const paneIntro = key => `<div class="pane-intro"><h2>${PANES[key][0]}</h2><p>${PANES[key][1]}</p></div>`;
  const previewButton = (kind, sample, id = '') => `<button ${id ? `id="${id}"` : ''} class="btn" type="button"
    data-appearance-preview="${kind}" aria-controls="${sample}" aria-pressed="false">Предпросмотр</button>`;
  const MARKUP = `
    <div id="ymc-editor" hidden>
      <div id="ymc-resize" role="separator" aria-orientation="vertical" aria-label="Ширина редактора" aria-controls="ymc-panel"
        tabindex="0" title="Перетащите край. Стрелки меняют ширину, двойной щелчок возвращает минимум."></div>
      <aside id="ymc-panel" class="panel" aria-labelledby="ymc-editor-title">
        <header class="head">
          <div class="headrow"><h2 id="ymc-editor-title">YMusic Customizer</h2>
          <div class="head-actions"><button id="ymc-undo" class="btn" title="Отменить изменение (${mac ? '⌘Z' : 'Ctrl+Z'})" aria-label="Отменить изменение">↶</button><button id="ymc-redo" class="btn" title="Вернуть изменение (${mac ? '⌘⇧Z' : 'Ctrl+Y'})" aria-label="Вернуть изменение">↷</button><button id="ymc-guide-open" class="btn head-icon" title="Обучение по текущей вкладке" aria-label="Обучение">?</button><button id="ymc-player-open" class="btn head-icon" title="Открыть расширенный плеер" aria-label="Плеер" hidden>♪</button>
          <button id="ymc-close" class="btn head-icon" aria-label="Закрыть редактор">✕</button></div></div>
          <nav class="tabs" aria-label="Вкладки Customizer">
            <button class="btn" data-tab="theme">Тема</button><button class="btn" data-tab="layout">Главная</button>
            <button class="btn" data-tab="player">Плеер</button><button class="btn" data-tab="playlists">Плейлисты</button>
            <button class="btn" data-tab="library">Магазин и CSS</button>
          </nav>
          <div class="editor-tools">
            <input id="ymc-settings-search" type="search" aria-label="Поиск настроек" placeholder="Найти настройку">
            <button id="ymc-settings-changed" class="btn" aria-pressed="false" title="Показать настройки, которые отличаются от стандартной темы">Изменённые</button>
            <button id="ymc-compare" class="btn" aria-pressed="false" title="Сравнить свою тему со штатным оформлением">Оригинал</button>
          </div>
          <div id="ymc-settings-results" class="settings-results" hidden></div>
          <div id="ymc-preview-toolbar" class="preview-toolbar" hidden>
            <p id="ymc-preview-message" class="muted" role="status"></p>
            <button id="ymc-preview-apply" class="btn primary" type="button">Применить</button>
            <button id="ymc-preview-cancel" class="btn" type="button">Отмена</button>
          </div>
          <nav id="ymc-shop-nav" class="shop-nav" aria-label="Магазин и CSS" hidden>
            <button class="btn" id="ymc-show-catalog">Магазин тем</button><button class="btn" data-tab="files">CSS и файлы</button>
          </nav>
          <p id="ymc-notice" class="notice" role="status"></p><p id="ymc-save-error" class="error" role="alert"></p>
        </header>
        <div id="ymc-guide-offer" class="guide-offer" hidden>
          <div><strong id="ymc-guide-offer-title">Знакомство с Customizer</strong><p id="ymc-guide-offer-text">Пройдите все вкладки и посмотрите, где находятся настройки.</p></div>
          <div class="buttons"><button class="btn primary" id="ymc-guide-start">Начать обучение</button>
            <button class="btn" id="ymc-guide-dismiss">Позже</button></div>
        </div>
        <div data-pane="theme">
          ${paneIntro('theme')}
          <section id="ymc-theme-status"><h3>Текущая тема</h3>${check('enabled', 'Включить Customizer')}<span class="pill" id="ymc-status"></span>
            <label>Название темы<input type="text" data-prop="name" maxlength="60"></label>
            <div class="buttons"><button class="btn" id="ymc-open-store">Открыть магазин тем</button></div>
          </section>
          <section id="ymc-theme-palette"><h3>Палитра</h3><div class="grid">
              ${swatch('accent', 'Акцент')}${swatch('text', 'Заголовки и текст')}${swatch('textSecondary', 'Подписи')}${swatch('background', 'Фон')}${swatch('gradientEnd', 'Конец градиента')}
            </div>
            ${check('customAccentStates', 'Свои оттенки акцента для наведения и нажатия')}
            ${whenAvailable('accentHover', 'customAccentStates', `<div class="grid">${swatch('accentHover', 'При наведении')}${swatch('accentPress', 'При нажатии')}</div>`)}
          </section>
          <section id="ymc-theme-background"><h3>Фон</h3><label>Тип фона<select data-prop="mode">
            <option value="gradient">Градиент</option><option value="solid">Сплошной</option>
            <option value="image">Локальное изображение</option><option value="cover">Обложка текущего трека</option>
            </select></label>
            <div id="ymc-image-options" hidden><div class="buttons">
              <button class="btn" id="ymc-image" data-setting="wallpaper" data-find="Локальная картинка фона">Выбрать изображение</button><button class="btn" id="ymc-image-clear">Убрать изображение</button>
              <input type="file" accept="image/png,image/jpeg,image/webp" id="ymc-file" hidden></div>
              <p id="ymc-image-status" class="muted"></p>
            </div>
            <p id="ymc-cover-status" class="muted" hidden></p>
            ${range('gradientAngle', 'Угол градиента')}${range('backgroundDim', 'Затемнение изображения')}
          </section>
          <section id="ymc-theme-media"><h3>Фон всего приложения</h3>
            ${check('appMediaEnabled', 'Показывать свой фон')}
            ${whenAvailable('appMediaFile', 'appMediaEnabled', `
            <div class="buttons"><button class="btn" id="ymc-vibe-pick" data-setting="vibeMedia" data-find="Выбрать картинку, GIF или видео">Выбрать файл</button>
              <button class="btn" id="ymc-vibe-clear">Убрать файл</button>
              <input type="file" id="ymc-vibe-file" accept=".png,.jpg,.jpeg,.webp,.gif,.mp4,.webm" hidden></div>
            <p class="muted">PNG, JPG, WebP, GIF, MP4 или WebM до 100 МиБ. Видео повторяется без звука.</p>
            <p id="ymc-vibe-status" class="muted" role="status"></p>`)}
            ${whenAvailable('mediaFit', 'appMediaEnabled', `
            <label>Заполнение фото и видео<select data-prop="mediaFit"><option value="cover">Заполнить экран</option><option value="contain">Уместить целиком</option></select></label>
            ${range('mediaX', 'Положение по горизонтали')}${range('mediaY', 'Положение по вертикали')}`)}
            ${whenAvailable('mediaBlur', 'appMediaEnabled', `
              ${range('mediaBlur', 'Размытие файла фона')}${range('mediaOpacity', 'Непрозрачность файла фона')}`)}
            ${whenAvailable('appMediaFile', 'appMediaEnabled', `<div id="ymc-palette" hidden>
              <p class="muted">Палитра из первого кадра</p><div id="ymc-palette-swatches" class="swatches"></div>
              <div class="palette-gradients">
                <span id="ymc-palette-spectrum">Эквалайзер</span><span id="ymc-palette-sidebar" hidden>Боковая панель</span>
              </div>
              <div id="ymc-palette-variants" class="buttons" role="group" aria-label="Вариант палитры">
                ${Object.entries(PALETTE_VARIANTS).map(([key, label]) => `<button class="btn" type="button" data-palette-variant="${key}">${label}</button>`).join('')}
              </div>
              <p class="muted" id="ymc-palette-opacity"></p>
              <button class="btn" id="ymc-apply-palette">Применить палитру и прозрачность</button>
            </div>`)}
          </section>
          <section id="ymc-theme-smart"><h3>Умная тема по обложке</h3>
            ${check('smartTheme', 'Подстраивать оформление под текущий трек')}
            ${whenAvailable('smartStrength', 'smartTheme', `
            <label>Стиль палитры<select data-prop="smartPaletteStyle">
              ${Object.entries(PALETTE_VARIANTS).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}
            </select></label>
            <p class="muted">Стиль «Светлая» сохраняет светлый фон даже у тёмных обложек.</p>
            ${range('smartStrength', 'Общая сила подстройки')}
            <p id="ymc-smart-status" class="muted" role="status"></p>
            <div id="ymc-smart-preview" aria-label="Цвета, рассчитанные для активной умной темы" hidden>${Object.entries({
              background: 'Фон', gradientEnd: 'Градиент', text: 'Текст', vibePlayFill: 'Кнопки',
              portraitColor: 'Аура', spectrumMid: 'Эквалайзер'
            }).map(([role, label]) => `<span data-role="${role}">${label}<code></code></span>`).join('')}</div>
            <details id="ymc-smart-groups" class="settings-more"><summary>Переход и отдельные цвета</summary>
              ${range('smartTransition', 'Длительность перехода')}
              <p class="muted">Каждая включённая группа закрывает свои ручные настройки. Чтобы вернуть их, выключите группу или поставьте её силу на 0%. Ваши прежние значения сохраняются.</p>
              <p class="muted">Автоцвет эквалайзера — один оттенок обложки с плавным изменением яркости. Для своих трёх цветов отключите группу «Эквалайзер» здесь и выберите цвета в карточке эквалайзера.</p>
              ${Object.entries(SMART_GROUPS).map(([key, { label }]) => `<div class="smart-group">
                ${check(key, label)}${whenAvailable(key + 'Amount', key, range(key + 'Amount', 'Сила · ' + label.toLowerCase()))}
              </div>`).join('')}
            </details>`)}
          </section>
          <section id="ymc-theme-pattern"><h3>Узоры на фоне</h3>
            ${check('patternEnabled', 'Показывать узор')}
            <div class="buttons">${previewButton('pattern', 'ymc-pattern-sample')}</div>
            <div id="ymc-pattern-sample" class="pattern-sample" aria-hidden="true" hidden>${patternMarkup('ymc-pattern-preview-tile')}</div>
            ${whenAvailable('patternStyle', 'patternEnabled', `
              <div class="grid">
                <label>Рисунок<select data-prop="patternStyle">${Object.entries(PATTERNS).map(([key, label]) =>
                  `<option value="${key}">${label}</option>`).join('')}</select></label>
                <label>Где показывать<select data-prop="patternScope"><option value="app">Во всём приложении</option><option value="wave">Только «Моя волна»</option></select></label>
              </div>
              ${whenAvailable('patternSymbols', 'patternStyle', `<label>Свои символы<input type="text" data-prop="patternSymbols" maxlength="32" placeholder="✦ ◇ ♪"></label>`)}
              ${range('patternOpacity', 'Видимость узора')}${range('patternDensity', 'Плотность рисунка')}${range('patternSize', 'Масштаб рисунка')}
              <label>Цвета узора<select data-prop="patternPalette"><option value="theme">Из текущей темы</option><option value="custom">Два своих цвета</option></select></label>
              ${whenAvailable('patternPrimary', 'patternPalette', `<div class="grid">${swatch('patternPrimary', 'Основной цвет')}${swatch('patternSecondary', 'Цвет деталей')}</div>`)}
              <details class="settings-more"><summary>Реакция на музыку</summary>
                <label>Эффект на бас<select data-prop="patternBeatEffect">${Object.entries(PATTERN_BEAT_EFFECTS)
                  .map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label>
                ${whenAvailable('patternBeatStrength', 'patternBeatEffect', `
                  ${range('patternBeatStrength', 'Сила реакции')}${range('patternBeatSensitivity', 'Чувствительность к басу')}
                  ${range('patternBeatRelease', 'Затухание эффекта')}`)}
                <p class="muted">В смешанном режиме значки по-разному реагируют на один удар. В предпросмотре без музыки работает пробный ритм.</p>
              </details>
              <details class="settings-more"><summary>Движение, свечение и положение</summary>
                <label>Анимация<select data-prop="patternMotion"><option value="still">Неподвижно</option><option value="drift">Дрейф</option><option value="shimmer">Мягкое мерцание</option><option value="both">Дрейф и мерцание</option></select></label>
                ${whenAvailable('patternDirection', 'patternMotion', `<label>Направление<select data-prop="patternDirection">${Object.entries(PATTERN_DIRECTIONS).map(([key, [,, label]]) =>
                  `<option value="${key}">${label}</option>`).join('')}</select></label>`)}
                ${whenAvailable('patternPeriod', 'patternMotion', range('patternPeriod', 'Длительность цикла'))}
                ${range('patternGlow', 'Свечение')}${range('patternX', 'Сдвиг по горизонтали')}${range('patternY', 'Сдвиг по вертикали')}
                ${whenAvailable('patternNativeOpacity', 'vibeAnimation', range('patternNativeOpacity', 'Видимость штатной анимации за «Моей волной»'))}
                <div class="pattern-seed"><label>Номер раскладки<input type="number" min="1" max="65535" step="1" data-number="patternSeed"></label>
                  <button class="btn" id="ymc-pattern-shuffle" type="button" data-setting="patternSeed" data-find="Перемешать узор">Перемешать</button></div>
              </details>
              <p class="muted">Узор рисуется поверх вашего фона, за текстом и кнопками.</p>
            `)}
          </section>
          <section id="ymc-theme-surfaces"><h3>Панели и карточки</h3>
            ${swatch('panel', 'Общий цвет панелей')}
            ${check('separateSurfaces', 'Отдельные цвета боковой панели и плеера')}
            ${whenAvailable('sidebar', 'separateSurfaces', `
              <div class="grid">${swatch('sidebar', 'Боковая панель')}${swatch('player', 'Плеер')}</div>
              ${check('sidebarGradient', 'Градиент боковой панели')}
              ${whenAvailable('sidebarAngle', 'sidebarGradient', `${swatch('sidebarEnd', 'Конец градиента панели')}${range('sidebarAngle', 'Угол градиента панели')}`)}
            `)}
            ${range('panelOpacity', 'Непрозрачность панелей')}${range('blur', 'Размытие панелей')}
            ${range('round', 'Скругление панелей')}${range('cardRound', 'Скругление карточек')}
            ${range('glowIntensity', 'Неоновое свечение акцентных кнопок')}
          </section>
          <section id="ymc-theme-contrast"><h3>Читаемость и скрытые элементы</h3>
            ${check('contrastGuard', 'Автоматически защищать контраст текста и иконок')}
            ${whenAvailable('contrastThreshold', 'contrastGuard', range('contrastLevel', 'Минимальный контраст'))}
            <p class="muted">Проверка сравнивает цвета темы и учитывает прозрачность подложек. Для фото и видео контраст зависит от кадра.</p>
            <p id="ymc-contrast-report" class="muted" role="status"></p>
            <ul id="ymc-contrast-issues" class="muted" hidden></ul>
            <div class="buttons"><button class="btn" id="ymc-contrast-fix">Исправить слабый контраст</button>
              <button class="btn" id="ymc-nav-link">Настроить стрелки</button></div>
          </section>
          <section id="ymc-theme-fonts"><h3>Шрифты и масштаб</h3>
            <label>Шрифт<select data-prop="font"><option value="native">Как в приложении</option><option value="system">Системный</option>
              <option value="segui">${mac ? 'Helvetica Neue' : 'Segoe UI'}</option><option value="georgia">Georgia</option><option value="mono">${mac ? 'Menlo' : 'Consolas'}</option><option value="arial">Arial</option><option value="verdana">Verdana</option></select></label>
            ${check('manualScale', 'Ручной масштаб вместо автоматического')}${whenAvailable('scale', 'manualScale', range('scale', 'Масштаб интерфейса'))}
          </section>
          <section id="ymc-theme-heart"><h3>Отметка «Нравится»</h3>
            ${check('likedCustom', 'Оформлять закрашенное сердечко')}
            ${whenAvailable('likedColor', 'likedCustom', `
            ${swatch('likedColor', 'Цвет лайка')}
            ${range('likedOpacity', 'Непрозрачность отметки')}${range('likedScale', 'Размер отметки')}
            <label>Иконка<select data-prop="likedShape"><option value="native">Сердце</option><option value="star">Звезда</option><option value="diamond">Ромб</option><option value="image">Своя картинка</option></select></label>
            <label>Анимация отметки<select data-prop="likedMotion"><option value="off">Выключена</option><option value="pulse">Пульс</option><option value="sparkle">Мерцание</option></select></label>
            ${whenAvailable('likedMotionSpeed', 'likedMotion', range('likedMotionSpeed', 'Длительность цикла отметки'))}
            ${whenAvailable('likedTintImage', 'likedShape', check('likedTintImage', 'Перекрасить свою иконку цветом лайка'))}
            <div class="buttons"><button class="btn" id="ymc-liked-pick" data-setting="likedImage" data-find="Картинка сердечка">Выбрать картинку</button>
              <button class="btn" id="ymc-liked-clear">Убрать картинку</button><input type="file" accept="image/png,image/jpeg,image/webp" id="ymc-liked-file" hidden></div>`)}
          </section>
          <section id="ymc-theme-bar"><h3>Фон нижнего плеера</h3>
            ${check('barCustom', 'Настроить фон нижнего плеера')}
            ${whenAvailable('barOpacity', 'barCustom', `
            ${range('barOpacity', 'Непрозрачность фона')}
            <div class="buttons">
              <button class="btn" id="ymc-bar-pick" data-setting="barWallpaper" data-find="Картинка нижнего плеера">Выбрать картинку</button>
              <button class="btn" id="ymc-bar-clear">Убрать картинку</button>
              <input type="file" accept="image/png,image/jpeg,image/webp" id="ymc-bar-file" hidden>
            </div>
            ${whenAvailable('barFit', 'barCustom', `<div class="grid">
              <label>Заполнение картинки<select data-prop="barFit"><option value="cover">Заполнить панель</option><option value="contain">Уместить целиком</option></select></label>
              <label>Положение<select data-prop="barImagePosition"><option value="center">Центр</option><option value="top">Верх</option><option value="bottom">Низ</option></select></label>
            </div>`)}`)}
          </section>
          <section id="ymc-theme-spectrum"><h3>Эквалайзер</h3>
            ${check('barSpectrum', 'Показывать эквалайзер')}
            <div class="buttons">${previewButton('spectrum', 'ymc-spectrum-sample', 'ymc-spectrum-show-preview')}</div>
            <div id="ymc-spectrum-sample" class="spectrum-sample" hidden><canvas id="ymc-spectrum-preview" aria-hidden="true"></canvas>
              <p id="ymc-spectrum-preview-label" class="muted">Макет без звука</p></div>
            ${whenAvailable('spectrumPlacement', 'barSpectrum', `
            <label>Готовый вид<select id="ymc-spectrum-profile" data-find="Готовый вид эквалайзера"><option value="">Свой вариант</option>
              ${Object.entries(SPECTRUM_PROFILES).map(([value, { label }]) => `<option value="${value}">${label}</option>`).join('')}
            </select></label>
            <div class="grid">
              <label>Где показывать<select data-prop="spectrumPlacement"><option value="page">На фоне</option><option value="bar">В плеере</option></select></label>
              <label>Форма<select data-prop="spectrumStyle"><option value="wave">Лента</option><option value="line">Контур</option><option value="bars">Столбцы</option><option value="segments">Сегменты</option><option value="dots">Точки</option></select></label>
            </div>
            ${range('spectrumOpacity', 'Яркость рисунка')}${range('spectrumGain', 'Чувствительность к звуку')}
            <div class="buttons"><button class="btn" id="ymc-spectrum-retry" type="button">Подключить звук</button></div>
            <p id="ymc-bar-status" class="muted" role="status"></p>
            <details class="settings-more" id="ymc-spectrum-colors"><summary>Цвета и слои</summary>
              <label>Заливка<select data-prop="spectrumGradient"><option value="solid">Один цвет</option><option value="vertical">Снизу вверх</option><option value="horizontal">Слева направо</option><option value="diagonal">По диагонали</option></select></label>
              <div class="grid">${swatch('spectrumStart', 'Первый цвет')}
                ${whenAvailable('spectrumMid', 'spectrumGradient', `${swatch('spectrumMid', 'Средний цвет')}`)}
                ${whenAvailable('spectrumEnd', 'spectrumGradient', `${swatch('spectrumEnd', 'Третий цвет')}`)}</div>
              ${range('spectrumGlow', 'Свечение')}
              <label>Дополнительный слой<select data-prop="spectrumOverlay"><option value="none">Без слоя</option><option value="grid">Сетка</option><option value="echo">Второй контур</option></select></label>
              ${whenAvailable('spectrumOverlayAmount', 'spectrumOverlay', range('spectrumOverlayAmount', 'Видимость слоя'))}
            </details>
            <details class="settings-more" id="ymc-spectrum-response"><summary>Форма и отклик</summary>
              <div class="grid"><label>Распределение частот<select data-prop="spectrumLayout"><option value="flow">Слева направо</option><option value="mirror">Зеркально от центра</option></select></label>
              <label>Динамика<select data-prop="spectrumDynamics"><option value="balanced">Ровная</option><option value="soft">Мягкая</option><option value="punch">Резкая</option></select></label></div>
              ${range('spectrumBands', 'Число полос')}${range('spectrumResponse', 'Скорость реакции')}${range('spectrumTaper', 'Затухание к краям')}
              ${whenAvailable('spectrumHeight', 'spectrumPlacement', range('spectrumHeight', 'Высота на фоне'))}
              ${whenAvailable('spectrumWidth', 'spectrumStyle', range('spectrumWidth', 'Ширина элементов'))}
              ${whenAvailable('spectrumRound', 'spectrumStyle', range('spectrumRound', 'Скругление элементов'))}
              ${whenAvailable('spectrumLineWidth', 'spectrumStyle', range('spectrumLineWidth', 'Толщина контура'))}
              ${whenAvailable('spectrumPeaks', 'spectrumStyle', check('spectrumPeaks', 'Показывать пиковые отметки'))}
              <label>Когда звука нет<select data-prop="spectrumIdle"><option value="line">Тихая линия</option><option value="hide">Скрывать рисунок</option></select></label>
            </details>`)}
            ${check('visualizer', 'Визуализатор в расширенном плеере')}
          </section>
        </div>
        <div data-pane="layout" hidden>
          ${paneIntro('layout')}
          <section id="ymc-home-hero"><h3>Портрет и надписи</h3>
            ${check('showVibePortrait', 'Показывать фото исполнителя')}
            ${check('showVibeArtist', 'Показывать имя исполнителя')}
            ${check('showVibeHeading', 'Показывать надпись «Моя волна»')}
            <p class="muted">Эти галочки не скрывают обложку трека, навигацию и кнопки плеера.</p>
          </section>
          <section id="ymc-home-buttons"><h3>Оформление кнопок «Моей волны»</h3>
            ${check('customVibeIcons', 'Свои цвета иконок')}
            ${whenAvailable('vibeIcon', 'customVibeIcons', `<div class="grid">${swatch('vibeIcon', 'Лайк, громкость и меню')}${swatch('vibeTransport', 'Играть, пауза и переключение')}</div>`)}
            ${check('customVibeButtons', 'Свои подложки и скругление')}
            ${whenAvailable('vibeFill', 'customVibeButtons', `
              <div class="grid">${swatch('vibeFill', 'Обычные кнопки')}${swatch('vibePlayFill', 'Кнопка воспроизведения')}${swatch('vibeHover', 'При наведении')}</div>
              ${range('vibeButtonRound', 'Скругление кнопок')}`)}
            ${range('vibeControlsOpacity', 'Непрозрачность подложек')}
          </section>
          <section id="ymc-home-visibility"><h3>Видимость кнопок</h3>
            ${check('hideVibeControls', 'Скрыть все кнопки «Моей волны»')}
            ${check('hideVibePlay', 'Скрыть воспроизведение и паузу')}
            ${check('hideVibeSkip', 'Скрыть переключение треков')}
            ${check('hideVibeLike', 'Скрыть лайк')}${check('hideVibeDislike', 'Скрыть дизлайк')}
            ${check('hideVibeVolume', 'Скрыть громкость')}${check('hideVibeMenu', 'Скрыть контекстное меню')}
          </section>
          <section id="ymc-home-sidebar"><h3>Панель навигации</h3>
            <label>Расположение<select data-prop="sidebarDock"><option value="native">Как в Яндекс Музыке</option>
              <option value="left">Слева</option><option value="right">Справа</option><option value="top">Сверху, горизонтально</option>
              <option value="bottom">Снизу, горизонтально</option></select></label>
            ${whenAvailable('sidebarAlign', 'sidebarDock', `
              <label>Привязка к краю<select data-prop="sidebarAlign"><option value="start">В начале</option><option value="center">По центру</option>
                <option value="end">В конце</option></select></label>
              ${check('sidebarCompact', 'Только значки, без подписей')}${range('sidebarSize', 'Размер панели')}
              ${range('sidebarGap', 'Расстояние между пунктами')}${range('sidebarInset', 'Отступ от края')}`)}
            ${range('sidebarIconSize', 'Размер значков')}
            ${check('sidebarCollapsed', 'Свернуть панель целиком')}
            ${check('sidebarEdgeHint', 'Показывать полоску у края после сворачивания')}
            ${whenAvailable('sidebarEdgeCustom', 'sidebarEdgeHint', `
              ${check('sidebarEdgeCustom', 'Свой цвет полоски')}
              ${whenAvailable('sidebarEdgeColor', 'sidebarEdgeCustom', swatch('sidebarEdgeColor', 'Цвет полоски'))}`)}
            <p class="muted">Стрелка рядом с профилем прячет панель целиком. Наведите указатель на край, чтобы вернуть её. По полоске также можно нажать.</p>
            <p id="ymc-sidebar-status" class="muted" aria-live="polite"></p>
            <ul id="ymc-sidebar-items" class="sidebar-items" aria-label="Пункты панели"></ul>
            <button class="btn" id="ymc-sidebar-reset" type="button">Вернуть штатную панель</button>
          </section>
          <section id="ymc-home-animation"><h3>Анимация «Моей волны»</h3>
            ${check('vibeAnimation', 'Показывать анимацию «Моей волны»')}
            ${whenAvailable('waveStyle', 'vibeAnimation', `
              <label>Вид анимации<select data-prop="waveStyle"><option value="native">Штатная</option>
                <option value="custom">Кастомная анимация «Моей волны»</option></select></label>
              ${check('waveClearRail', 'Прозрачная панель поверх волны')}
              ${whenAvailable('waveNativeOpacity', 'waveStyle', range('waveNativeOpacity', 'Видимость штатной анимации'))}
              ${whenAvailable('wavePalette', 'waveStyle', `
                <label>Цвет анимации<select data-prop="wavePalette"><option value="auto">Авто: по фону или обложке</option>
                  <option value="cover">Всегда из обложки</option><option value="custom">Свой цвет</option></select></label>
                ${whenAvailable('waveTint', 'wavePalette', swatch('waveTint', 'Цвет волны'))}
                ${range('waveOpacity', 'Видимость анимации')}${range('waveTone', 'Контраст анимации')}
                ${range('waveBeat', 'Реакция волны на бас')}`)}`)}
          </section>
          <section id="ymc-home-wave"><h3>Колесо и подсказки</h3>
            ${check('showVibeWheel', 'Показывать колесо «Моей волны»')}
            ${whenAvailable('vibeWheelOpacity', 'showVibeWheel', range('vibeWheelOpacity', 'Непрозрачность колеса'))}
            ${check('aiTrackCards', 'Показывать ИИ-подсказки о треках')}
            ${whenAvailable('vibeAiOpacity', 'aiTrackCards', range('vibeAiOpacity', 'Непрозрачность подсказок'))}
          </section>
          <section id="ymc-home-motion"><h3>Редактор анимаций</h3>
            ${check('motionEnabled', 'Включить плавные переходы')}
            ${whenAvailable('motionDuration', 'motionEnabled', `
            ${range('motionDuration', 'Длительность перехода')}
            <label>Характер движения<select data-prop="motionCurve"><option value="smooth">Плавный</option><option value="soft">Мягкий</option><option value="snappy">Пружинистый</option><option value="linear">Равномерный</option></select></label>
            ${check('motionCards', 'Анимировать карточки при наведении')}
            ${whenAvailable('motionCardScale', 'motionCards', range('motionCardScale', 'Увеличение карточки') + range('motionCardLift', 'Подъём карточки'))}
            ${check('motionAura', 'Равномерное дыхание ауры')}
            ${whenAvailable('motionAuraSpeed', 'motionAura', range('motionAuraSpeed', 'Скорость дыхания'))}
            ${check('motionBackground', 'Медленное движение фона')}
            ${whenAvailable('motionBackgroundSpeed', 'motionBackground', range('motionBackgroundSpeed', 'Скорость движения фона'))}
            <p class="muted">Движение фона работает с градиентом. Для пульсации от музыки откройте «Портрет артиста».</p>`)}
          </section>
          <section id="ymc-home-portrait"><h3>Портрет артиста</h3>
            <p class="muted">Эффект появляется, когда «Моя волна» показывает вырезанный портрет.</p>
            <div class="buttons">${previewButton('portrait', 'ymc-portrait-sample')}</div>
            <div id="ymc-portrait-sample" class="portrait-preview" hidden>
              <div class="portrait-preview-art"><div id="ymc-aura-preview" data-ymc-portrait-aura hidden></div>
              <svg id="ymc-portrait-preview" viewBox="0 0 108 108" aria-hidden="true">
                <path fill="#bdc6d7" d="M54 20c-11 0-19 9-19 21 0 9 4 16 10 20v7c-11 4-22 9-25 24h68c-3-15-14-20-25-24v-7c6-4 10-11 10-20 0-12-8-21-19-21Z"/>
                <path fill="#7886a0" d="M20 92c2-11 10-17 21-22l13 11 13-11c11 5 19 11 21 22Z"/>
              </svg></div>
              <div class="portrait-preview-label"><strong>Образец</strong><br><span class="portrait-chip" id="ymc-portrait-chip"></span><span id="ymc-portrait-color"></span></div>
            </div>
            <div class="grid">
              <label>Эффект портрета<select data-prop="portraitEffect">
                <option value="off">Выключен</option><option value="glow">Мягкая аура</option>
                <option value="outline">Обводка</option><option value="both">Аура и обводка</option><option value="bloom">Плотное свечение</option>
              </select></label>
              ${whenAvailable('portraitColorSource', 'portraitEffect', `<label>Источник цвета<select data-prop="portraitColorSource">
                <option value="theme">Акцент темы</option><option value="background">Подобрать по фону</option><option value="custom">Свой цвет</option>
              </select></label>`)}
            </div>
            <p id="ymc-portrait-hint" class="muted"></p>
            ${whenAvailable('portraitColor', 'portraitColorSource', swatch('portraitColor', 'Свой цвет ауры и обводки'))}
            ${whenAvailable('portraitSpread', 'portraitEffect', range('portraitSpread', 'Радиус ауры'))}
            ${whenAvailable('portraitOutline', 'portraitEffect', range('portraitOutline', 'Толщина обводки'))}
            ${whenAvailable('portraitIntensity', 'portraitEffect', range('portraitIntensity', 'Интенсивность эффекта'))}
            ${whenAvailable('portraitBeat', 'portraitEffect', `
              ${check('portraitBeat', 'Пульсировать в такт музыке')}
              ${whenAvailable('portraitBeatStrength', 'portraitBeat', range('portraitBeatStrength', 'Сила пульсации') +
                range('portraitBeatSensitivity', 'Чувствительность к басу') + range('portraitBeatRelease', 'Затухание пульсации'))}
              <p class="muted">Пульсация использует звук эквалайзера и работает даже при скрытом рисунке. Она заменяет равномерное дыхание, пока включена.</p>`)}
          </section>
          <section id="ymc-home-track"><h3>Обложка и строка трека</h3>
            ${check('vibeAdaptiveCover', 'Скрывать обложку при портрете и увеличивать без него')}
            ${whenAvailable('vibeAdaptiveCoverSize', 'vibeAdaptiveCover', range('vibeAdaptiveCoverSize', 'Размер крупной обложки'))}
            ${range('vibeCoverOpacity', 'Непрозрачность обложки трека')}
            ${range('vibeTrackOpacity', 'Подложка строки трека')}
            ${check('hideVibeTrack', 'Скрыть строку трека целиком')}
          </section>
          <section id="ymc-home-badges"><h3>Значки в правом нижнем углу</h3>
            ${check('showCornerAppVersion', 'Показывать версию Яндекс Музыки')}
            ${check('showCornerLoaderVersion', 'Показывать версию загрузчика мода')}
            ${check('showCornerAudioFormat', 'Показывать формат аудио (FLAC, AAC, MP3)')}
            <p class="muted">Показываются только значки, которые доступны в вашей версии клиента или загрузчика.</p>
          </section>
        </div>
        <div data-pane="player" hidden>
          ${paneIntro('player')}
          <section id="ymc-player-layout"><h3>Конструктор нижнего плеера</h3>${check('widePlayer', 'Расширить плеер на всю ширину')}
            <label>Компоновка<select data-prop="barLayout"><option value="native">Как в приложении</option><option value="compact">Компактная</option><option value="center">Управление по центру</option><option value="spacious">Просторная</option></select></label>
            ${whenAvailable('barHeight', 'barLayout', `${range('barHeight', 'Высота панели')}${range('barCoverSize', 'Размер обложки')}
            ${range('barControlsSize', 'Размер управления')}${range('barTextScale', 'Масштаб названия и исполнителя')}
            ${range('barGap', 'Расстояние между блоками')}`)}
            <label>Видимость полосы прогресса<select data-prop="barProgressMode"><option value="native">Как в приложении</option><option value="always">Всегда видна</option><option value="minimal">Только при фокусе на плеере</option></select></label>
            ${whenAvailable('barProgressSize', 'barProgressMode', range('barProgressSize', 'Толщина прогресса'))}
            <p id="ymc-layout-status" class="muted"></p>
          </section>
          <section id="ymc-player-buttons"><h3>Элементы нижнего плеера</h3>
            ${check('hideBarCover', 'Скрыть обложку')}${check('hideBarVolume', 'Скрыть громкость')}${check('hideBarQueue', 'Скрыть кнопку очереди')}
            ${check('hideBarTitle', 'Скрыть название трека')}${check('hideBarArtist', 'Скрыть исполнителя')}
            ${check('barButtonsCustom', 'Свои цвета и форма кнопок плеера')}
            ${whenAvailable('barButtonFill', 'barButtonsCustom', `
              <div class="grid">${swatch('barButtonFill', 'Подложка кнопок')}${swatch('barButtonText', 'Цвет иконок')}${swatch('barButtonHover', 'При наведении')}</div>
              ${range('barButtonOpacity', 'Непрозрачность кнопок')}${range('barButtonRound', 'Скругление кнопок')}`)}
          </section>
          <section id="ymc-player-overlay"><h3>Расширенный плеер</h3>${check('playerOverlay', 'Разрешить расширенный плеер')}
            ${whenAvailable('playerOverlayDetails', 'playerOverlay', `
            <p class="muted">Обложка и кнопки управления используют текущий трек и штатные элементы Яндекс Музыки. Визуализатор включается во вкладке «Тема».</p>
            <button class="btn primary" id="ymc-player-preview">Открыть плеер</button>
            <p id="ymc-player-status" class="muted"></p>`)}
          </section>
          <section id="ymc-discord"><h3>Discord Rich Presence</h3>
            <p class="muted">Показывает текущий трек в Discord. Кнопка ведёт на этот трек в Яндекс Музыке и видна посетителям профиля.</p>
            <label>Application ID<input type="text" id="ymc-discord-id" data-find="Discord Application ID" inputmode="numeric" maxlength="22" autocomplete="off" placeholder="123456789012345678"></label>
            <div class="line"><label for="ymc-discord-enabled">Показывать активность</label><input type="checkbox" id="ymc-discord-enabled"></div>
            <div class="line"><label for="ymc-discord-album">Показывать название альбома</label><input type="checkbox" id="ymc-discord-album"></div>
            <div class="line"><label for="ymc-discord-paused">Оставлять статус на паузе</label><input type="checkbox" id="ymc-discord-paused"></div>
            <div class="buttons"><button class="btn primary" id="ymc-discord-save">Сохранить подключение</button>
              <a class="btn" href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">Создать приложение Discord</a></div>
            <p id="ymc-discord-status" class="muted" role="status"></p>
            <p class="muted">Предпросмотр карточки</p>
            <div id="ymc-discord-preview" class="discord-preview">
              <strong class="discord-preview-head">Слушает ${discordName}</strong>
              <div class="discord-preview-body">
                <div class="discord-art"><span aria-hidden="true">♪</span><img id="ymc-discord-cover" alt="" hidden></div>
                <div class="discord-preview-meta">
                  <strong id="ymc-discord-track"></strong>
                  <span class="discord-preview-state" id="ymc-discord-details" hidden></span>
                  <div id="ymc-discord-time" class="discord-preview-time" hidden>
                    <span id="ymc-discord-elapsed"></span><progress id="ymc-discord-progress" aria-label="Прогресс трека"></progress><span id="ymc-discord-duration"></span>
                  </div>
                </div>
              </div>
              <a class="btn" id="ymc-discord-open-track" target="_blank" rel="noopener noreferrer" hidden>Открыть трек</a>
            </div>
            <p id="ymc-discord-preview-note" class="muted" hidden></p>
          </section>
        </div>
        <div data-pane="playlists" hidden>
          ${paneIntro('playlists')}
          <div class="buttons">${previewButton('playlists', 'ymc-playlist-preview')}</div>
          <div id="ymc-playlist-preview" class="playlist-preview" aria-hidden="true" hidden>
              <div class="playlist-preview-nav"><span>‹</span><span>›</span></div>
              <div class="playlist-preview-title"><span class="playlist-preview-cover">♥</span><div><small>Плейлист</small><strong>Мне нравится</strong></div></div>
              <div class="playlist-preview-controls"><span data-preview="primary">▶ Слушать</span><span data-preview="secondary">•••</span>
                <span data-preview="filter" data-selected>Всё</span><span data-preview="filter">Спокойное</span></div>
              <div data-preview="search" class="playlist-preview-search">⌕ Поиск трека</div>
          </div>
          <section id="ymc-playlists-gradient"><h3>Фон шапки плейлиста</h3>
            <p class="muted">Действует и на странице «Мне нравится».</p>
            <label>Фон плейлиста<select data-prop="playlistGradient">
              <option value="palette">Из палитры темы</option><option value="theme">Свой градиент</option>
              <option value="solid">Сплошная заливка</option><option value="off">Без заливки</option><option value="native">Цвет обложки от Яндекса</option>
            </select></label>
            <p id="ymc-playlist-hint" class="muted"></p>
            <div class="buttons"><button class="btn" id="ymc-playlist-palette" data-find="Взять цвета темы для шапки">Взять цвета темы</button></div>
            <div class="grid">${swatch('playlistStart', 'Начальный цвет или заливка')}${swatch('playlistEnd', 'Второй цвет')}</div>
            ${range('playlistOpacity', 'Непрозрачность')}${range('playlistAngle', 'Угол градиента')}
            ${range('playlistDepth', 'Насыщенность второго цвета')}${range('playlistFade', 'Длина затухания')}
          </section>
          <section id="ymc-playlists-buttons"><h3>Кнопки и фильтры</h3>
            ${check('playlistButtons', 'Оформлять кнопки плейлистов')}
            ${whenAvailable('playlistCustomButtons', 'playlistButtons', `
            ${check('playlistCustomButtons', 'Задать свои цвета для групп кнопок')}
            ${whenAvailable('playlistPrimary', 'playlistCustomButtons', `
            <div class="grid">
              ${swatch('playlistPrimary', 'Кнопка «Слушать»')}${swatch('playlistPrimaryText', 'Текст кнопки «Слушать»')}
              ${swatch('playlistSecondary', 'Закрепление, меню, скачивание')}${swatch('playlistSecondaryText', 'Иконки остальных кнопок')}
              ${swatch('playlistFilter', 'Фон фильтров')}${swatch('playlistFilterText', 'Текст фильтров')}
              ${swatch('playlistFilterBorder', 'Рамка обычного фильтра')}${swatch('playlistSelected', 'Рамка выбранного фильтра')}
              ${swatch('playlistButtonHover', 'При наведении')}
            </div>
            ${range('playlistButtonOpacity', 'Непрозрачность подложек')}${range('playlistButtonRound', 'Скругление кнопок')}`)}`)}
          </section>
          <section id="ymc-playlists-navigation"><h3>Стрелки назад и вперёд</h3>
            <p class="muted">Эти настройки действуют на верхние стрелки навигации во всём приложении.</p>
            ${check('navigationCustom', 'Оформлять стрелки назад и вперёд')}
            ${whenAvailable('navigationFill', 'navigationCustom', `
              <div class="grid">${swatch('navigationFill', 'Подложка стрелок')}${swatch('navigationText', 'Цвет стрелок')}</div>
              ${range('navigationOpacity', 'Непрозрачность подложки стрелок')}${range('navigationRound', 'Скругление стрелок')}`)}
          </section>
          <section id="ymc-playlists-details"><h3>Обложка и поиск трека</h3>
            ${check('playlistCoverCustom', 'Настроить скругление обложки')}
            ${whenAvailable('playlistCoverRound', 'playlistCoverCustom', range('playlistCoverRound', 'Скругление обложки'))}
            ${check('playlistSearchCustom', 'Оформлять строку поиска')}
            ${whenAvailable('playlistSearchFill', 'playlistSearchCustom', `
              <div class="grid">${swatch('playlistSearchFill', 'Подложка поиска')}${swatch('playlistSearchText', 'Текст поиска')}</div>
              ${range('playlistSearchOpacity', 'Непрозрачность подложки')}${range('playlistSearchRound', 'Скругление поиска')}`)}
          </section>
        </div>
        <div data-pane="library" hidden>
          ${paneIntro('library')}
          <section id="ymc-shop-catalog" class="store">
            <div class="store-heading"><div><h2>Магазин <span>тем</span></h2><p class="muted">Локальный каталог Customizer</p></div>
              <div class="buttons">
                <button class="btn" id="ymc-library-import" data-find="Импорт темы .ymctheme">Импорт</button>
                <button class="btn" id="ymc-library-export-current" data-find="Экспорт темы с фоном .ymctheme">Экспорт текущей</button>
                <input type="file" id="ymc-library-import-file" accept=".ymctheme" hidden>
              </div>
            </div>
            <div class="store-tools">
              <div class="store-groups" role="group" aria-label="Категории магазина">
                <button class="btn" data-store-group="presets">Пресеты</button>
                <button class="btn" data-store-group="saved">Мои темы</button>
                <button class="btn" data-store-group="files">Файлы</button>
              </div>
              <label id="ymc-store-category-label">Стиль<select id="ymc-store-category"><option value="all">Все стили</option>${[...new Set(Object.values(PRESET_CATEGORIES))].sort().map(name => `<option value="${name}">${name}</option>`).join('')}</select></label>
              <input type="search" id="ymc-store-search" aria-label="Поиск в магазине" placeholder="Найти в каталоге">
            </div>
            <div class="store-cards" id="ymc-store-cards"></div>
            <p class="muted store-empty" id="ymc-store-empty" hidden></p>
            <div class="buttons" id="ymc-store-theme-actions">
              <button class="btn primary" id="ymc-library-apply">Применить выбранную</button>
              <button class="btn" id="ymc-library-export-selected">Экспорт выбранной</button>
              <button class="btn" id="ymc-library-remove-theme">Удалить</button>
            </div>
            <div id="ymc-store-file-actions" hidden>
              <label>Использовать как<select id="ymc-library-target">
                <option value="background">Общий фон</option><option value="bar">Картинка нижнего плеера</option><option value="liked">Иконка лайка</option>
              </select></label>
              <div class="buttons"><button class="btn primary" id="ymc-library-use-file">Применить файл</button>
                <button class="btn" id="ymc-library-remove-file">Удалить из библиотеки</button></div>
            </div>
          </section>
          <section id="ymc-shop-save" class="store-save">
            <label>Название новой темы<input type="text" id="ymc-library-name" maxlength="60" placeholder="Название текущей темы"></label>
            <button class="btn" id="ymc-library-save" data-find="Сохранить тему">Сохранить текущую как новую</button>
          </section>
        </div>
        <div data-pane="files" hidden>
          ${paneIntro('files')}
          <section id="ymc-shop-css"><h3>Свой CSS</h3><textarea id="ymc-css" data-setting="customCss" data-find="Редактор CSS" aria-label="Свой CSS" spellcheck="false" maxlength="20000" placeholder="/* Ваши CSS-правила */"></textarea>
            <p class="muted">Применяйте CSS, которому доверяете. Он может загружать внешние ресурсы.</p>
            <button class="btn" id="ymc-css-apply">Применить CSS</button>
          </section>
          <section id="ymc-shop-addon"><h3>Тема Next Music</h3>
            <p class="muted">Выберите CSS из распакованной темы. JavaScript, сервер ресурсов и API дополнений Next Music здесь недоступны.</p>
            <div class="buttons"><button class="btn" id="ymc-addon-import" data-setting="addonSheets" data-find="Импорт CSS Next Music">Выбрать CSS</button><button class="btn" id="ymc-addon-clear">Убрать CSS</button>
            <input type="file" accept=".css,text/css" id="ymc-addon-file" multiple hidden></div>
            <p class="muted" id="ymc-addon-name"></p>${check('addonEnabled', 'Включить импортированный CSS')}
            ${check('addonPalette', 'Использовать оформление CSS-темы вместо палитры Customizer')}
          </section>
          <section id="ymc-shop-files"><h3>Файлы темы</h3><div class="buttons">
            <button class="btn primary" id="ymc-export" data-find="Экспорт JSON">Экспорт JSON</button><button class="btn" id="ymc-css-export" data-find="Экспорт CSS">Экспорт CSS</button>
            <button class="btn" id="ymc-import" data-find="Импорт JSON">Импорт JSON</button><button class="btn" id="ymc-reset">Сбросить</button>
            <input type="file" accept=".json,application/json" id="ymc-theme-file" hidden>
          </div></section>
        </div>
      </aside>
      <footer class="editor-footer">
        <button id="ymc-update-summary" type="button" class="btn update-trigger" aria-expanded="false" aria-controls="ymc-update-card" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a8 8 0 1 1 2 6m-2-6V5m0 6h6"/></svg>
          <span id="ymc-update-label">Обновления</span>
        </button>
        <p class="muted">v${version} · ${mac ? 'macOS' : 'Windows'}</p>
        <div id="ymc-update-card" class="update-card" role="region" aria-labelledby="ymc-update-summary" hidden>
          <strong>Обновления Customizer</strong>
          <p id="ymc-update-status" class="muted" role="status">Проверка обновлений…</p>
          <p id="ymc-update-notes" class="muted" hidden></p>
          <div class="buttons">
            <button type="button" id="ymc-update-check" class="btn">Проверить</button>
            <button type="button" id="ymc-update-install" class="btn primary" hidden>Обновить и перезапустить</button>
          </div>
        </div>
      </footer>
    </div>
    <div id="ymc-update-toast" class="update-toast" role="group" aria-label="Уведомление об обновлении" hidden>
      <div class="update-toast-head">
        <div role="status"><strong id="ymc-update-toast-title"></strong><p class="muted">Обновите Customizer, чтобы получить новые настройки.</p></div>
        <button id="ymc-update-toast-close" class="btn" type="button" aria-label="Закрыть уведомление об обновлении">✕</button>
      </div>
      <button id="ymc-update-toast-open" class="btn primary" type="button">Посмотреть обновление</button>
    </div>
    <dialog id="ymc-whats-new" class="release-dialog" aria-labelledby="ymc-release-title">
      <header><span class="pill" id="ymc-release-version"></span><button id="ymc-release-close" class="btn" type="button" aria-label="Закрыть">×</button></header>
      <h2 id="ymc-release-title">Что нового</h2>
      <p id="ymc-release-range" class="muted"></p>
      <ul id="ymc-release-notes"></ul>
      <div class="buttons"><button class="btn primary" id="ymc-release-guide" type="button">Посмотреть настройки</button>
        <button class="btn" id="ymc-release-later" type="button">Позже</button></div>
    </dialog>
    <div class="guide-layer" id="ymc-guide" hidden>
      <div id="ymc-guide-spot" class="guide-spot" aria-hidden="true"></div>
      <div id="ymc-guide-card" class="guide-card" role="dialog" aria-labelledby="ymc-guide-title" aria-describedby="ymc-guide-text">
        <div id="ymc-guide-content">
          <div role="status" aria-atomic="true"><span id="ymc-guide-progress" class="muted"></span>
            <h3 id="ymc-guide-title"></h3></div>
          <p id="ymc-guide-text"></p>
          <div id="ymc-guide-demo" class="guide-example" aria-hidden="true"></div>
        </div>
        <div class="buttons"><button class="btn" id="ymc-guide-back">Назад</button>
          <button class="btn primary" id="ymc-guide-next">Далее</button>
          <button class="btn" id="ymc-guide-close">Закрыть</button></div>
        <button class="btn guide-all" id="ymc-guide-all">Подробно по всем блокам</button>
      </div>
    </div>
    <div class="shade focus" id="ymc-now" hidden>
      <div class="now" role="dialog" aria-modal="true" aria-labelledby="ymc-now-title">
        <div class="headrow"><h2 id="ymc-now-title">Сейчас играет</h2><button id="ymc-now-close" class="btn" aria-label="Закрыть плеер">✕</button></div>
        <div class="art"><span aria-hidden="true">♫</span><img id="ymc-now-cover" alt="" hidden></div>
        <div class="track"><h3 id="ymc-now-track"></h3><p id="ymc-now-artist" class="muted"></p></div>
        <div class="controls">
          <button class="btn" data-action="prev" aria-label="Предыдущий трек"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h2v12H3zM16 4v12L6 10z"/></svg></button>
          <button class="btn primary" data-action="toggle">Играть</button>
          <button class="btn" data-action="next" aria-label="Следующий трек"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 4h2v12h-2zM4 4l10 6L4 16z"/></svg></button>
          <button class="btn" data-action="like" aria-label="Нравится">♡</button>
          <button class="btn" data-action="queue">Очередь</button>
        </div>
        <div class="timeline" id="ymc-timeline" hidden><span id="ymc-time"></span>
          <input type="range" min="0" max="1000" aria-label="Позиция воспроизведения" id="ymc-seek" hidden>
          <progress id="ymc-progress" max="1000" aria-label="Позиция воспроизведения" hidden></progress><span id="ymc-duration"></span>
        </div>
        <div class="buttons" id="ymc-spectrum-controls" hidden><button class="btn" id="ymc-spectrum-start">Запустить визуализатор</button></div>
        <canvas id="ymc-spectrum" width="432" height="60" aria-label="Спектр аудиосигнала" hidden></canvas>
      </div>
    </div>
  `;

  function notice(message = '', error = false) {
    $('ymc-notice').classList.toggle('error', error);
    $('ymc-notice').textContent = message;
  }

  const PLAYLIST_HINT = {
    palette: 'Берёт цвета «Общий цвет панелей» и «Фон» из вашей темы. Угол и затухание настраиваются ниже.',
    theme: 'Выберите два цвета. Насыщенность второго цвета и длину затухания можно изменить отдельно.',
    solid: 'Вся шапка использует начальный цвет с выбранной непрозрачностью.',
    off: 'Заливка шапки скрыта. Через неё виден общий фон приложения.',
    native: 'Цвет вычисляет Яндекс Музыка по обложке. В образце показан пример.'
  };

  function syncPlaylistPreview(t = previewVisual('playlists')) {
    const preview = $('ymc-playlist-preview');
    const backdrop = playlistBackground(t);
    const solid = t.playlistGradient === 'solid';
    preview.style.backgroundImage = solid ? `linear-gradient(${backdrop},${backdrop})`
      : backdrop || (t.playlistGradient === 'off' ? 'none' : 'linear-gradient(180deg,#8a8a8a,transparent)');
    preview.style.backgroundColor = t.background;
    const custom = t.playlistButtons && (!(t.addonEnabled && t.addonPalette) || t.playlistCustomButtons);
    const c = custom ? playlistColors(t) : {
      primary: '#e4e4e4', primaryText: '#202022', secondary: '#39363d', secondaryText: '#faf6ff',
      filter: '#27242d', filterText: '#faf6ff', selected: '#b8b4bf', hover: '#666169', opacity: 100, radius: null
    };
    const styles = {
      ink: readableText(t.text, t.background), selected: c.selected, round: (c.radius ?? 20) + 'px',
      'filter-border': c.filterBorder || '#c8c4d3',
      nav: t.navigationCustom ? rgba(t.navigationFill, t.navigationOpacity) : '#ffffff1a',
      'nav-ink': guardedInk(t, t.navigationCustom ? t.navigationText : t.text, navigationFill(t)),
      'nav-round': (t.navigationCustom ? t.navigationRound : 24) + 'px',
      cover: (t.playlistCoverCustom ? t.playlistCoverRound : 9) + 'px',
      search: t.playlistSearchCustom ? rgba(t.playlistSearchFill, t.playlistSearchOpacity) : '#16121880',
      'search-ink': t.playlistSearchCustom
        ? guardedInk(t, t.playlistSearchText, blendedFill(t.playlistSearchFill, t.playlistSearchOpacity, t.background)) : '#fff',
      'search-round': (t.playlistSearchCustom ? t.playlistSearchRound : 8) + 'px'
    };
    for (const [name, value] of Object.entries(styles)) preview.style.setProperty('--playlist-' + name, value);
    for (const button of preview.querySelectorAll('.playlist-preview-controls [data-preview]')) {
      const key = button.dataset.preview;
      const opacity = key === 'primary' && c.radius === null ? 100 : c.opacity;
      button.style.setProperty('--button-fill', rgba(c[key], opacity));
      button.style.setProperty('--button-ink', c[key + 'Text']);
      button.style.setProperty('--button-hover', rgba(c.hover, opacity));
      button.style.setProperty('--button-hover-ink', readableText(c[key + 'Text'], c.hover));
    }
    setText($('ymc-playlist-hint'), PLAYLIST_HINT[t.playlistGradient]);
  }

  let syncSettingsTools;

  const SECTION_SUMMARIES = {
    'ymc-theme-smart': ['Цвета трека для фона, текста и акцентов', 'smartTheme'],
    'ymc-theme-spectrum': ['Рисунок, который реагирует на музыку', 'barSpectrum'],
    'ymc-theme-palette': ['Основные цвета интерфейса'],
    'ymc-theme-background': ['Градиент, сплошной цвет или обложка'],
    'ymc-theme-media': ['Свои фото, GIF и видео', 'appMediaEnabled'],
    'ymc-theme-pattern': ['Звёзды, геометрия, ноты и свои символы', 'patternEnabled'],
    'ymc-theme-surfaces': ['Прозрачность, формы и неоновое свечение'],
    'ymc-theme-contrast': ['Проверка текста и иконок', 'contrastGuard'],
    'ymc-theme-fonts': ['Шрифт и размер интерфейса'],
    'ymc-theme-heart': ['Цвет, форма и анимация лайка', 'likedCustom'],
    'ymc-theme-bar': ['Цвет или фото для нижней панели', 'barCustom'],
    'ymc-home-buttons': ['Цвета и форма кнопок'],
    'ymc-home-hero': ['Фото, имя исполнителя и надпись «Моя волна»'],
    'ymc-home-visibility': ['Выбор кнопок на главном экране'],
    'ymc-home-sidebar': ['Расположение, порядок и видимость пунктов'],
    'ymc-home-animation': ['Исходное движение и настройка цвета', 'vibeAnimation'],
    'ymc-home-wave': ['Колесо выбора волны и ИИ-подсказки'],
    'ymc-home-motion': ['Скорость, карточки, аура и фон', 'motionEnabled'],
    'ymc-home-portrait': ['Мягкая аура, обводка и плотное свечение в такт'],
    'ymc-home-track': ['Авторазмер обложки, видимость и прозрачность'],
    'ymc-home-badges': ['Версии приложения и мода, формат аудио'],
    'ymc-player-layout': ['Размер, расположение и полоса прогресса'],
    'ymc-player-buttons': ['Видимые элементы и их цвета'],
    'ymc-player-overlay': ['Отдельное окно управления', 'playerOverlay'],
    'ymc-discord': ['Показывать трек в профиле Discord'],
    'ymc-playlists-gradient': ['Цвет за обложкой и заголовком'],
    'ymc-playlists-buttons': ['Воспроизведение, меню и фильтры', 'playlistButtons'],
    'ymc-playlists-navigation': ['Цвет и подложка верхних стрелок', 'navigationCustom'],
    'ymc-playlists-details': ['Форма обложки и стиль поиска'],
    'ymc-shop-css': ['Правила оформления вручную'],
    'ymc-shop-addon': ['Подключение CSS-файлов'],
    'ymc-shop-files': ['Импорт, экспорт и сброс']
  };

  const jumpedFolds = new Set();
  let foldJumpFrame;

  function finishFoldJumps() {
    foldJumpFrame = undefined;
    for (const node of jumpedFolds) node.removeAttribute('data-jump');
    jumpedFolds.clear();
  }

  function setFold(node, open, immediate = false) {
    if (!node || (node.hasAttribute('aria-hidden') && node.inert === !open)) return false;
    if (immediate) {
      node.setAttribute('data-jump', '');
      jumpedFolds.add(node);
      if (foldJumpFrame !== undefined) cancelAnimationFrame(foldJumpFrame);
      // Keep the jump through a render before restoring normal transitions.
      foldJumpFrame = requestAnimationFrame(() => {
        foldJumpFrame = requestAnimationFrame(finishFoldJumps);
      });
    } else if (jumpedFolds.delete(node)) {
      node.removeAttribute('data-jump');
    }
    if (!open && node.contains(shadow.activeElement)) {
      const switcher = node.dataset.enable && shadow.querySelector(`[data-prop="${node.dataset.enable}"]`);
      const fallback = node.closest('.settings-section')?.querySelector('.section-toggle');
      const control = switcher && !switcher.disabled && !switcher.closest('[inert]') ? switcher : fallback;
      control?.focus({ preventScroll: true });
    }
    node.inert = !open;
    node.setAttribute('aria-hidden', String(!open));
    return true;
  }

  function setSettingsSection(section, open, immediate = false) {
    const button = section?.querySelector('.section-toggle');
    if (!button || (open && section.hasAttribute('data-section-lock'))) return;
    if (button.getAttribute('aria-expanded') !== String(open)) button.setAttribute('aria-expanded', String(open));
    if (setFold($(button.getAttribute('aria-controls')), open, immediate)) syncSpectrumAnimation();
  }

  function setupEditorSections() {
    const smart = $('ymc-theme-smart'), spectrumSection = $('ymc-theme-spectrum');
    smart.dataset.feature = '';
    for (const [id, [description, switchKey]] of Object.entries(SECTION_SUMMARIES)) {
      const section = $(id);
      const heading = section.querySelector('h3');
      const headingText = heading.textContent;
      const toggleRow = switchKey ? $('p-' + switchKey).closest('.line') : null;
      const rest = [...section.childNodes].filter(node => node !== heading && node !== toggleRow);
      section.classList.add('settings-section');
      section.dataset.sectionTitle = headingText;
      const header = document.createElement('div');
      header.className = 'settings-heading';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'section-toggle';
      const text = document.createElement('span');
      const strong = document.createElement('strong'), small = document.createElement('small');
      strong.textContent = headingText;
      small.textContent = description;
      text.append(strong, small);
      const arrow = document.createElement('span');
      arrow.className = 'section-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      button.append(text, arrow);
      heading.replaceChildren(button);
      header.append(heading);
      if (toggleRow) {
        toggleRow.classList.add('section-switch');
        header.append(toggleRow);
        const control = toggleRow.querySelector('input');
        control.addEventListener('change', () => {
          if (control.checked) setSettingsSection(section, true);
        });
      }
      const content = document.createElement('div');
      content.className = 'settings-fold settings-content';
      content.id = id + '-content';
      button.setAttribute('aria-controls', content.id);
      const inner = document.createElement('div'), pad = document.createElement('div');
      inner.className = 'settings-inner';
      pad.className = 'settings-pad';
      pad.append(...rest);
      inner.append(pad);
      content.append(inner);
      section.append(header, content);
      button.setAttribute('aria-expanded', 'false');
      setFold(content, false, true);
      button.addEventListener('click', () => setSettingsSection(section, content.inert));
    }
    const groups = {
      theme: {
        'Автоматические цвета': ['theme-smart'],
        'Цвета и фон': ['theme-palette', 'theme-background', 'theme-media'],
        'Визуальные эффекты': ['theme-spectrum', 'theme-pattern', 'theme-heart'],
        'Интерфейс': ['theme-surfaces', 'theme-fonts', 'theme-contrast']
      },
      layout: {
        'Экран «Моя волна»': ['home-hero', 'home-track', 'home-animation', 'home-portrait'],
        'Управление': ['home-buttons', 'home-visibility', 'home-wave'],
        'Панель и детали': ['home-sidebar', 'home-badges', 'home-motion']
      },
      player: {
        'Нижний плеер': ['player-layout', 'player-buttons', 'theme-bar'],
        'Дополнительно': ['player-overlay', 'discord']
      },
      playlists: {
        'Оформление': ['playlists-gradient', 'playlists-buttons'],
        'Навигация и поиск': ['playlists-navigation', 'playlists-details']
      }
    };
    for (const [pane, sections] of Object.entries(groups)) {
      const page = shadow.querySelector('[data-pane="' + pane + '"]');
      for (const [label, ids] of Object.entries(sections)) {
        const group = document.createElement('div');
        group.className = 'settings-group';
        const title = document.createElement('h3');
        title.className = 'section-label';
        title.textContent = label;
        group.append(title, ...ids.map(id => $('ymc-' + id)));
        page.append(group);
      }
    }
    if (theme.smartTheme) setSettingsSection(smart, true, true);
    else if (theme.barSpectrum) setSettingsSection(spectrumSection, true, true);
  }

  function contrastPairs(t) {
    const playerSurface = panelFill(t, t.separateSurfaces ? t.player : t.panel);
    const fill = (key, opacity) => blendedFill(t[key], t[opacity], t.background);
    const customPlaylist = t.playlistButtons && t.playlistCustomButtons;
    return [
      ['Основной текст на фоне', 'text', t.background],
      ['Текст на боковой панели', 'text', panelFill(t, t.separateSurfaces ? t.sidebar : t.panel)],
      ['Текст на нижнем плеере', 'text', playerSurface],
      ['Стрелки навигации', t.navigationCustom ? 'navigationText' : 'text', navigationFill(t)],
      ['Кнопки нижнего плеера', 'barButtonText', blendedFill(t.barButtonFill, t.barButtonOpacity, playerSurface), t.barButtonsCustom],
      ['Обычные кнопки «Моей волны»', 'vibeIcon', t.customVibeButtons ? fill('vibeFill', 'vibeControlsOpacity') : t.background, t.customVibeIcons],
      ['Воспроизведение «Моей волны»', 'vibeTransport', t.customVibeButtons ? fill('vibePlayFill', 'vibeControlsOpacity') : t.accent, t.customVibeIcons],
      ['Кнопка «Слушать»', 'playlistPrimaryText', fill('playlistPrimary', 'playlistButtonOpacity'), customPlaylist],
      ['Кнопки плейлиста', 'playlistSecondaryText', fill('playlistSecondary', 'playlistButtonOpacity'), customPlaylist],
      ['Фильтры плейлиста', 'playlistFilterText', fill('playlistFilter', 'playlistButtonOpacity'), customPlaylist],
      ['Поиск в плейлисте', 'playlistSearchText', fill('playlistSearchFill', 'playlistSearchOpacity'), t.playlistSearchCustom]
    ].filter(([, , , enabled = true]) => enabled).map(([label, ink, surface]) => ({
      label, ink, surface, ratio: contrastRatio(t[ink], surface)
    }));
  }

  function contrastFixes(pairs, issues) {
    const changes = {};
    for (const key of new Set(issues.map(({ ink }) => ink))) {
      const surfaces = pairs.filter(pair => pair.ink === key);
      const score = color => Math.min(...surfaces.map(pair => contrastRatio(color, pair.surface)));
      const best = score('#000000') > score('#FFFFFF') ? '#000000' : '#FFFFFF';
      if (score(best) > score(theme[key]) + .01) changes[key] = best;
    }
    return changes;
  }

  function syncContrastReport(applyFixes = false) {
    const pairs = contrastPairs(theme);
    const minimum = theme.contrastLevel / 10;
    const issues = pairs.filter(pair => pair.ratio < minimum);
    const fixes = contrastFixes(pairs, issues);
    if (applyFixes && Object.keys(fixes).length) {
      update(fixes);
      notice('Цвета с низким контрастом обновлены. Изменение можно отменить стрелкой сверху.');
      return;
    }
    setText($('ymc-contrast-report'), issues.length
      ? `Ниже порога ${minimum.toFixed(1)}:1 — ${issues.length} из ${pairs.length}.`
      : `Все проверяемые сочетания проходят порог ${minimum.toFixed(1)}:1.`);
    const list = $('ymc-contrast-issues');
    list.hidden = !issues.length;
    list.replaceChildren(...issues.map(({ label, ratio }) => {
      const item = document.createElement('li');
      item.textContent = `${label} · ${ratio.toFixed(1)}:1`;
      return item;
    }));
    $('ymc-contrast-fix').disabled = !Object.keys(fixes).length;
  }

  function syncHistoryButtons() {
    const busy = historyBusy || vibeBusy || libraryBusy || Boolean(previewSession);
    $('ymc-undo').disabled = busy || !undoStack.length;
    $('ymc-redo').disabled = busy || !redoStack.length;
  }

  function syncPortraitPreview(backgroundColor, displayTheme = theme) {
    const color = portraitEffectColor(displayTheme, backgroundColor);
    $('ymc-portrait-preview').style.filter = portraitFilter(displayTheme, color);
    const aura = $('ymc-aura-preview');
    aura.hidden = displayTheme.portraitEffect !== 'bloom' || displayTheme.portraitIntensity === 0;
    if (!aura.hidden) paintAura(displayTheme, color, aura);
    $('ymc-portrait-chip').style.backgroundColor = color;
    setText($('ymc-portrait-color'), color.toUpperCase());
    const hint = displayTheme.portraitEffect === 'off' ? 'Выберите эффект, чтобы настроить цвет и силу свечения.'
      : displayTheme.coverColors && theme.smartPortrait && theme.smartPortraitAmount && theme.smartStrength
        ? 'Цвет ауры подстраивается под обложку трека.'
      : displayTheme.portraitColorSource === 'background' ? backgroundColor
        ? 'Цвет подобран по яркости и палитре текущего фона.'
        : 'Используется акцент темы. Для подбора загрузите картинку или видео фона.'
      : displayTheme.portraitColorSource === 'custom' ? 'Эффект использует выбранный вами цвет.'
      : 'Цвет следует за акцентом темы Customizer.';
    setText($('ymc-portrait-hint'), hint);
  }

  let lockedManualFields = new Set();

  function syncSmartLocks(t) {
    lockedManualFields = new Set();
    for (const [group, { fields }] of Object.entries(SMART_GROUPS)) {
      if (smartGroupEnabled(t, group)) for (const key of fields) lockedManualFields.add(key);
    }
    if (smartGroupEnabled(t, 'smartAccent')) lockedManualFields.add('customAccentStates');
    if (smartGroupEnabled(t, 'smartPortrait')) lockedManualFields.add('portraitColorSource');
    if (smartOwnsBackdrop(t)) {
      for (const key of ['mode','wallpaper','gradientAngle','backgroundDim','appMediaEnabled','vibeMedia',
        'appMediaFile','mediaFit','mediaX','mediaY','mediaBlur','mediaOpacity']) lockedManualFields.add(key);
    }
    const sections = {
      'ymc-theme-palette': ['accent', 'text', 'textSecondary', 'background', 'gradientEnd']
        .every(key => lockedManualFields.has(key)),
      'ymc-theme-background': smartOwnsBackdrop(t),
      'ymc-theme-media': smartOwnsBackdrop(t)
    };
    for (const [id, locked] of Object.entries(sections)) {
      const section = $(id);
      const toggle = section.querySelector('.section-toggle');
      if (locked) {
        setSettingsSection(section, false, true);
        section.setAttribute('data-section-lock', '');
      } else section.removeAttribute('data-section-lock');
      toggle.disabled = locked;
      toggle.title = locked ? 'Управляется умной темой' : '';
    }
  }

  function syncControls(resetDraft, syncCss = resetDraft) {
    const t = editorTheme();
    const withMedia = Boolean(vibeMedia && t.appMediaEnabled);
    const photoMode = ['image', 'cover'].includes(t.mode);
    const playlistGradient = ['palette', 'theme'].includes(t.playlistGradient);
    const portraitOff = t.portraitEffect === 'off';
    const bloom = t.portraitEffect === 'bloom';
    const customWave = t.vibeAnimation && t.waveStyle !== 'native';
    const unavailable = {
      scale: !t.manualScale, addonEnabled: !t.addonSheets.length, addonPalette: !t.addonEnabled,
      accentHover: !t.customAccentStates, accentPress: !t.customAccentStates,
      appMediaFile: !t.appMediaEnabled,
      gradientAngle: t.mode === 'solid', backgroundDim: !withMedia && !photoMode,
      mediaFit: !withMedia && !photoMode, mediaX: !withMedia && !photoMode, mediaY: !withMedia && !photoMode,
      mediaBlur: !withMedia, mediaOpacity: !withMedia,
      patternStyle: !t.patternEnabled && previewSession?.kind !== 'pattern', patternSymbols: t.patternStyle !== 'symbols',
      patternPrimary: t.patternPalette !== 'custom', patternSecondary: t.patternPalette !== 'custom',
      patternDirection: !['drift', 'both'].includes(t.patternMotion), patternPeriod: t.patternMotion === 'still',
      patternBeatStrength: t.patternBeatEffect === 'off', patternBeatSensitivity: t.patternBeatEffect === 'off',
      patternBeatRelease: t.patternBeatEffect === 'off',
      patternNativeOpacity: !t.vibeAnimation || t.waveStyle !== 'native',
      waveStyle: !t.vibeAnimation, waveClearRail: !t.vibeAnimation, waveNativeOpacity: !t.vibeAnimation || customWave,
      wavePalette: !customWave, waveTint: !customWave || t.wavePalette !== 'custom',
      waveOpacity: !customWave, waveTone: !customWave, waveBeat: !customWave,
      sidebarAlign: t.sidebarDock === 'native', sidebarSize: t.sidebarDock === 'native',
      sidebarGap: t.sidebarDock === 'native', sidebarInset: t.sidebarDock === 'native', sidebarCompact: t.sidebarDock === 'native',
      sidebarEdgeCustom: !t.sidebarEdgeHint, sidebarEdgeColor: !t.sidebarEdgeHint || !t.sidebarEdgeCustom,
      vibeAdaptiveCoverSize: !t.vibeAdaptiveCover,
      sidebar: !t.separateSurfaces, player: !t.separateSurfaces,
      sidebarEnd: !t.sidebarGradient, sidebarAngle: !(t.separateSurfaces && t.sidebarGradient),
      barOpacity: !t.barCustom, barFit: !t.barWallpaper, barImagePosition: !t.barWallpaper,
      barButtonFill: !t.barButtonsCustom, barButtonText: !t.barButtonsCustom,
      barButtonHover: !t.barButtonsCustom, barButtonOpacity: !t.barButtonsCustom,
      barButtonRound: !t.barButtonsCustom,
      spectrumHeight: t.spectrumPlacement !== 'page', spectrumMid: t.spectrumGradient === 'solid',
      spectrumEnd: t.spectrumGradient === 'solid', spectrumOverlayAmount: t.spectrumOverlay === 'none',
      spectrumWidth: !['bars', 'segments', 'dots'].includes(t.spectrumStyle),
      spectrumRound: !['bars', 'segments'].includes(t.spectrumStyle),
      spectrumLineWidth: !['line', 'wave'].includes(t.spectrumStyle),
      spectrumPeaks: !['bars', 'segments'].includes(t.spectrumStyle),
      likedTintImage: t.likedShape !== 'image' || !t.likedCustom,
      likedColor: !t.likedCustom, likedShape: !t.likedCustom, likedScale: !t.likedCustom, likedOpacity: !t.likedCustom,
      likedMotion: !t.likedCustom, likedMotionSpeed: !t.likedCustom || t.likedMotion === 'off',
      vibeIcon: !t.customVibeIcons, vibeTransport: !t.customVibeIcons,
      vibeFill: !t.customVibeButtons, vibePlayFill: !t.customVibeButtons,
      vibeHover: !t.customVibeButtons, vibeButtonRound: !t.customVibeButtons,
      vibeWheelOpacity: !t.showVibeWheel, vibeAiOpacity: !t.aiTrackCards,
      portraitColorSource: portraitOff, portraitColor: portraitOff || t.portraitColorSource !== 'custom',
      portraitOutline: portraitOff || t.portraitEffect === 'glow' || bloom,
      portraitSpread: portraitOff || t.portraitEffect === 'outline', portraitIntensity: portraitOff,
      portraitBeat: !hasPortraitAura(t), portraitBeatStrength: !hasPortraitAura(t) || !t.portraitBeat,
      portraitBeatSensitivity: !hasPortraitAura(t) || !t.portraitBeat,
      portraitBeatRelease: !hasPortraitAura(t) || !t.portraitBeat,
      smartTransition: !t.smartTheme, smartStrength: !t.smartTheme, smartPaletteStyle: !t.smartTheme,
      motionDuration: !t.motionEnabled, motionCurve: !t.motionEnabled,
      motionCards: !t.motionEnabled, motionCardScale: !t.motionEnabled || !t.motionCards,
      motionCardLift: !t.motionEnabled || !t.motionCards,
      motionAura: !t.motionEnabled, motionAuraSpeed: !t.motionEnabled || !t.motionAura,
      motionBackground: !t.motionEnabled, motionBackgroundSpeed: !t.motionEnabled || !t.motionBackground,
      playerOverlayDetails: !t.playerOverlay,
      contrastThreshold: !t.contrastGuard,
      barHeight: t.barLayout === 'native', barCoverSize: t.barLayout === 'native',
      barControlsSize: t.barLayout === 'native', barTextScale: t.barLayout === 'native',
      barGap: t.barLayout === 'native', barProgressSize: t.barLayout === 'native' && t.barProgressMode === 'native',
      navigationFill: !t.navigationCustom, navigationText: !t.navigationCustom,
      navigationOpacity: !t.navigationCustom, navigationRound: !t.navigationCustom,
      playlistAngle: !playlistGradient, playlistDepth: !playlistGradient, playlistFade: !playlistGradient,
      playlistStart: !['theme', 'solid'].includes(t.playlistGradient), playlistEnd: t.playlistGradient !== 'theme',
      playlistOpacity: !playlistGradient && t.playlistGradient !== 'solid',
      playlistCustomButtons: !t.playlistButtons,
      playlistCoverRound: !t.playlistCoverCustom,
      playlistSearchFill: !t.playlistSearchCustom, playlistSearchText: !t.playlistSearchCustom,
      playlistSearchOpacity: !t.playlistSearchCustom, playlistSearchRound: !t.playlistSearchCustom
    };
    if (!t.barSpectrum && previewSession?.kind !== 'spectrum') {
      for (const key of Object.keys(DEFAULT)) {
        if (key.startsWith('spectrum')) unavailable[key] = true;
      }
    }
    for (const key of smartGroups) {
      unavailable[key] = !t.smartTheme;
      unavailable[key + 'Amount'] = !t.smartTheme || !t[key];
    }
    for (const key of ['Primary', 'PrimaryText', 'Secondary', 'SecondaryText', 'Filter', 'FilterText', 'FilterBorder',
      'Selected', 'ButtonHover', 'ButtonOpacity', 'ButtonRound']) {
      unavailable['playlist' + key] = !t.playlistButtons || !t.playlistCustomButtons;
    }
    syncSmartLocks(t);
    for (const el of shadow.querySelectorAll('[data-prop], [data-number], [data-setting]')) {
      const key = el.dataset.prop || el.dataset.number || el.dataset.setting;
      const locked = lockedManualFields.has(key);
      const row = el.closest('.line') || el.closest('label');
      if (row && !el.dataset.number) row.toggleAttribute('data-auto-locked', locked);
      if (el.dataset.setting) {
        if (locked) el.disabled = true;
        else if (el.hasAttribute('data-smart-locked')) el.disabled = false;
        el.toggleAttribute('data-smart-locked', locked);
        continue;
      }
      const value = t[key];
      if (el.dataset.number) {
        if (el !== shadow.activeElement || el.disabled || resetDraft) el.value = value / (key === 'contrastLevel' ? 10 : 1);
      } else if (el.type === 'checkbox') el.checked = value;
      else if (el.value !== String(value)) el.value = value;
      el.disabled = Boolean(unavailable[key] || locked);
    }
    if (suggestedPalette) showPaletteSuggestion(false);
    $('ymc-addon-clear').disabled = !t.addonSheets.length;
    $('ymc-addon-name').textContent = t.addonSheets.map(sheet => sheet.name).join(', ') || 'CSS дополнения не выбран.';
    for (const group of shadow.querySelectorAll('[data-available]')) {
      setFold(group, !unavailable[group.dataset.available] && !lockedManualFields.has(group.dataset.available), !group.hasAttribute('aria-hidden'));
    }
    const spectrumProfile = Object.entries(SPECTRUM_PROFILES).find(([, { settings }]) =>
      Object.entries(settings).every(([key, value]) => t[key] === value));
    $('ymc-spectrum-profile').value = spectrumProfile?.[0] || '';
    $('ymc-spectrum-retry').disabled = previewSession?.kind === 'spectrum';
    $('ymc-image-options').hidden = t.mode !== 'image' || smartOwnsBackdrop(t);
    $('ymc-apply-palette').disabled = [...lockedManualFields].some(key => COLORS.includes(key));
    syncVibeControls();
    $('ymc-image-status').textContent = t.wallpaper ? 'Локальное изображение загружено.' : 'Выберите PNG, JPG или WebP. Пока используется градиент.';
    $('ymc-bar-clear').disabled = !t.barWallpaper;
    $('ymc-liked-clear').disabled = !t.likedImage;
    if (syncCss) $('ymc-css').value = t.customCss;
    syncPlaylistPreview();
    syncContrastReport();
    syncHistoryButtons();
    syncSettingsTools?.();
  }

  const settingKey = control => control.dataset.prop || control.dataset.setting;

  const APPEARANCE_PREVIEWS = {
    spectrum: { title: 'Эквалайзер', sections: ['ymc-theme-spectrum'] },
    pattern: { title: 'Узоры', sections: ['ymc-theme-pattern'] },
    portrait: { title: 'Портрет артиста', sections: ['ymc-home-portrait'] },
    playlists: { title: 'Плейлисты', sections: [
      'ymc-playlists-gradient', 'ymc-playlists-buttons', 'ymc-playlists-navigation', 'ymc-playlists-details'
    ] }
  };
  let previewSession;

  function editorTheme() {
    return previewSession ? { ...theme, ...previewSession.patch } : theme;
  }

  function previewVisual(kind) {
    const session = previewSession;
    if (session?.kind !== kind || !Object.keys(session.patch).length) return visualTheme();
    const background = portraitBackgroundColor();
    if (session.theme !== theme || session.palette !== smartPalette || session.background !== background || !session.visual) {
      session.theme = theme;
      session.palette = smartPalette;
      session.background = background;
      const draft = editorTheme();
      session.visual = draft.smartTheme && smartPalette
        ? { ...draft, ...smartTarget(smartPalette, draft), coverColors: true } : draft;
    }
    return session.visual;
  }

  function syncAppearancePreview() {
    const kind = previewSession?.kind;
    syncControls(true, false);
    if (kind === 'pattern') paintPattern($('ymc-pattern-sample'), previewVisual(kind), true, .56);
    syncPortraitPreview(portraitBackgroundColor(), previewVisual('portrait'));
    $('ymc-preview-apply').disabled = !kind || !Object.keys(previewSession.patch).length;
    syncSpectrumAnimation(true);
  }

  function editorUpdate(partial, options) {
    const keys = Object.keys(partial);
    if (!previewSession || !keys.every(key => previewSession.keys.has(key))) {
      update(partial, options);
      return false;
    }
    const draft = sanitizeTheme({ ...editorTheme(), ...partial });
    for (const key of keys) {
      if (draft[key] === theme[key]) delete previewSession.patch[key];
      else previewSession.patch[key] = draft[key];
    }
    previewSession.visual = null;
    syncAppearancePreview();
    return true;
  }

  function finishAppearancePreview(applyDraft = false, focus = false) {
    if (!previewSession) return;
    const { button, patch } = previewSession;
    previewSession = undefined;
    $(button.getAttribute('aria-controls')).hidden = true;
    button.setAttribute('aria-pressed', 'false');
    setText(button, 'Предпросмотр');
    $('ymc-preview-toolbar').hidden = true;
    if (applyDraft && Object.keys(patch).length) {
      update(patch, { sync: false });
      notice('Настройки из предпросмотра применены.');
    }
    syncAppearancePreview();
    if (focus) button.focus({ preventScroll: true });
  }

  function startAppearancePreview(button) {
    const kind = button.dataset.appearancePreview;
    const close = previewSession?.button === button;
    finishAppearancePreview();
    if (close) return;
    const { title, sections } = APPEARANCE_PREVIEWS[kind];
    const keys = new Set(sections.flatMap(id => [...$(id).querySelectorAll('[data-prop], [data-setting]')].map(settingKey)));
    previewSession = { kind, keys, button, patch: {} };
    button.setAttribute('aria-pressed', 'true');
    setText(button, 'Закрыть предпросмотр');
    const sample = $(button.getAttribute('aria-controls'));
    sample.hidden = false;
    $('ymc-preview-toolbar').hidden = false;
    setText($('ymc-preview-message'), title + ' · настройки меняют только образец');
    if (kind === 'spectrum') {
      previewLevels.fill(0);
      previewPeaks.fill(0);
    }
    syncAppearancePreview();
    sample.scrollIntoView({ block: 'nearest' });
  }

  const isChanged = key => {
    if (key === 'vibeMedia') return Boolean(vibeMedia || vibeError);
    if (key === 'addonSheets') return theme.addonSheets.length > 0;
    return Object.hasOwn(DEFAULT, key) && (previewSession?.patch[key] ?? theme[key]) !== DEFAULT[key];
  };

  const normalizeSearch = value => value.trim().toLowerCase().replaceAll('ё', 'е');
  const settingAliases = {
    'ymc-playlists-gradient': 'Мне нравится обложка шапка градиент',
    'ymc-playlists-navigation': 'назад вперед невидимые стрелочки навигация',
    'ymc-theme-heart': 'лайк сердечко сердце',
    'ymc-theme-smart': 'умная тема по треку обложка хамелеон характер палитры',
    'ymc-theme-spectrum': 'эквалайзер на фоне визуализатор музыка спектр',
    'ymc-theme-pattern': 'узоры фон символы звезды звездное небо геометрия частицы',
    'ymc-theme-contrast': 'невидимый черный белый читаемость',
    'ymc-home-portrait': 'человек силуэт портрет обводка аура свечение бит бас пульсация',
    'ymc-home-hero': 'заголовок моя волна скрыть артист фотография',
    'ymc-home-badges': 'версия FLAC AAC MP3 качество правый нижний угол'
  };
  function settingsTools(selectTab, resetBlock) {
    const search = $('ymc-settings-search');
    const changed = $('ymc-settings-changed');
    const results = $('ymc-settings-results');
    const index = [];
    const resetButtons = [];
    for (const section of shadow.querySelectorAll('[data-pane] section[id]')) {
      const pane = section.closest('[data-pane]').dataset.pane;
      const heading = section.querySelector('h3, h2') || section;
      const title = section.id === 'ymc-shop-save' ? 'Сохранение темы' : section.dataset.sectionTitle || heading.textContent.trim();
      heading.tabIndex = -1;
      const controls = [...section.querySelectorAll('[data-prop], [data-setting], [data-find]')];
      const keys = [...new Set(controls.map(settingKey).filter(Boolean))];
      for (const control of controls) {
        const label = control.labels?.[0];
        const labelText = label && [...label.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent).join('').trim();
        const name = control.dataset.find || labelText || control.getAttribute('aria-label') || control.textContent.trim();
        const context = `${PANES[mainPane(pane)][0]} · ${title}`;
        index.push({ control, pane, heading, name, context, key: settingKey(control),
          searchable: normalizeSearch([name, context, settingAliases[section.id]].join(' ')) });
      }
      if (!keys.length) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn block-reset';
      button.textContent = 'Сбросить блок';
      button.setAttribute('aria-label', 'Сбросить блок «' + title + '»');
      button.addEventListener('click', () => resetBlock(keys, title));
      const content = section.querySelector('.settings-pad');
      if (content) content.append(button);
      else section.prepend(button);
      resetButtons.push({ button, keys });
    }

    const render = () => {
      const tokens = normalizeSearch(search.value).split(/\s+/).filter(Boolean);
      const changedOnly = changed.getAttribute('aria-pressed') === 'true';
      results.hidden = !tokens.length && !changedOnly;
      if (results.hidden) {
        results.replaceChildren();
        return;
      }
      const fragment = document.createDocumentFragment();
      for (const entry of index) {
        if (lockedManualFields.has(entry.key) || entry.control.closest('[data-section-lock]')) continue;
        if (changedOnly && !isChanged(entry.key)) continue;
        if (!tokens.every(token => entry.searchable.includes(token))) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = entry.name;
        const context = document.createElement('small');
        context.textContent = entry.context;
        button.append(context);
        button.addEventListener('click', () => {
          search.value = '';
          changed.setAttribute('aria-pressed', 'false');
          render();
          selectTab(entry.pane);
          const control = entry.control;
          const section = control.closest('section');
          setSettingsSection(section, true, true);
          let prerequisite;
          for (let ancestor = control.parentElement; ancestor; ancestor = ancestor.parentElement) {
            if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
            if (ancestor.inert && ancestor.dataset.enable) prerequisite = shadow.querySelector(`[data-prop="${ancestor.dataset.enable}"]`);
          }
          const target = prerequisite || (control.getClientRects().length && !control.disabled ? control :
            section.querySelector('.section-toggle') || entry.heading);
          scrollToSetting(target);
          target.focus({ preventScroll: true });
        });
        fragment.append(button);
      }
      if (!fragment.childElementCount) {
        const message = document.createElement('p');
        message.className = 'muted';
        message.setAttribute('role', 'status');
        message.textContent = tokens.length ? 'Ничего не найдено. Попробуйте другое слово.' : 'Значения совпадают со стандартной темой.';
        fragment.append(message);
      }
      results.replaceChildren(fragment);
    };

    search.addEventListener('input', render);
    changed.addEventListener('click', () => {
      changed.setAttribute('aria-pressed', String(changed.getAttribute('aria-pressed') !== 'true'));
      render();
    });
    return () => {
      for (const { button, keys } of resetButtons) {
        button.disabled = !keys.some(key => !lockedManualFields.has(key) && isChanged(key)) || (keys.includes('vibeMedia') && vibeBusy);
      }
      if (search.value || changed.getAttribute('aria-pressed') === 'true') render();
    };
  }

  const timeLabel = value => {
    const n = Math.floor(value);
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  };
  const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const discordStates = {
    off: 'Статус выключен.', connecting: 'Подключение к Discord…', connected: 'Discord подключён.',
    'no-discord': 'Ожидаю запуска настольного Discord.', error: 'Не удалось подключиться. Проверьте Application ID.'
  };
  let discordReady = false, discordBusy = false, discordPollBusy = false;
  async function refreshDiscord() {
    if (discordBusy || discordPollBusy) return;
    if (!discordBridge?.getState || !discordBridge?.setConfig) {
      $('ymc-discord-save').disabled = true;
      setText($('ymc-discord-status'), 'Подключение доступно в Яндекс Музыке с Customizer.');
      return;
    }
    discordPollBusy = true;
    try {
      const state = await discordBridge.getState();
      if (!state?.config || discordBusy) return;
      if (!discordReady) {
        $('ymc-discord-id').value = state.config.discordClientId ?? '';
        $('ymc-discord-enabled').checked = Boolean(state.config.discordRpc);
        $('ymc-discord-paused').checked = Boolean(state.config.discordShowPaused);
        $('ymc-discord-album').checked = state.config.discordShowAlbum === true;
        discordReady = true;
      }
      const albumSupported = typeof state.config.discordShowAlbum === 'boolean';
      $('ymc-discord-album').disabled = !albumSupported;
      setText($('ymc-discord-status'), albumSupported ? discordStates[state.discord] ?? discordStates.off
        : 'Переустановите обновление Customizer, чтобы подключить новые настройки карточки.');
    } catch {
      setText($('ymc-discord-status'), 'Связь с загрузчиком пока недоступна.');
    } finally {
      discordPollBusy = false;
    }
  }

  async function saveDiscord() {
    if (discordBusy || !discordBridge?.setConfig) return;
    const discordClientId = $('ymc-discord-id').value.trim();
    const discordRpc = $('ymc-discord-enabled').checked;
    if ((discordRpc || discordClientId) && !/^\d{15,22}$/.test(discordClientId)) {
      setText($('ymc-discord-status'), 'Введите Application ID из Discord Developer Portal.');
      return;
    }
    const discordShowPaused = $('ymc-discord-paused').checked;
    const discordShowAlbum = $('ymc-discord-album').checked;
    discordBusy = true;
    $('ymc-discord-save').disabled = true;
    try {
      const result = await discordBridge.setConfig({ discordClientId, discordRpc, discordShowPaused, discordShowAlbum });
      if (!result?.ok) throw Error();
      discordReady = true;
      setText($('ymc-discord-status'), discordStates[result.discord] ?? (discordRpc ? discordStates.connecting : discordStates.off));
    } catch {
      setText($('ymc-discord-status'), 'Не удалось сохранить параметры Discord.');
    } finally {
      discordBusy = false;
      $('ymc-discord-save').disabled = false;
    }
  }

  let discordModelNode, discordPlayerState;
  function discordModelTrack(player, title) {
    const node = player || document.querySelector(SELECTOR.vibe);
    try {
      if (discordModelNode !== node || !discordPlayerState) {
        discordModelNode = node;
        discordPlayerState = undefined;
        const key = node && Object.keys(node).find(key => key.startsWith('__reactFiber$'));
        for (let fiber = key && node[key], depth = 0; fiber && depth < 250; fiber = fiber.return, depth++) {
          const model = fiber.memoizedProps?.value;
          if (model?.isRootModel && model.sonataState) {
            discordPlayerState = model.sonataState;
            break;
          }
        }
      }
      const state = discordPlayerState;
      const entity = state?.entityMeta;
      if (!entity || entity.title !== title) return {};
      return { entity, position: state.position, duration: Number(state.duration) || Number(entity.durationMs) / 1000 };
    } catch { return {}; }
  }

  function discordTrack(player) {
    const track = trackInfo(player);
    const session = navigator.mediaSession;
    const model = discordModelTrack(player, track.title);
    const id = value => /^[1-9]\d{0,19}$/.test(String(value)) ? String(value) : '';
    let trackId = id(model.entity?.id);
    let albumId = id(model.entity?.albumId) || id(model.entity?.albums?.[0]?.id);
    if (!trackId && track.title) {
      const link = player?.querySelector('a[class*="Meta_title"][href], a[class*="Meta_trackTitle"][href], [class*="Meta_title"] a[href]');
      if (link?.textContent.trim() === track.title) {
        try {
          const url = new URL(link.href);
          if (url.origin === 'https://music.yandex.ru' || (url.protocol === 'music-application:' && url.host === 'desktop')) {
            const match = url.pathname.match(/^\/(?:album\/([1-9]\d{0,19})\/)?track\/([1-9]\d{0,19})\/?$/);
            if (match) [, albumId = '', trackId] = match;
          }
        } catch { /* Tracks without a stable URL can still be displayed. */ }
      }
    }
    const media = currentMedia();
    const range = nativeRange(player);
    const min = Number(range?.min || 0);
    const useMedia = Number.isFinite(media?.duration) && media.duration > 0;
    const useModel = model.duration > 0 && Number.isFinite(model.position);
    return {
      ...track, trackId, albumId, album: session?.metadata?.album || model.entity?.albums?.[0]?.title || '',
      playing: session?.playbackState === 'playing' || (session?.playbackState !== 'paused' && track.playing),
      position: useModel ? model.position : useMedia ? media.currentTime : range?.valueAsNumber - min,
      duration: useModel ? model.duration : useMedia ? media.duration : Number(range?.max) - min
    };
  }

  function syncDiscordPreview(player) {
    if (activeDialog !== 'editor' || editorTab !== 'player' || $('ymc-discord-preview').closest('[inert]')) return;
    const current = discordTrack(player ?? nativePlayer());
    const demo = !current.title;
    const track = demo ? { title: 'Пример трека', artist: 'Исполнитель', album: 'Название альбома',
      cover: '', playing: true, position: 27, duration: 99 } : current;
    const paused = !track.playing && !$('ymc-discord-paused').checked;
    $('ymc-discord-preview').hidden = paused;
    const note = $('ymc-discord-preview-note');
    note.hidden = !demo && !paused;
    setText(note, paused ? 'Карточка скрыта на паузе.' : demo ? 'Запустите трек, чтобы увидеть его карточку.' : '');
    if (paused) return;

    const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : '';
    const key = value => value.normalize('NFKC').toLowerCase();
    const title = clean(track.title);
    const seen = new Set([key(title)]);
    const state = track.playing ? [] : ['На паузе'];
    for (const value of [track.artist, $('ymc-discord-album').checked ? track.album : '']) {
      const label = clean(value), name = key(label);
      if (!label || seen.has(name)) continue;
      seen.add(name);
      state.push(label);
    }
    setText($('ymc-discord-track'), title);
    const details = $('ymc-discord-details');
    details.hidden = !state.length;
    setText(details, state.join(' · '));

    const cover = $('ymc-discord-cover');
    if ((cover.getAttribute('src') || '') !== track.cover) {
      cover.hidden = !track.cover;
      if (track.cover) cover.src = track.cover;
      else cover.removeAttribute('src');
    }
    const showTime = track.playing && Number.isFinite(track.duration) && Number.isFinite(track.position) &&
      track.duration > 0 && track.position >= 0 && track.position < track.duration;
    $('ymc-discord-time').hidden = !showTime;
    if (showTime) {
      $('ymc-discord-progress').max = track.duration;
      $('ymc-discord-progress').value = track.position;
      setText($('ymc-discord-elapsed'), timeLabel(track.position));
      setText($('ymc-discord-duration'), timeLabel(track.duration));
    }
    const button = $('ymc-discord-open-track');
    button.hidden = !track.trackId;
    if (track.trackId) {
      const href = 'https://music.yandex.ru' + (track.albumId ? '/album/' + track.albumId : '') + '/track/' + track.trackId;
      if (button.getAttribute('href') !== href) button.href = href;
    } else button.removeAttribute('href');
  }

  function reportDiscordTrack() {
    const track = discordTrack(nativePlayer());
    discordBridge.reportTrack({ ...track, cover: track.cover.startsWith('https:') ? track.cover : '' });
  }

  let activeDialog = '';
  let editorTab = 'theme';
  let guideIndex = -1;
  let guideSteps = [];
  let guideMode = 'tab';
  let guidePositionFrame, guideAnimation, guideObserver, guideScrollPanel, guideTrigger;
  const GUIDE = [
    ['theme', 'ymc-theme-status', 'Применение темы',
      'Откройте карточку по её заголовку или найдите настройку поиском. «Оригинал» временно возвращает штатный вид, а ↶ и ↷ отменяют и возвращают изменения. Потяните левую границу редактора, чтобы изменить ширину. Внизу находится кнопка «Обновления»; о новой версии сообщит плашка справа сверху.', 'theme'],
    ['theme', 'ymc-theme-spectrum', 'Эквалайзер на фоне',
      'Включите эквалайзер и выберите готовый вид или форму. «Предпросмотр» показывает рисунок даже без музыки. Изменения остаются в образце до нажатия «Применить». Автоподбор даёт один оттенок. Для трёх ручных цветов отключите группу «Эквалайзер» в умной теме и откройте «Цвета и слои». Там же регулируются свечение, сетка и второй контур. Если сигнал запаздывает, нажмите «Подключить звук».', 'spectrum'],
    ['theme', 'ymc-theme-smart', 'Умная тема по треку',
      'Основной фон берёт цвет крупного участка обложки. У преимущественно белой обложки он остаётся светлым, а цветные детали идут в акценты. Стиль «Светлая» сохраняет светлый фон и для тёмных обложек. Эквалайзер использует один оттенок с переходом по яркости. В «Переход и отдельные цвета» можно изменить силу или отключить каждую группу. Выключите группу, чтобы вернуть её ручные настройки.', 'cover'],
    ['theme', 'ymc-theme-palette', 'Палитра',
      'Акцент красит основные действия, а «Текст» меняет надписи. «Фон» и «Конец градиента» задают общую заливку. Включите свои оттенки акцента, чтобы выбрать цвета при наведении и нажатии. Название видно в магазине при сохранении.', 'theme'],
    ['theme', 'ymc-theme-background', 'Тип фона',
      'Выберите сплошной цвет, градиент, локальную картинку или обложку трека. Для градиента задайте угол, а для изображения измените затемнение. Точное число можно ввести справа от ползунка.'],
    ['theme', 'ymc-theme-media', 'Фото, GIF и видео',
      'Загрузите файл для общего фона и включите его показ. «Заполнить экран» обрезает края, а «Уместить целиком» сохраняет весь кадр. Двигайте кадр по двум осям и меняйте размытие и непрозрачность. Из первого кадра можно выбрать один из шести вариантов палитры.'],
    ['theme', 'ymc-theme-pattern', 'Узоры на фоне',
      'Выберите звёзды, геометрию, ноты или свои символы. Размер, поворот и положение значков случайны, а «Перемешать» создаёт новую раскладку. Цвета, плотность, дрейф и мерцание настраиваются отдельно. В «Реакции на музыку» есть пульс, вибрация, эхо и изгиб линий. Настройте силу, чувствительность и затухание. Предпросмотр без трека использует пробный ритм.'],
    ['theme', 'ymc-theme-surfaces', 'Панели и карточки',
      'Общий цвет используется для панелей. Включите отдельные цвета, чтобы изменить боковую панель и плеер по отдельности. Для боковой панели можно задать второй цвет и угол. На 0% заливка исчезает. Размытие, скругления и неоновое свечение регулируются отдельно.'],
    ['theme', 'ymc-theme-contrast', 'Читаемость и стрелки',
      'Выберите порог и посмотрите, какие пары цветов не проходят проверку. Автозащита подбирает видимый цвет во время оформления. «Исправить слабый контраст» записывает улучшенные цвета в тему. Настройки стрелок находятся во вкладке «Плейлисты».'],
    ['theme', 'ymc-theme-fonts', 'Шрифты и масштаб',
      'Выберите шрифт приложения или один из системных. Включите ручной масштаб и задайте процент. При 100% размер соответствует базовому, а отключение ручного масштаба возвращает автоматику.'],
    ['theme', 'ymc-theme-heart', 'Отметка «Нравится»',
      'Включите оформление закрашенной отметки. Выберите цвет, размер, непрозрачность и форму. Настройте пульс или мерцание и длительность цикла. Можно загрузить картинку и оставить её цвета или перекрасить цветом лайка.'],
    ['layout', 'ymc-home-hero', 'Портрет и надписи',
      'Три независимые галочки скрывают фото, имя исполнителя и верхнюю надпись «Моя волна». Обложка текущего трека и управление остаются на месте.'],
    ['layout', 'ymc-home-buttons', 'Оформление кнопок «Моей волны»',
      'Включите свои цвета иконок. Цвет запуска, паузы и переключения треков теперь следует настройкам транспорта. На светлом фоне умная тема приглушает штатную анимацию, чтобы она не мешала тексту и кнопкам. Своими подложками можно настроить обычные кнопки, кнопку запуска и наведение, а затем изменить непрозрачность и скругление.', 'layout'],
    ['layout', 'ymc-home-visibility', 'Видимость кнопок',
      'Скройте весь ряд или отдельные кнопки воспроизведения, переключения, лайка, дизлайка, громкости и меню. Снимите нужную галочку, чтобы вернуть элемент. Нижний плеер настраивается отдельно.'],
    ['layout', 'ymc-home-sidebar', 'Панель навигации',
      'Выберите край окна, выравнивание и размер значков. В узком окне горизонтальная панель прокручивается колесом. Значок внутри панели переключает подписи. Стрелки в списке меняют порядок. Кнопка у профиля сворачивает панель. Наведите на полоску у края или нажмите на неё, чтобы вернуть панель. Цвет полоски можно настроить, а саму полоску скрыть.'],
    ['layout', 'ymc-home-animation', 'Анимация «Моей волны»',
      'Кастомная анимация перекрашивает штатную «Мою волну». В режиме «Авто» цветной фон даёт близкий оттенок, тёмный нейтральный фон подсвечивается серым, а светлый берёт цвет из обложки. Настройте видимость, контраст и реакцию на бас. При 0% реакции штатное движение сохраняется. Прозрачная навигация оставляет рисунок видимым у края.'],
    ['layout', 'ymc-home-wave', 'Колесо и подсказки',
      'Колесо выбора волны можно скрыть или сделать полупрозрачным. ИИ-подсказки о треках можно выключить целиком или приглушить ползунком.'],
    ['layout', 'ymc-home-motion', 'Редактор анимаций',
      'Главный переключатель включает плавные переходы. Карточки можно слегка поднять и увеличить при наведении. Равномерное дыхание ауры и движение градиента включаются отдельно. Пульсация по музыке находится в карточке «Портрет артиста». Системное уменьшение движения отключает анимации.'],
    ['layout', 'ymc-home-portrait', 'Портрет артиста',
      'Выберите мягкую ауру, обводку или плотное свечение. У плотного свечения мягкие края, а пульс заметнее. Цвет можно взять из темы, подобрать по фону или задать вручную. «Пульсировать в такт музыке» усиливает ауру на басовых ударах. Настройте силу, чувствительность и затухание. Силу можно поднять до 250%. Пульсация работает даже при скрытом эквалайзере.'],
    ['layout', 'ymc-home-track', 'Обложка и строка трека',
      'Включите адаптивную обложку: с видимым портретом она скроется, без портрета займёт больше места между названием и управлением. Имя сохраняет штатный размер. Большая обложка занимает только свободное место под ним. Прозрачность обложки и подложка строки трека настраиваются отдельно.'],
    ['layout', 'ymc-home-badges', 'Значки в правом нижнем углу',
      'Здесь можно по отдельности убрать номер версии Яндекс Музыки, версию загрузчика и формат аудио, например FLAC. Показать можно только значки, которые предоставляет клиент или загрузчик.'],
    ['player', 'ymc-player-layout', 'Конструктор нижнего плеера',
      'Выберите штатную, компактную, центрированную или просторную компоновку. Подстройте высоту, размеры обложки и управления, текст и интервалы. Полосу прогресса можно сделать постоянно видимой или показывать при фокусе. На узкой панели центральный режим использует обычный ряд.'],
    ['player', 'ymc-player-buttons', 'Элементы нижнего плеера',
      'Можно отдельно убрать обложку, название, исполнителя, громкость и кнопку очереди. Включите свои цвета и форму, чтобы задать подложку, иконки, наведение, прозрачность и скругление кнопок.'],
    ['player', 'ymc-theme-bar', 'Фон нижнего плеера',
      'Включите фон нижнего плеера. Задайте непрозрачность или загрузите картинку. «Уместить целиком» показывает её полностью, а положение выбирает, какую часть показывать при обрезке.'],
    ['player', 'ymc-player-overlay', 'Расширенный плеер',
      'Галочка разрешает открыть окно с обложкой, названием, перемоткой и управлением текущим треком. Его можно открыть здесь или кнопкой «Плеер» вверху. Настройки визуализатора находятся во вкладке «Тема».'],
    ['player', 'ymc-discord', 'Статус в Discord',
      'Вставьте Application ID из своего приложения на портале Discord и включите активность. Альбом появляется, если у него отдельное название. Выберите поведение на паузе и проверьте карточку ниже. Кнопка открывает текущий трек, когда известна его ссылка. Сохраните подключение.', 'discord'],
    ['playlists', 'ymc-playlists-gradient', 'Фон шапки плейлиста',
      'Это фон за обложкой и заголовком, в том числе в «Мне нравится». Возьмите цвета темы, задайте два своих, выберите заливку или уберите фон. Угол задаёт направление, насыщенность усиливает второй цвет, длина затухания показывает, где градиент исчезает.', 'theme'],
    ['playlists', 'ymc-playlists-buttons', 'Кнопки и фильтры',
      'Включите оформление кнопок, а для ручных цветов включите вторую галочку. Настройте отдельно «Слушать», меню, скачивание, фильтры и рамку выбранного фильтра. Цвет наведения, скругление и непрозрачность действуют на группы вместе. Образец находится выше.', 'layout'],
    ['playlists', 'ymc-playlists-navigation', 'Стрелки назад и вперёд',
      'Выберите цвет стрелок и подложки, её прозрачность и скругление. Настройка действует во всём приложении, включая «Мне нравится». Защита во вкладке «Тема» помогает, если стрелки сливаются с фоном.'],
    ['playlists', 'ymc-playlists-details', 'Обложка и поиск трека',
      'Включите скругление обложки или оформление поиска. Для строки поиска отдельно настраиваются заливка, текст, непрозрачность и форма. Изменения сразу видны в образце выше.'],
    ['library', 'ymc-shop-catalog', 'Магазин тем',
      'Выберите пресет, сохранённую тему или файл. Встроенные темы разделены по стилям: неон, стекло, светлые, природные, тёплые, динамические и минималистичные. Под названием указаны сердце, аура, динамика и режим хамелеона. Поиск работает внутри выбранного раздела.', 'library'],
    ['library', 'ymc-shop-save', 'Сохранение и перенос темы',
      'Введите название и сохраните текущий вариант в «Мои темы». «Экспорт текущей» вверху упакует тему с её фоном в .ymctheme. Импорт добавит этот файл в каталог, откуда его можно применить.', 'library'],
    ['files', 'ymc-shop-css', 'Свой CSS',
      'Вставьте правила в редактор и нажмите «Применить CSS». Сброс этого блока очищает свой CSS. Остальные параметры сохраняются.'],
    ['files', 'ymc-shop-addon', 'Тема Next Music',
      'Выберите один или несколько CSS-файлов из распакованной темы. Первая галочка включает файлы, вторая отдаёт CSS управление общей палитрой. Локальные скрипты и сервер ресурсов Next Music для этого режима недоступны.'],
    ['files', 'ymc-shop-files', 'Файлы темы',
      'JSON сохраняет параметры оформления, CSS выгружает правила. Импорт JSON применяет сохранённые параметры. Кнопка «Сбросить» здесь возвращает все параметры оформления и убирает активный фон.']
  ];
  const RELEASES = [
    { version: '0.5.6', notes: ['Проверка и установка обновлений из Customizer.'],
      steps: ['ymc-theme-status', 'ymc-discord'] },
    { version: '0.5.7', notes: ['Узоры, изменение ширины редактора, пульсация ауры и настройки значков.'],
      steps: ['ymc-theme-status', 'ymc-theme-pattern', 'ymc-home-hero', 'ymc-home-portrait', 'ymc-home-badges'] },
    { version: '0.6.0', notes: ['Отдельные предпросмотры для эквалайзера, ауры, узоров и плейлистов.'],
      steps: ['ymc-theme-spectrum', 'ymc-theme-pattern', 'ymc-home-portrait', 'ymc-playlists-gradient'] },
    { version: '0.7.0', notes: [
      'Панель навигации можно переносить, менять порядок и скрывать отдельные пункты.',
      'У «Моей волны» появились дымка, ленты и орбиты, у портрета — лента в такт музыке.',
      'Исправлен цвет паузы и улучшена читаемость светлых тем; ручные цвета разблокируются по группам.',
      'Обложка может скрываться при портрете и увеличиваться без него. Рассыпные узоры больше не строятся по сетке.'
    ], steps: ['ymc-home-sidebar', 'ymc-home-animation', 'ymc-home-portrait', 'ymc-home-track', 'ymc-home-buttons',
      'ymc-theme-smart', 'ymc-theme-pattern'] },
    { version: '0.7.1', notes: [
      'Штатная анимация «Моей волны» перекрашивается без изменения движения. Все кнопки получают цвета темы.',
      'Плотная аура без контура, выровненный экран и исправленный размер крупной обложки.',
      'Подписи под значками панели, меню по группам и закрытые ручные разделы умной темы.'
    ], steps: ['ymc-home-animation', 'ymc-home-portrait', 'ymc-home-track', 'ymc-home-sidebar', 'ymc-home-buttons', 'ymc-theme-smart'] },
    { version: '0.7.2', notes: [
      '«Моя волна» сохраняет штатный размер имени и раскладку. Крупная обложка ограничена местом между именем и плеером.',
      'Горизонтальная навигация занимает доступную ширину. Кнопка у края сворачивает и возвращает всю панель.'
    ], steps: ['ymc-home-track', 'ymc-home-sidebar'] },
    { version: '0.7.3', notes: [
      'Штатная панель сохраняет раскладку Яндекс Музыки.',
      'Сверху, снизу и по бокам значки центрируются. Подписи идут под значками, логотип и профиль помещаются целиком.'
    ], steps: ['ymc-home-sidebar'] },
    { version: '0.7.4', notes: [
      'На macOS тема и редактор восстанавливаются, если клиент перестроил страницу при запуске.',
      'Кнопка сворачивания находится рядом с профилем. В свёрнутом виде кнопка возврата остаётся у края окна.'
    ], steps: ['ymc-home-sidebar'] },
    { version: '0.7.5', notes: [
      'Светлая умная тема сохраняет светлый фон даже с тёмной обложкой. Штатная «Моя волна» больше не затемняет фон своей подложкой.',
      'Узоры размещаются случайно по всему окну и могут пульсировать, дрожать, изгибаться или давать эхо в такт музыке.',
      'Размер значков навигации настраивается. Свёрнутая панель возвращается при наведении на полоску у края.',
      'Кастомная «Моя волна» подбирает цвет по теме и реагирует на бас. Эквалайзер заполняет пространство до нижнего края.'
    ], steps: ['ymc-theme-smart', 'ymc-theme-pattern', 'ymc-home-sidebar', 'ymc-home-animation', 'ymc-theme-spectrum'] }
  ];

  const validVersion = value => typeof value === 'string' && /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(value);
  function compareVersions(a, b) {
    const left = a.split('.').map(Number), right = b.split('.').map(Number);
    return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
  }
  let upgradeFrom = '';
  function initOnboarding() {
    try {
      const last = localStorage.getItem(RUN_VERSION_KEY);
      const seen = localStorage.getItem(GUIDE_SEEN_KEY);
      const pending = localStorage.getItem(PENDING_GUIDE_KEY);
      const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
      const legacy = stored?.version === 2 ? ('patternEnabled' in stored ? '0.5.7' : '0.5.5')
        : localStorage.getItem(LEGACY_KEY) ? '0.5.5' : '';
      const previous = validVersion(last) ? last : validVersion(seen) ? seen : legacy;
      if (validVersion(pending) && compareVersions(pending, version) < 0) upgradeFrom = pending;
      else if (validVersion(previous) && compareVersions(previous, version) < 0) upgradeFrom = previous;
      if (upgradeFrom) localStorage.setItem(PENDING_GUIDE_KEY, upgradeFrom);
      if (!last || !validVersion(last) || compareVersions(last, version) < 0) localStorage.setItem(RUN_VERSION_KEY, version);
    } catch { /* The guide is also accessible from the editor without storage. */ }
  }

  const newerReleases = () => RELEASES.filter(release => upgradeFrom && compareVersions(release.version, upgradeFrom) > 0 &&
    compareVersions(release.version, version) <= 0);
  function upgradeSteps() {
    const unique = new Set(newerReleases().flatMap(release => release.steps));
    return [...unique].map(id => GUIDE.find(step => step[1] === id)).filter(Boolean);
  }

  function showReleaseNotes() {
    const releases = newerReleases();
    if (!releases.length) return;
    try { if (localStorage.getItem('ymc:whats-new:seen') === version) return; } catch {}
    const dialog = $('ymc-whats-new');
    setText($('ymc-release-version'), 'Customizer v' + version);
    setText($('ymc-release-range'), 'Обновлено с v' + upgradeFrom + ' до v' + version + '.');
    $('ymc-release-notes').replaceChildren(...releases.flatMap(({ version: release, notes }) => notes.map(note => {
      const item = document.createElement('li');
      item.textContent = (release === version ? '' : 'v' + release + ' · ') + note;
      return item;
    })));
    dialog.showModal();
    try { localStorage.setItem('ymc:whats-new:seen', version); } catch {}
  }

  function guideWasSeen() {
    try { return localStorage.getItem(GUIDE_SEEN_KEY) === version; }
    catch { return false; }
  }

  function dismissGuideOffer() {
    try {
      localStorage.setItem(GUIDE_SEEN_KEY, version);
      localStorage.removeItem(PENDING_GUIDE_KEY);
    } catch {}
    upgradeFrom = '';
    $('ymc-guide-offer').hidden = true;
  }

  function closeGuide(restoreFocus = true) {
    if (guideIndex < 0) return;
    guideIndex = -1;
    if (guidePositionFrame !== undefined) cancelAnimationFrame(guidePositionFrame);
    guidePositionFrame = undefined;
    guideAnimation?.cancel();
    guideAnimation = undefined;
    guideObserver?.disconnect();
    stopGuideScroll();
    $('ymc-guide').hidden = true;
    if (restoreFocus) {
      const trigger = guideTrigger?.getClientRects().length ? guideTrigger : $('ymc-guide-open');
      trigger.focus({ preventScroll: true });
    }
    guideTrigger = undefined;
  }

  const editorPanel = () => $('ymc-editor').querySelector('.panel');

  function scrollToSetting(el) {
    const panel = editorPanel();
    const head = panel.querySelector('.head').getBoundingClientRect();
    const offset = el.getBoundingClientRect().top - head.bottom;
    panel.scrollTo({ top: panel.scrollTop + offset - 10, behavior: 'instant' });
  }

  function stopGuideScroll() {
    if (!guideScrollPanel) return;
    guideScrollPanel.scrollTo({ top: guideScrollPanel.scrollTop, behavior: 'instant' });
    guideScrollPanel = undefined;
  }

  function readGuidePosition(target) {
    const panel = editorPanel(), card = $('ymc-guide-card');
    const bounds = panel.getBoundingClientRect();
    const header = panel.querySelector('.head').getBoundingClientRect();
    const rect = (target.querySelector('.settings-heading') || target).getBoundingClientRect();
    const width = card.offsetWidth, height = card.offsetHeight;
    const beside = bounds.left >= width + 28;
    const cardX = beside ? bounds.left - width - 16 : Math.max(12, (innerWidth - width) / 2);
    const cardY = beside ? Math.max(10, Math.min(header.bottom + 12, innerHeight - height - 10)) : innerHeight - height - 10;
    return {
      panel, rect, cardX, cardY,
      contentTop: Math.max(bounds.top, header.bottom) + 4,
      contentBottom: Math.min(bounds.bottom, beside ? innerHeight : cardY - 8) - 4,
      left: Math.max(bounds.left + 4, rect.left - 5),
      right: Math.min(bounds.right - 4, innerWidth - 4, rect.right + 5)
    };
  }

  function writeGuidePosition(geometry, scrollDelta = 0) {
    const { rect, cardX, cardY, left, right, contentTop, contentBottom } = geometry;
    const card = $('ymc-guide-card'), spot = $('ymc-guide-spot');
    const top = Math.max(contentTop, rect.top - 4 - scrollDelta);
    const bottom = Math.min(contentBottom, rect.bottom + 5 - scrollDelta, top + 168);
    const visible = bottom - top >= 6 && right > left;
    const place = (node, x, y) => {
      const translate = Math.round(x) + 'px ' + Math.round(y) + 'px';
      if (node.style.translate !== translate) node.style.translate = translate;
    };
    place(card, cardX, cardY);
    if (spot.hidden === visible) spot.hidden = !visible;
    if (visible) {
      place(spot, left, top);
      const width = Math.round(right - left) + 'px';
      const height = Math.round(bottom - top) + 'px';
      if (spot.style.width !== width) spot.style.width = width;
      if (spot.style.height !== height) spot.style.height = height;
    }
  }

  function positionGuide() {
    guidePositionFrame = undefined;
    if (guideIndex < 0) return;
    const target = $(guideSteps[guideIndex][1]);
    if (target) writeGuidePosition(readGuidePosition(target));
  }

  function queueGuidePosition() {
    if (guideIndex >= 0 && guidePositionFrame === undefined) guidePositionFrame = requestAnimationFrame(positionGuide);
  }

  function revealGuideTarget(target, animate) {
    const geometry = readGuidePosition(target);
    const { panel, rect, contentTop, contentBottom } = geometry;
    const anchorHeight = Math.min(42, rect.height);
    let scrollDelta = 0;
    if (rect.top < contentTop + 4 || rect.top + anchorHeight > contentBottom) {
      const start = panel.scrollTop;
      const end = Math.min(panel.scrollHeight - panel.clientHeight, Math.max(0, start + rect.top - contentTop - 7));
      scrollDelta = end - start;
      if (Math.abs(scrollDelta) > 1) {
        const smooth = animate && Math.abs(scrollDelta) < panel.clientHeight * 1.3;
        if (smooth) guideScrollPanel = panel;
        panel.scrollTo({ top: end, behavior: smooth ? 'smooth' : 'instant' });
        if (smooth) scrollDelta = 0;
      }
    }
    writeGuidePosition(geometry, scrollDelta);
    guideObserver ||= new ResizeObserver(queueGuidePosition);
    guideObserver.disconnect();
    for (const node of [panel, panel.querySelector('.head'), target, $('ymc-guide-card')]) guideObserver.observe(node);
    queueGuidePosition();
  }

  function startGuide(mode, selectTab, trigger) {
    if (guideIndex < 0) guideTrigger = trigger;
    guideMode = mode;
    guideSteps = mode === 'update' ? upgradeSteps() : mode === 'all' ? GUIDE :
      GUIDE.filter(([pane]) => mainPane(pane) === mainPane(editorTab));
    if (guideSteps.length) showGuideStep(0, selectTab);
  }

  function showGuideStep(index, selectTab) {
    if (index < 0) return;
    if (index >= guideSteps.length) {
      if (guideMode !== 'tab') dismissGuideOffer();
      closeGuide();
      return;
    }
    const [pane, targetId, title, description, example] = guideSteps[index];
    const target = $(targetId);
    if (!target) return;
    const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const samePane = guideIndex >= 0 && pane === editorTab;
    stopGuideScroll();
    guideAnimation?.cancel();
    guideAnimation = undefined;
    guideIndex = index;
    if (pane !== editorTab) selectTab(pane);
    $('ymc-guide').hidden = false;
    setText($('ymc-guide-progress'), `${PANES[mainPane(pane)][0]} · Шаг ${index + 1} из ${guideSteps.length}`);
    setText($('ymc-guide-title'), title);
    setText($('ymc-guide-text'), description);
    const demo = $('ymc-guide-demo');
    if (demo.dataset.demo !== (example || '')) {
      demo.hidden = !example;
      demo.dataset.demo = example || '';
      const shapes = !example ? 0 : example === 'discord' ? 1 : example === 'spectrum' ? 10 : 4;
      demo.replaceChildren(...Array.from({ length: shapes }, () => document.createElement('i')));
      if (example === 'discord') {
        const sample = document.createElement('b');
        sample.textContent = 'Название трека · Исполнитель · 1:24';
        demo.append(sample);
      }
    }
    $('ymc-guide-back').disabled = index === 0;
    $('ymc-guide-all').hidden = guideMode === 'all';
    setText($('ymc-guide-next'), index === guideSteps.length - 1 ? 'Готово' : 'Далее');
    setSettingsSection(target, true, true);
    const card = $('ymc-guide-card');
    card.scrollTop = 0;
    revealGuideTarget(target, samePane && animate);
    if (animate) {
      guideAnimation = $('ymc-guide-content').animate([
        { opacity: .72, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 160, easing: 'cubic-bezier(.22,.7,.25,1)' });
    }
    const focused = shadow.activeElement;
    if (!card.contains(focused) || focused.disabled || focused.hidden) $('ymc-guide-next').focus({ preventScroll: true });
  }
  let returnFocus;
  let seeking = false;
  let seekPlayer;
  let seekRange;

  let editorWidth = 0;
  function editorBounds(viewport = window.innerWidth) {
    const min = Math.round(viewport <= 580 ? Math.min(viewport, 400) : Math.min(510, viewport * .46));
    const max = Math.max(min, Math.round(viewport <= 580 ? viewport : Math.min(1400, viewport * .84)));
    return { min, max };
  }

  function syncEditorWidth() {
    const { min, max } = editorBounds();
    const storeWidth = mainPane(editorTab) === 'library' && window.innerWidth > 580
      ? Math.min(970, window.innerWidth * .76) : min;
    const width = Math.min(max, Math.max(min, Math.round(editorWidth || storeWidth)));
    const resize = $('ymc-resize');
    const rootStyle = document.documentElement.style;
    if (rootStyle.getPropertyValue('--ymc-dock') !== width + 'px') rootStyle.setProperty('--ymc-dock', width + 'px');
    resize.hidden = min === max;
    resize.setAttribute('aria-valuemin', min);
    resize.setAttribute('aria-valuemax', max);
    resize.setAttribute('aria-valuenow', width);
    resize.setAttribute('aria-valuetext', width + ' пикс.');
    return width;
  }

  function setupEditorResize() {
    const resize = $('ymc-resize'), editor = $('ymc-editor');
    let drag;
    try { editorWidth = bounded(Number(localStorage.getItem(EDITOR_WIDTH_KEY)) || null, 1, 1400, 0); } catch {}
    const save = () => { try { localStorage.setItem(EDITOR_WIDTH_KEY, String(editorWidth)); } catch {} };
    const choose = value => {
      const { min, max } = editorBounds();
      editorWidth = bounded(value, min, max, min);
      syncEditorWidth();
      queueGuidePosition();
    };
    resize.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag) return;
      event.preventDefault();
      const bounds = editor.getBoundingClientRect();
      drag = { id: event.pointerId, offset: event.clientX - bounds.left, start: event.clientX, right: bounds.right };
      resize.setPointerCapture(event.pointerId);
      resize.focus({ preventScroll: true });
      editor.setAttribute('data-resizing', '');
    });
    resize.addEventListener('pointermove', event => {
      if (event.pointerId !== drag?.id || !drag.changed && Math.abs(drag.start - event.clientX) < 2) return;
      drag.changed = true;
      choose(drag.right - event.clientX + drag.offset);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      resize.addEventListener(event, ({ pointerId }) => {
        if (pointerId !== drag?.id) return;
        if (drag.changed) save();
        drag = undefined;
        editor.removeAttribute('data-resizing');
      });
    }
    resize.addEventListener('dblclick', () => { choose(editorBounds().min); save(); });
    resize.addEventListener('keydown', event => {
      const { min, max } = editorBounds(), current = syncEditorWidth(), step = event.shiftKey ? 60 : 20;
      const next = { ArrowLeft: current + step, ArrowRight: current - step, Home: min, End: max }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      choose(next);
      save();
    });
    syncEditorWidth();
  }

  function setUpdateCard(open, focus = false) {
    const trigger = $('ymc-update-summary'), card = $('ymc-update-card');
    if (open && trigger.hidden) return;
    card.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (focus) {
      const check = $('ymc-update-check');
      (open && !check.disabled ? check : trigger).focus({ preventScroll: true });
    }
  }

  function setupUpdates() {
    if (!discordBridge?.checkUpdate || !discordBridge?.installUpdate) return;
    const trigger = $('ymc-update-summary'), label = $('ymc-update-label'), card = $('ymc-update-card');
    const check = $('ymc-update-check'), install = $('ymc-update-install');
    const status = $('ymc-update-status'), notes = $('ymc-update-notes'), toast = $('ymc-update-toast');
    let latest = '', dismissed, swipe;
    try { dismissed = localStorage.getItem(UPDATE_DISMISSED_KEY); } catch {}
    trigger.hidden = false;
    const dismiss = () => {
      if (latest) {
        dismissed = latest;
        try { localStorage.setItem(UPDATE_DISMISSED_KEY, latest); } catch {}
      }
      toast.hidden = true;
    };
    const showAvailable = (next, message) => {
      latest = next;
      trigger.toggleAttribute('data-available', Boolean(latest));
      setText(label, latest ? 'Обновления · v' + latest : 'Обновления');
      install.hidden = !latest;
      notes.hidden = !latest || !message;
      setText(notes, latest ? message || '' : '');
      toast.hidden = !latest || latest === dismissed || !card.hidden;
      if (!toast.hidden) setText($('ymc-update-toast-title'), 'Вышел Customizer ' + latest);
    };
    const checkUpdate = async () => {
      if (check.disabled) return;
      check.disabled = install.disabled = true;
      setText(status, 'Проверка обновлений…');
      try {
        const result = await discordBridge.checkUpdate();
        const next = result?.available && typeof result.version === 'string' && /^\d+\.\d+\.\d+$/.test(result.version)
          ? result.version : '';
        showAvailable(next, result?.notes);
        setText(status, result?.error || (next ? 'Доступна версия ' + next + '.' : 'Установлена актуальная версия.'));
      } catch {
        showAvailable('');
        setText(status, 'Не удалось проверить обновления.');
      } finally {
        check.disabled = install.disabled = false;
      }
    };
    trigger.addEventListener('click', () => {
      if (card.hidden && !toast.hidden) dismiss();
      setUpdateCard(card.hidden);
    });
    check.addEventListener('click', checkUpdate);
    install.addEventListener('click', async () => {
      if (!latest || install.disabled) return;
      dismiss();
      check.disabled = install.disabled = true;
      setText(status, 'Скачивание и проверка обновления…');
      try {
        const result = await discordBridge.installUpdate();
        if (result?.restarting) {
          setText(status, 'Перезапуск Яндекс Музыки…');
          return;
        }
        setText(status, result?.error || 'Не удалось установить обновление.');
      } catch {
        setText(status, 'Не удалось установить обновление.');
      }
      check.disabled = install.disabled = false;
    });
    $('ymc-update-toast-close').addEventListener('click', dismiss);
    $('ymc-update-toast-open').addEventListener('click', () => {
      dismiss();
      if (activeDialog !== 'editor') showDialog('editor', launcher);
      else closeGuide(false);
      setUpdateCard(true, true);
    });
    toast.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    });
    toast.addEventListener('pointerdown', event => {
      if (event.button !== 0 || swipe || event.target.closest('button')) return;
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
      toast.setPointerCapture(event.pointerId);
    });
    toast.addEventListener('pointermove', event => {
      if (event.pointerId !== swipe?.id || reducedMotion()) return;
      const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
      if (Math.abs(dx) > Math.max(8, Math.abs(dy))) toast.style.translate = dx + 'px';
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      toast.addEventListener(event, e => {
        if (e.pointerId !== swipe?.id) return;
        const dx = Math.abs(e.clientX - swipe.x), dy = Math.abs(e.clientY - swipe.y);
        swipe = undefined;
        toast.style.removeProperty('translate');
        if (event === 'pointerup' && dx > Math.max(60, dy * 1.35)) dismiss();
      });
    }
    document.addEventListener('pointerdown', event => {
      if (!card.hidden && !event.composedPath().some(node => node === card || node === trigger || node === toast)) {
        setUpdateCard(false);
      }
    }, true);
    checkUpdate();
    setInterval(checkUpdate, 6 * 60 * 60 * 1000);
  }

  function showDialog(name, trigger) {
    if (name !== 'editor') finishAppearancePreview();
    if (name !== 'editor') closeGuide(false);
    if (name !== 'editor' && compareNative) {
      compareNative = false;
      apply();
    }
    if (activeDialog === 'now' && name !== 'now') {
      stopSpectrum();
      seeking = false;
      seekPlayer = seekRange = null;
    }
    if (trigger) returnFocus = trigger;
    activeDialog = name;
    if (name !== 'editor') setUpdateCard(false);
    $('ymc-editor').hidden = name !== 'editor';
    document.documentElement.toggleAttribute('data-ymc-editor-open', name === 'editor');
    if (name === 'editor') syncEditorWidth();
    $('ymc-now').hidden = name !== 'now';
    if (name === 'editor') {
      $('ymc-guide-offer').hidden = guideWasSeen();
      const updated = upgradeSteps().length > 0;
      setText($('ymc-guide-offer-title'), updated ? 'Что изменилось в Customizer' : 'Знакомство с Customizer');
      setText($('ymc-guide-offer-text'), updated ? 'Покажем только изменения с v' + upgradeFrom + ' до v' + version + '.'
        : 'Пройдите все вкладки и посмотрите, где находятся настройки.');
      setText($('ymc-guide-start'), updated ? 'Посмотреть изменения' : 'Начать обучение');
    }
    launcher?.setAttribute('aria-expanded', String(Boolean(name)));
    refresh();
    if (name) $(name === 'editor' ? 'ymc-close' : 'ymc-now-close').focus();
    else {
      (returnFocus?.getClientRects().length ? returnFocus : launcher)?.focus();
      returnFocus = null;
    }
  }

  function showTimeline(player, media) {
    const native = nativeRange(player);
    const min = native ? Number(native.min || 0) : 0;
    const max = native ? Number(native.max || 100) : media?.duration;
    const position = native ? native.valueAsNumber : media?.currentTime;
    const valid = Number.isFinite(max) && max > min && Number.isFinite(position);
    $('ymc-timeline').hidden = !valid;
    $('ymc-seek').hidden = !native;
    $('ymc-progress').hidden = Boolean(native);
    if (!valid || seeking) return;
    const percent = Math.min(1000, Math.max(0, Math.round(1000 * (position - min) / (max - min))));
    $('ymc-progress').value = percent;
    $('ymc-seek').value = percent;
    setText($('ymc-time'), timeLabel(Math.max(0, position - min)));
    setText($('ymc-duration'), timeLabel(max - min));
  }

  function refreshPlayer(player, track) {
    setText($('ymc-now-track'), track.title || 'Трек пока не выбран');
    setText($('ymc-now-artist'), track.artist);
    const img = $('ymc-now-cover');
    if ((img.getAttribute('src') || '') !== track.cover) {
      if (track.cover) img.src = track.cover;
      else img.removeAttribute('src');
      img.hidden = !track.cover;
    }
    for (const control of shadow.querySelectorAll('[data-action]')) {
      const native = nativeButton(player, control.dataset.action);
      control.disabled = !native;
      if (control.dataset.action === 'toggle') setText(control, track.playing ? 'Пауза' : 'Играть');
      if (control.dataset.action === 'like') {
        const liked = native?.getAttribute('aria-pressed') === 'true';
        control.setAttribute('aria-pressed', String(liked));
        setText(control, liked ? '♥' : '♡');
      }
    }
    const media = currentMedia();
    showTimeline(player, media);
    if (overlaySpectrum && (!theme.visualizer || document.hidden)) stopSpectrum();
    $('ymc-spectrum-controls').hidden = !theme.visualizer;
    $('ymc-spectrum').hidden = !overlaySpectrum;
    const start = $('ymc-spectrum-start');
    const canCapture = Boolean(media && !media.paused && (media.captureStream || playerAudioNodes.has(media)) && window.AudioContext);
    start.disabled = !canCapture && !overlaySpectrum;
    if (overlaySpectrum) setText(start, 'Выключить визуализатор');
    else if (!canCapture) setText(start, 'Аудиопоток пока недоступен');
    else setText(start, 'Запустить визуализатор');
  }

  function restorePresentation() {
    const { documentElement: root, head, body } = document;
    if (!head || !body) return;
    const remount = host.parentNode !== body;
    const missingFilter = waveFilter.parentNode !== body;
    const missingSheets = baseStyle.parentNode !== head || customStyle.parentNode !== head ||
      nativeStyle.parentNode !== head || addonStyles.some(sheet => sheet.parentNode !== head);
    const editor = activeDialog === 'editor';
    const missingState = root.getAttribute('data-ymc-active') !== (isStyled() ? 'yes' : 'no') ||
      root.hasAttribute('data-ymc-editor-open') !== editor ||
      editor && !root.style.getPropertyValue('--ymc-dock') ||
      paintCount && !root.style.getPropertyValue(paintNames[0]);
    if (!remount && !missingFilter && !missingSheets && !missingState) return;

    // The client's React root may replace the startup markup after the preload has run.
    if (missingSheets) head.append(baseStyle, ...addonStyles, customStyle, nativeStyle);
    if (missingFilter) body.append(waveFilter);
    if (remount) {
      body.append(host);
      const notes = $('ymc-whats-new');
      if (notes.open && !notes.matches(':modal')) {
        notes.close();
        notes.showModal();
      }
    }
    root.toggleAttribute('data-ymc-editor-open', editor);
    syncEditorWidth();
    apply();
  }

  function syncNativeMounts() {
    restorePresentation();
    const fullscreen = Boolean(document.fullscreenElement) ||
      [...document.querySelectorAll(SELECTOR.fullscreen)].some(el => el.getClientRects().length && !el.closest('[aria-hidden="true"]'));
    syncAppBackground();
    syncSidebar(desktopNavbar(), fullscreen);
    syncWaveMount(fullscreen);
    syncPortraitAura(fullscreen ? null : portraitNode);
    syncPatternMount(fullscreen);
    syncBeatPortrait(fullscreen);
    syncBottomBar(fullscreen);
  }

  function refresh() {
    if (!shadow) return;
    syncNativeMounts();
    if (document.hidden) return;
    const player = isStyled() ? nativePlayer() : null;
    const wide = syncLayout(player);
    const available = Boolean(player && theme.playerOverlay);
    $('ymc-player-open').hidden = !available;
    $('ymc-player-preview').disabled = !available;
    setText($('ymc-player-status'), player ? 'Штатная панель найдена.' : 'Штатная панель пока не найдена.');
    setText($('ymc-layout-status'), compareNative ? 'Показана штатная ширина.' : !theme.enabled ? 'Customizer отключён.' : !theme.widePlayer ? 'Используется ширина приложения.'
      : wide ? 'Плеер расширен на всю ширину.' : 'Эта раскладка не поддерживает расширение. Штатная ширина сохранена.');
    if (!available && activeDialog === 'now') {
      showDialog('', null);
      return;
    }
    const coverMode = isStyled() && visualTheme().mode === 'cover' && !(theme.addonEnabled && theme.addonPalette);
    const smartMode = isStyled() && theme.smartTheme;
    const visuals = visualTheme();
    const waveCover = Boolean(activeHero && waveUsesTint(visuals) && waveNeedsCover(visuals));
    const track = coverMode || smartMode || waveCover || activeDialog === 'now' ? trackInfo(player, smartMode || waveCover) : null;
    if (waveCover || waveKey) {
      syncWavePalette(waveCover ? track : null, smartMode);
      if (waveCover && smartMode && smartReady && smartPalette && smartCovers.join('\n') === waveKey && waveSample !== smartPalette) {
        waveSample = smartPalette;
        paintCustomWave(visualTheme());
      }
    }
    const nextCover = coverMode ? track.cover : '';
    if (cover !== nextCover) {
      cover = nextCover;
      apply();
    }
    $('ymc-cover-status').hidden = !coverMode;
    setText($('ymc-cover-status'), cover ? 'Используется обложка текущего трека.' : 'До появления обложки используется градиент.');
    if (smartMode) syncSmartTheme(track);
    else setText($('ymc-smart-status'), theme.smartTheme ? 'Умная тема приостановлена.' : 'Умная тема выключена.');
    if (activeDialog === 'now') refreshPlayer(player, track);
    else syncDiscordPreview(player);
  }

  function mount() {
    if (host || !document.body) return;
    host = document.createElement('div');
    host.id = 'ymusic-customizer-root';
    appBackdrop = document.createElement('div');
    appBackdrop.dataset.ymcAppBackdrop = '';
    appBackdrop.setAttribute('aria-hidden', 'true');
    waveFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    waveFilter.setAttribute('aria-hidden', 'true');
    waveFilter.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    waveFilter.innerHTML = '<defs><filter id="ymc-native-wave-tint" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="matrix" result="waveLight"/><feComposite in="waveLight" in2="SourceAlpha" operator="in"/></filter></defs>';
    waveMatrix = waveFilter.querySelector('feColorMatrix');
    patternLayer = document.createElement('div');
    patternLayer.dataset.ymcPattern = '';
    patternLayer.setAttribute('aria-hidden', 'true');
    patternLayer.innerHTML = patternMarkup('ymc-pattern-page-tile');
    Object.assign(host.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483640' });
    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    const frame = document.createElement('div');
    frame.innerHTML = MARKUP;
    shadow.append(style, frame);
    document.body.append(waveFilter, host);
    setupEditorSections();
    setupEditorResize();

    navToggle = document.createElement('button');
    navToggle.type = 'button';
    navToggle.setAttribute('data-ymc-nav-toggle', '');
    navToggle.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 5h12M4 10h12M6 15h8"/></svg>';
    navToggle.addEventListener('click', () => update({ sidebarCompact: !theme.sidebarCompact }));

    navEdgeToggle = document.createElement('button');
    navEdgeToggle.type = 'button';
    navEdgeToggle.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 6 6-6 6"/></svg>';
    navEdgeToggle.addEventListener('click', () => {
      const focused = document.activeElement === navEdgeToggle;
      update({ sidebarCollapsed: !theme.sidebarCollapsed });
      if (focused) navEdgeToggle.focus({ preventScroll: true });
    });
    navEdgeToggle.addEventListener('pointerenter', event => {
      if (!theme.sidebarCollapsed || event.pointerType === 'touch' || event.buttons) return;
      clearTimeout(navRevealTimer);
      navRevealTimer = setTimeout(() => {
        if (theme.sidebarCollapsed && navEdgeToggle.isConnected && navEdgeToggle.matches(':hover')) {
          update({ sidebarCollapsed: false });
        }
      }, 170);
    });
    navEdgeToggle.addEventListener('pointerleave', () => clearTimeout(navRevealTimer));

    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.dataset.ymcLauncher = '';
    launcher.setAttribute('aria-label', 'Customizer');
    launcher.setAttribute('aria-controls', 'ymusic-customizer-root');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.title = `Customizer (${shortcut})`;
    launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 6h8m4 0h6M3 12h3m4 0h11M3 18h12m4 0h2M11 3v6M6 9v6m9 0v6"/></svg><span>Customizer</span>';
    launcher.addEventListener('click', () => showDialog(activeDialog === 'editor' ? '' : 'editor', launcher));
    $('ymc-player-open').addEventListener('click', () => showDialog('now'));
    $('ymc-player-preview').addEventListener('click', () => showDialog('now'));
    $('ymc-close').addEventListener('click', () => showDialog(''));
    $('ymc-now-close').addEventListener('click', () => showDialog(''));
    $('ymc-now').addEventListener('click', e => { if (e.target === e.currentTarget) showDialog(''); });
    $('ymc-now-cover').addEventListener('error', e => { e.currentTarget.hidden = true; });

    document.addEventListener('keydown', e => {
      if (e.isTrusted && spectrumContext?.state === 'suspended' && spectrumFrame !== undefined) {
        spectrumContext.resume().catch(() => {});
      }
      const modifier = (e.ctrlKey && !e.metaKey) || (mac && e.metaKey && !e.ctrlKey);
      const target = e.composedPath()[0];
      const typing = target instanceof HTMLElement && (target.isContentEditable ||
        target.matches('textarea,input:is([type=text],[type=search],[type=number])'));
      if (activeDialog === 'editor' && modifier && !e.altKey && !typing &&
        (e.code === 'KeyZ' || !e.shiftKey && !mac && e.code === 'KeyY')) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) (e.shiftKey || e.code === 'KeyY' ? redoTheme : undoTheme)();
        return;
      }
      if (modifier && e.shiftKey && !e.altKey && (e.code === 'KeyY' || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) showDialog(activeDialog === 'editor' ? '' : 'editor', activeDialog ? null : launcher);
        return;
      }
      if (!activeDialog) return;
      if (e.key === 'Escape') {
        if ($('ymc-update-toast').contains(target)) return;
        e.preventDefault();
        e.stopPropagation();
        if (guideIndex >= 0) closeGuide();
        else if (activeDialog === 'editor' && !$('ymc-update-card').hidden) setUpdateCard(false, true);
        else if (previewSession) finishAppearancePreview(false, true);
        else showDialog('');
      } else if (activeDialog === 'now' && e.key === 'Tab') {
        const current = $(activeDialog === 'editor' ? 'ymc-editor' : 'ymc-now');
        const controls = [...current.querySelectorAll('button,input,select,textarea')]
          .filter(el => !el.disabled && el.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (!controls.includes(shadow.activeElement) || shadow.activeElement === (e.shiftKey ? first : last)) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
        e.stopPropagation();
      } else if (activeDialog === 'now' && e.target !== host) {
        // A modal must not invoke playback hotkeys in the page behind it.
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    document.addEventListener('pointerdown', e => {
      if (e.isTrusted && spectrumContext?.state === 'suspended' && spectrumFrame !== undefined) {
        spectrumContext.resume().catch(() => {});
      }
    }, true);
    shadow.addEventListener('keydown', e => { if (activeDialog) e.stopPropagation(); });

    const tabs = [...shadow.querySelectorAll('.tabs [data-tab]')];
    const cssTab = shadow.querySelector('[data-tab="files"]');
    function tab(name) {
      if (name !== editorTab) finishAppearancePreview();
      editorTab = name;
      const group = mainPane(name);
      syncEditorWidth();
      tabs.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === group)));
      $('ymc-shop-nav').hidden = group !== 'library';
      $('ymc-show-catalog').setAttribute('aria-pressed', String(name === 'library'));
      cssTab.setAttribute('aria-pressed', String(name === 'files'));
      for (const pane of shadow.querySelectorAll('[data-pane]')) pane.hidden = pane.dataset.pane !== name;
      $('ymc-editor').querySelector('.panel').scrollTop = 0;
      if (name === 'player') refreshDiscord();
      if (name === 'layout') {
        syncPortraitPreview(portraitBackgroundColor(), previewVisual('portrait'));
        syncSidebar(desktopNavbar(), Boolean(document.fullscreenElement));
      }
      syncSpectrumAnimation();
    }
    function openTab(name) {
      closeGuide(false);
      setUpdateCard(false);
      tab(name);
    }
    [...tabs, cssTab].forEach(button => button.addEventListener('click', () => openTab(button.dataset.tab)));
    $('ymc-show-catalog').addEventListener('click', () => openTab('library'));
    $('ymc-sidebar-reset').addEventListener('click', () => update(Object.fromEntries(
      Object.entries(DEFAULT).filter(([key]) => ['sidebarDock','sidebarAlign','sidebarSize','sidebarGap','sidebarInset',
        'sidebarCompact','sidebarCollapsed','sidebarOrder','sidebarHidden','sidebarIconSize','sidebarEdgeHint',
        'sidebarEdgeCustom','sidebarEdgeColor'].includes(key)))));
    $('ymc-sidebar-items').addEventListener('click', event => {
      const button = event.target.closest('[data-nav-action]');
      const id = button?.closest('li')?.dataset.navKey;
      if (!id) return;
      if (button.dataset.navAction === 'visibility') {
        const hidden = new Set(navIds(theme.sidebarHidden));
        if (!hidden.delete(id)) hidden.add(id);
        update({ sidebarHidden: [...hidden].join('|') });
        return;
      }
      const keys = orderedNav(theme).map(({ key }) => key);
      const index = keys.indexOf(id);
      const next = index + (button.dataset.navAction === 'up' ? -1 : 1);
      if (index < 0 || next < 0 || next >= keys.length) return;
      [keys[index], keys[next]] = [keys[next], keys[index]];
      update({ sidebarOrder: [...keys, ...navIds(theme.sidebarOrder).filter(key => !keys.includes(key))].join('|') });
    });
    $('ymc-guide-open').setAttribute('aria-haspopup', 'dialog');
    $('ymc-guide-start').setAttribute('aria-haspopup', 'dialog');
    $('ymc-guide-open').addEventListener('click', ({ currentTarget }) => startGuide('tab', tab, currentTarget));
    $('ymc-guide-start').addEventListener('click', ({ currentTarget }) => startGuide(upgradeSteps().length ? 'update' : 'all', tab, currentTarget));
    const closeRelease = () => $('ymc-whats-new').close();
    $('ymc-release-close').addEventListener('click', closeRelease);
    $('ymc-release-later').addEventListener('click', closeRelease);
    $('ymc-release-guide').addEventListener('click', () => {
      closeRelease();
      showDialog('editor', launcher);
      startGuide('update', tab, $('ymc-guide-start'));
    });
    $('ymc-guide-all').addEventListener('click', () => startGuide('all', tab));
    $('ymc-guide-dismiss').addEventListener('click', () => {
      dismissGuideOffer();
      $('ymc-guide-open').focus();
    });
    $('ymc-guide-back').addEventListener('click', () => showGuideStep(guideIndex - 1, tab));
    $('ymc-guide-next').addEventListener('click', () => showGuideStep(guideIndex + 1, tab));
    $('ymc-guide-close').addEventListener('click', () => closeGuide());
    editorPanel().addEventListener('scroll', queueGuidePosition, { passive: true });
    for (const event of ['wheel', 'touchstart', 'pointerdown']) {
      editorPanel().addEventListener(event, stopGuideScroll, { passive: true });
    }
    window.addEventListener('resize', queueGuidePosition);
    $('ymc-compare').addEventListener('click', () => {
      compareNative = !compareNative;
      apply();
      refresh();
    });
    $('ymc-undo').addEventListener('click', undoTheme);
    $('ymc-redo').addEventListener('click', redoTheme);
    $('ymc-contrast-fix').addEventListener('click', () => syncContrastReport(true));
    $('ymc-nav-link').addEventListener('click', () => {
      openTab('playlists');
      setSettingsSection($('ymc-playlists-navigation'), true, true);
      scrollToSetting($('ymc-playlists-navigation'));
      $('p-navigationCustom').focus({ preventScroll: true });
    });
    $('ymc-spectrum-profile').addEventListener('change', ({ target }) => {
      const preset = SPECTRUM_PROFILES[target.value];
      if (preset) editorUpdate(preset.settings, { sync: false });
    });
    for (const button of shadow.querySelectorAll('[data-appearance-preview]')) {
      button.addEventListener('click', () => startAppearancePreview(button));
    }
    $('ymc-preview-apply').addEventListener('click', () => finishAppearancePreview(true, true));
    $('ymc-preview-cancel').addEventListener('click', () => finishAppearancePreview(false, true));
    $('ymc-spectrum-retry').addEventListener('click', retrySpectrum);
    $('ymc-pattern-shuffle').addEventListener('click', () => {
      const jump = 1 + crypto.getRandomValues(new Uint16Array(1))[0] % 65534;
      editorUpdate({ patternSeed: (editorTheme().patternSeed - 1 + jump) % 65535 + 1 }, { sync: false });
    });
    tab('theme');
    $('ymc-discord-save').addEventListener('click', saveDiscord);
    $('ymc-discord-album').addEventListener('change', () => syncDiscordPreview());
    $('ymc-discord-paused').addEventListener('change', () => syncDiscordPreview());
    $('ymc-discord-cover').addEventListener('error', event => { event.target.hidden = true; });
    setInterval(() => {
      if (activeDialog === 'editor' && editorTab === 'player') refreshDiscord();
    }, 3000);

    for (const el of shadow.querySelectorAll('[data-prop]')) {
      const live = ['range', 'text'].includes(el.type);
      el.addEventListener(live ? 'input' : 'change', () => {
        const key = el.dataset.prop;
        const value = el.type === 'checkbox' ? el.checked : el.type === 'range' ? el.valueAsNumber : el.value;
        const profile = key === 'barLayout' ? BAR_LAYOUT_PROFILES[value] : undefined;
        editorUpdate({ ...profile, [key]: value }, { immediate: !live, sync: false, historyKey: live ? key : '' });
      });
      if (live) el.addEventListener('change', () => {
        if (lastHistoryKey === el.dataset.prop) lastHistoryKey = '';
      });
    }
    for (const el of shadow.querySelectorAll('[data-number]')) {
      el.addEventListener('change', () => {
        const key = el.dataset.number;
        const factor = key === 'contrastLevel' ? 10 : 1;
        if (Number.isFinite(el.valueAsNumber)) editorUpdate({ [key]: el.valueAsNumber * factor }, { sync: false });
        el.value = editorTheme()[key] / factor;
      });
      el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); });
    }

    $('ymc-open-store').addEventListener('click', () => openTab('library'));
    $('ymc-playlist-palette').addEventListener('click', () => editorUpdate({ playlistGradient: 'palette' }, { sync: false }));

    let fileRequest = 0;
    syncSettingsTools = settingsTools(openTab, async (keys, title) => {
      keys = keys.filter(key => !lockedManualFields.has(key));
      if (!keys.length || !confirm(`Вернуть стандартные значения в блоке «${title}»?`)) return;
      fileRequest++;
      const { background } = snapshot();
      if (keys.includes('vibeMedia') && isChanged('vibeMedia') &&
        !await changeVibeMedia(null, false, { history: false })) return;
      const patch = Object.fromEntries(keys.filter(key => Object.hasOwn(DEFAULT, key)).map(key => [key, DEFAULT[key]]));
      const staged = editorUpdate(patch, { sync: keys.includes('customCss'), previous: { settings: theme, background } });
      notice(staged ? 'Стандартные значения показаны в образце.' : 'Блок сброшен.');
    });
    function fileInput(button, id, handle) {
      $(button).addEventListener('click', () => $(id).click());
      $(id).addEventListener('change', async e => {
        const files = [...e.target.files];
        e.target.value = '';
        if (!files.length) return;
        const request = ++fileRequest;
        const isCurrent = () => request === fileRequest;
        notice();
        try { await handle(files, isCurrent); }
        catch (error) {
          if (isCurrent()) notice(error instanceof SyntaxError ? 'Файл содержит некорректный JSON.' : error.message, true);
        }
      });
    }
    fileInput('ymc-image', 'ymc-file', async ([file], isCurrent) => {
      const wallpaper = await imageToDataUrl(file);
      if (!isCurrent() || smartOwnsBackdrop(theme)) return;
      update({ wallpaper, mode: 'image' }, { sync: false });
      await rememberFile(file);
    });
    $('ymc-image-clear').addEventListener('click', () => {
      fileRequest++;
      update({ wallpaper: '', mode: 'gradient' }, { sync: false });
    });
    fileInput('ymc-vibe-pick', 'ymc-vibe-file', async ([file]) => {
      if (await changeVibeMedia(file)) await rememberFile(file);
    });
    fileInput('ymc-liked-pick', 'ymc-liked-file', async ([file], isCurrent) => {
      const likedImage = await imageToDataUrl(file, 128, true);
      if (!isCurrent()) return;
      update({ likedImage, likedCustom: true, likedShape: 'image' });
      await rememberFile(file);
    });
    $('ymc-liked-clear').addEventListener('click', () => {
      fileRequest++;
      update({ likedImage: '', likedShape: theme.likedShape === 'image' ? 'native' : theme.likedShape }, { sync: false });
    });
    $('ymc-apply-palette').addEventListener('click', () => {
      if (!suggestedPalette || $('ymc-apply-palette').disabled) return;
      const palette = makePaletteVariant(suggestedPalette, paletteVariant);
      update({ ...palette, portraitColor: palette.portraitAccent, sidebarGradient: theme.separateSurfaces, barCustom: true,
        spectrumGradient: theme.spectrumGradient === 'solid' ? 'vertical' : theme.spectrumGradient });
      notice(`Палитра «${PALETTE_VARIANTS[paletteVariant]}» применена.`);
    });
    for (const button of shadow.querySelectorAll('[data-palette-variant]')) {
      button.addEventListener('click', () => {
        paletteVariant = button.dataset.paletteVariant;
        paletteUsesSeparateSurfaces = undefined;
        showPaletteSuggestion(false);
      });
    }
    fileInput('ymc-bar-pick', 'ymc-bar-file', async ([file], isCurrent) => {
      const barWallpaper = await imageToDataUrl(file, 800);
      if (!isCurrent()) return;
      update({ barWallpaper, barCustom: true });
      await rememberFile(file);
    });
    $('ymc-bar-clear').addEventListener('click', () => {
      fileRequest++;
      update({ barWallpaper: '' });
    });
    $('ymc-vibe-clear').addEventListener('click', () => {
      notice();
      changeVibeMedia();
    });
    fileInput('ymc-import', 'ymc-theme-file', ([file], isCurrent) => importTheme(file, isCurrent));
    for (const button of shadow.querySelectorAll('[data-store-group]')) {
      button.addEventListener('click', () => selectStoreGroup(button.dataset.storeGroup));
    }
    $('ymc-store-search').addEventListener('input', renderThemeStore);
    $('ymc-store-category').addEventListener('change', renderThemeStore);
    $('ymc-store-cards').addEventListener('click', e => {
      const action = e.target.closest('[data-store-apply]');
      const card = e.target.closest('[data-store-card]');
      const id = action?.dataset.storeApply ?? card?.dataset.storeCard;
      if (!id) return;
      if (libraryGroup === 'files') libraryFileId = id;
      else libraryThemeId = id;
      renderThemeStore();
      if (action && libraryGroup !== 'files') runLibrary(() => applyLibraryTheme(selectedTheme()));
      if (action && libraryGroup === 'files') $('ymc-library-target').focus();
    });
    const libraryButton = (id, action) => $('ymc-library-' + id).addEventListener('click', () => runLibrary(action));
    libraryButton('save', async () => {
      const record = currentThemeRecord($('ymc-library-name').value || theme.name);
      await localStorageRequest('themes', 'readwrite', store => store.put(record, record.id));
      await refreshLibrary();
      libraryThemeId = record.id;
      selectStoreGroup('saved');
      notice('Тема сохранена.');
    });
    libraryButton('apply', () => applyLibraryTheme(selectedTheme()));
    libraryButton('export-selected', () => exportThemePackage(selectedTheme()));
    libraryButton('export-current', () => exportThemePackage(currentThemeRecord()));
    libraryButton('remove-theme', async () => {
      const record = selectedTheme();
      if (!record || record.builtIn || !confirm('Удалить сохранённую тему?')) return;
      await localStorageRequest('themes', 'readwrite', store => store.delete(record.id));
      await refreshLibrary();
    });
    libraryButton('use-file', async () => {
      const record = selectedFile();
      if (record && await applyLibraryFile(record.file, $('ymc-library-target').value)) notice('Файл применён.');
    });
    libraryButton('remove-file', async () => {
      const record = selectedFile();
      if (!record || !confirm('Удалить файл из библиотеки?')) return;
      await localStorageRequest('files', 'readwrite', store => store.delete(record.id));
      await refreshLibrary();
    });
    fileInput('ymc-library-import', 'ymc-library-import-file', ([file]) => runLibrary(async () => {
      const record = await readThemePackage(file);
      await localStorageRequest('themes', 'readwrite', store => store.put(record, record.id));
      if (record.background) await rememberFile(record.background);
      await refreshLibrary();
      libraryThemeId = record.id;
      selectStoreGroup('saved');
      notice('Тема импортирована. Нажмите «Применить», чтобы её открыть.');
    }));
    fileInput('ymc-addon-import', 'ymc-addon-file', importAddon);
    $('ymc-addon-clear').addEventListener('click', () => {
      fileRequest++;
      update({ addonSheets: [], addonEnabled: false }, { sync: false });
      notice('CSS дополнения удалён.');
    });
    $('ymc-css-apply').addEventListener('click', () => {
      update({ customCss: $('ymc-css').value });
      notice('CSS применён.');
    });
    $('ymc-export').addEventListener('click', () => download('ymusic-theme.json', JSON.stringify(theme, null, 2), 'application/json'));
    $('ymc-css-export').addEventListener('click', () => {
      const t = { ...theme, enabled: true, widePlayer: false };
      const base = makeStyles(t, '', portraitBackgroundColor()).replaceAll(`${ACTIVE} `, '').replaceAll(ACTIVE, ':root');
      const custom = [...(t.addonEnabled ? t.addonSheets.map(sheet => sheet.css) : []), t.customCss].filter(Boolean);
      download('ymusic-theme.css', [base, ...custom].join('\n'), 'text/css');
      if (custom.some(css => /@import|@charset|@namespace/i.test(css))) {
        notice('Экспортирован CSS. Для тем с @import, @charset или @namespace используйте исходные CSS-файлы либо экспорт JSON.');
      }
    });
    $('ymc-reset').addEventListener('click', async () => {
      if (vibeBusy || !confirm('Сбросить тему, фон приложения, CSS и настройки плеера?')) return;
      fileRequest++;
      const { background } = snapshot();
      if ((background || vibeError) && !await changeVibeMedia(null, false, { history: false })) return;
      setTheme(DEFAULT, { previous: { settings: theme, background } });
      notice('Настройки сброшены.');
    });

    for (const button of shadow.querySelectorAll('[data-action]')) {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const target = nativeButton(nativePlayer(), action);
        if (!target) return;
        if (action === 'queue') showDialog('');
        target.click();
        refresh();
      });
    }
    const seek = $('ymc-seek');
    seek.addEventListener('input', () => {
      if (seeking) return;
      seekPlayer = nativePlayer();
      seekRange = nativeRange(seekPlayer);
      seeking = true;
    });
    seek.addEventListener('change', () => {
      const player = nativePlayer();
      const native = nativeRange(player);
      const sameTrack = player === seekPlayer && native === seekRange;
      seeking = false;
      seekPlayer = seekRange = null;
      if (!native || !sameTrack) { refresh(); return; }
      const min = Number(native.min || 0), max = Number(native.max || 100);
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(native, String(min + (max - min) * seek.valueAsNumber / 1000));
      native.dispatchEvent(new Event('input', { bubbles: true }));
      native.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      refresh();
    });
    seek.addEventListener('blur', () => { seeking = false; seekPlayer = seekRange = null; });
    $('ymc-spectrum-start').addEventListener('click', () => {
      if (overlaySpectrum) stopSpectrum();
      else {
        overlaySpectrum = true;
        spectrumCheckAt = 0;
        syncSpectrumAnimation();
      }
      refresh();
    });

    window.addEventListener('resize', () => { syncEditorWidth(); checkedLayout = undefined; refresh(); });
    reducedMotion();
    motionPreference.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', () => {
      refresh();
    });
    window.addEventListener('pagehide', () => {
      overlaySpectrum = false;
      if (spectrumFrame !== undefined) cancelAnimationFrame(spectrumFrame);
      spectrumFrame = undefined;
      clearVisualBeats();
      releaseSpectrumInput();
      spectrumContext?.close().catch(() => {});
      spectrumContext = undefined;
      cancelAnimationFrame(smartFrame);
      smartFrame = undefined;
      if (smartDestination) dynamicColors = smartDestination;
      if (smartAbort) {
        smartRequest++;
        smartAbort.abort();
        smartAbort = undefined;
        smartCovers = [];
      }
      if (persistTimer !== undefined) persist();
      discordBridge?.reportTrack?.(null);
    });
    window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      apply();
      refresh();
    });
    setupUpdates();
    let mountFrame;
    new MutationObserver(() => {
      if (mountFrame !== undefined) return;
      mountFrame = requestAnimationFrame(() => {
        mountFrame = undefined;
        syncNativeMounts();
      });
    }).observe(document, { childList: true, subtree: true });
    document.addEventListener('fullscreenchange', syncNativeMounts);
    setInterval(refresh, 450);
    if (discordBridge?.reportTrack) {
      reportDiscordTrack();
      setInterval(reportDiscordTrack, 2500);
    }
    syncVibeControls();
    loadVibeMedia();
    selectStoreGroup('presets');
    refreshLibrary().catch(() => {});
    initOnboarding();
    syncControls(true);
    apply();
    refresh();
    showReleaseNotes();
    window.YMusicCustomizer = {
      getTheme: () => cloneTheme(theme),
      update: partial => update(partial),
      open: () => showDialog('editor', launcher),
      diagnostics: () => {
        const media = currentMedia();
        return {
          version, renderer: location.protocol,
          nativePlayer: Boolean(nativePlayer()), expandedGrid: Boolean(wideLayout?.hasAttribute('data-ymc-wide')),
          audioCapture: Boolean(media && (media.captureStream || playerAudioNodes.has(media))),
          spectrumState: spectrumSignal, spectrumInput: spectrumInput ? (spectrumInput.stream ? 'captureStream' : 'native') : null,
          themeSheet: Boolean(baseStyle.sheet)
        };
      }
    };
  }

  function initialize() {
    const head = document.head || document.documentElement;
    [baseStyle, customStyle] = ['ymc-dynamic-theme', 'ymc-user-css'].map(id => {
      const sheet = document.createElement('style');
      sheet.id = id;
      head.append(sheet);
      return sheet;
    });
    nativeStyle = document.createElement('style');
    nativeStyle.textContent = `
      [data-ymc-launcher] {
        flex:0 0 auto; box-sizing:border-box; display:flex; align-items:center; gap:var(--ym-spacer-size-xs,.5rem);
        width:calc(100% - 1.5rem); min-height:2.75rem; padding:0 .5rem; margin:0 .75rem; overflow:hidden;
        text-align:start; white-space:nowrap; border:0; border-radius:var(--ym-radius-size-m,.625rem);
        background:none; color:var(--ym-controls-color-primary-text-enabled,inherit);
        font:inherit; font-size:var(--ym-font-size-label-m,.875rem); font-weight:600; cursor:pointer;
      }
      [data-ymc-launcher][hidden] { display:none !important; }
      [data-ymc-launcher]:hover, [data-ymc-launcher][aria-expanded=true] {
        background:var(--ym-controls-color-secondary-default-hovered,#ffffff12);
      }
      [data-ymc-launcher]:focus-visible { outline:2px solid currentColor; outline-offset:-2px; }
      [data-ymc-launcher] svg { flex:none; width:1.5rem; height:1.5rem; }
      [data-ymc-launcher] span { overflow:hidden; text-overflow:ellipsis; }
      ${SELECTOR.navbar}:has([class*="NavbarDesktopUserWidget_userMeta_collapsed__"]) [data-ymc-launcher] {
        width:2.75rem; justify-content:center; padding:0;
      }
      ${SELECTOR.navbar}:has([class*="NavbarDesktopUserWidget_userMeta_collapsed__"]) [data-ymc-launcher] span { display:none; }
      :root { --ymc-dock:0px; --ymc-reserved-width:0px; }
      html[data-ymc-editor-open] { --ymc-reserved-width:var(--ymc-dock); }
      html[data-ymc-editor-open] ${SELECTOR.layout} { width:calc(100% - var(--ymc-dock)) !important; min-width:0 !important; }
      body:has(> [data-ymc-app-backdrop],> [data-ymc-pattern],> [data-ymc-page-spectrum]) { isolation:isolate; }
      html body:has(> [data-ymc-app-backdrop]) { background-image:none !important; }
      html[data-ymc-active="yes"]:has([data-ymc-app-backdrop]) ${SELECTOR.layout} { background:transparent !important; }
      [data-ymc-app-backdrop] { position:fixed; inset:0 var(--ymc-reserved-width) 0 0; z-index:-3; pointer-events:none; overflow:hidden; }
      [data-ymc-pattern] { position:fixed; inset:0 var(--ymc-reserved-width) 0 0; z-index:-2; pointer-events:none; overflow:hidden; }
      ${AURA_STYLE}
      ${NAV_STYLES}
      ${patternRules('[data-ymc-pattern]')}
      [data-ymc-page-spectrum] { position:fixed; inset:auto var(--ymc-reserved-width) 0 0; height:var(--ymc-spectrum-height); z-index:-1; pointer-events:none; }
      [data-ymc-page-spectrum] canvas { display:block; width:100%; height:100%; opacity:var(--ymc-spectrum-alpha); }
      [data-ymc-app-backdrop]::after { content:""; position:absolute; inset:0; background:var(--ymc-media-dim,transparent); }
      [data-ymc-app-media] {
        display:block; width:100%; height:100%; object-fit:var(--ymc-media-fit,cover);
        object-position:var(--ymc-media-position,center); opacity:var(--ymc-media-opacity,1); filter:blur(var(--ymc-media-blur,0px));
      }
      ${SELECTOR.player}:has(> [data-ymc-bar-backdrop]) { isolation:isolate; position:relative; }
      [data-ymc-bar-backdrop] { position:absolute; inset:0; z-index:-1; pointer-events:none; overflow:hidden; border-radius:inherit; }
      [data-ymc-bar-backdrop]::before { content:""; position:absolute; inset:0; background-size:cover; background-position:center; }
      [data-ymc-spectrum][hidden] { display:block !important; visibility:hidden; }
      [data-ymc-bar-backdrop] canvas { position:absolute; inset:0; width:100%; height:100%; opacity:var(--ymc-spectrum-alpha); }
    `;
    head.append(nativeStyle);
    apply();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }

  if (window.HTMLMediaElement) observeAudioPlayback();
  if (typeof window.fetch === 'function') blockDisabledTrackCards();
  if (document.head || document.readyState !== 'loading') initialize();
  else document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
