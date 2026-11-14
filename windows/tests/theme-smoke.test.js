// Run: node tests/theme-smoke.test.js
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../mod/ymusic-customizer.js'), 'utf8');
const testSource = source.replace('  const head = document.head',
  '  window.test = { sanitizeTheme, makeStyles, expandGrid, readTheme, artworkUrl, extractCoverColors, paletteFromSample, contrastRatio, hueOf };\n  const head = document.head');
assert.notEqual(testSource, source);

const attrs = {};
const sheets = [];
const storage = new Map([['ymc:theme:v1', '{"version":1,"name":"Legacy","round":8,"customCss":"body {}"}']]);
const sandbox = {
  window: {},
  document: {
    readyState: 'loading',
    head: { append(node) { sheets.push(node); } },
    documentElement: { setAttribute(key, value) { attrs[key] = value; } },
    createElement() { return { textContent: '' }; },
    addEventListener() {}
  },
  localStorage: { getItem: key => storage.get(key) ?? null },
  URL,
  location: { href: 'https://example.test/app', origin: 'https://example.test' }
};
vm.runInNewContext(testSource, sandbox, { timeout: 1000 });
const { sanitizeTheme, makeStyles, expandGrid, readTheme, artworkUrl, extractCoverColors, paletteFromSample, contrastRatio, hueOf } = sandbox.window.test;
const bad = sanitizeTheme({ accent: 'red;evil', blur: 999, round: -10, mode: 'remote', scale: null,
  wallpaper: 'https://example.test/track', enabled: false, addonSheets: [{ name: 'bad', css: 'a\0b' }], addonEnabled: true });
assert.equal(bad.accent, '#A855F7');
assert.equal(bad.blur, 40);
assert.equal(bad.round, 0);
assert.equal(bad.mode, 'gradient');
assert.equal(bad.scale, 100);
assert.equal(bad.wallpaper, '');
assert.equal(bad.addonEnabled, false);
assert.equal(makeStyles(bad), '');
assert.equal(attrs['data-ymc-active'], 'yes');
assert.equal(sheets.length, 3);
assert.equal(sheets[1].textContent, 'body {}');
assert.equal(readTheme().cardRound, 8);
assert.equal(readTheme().version, 2);
storage.set('ymc:theme:v2', 'broken JSON');
assert.equal(readTheme().name, 'Legacy');
storage.set('ymc:theme:v2', '{"version":2,"name":"New","round":5,"cardRound":9}');
assert.equal(readTheme().name, 'New');
assert.equal(readTheme().cardRound, 9);

const palette = sanitizeTheme({ accent: '#3344aa', mode: 'cover', panelOpacity: 40, manualScale: true, scale: 110,
  separateSurfaces: true, player: '#112233', cardRound: 10 });
assert.match(makeStyles(palette), /#3344AA/);
assert.match(makeStyles(palette), /rgba\(17,34,51,0\.4\)/);
assert.match(makeStyles(palette), /border-radius:10px/);
assert.match(makeStyles(palette), /--html-font-size:17\.6px/);
assert.match(makeStyles(palette), /linear-gradient\(140deg/);
assert.match(makeStyles(palette, 'https://avatars.yandex.net/a'), /url\("https:\/\/avatars.yandex.net\/a"\)/);
assert.equal(artworkUrl('https://avatars.yandex.net/a'), 'https://avatars.yandex.net/a');
assert.equal(artworkUrl('https://yandex.net.attacker.test/a'), '');
assert.equal(artworkUrl('javascript:alert(1)'), '');
assert.equal(expandGrid('"navbar content" "navbar playerbar" "barBelow barBelow"'), '"navbar content" "playerbar playerbar" "barBelow barBelow"');
assert.equal(expandGrid('"navbar content" "navbar playerbar" "navbar barBelow"'), '"navbar content" "playerbar playerbar" "barBelow barBelow"');
assert.equal(expandGrid('"navbar content" "playerbar playerbar"'), '');
assert.equal(expandGrid('"content" "playerbar"'), '');
assert.equal(expandGrid('"navbar playerbar" "navbar playerbar"'), '');
assert.equal(expandGrid('"navbar playerbar"'), '');
assert.equal(sanitizeTheme({ spectrumStart: '#FF0000', spectrumEnd: '#0000FF' }).spectrumMid, '#800080');
const manualSpectrum = sanitizeTheme({
  smartSpectrum: false, spectrumGradient: 'vertical', spectrumStart: '#FF0000', spectrumMid: '#00FF00', spectrumEnd: '#0000FF'
});
assert.deepEqual([manualSpectrum.smartSpectrum, manualSpectrum.spectrumGradient,
  manualSpectrum.spectrumStart, manualSpectrum.spectrumMid, manualSpectrum.spectrumEnd],
[false, 'vertical', '#FF0000', '#00FF00', '#0000FF']);
assert.equal(sanitizeTheme({ spectrumGlow: 250, spectrumStyle: 'segments' }).spectrumGlow, 100);
assert.equal(sanitizeTheme({ vibeAdaptiveCover: true }).vibeHideCoverWithPortrait, true);
assert.equal(sanitizeTheme({ vibeAdaptiveCover: true, vibeHideCoverWithPortrait: false }).vibeHideCoverWithPortrait, false);
const legacyCover = sanitizeTheme({ vibeCoverFocus: true });
assert.equal(legacyCover.vibeAdaptiveCover, true);
assert.equal(legacyCover.vibeTrackLayout, 'noArtist');
assert.equal(legacyCover.vibeHideCoverWithPortrait, false);
assert.equal(sanitizeTheme({ showVibeArtist: false }).vibeTrackLayout, 'noArtist');
assert.equal(sanitizeTheme({ showVibeArtist: false, vibeTrackLayout: 'time' }).vibeTrackLayout, 'time');
assert.deepEqual(sanitizeTheme(legacyCover), legacyCover);

const width = 48;
const coverPixels = new Uint8ClampedArray(width * width * 4);
for (let y = 0; y < width; y++) {
  for (let x = 0; x < width; x++) {
    let rgb = [45, 45, 45, 255];
    if ((x < 8 || x >= 40) && y < 34) rgb = [30, 135, 65, 255];
    if (x >= 15 && x < 33 && y >= 12 && y < 34) rgb = [239, 185, 35, 255];
    if (x >= 16 && x < 32 && y >= 39) rgb = [60, 90, 208, 255];
    coverPixels.set(rgb, (y * width + x) * 4);
  }
}
const sample = extractCoverColors(coverPixels, width, width);
assert.ok(sample.colors.length >= 3);
const styleNames = ['balanced', 'calm', 'contrast', 'dark', 'light', 'neon'];
const styles = styleNames.map(style => paletteFromSample(sample, style));
assert.equal(new Set(styles.map(style => style.background)).size, 6);
assert.equal(new Set(styles.map(style => style.spectrumMid)).size, 6);
for (const style of styles) {
  const [red, green, blue] = style.background.slice(1).match(/../g).map(value => parseInt(value, 16));
  assert.ok(green > red && green > blue, 'largest chromatic region supplies the background color');
  const [textR, , textB] = style.text.slice(1).match(/../g).map(value => parseInt(value, 16));
  assert.ok(textR > textB + 12, 'cover center supplies a colored text tone');
  assert.ok(contrastRatio(style.text, style.background) >= 4.5);
  assert.ok(contrastRatio(style.text, style.gradientEnd) >= 4.5);
  assert.equal(new Set([style.spectrumStart, style.spectrumMid, style.spectrumEnd]).size, 3);
}

const pixelSample = colorAt => {
  const pixels = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) pixels.set(colorAt(x, y), (y * width + x) * 4);
  }
  return extractCoverColors(pixels, width, width);
};
const channels = hex => hex.slice(1).match(/../g).map(channel => parseInt(channel, 16));
const spread = hex => Math.max(...channels(hex)) - Math.min(...channels(hex));

const redFrame = pixelSample((x, y) => {
  if (x >= 10 && x < 38 && y >= 9 && y < 39) {
    if ((x - 24) ** 2 + (y - 19) ** 2 < 6 ** 2) return [178, 147, 65, 255];
    return [28, 22, 100, 255];
  }
  return x < 24 ? [151, 39, 39, 255] : [172, 34, 31, 255];
});
for (const style of ['balanced', 'contrast', 'neon']) {
  const redTheme = paletteFromSample(redFrame, style);
  const [red, green, blue] = channels(redTheme.gradientEnd);
  assert.ok(red >= 155 && red - Math.max(green, blue) >= 90 && Math.abs(green - blue) <= 24,
    `${style} gradient should reflect the red framing: ${redTheme.gradientEnd}`);
  assert.ok(contrastRatio(redTheme.text, redTheme.background) >= 4.5);
  assert.ok(contrastRatio(redTheme.text, redTheme.gradientEnd) >= 4.5);
}

const limeEdge = pixelSample(x => x >= 35 ? [202, 255, 0, 255] : [216, 19, 17, 255]);
const neonLime = paletteFromSample(limeEdge, 'neon');
assert.ok(contrastRatio(neonLime.text, neonLime.gradientEnd) >= 4.5);

const redSkyOverBrown = pixelSample((x, y) => {
  if (y < 12 + Math.abs(x - 24) / 10) return [111, 24, 16, 255];
  return (x + y) % 3 ? [153, 113, 82, 255] : [111, 82, 64, 255];
});
const pinkSky = pixelSample((x, y) => {
  if (y < 16 || (y < 29 && x >= 36)) return [226, 151, 187, 255];
  if (y >= 30) return [114, 73, 163, 255];
  return [43, 119, 79, 255];
});
const redOnNavy = pixelSample((x, y) => {
  if (x >= 5 && x < 16 && y >= 14 && y < 30) return [217, 26, 23, 255];
  if (x >= 15 && x < 43 && y >= 10 && y < 38) return [136, 85, 62, 255];
  return [38, 54, 79, 255];
});
const darkScarletSky = pixelSample((x, y) => {
  if (y < 22 && x >= 5 && x < 32 && (x + Math.floor(y / 4)) % 9 > 2) return [75, 28, 21, 255];
  return y < 37 ? [26, 26, 25, 255] : [54, 61, 42, 255];
});
const withinHue = (hex, target, tolerance, minimumSpread) => {
  const { hue } = hueOf(...channels(hex));
  const distance = Math.abs(hue - target);
  return Math.min(distance, 360 - distance) <= tolerance && spread(hex) >= minimumSpread;
};
const spectrumColors = ({ spectrumStart, spectrumMid, spectrumEnd }) => [spectrumStart, spectrumMid, spectrumEnd];
const assertSpectrumHue = (palette, hue, name, tolerance = 12) => {
  const stops = spectrumColors(palette);
  assert.ok(stops.every(color => withinHue(color, hue, tolerance, 30)), name + ' should use one hue: ' + stops);
  assert.equal(new Set(stops).size, 3, name + ' should retain a tonal gradient');
};
for (const style of ['balanced', 'contrast', 'neon']) {
  for (const [name, fixture] of [
    ['red sky over brown', redSkyOverBrown], ['dark scarlet sky', darkScarletSky]
  ]) {
    const palette = paletteFromSample(fixture, style);
    assertSpectrumHue(palette, 6, `${style} ${name}`);
    assert.ok(contrastRatio(palette.text, palette.background) >= 4.5);
    assert.ok(contrastRatio(palette.text, palette.gradientEnd) >= 4.5);
  }
  const navyTheme = paletteFromSample(redOnNavy, style);
  assert.ok(withinHue(navyTheme.accent, 6, 12, 80), `${style} navy artwork should keep the scarlet accent`);
  assertSpectrumHue(navyTheme, 217, `${style} navy artwork`);
  assertSpectrumHue(paletteFromSample(pinkSky, style), 331, `${style} pink sky`);
}

const monochromeRed = pixelSample((x, y) => {
  if (x < 9 && y >= 16 && y < 42) return [183, 29, 27, 255];
  return y < 20 ? [170, 170, 170, 255] : [72, 72, 72, 255];
});
const charcoalGold = pixelSample((x, y) => {
  if (x >= 12 && x < 35 && y >= 11 && y < 32) return [163, 130, 44, 255];
  if (x >= 33 && y >= 12 && y < 22) return [124, 42, 25, 255];
  return x < 17 && y >= 19 ? [54, 57, 50, 255] : [24, 24, 21, 255];
});
const blueMountains = pixelSample((x, y) => {
  if (x >= 18 && x < 29 && y >= 13 && y < 29) return [151, 111, 87, 255];
  if (x >= 23 && x < 28 && y >= 29 && y < 40) return [157, 44, 31, 255];
  return y < 15 ? [99, 132, 148, 255] : [36, 85, 103, 255];
});
const purpleArtwork = pixelSample((x, y) => {
  if (x >= 24 && x < 33 && y >= 33 && y < 43) return [232, 111, 23, 255];
  if (y < 16 && x >= 8) return [78, 83, 92, 255];
  return x < 20 ? [86, 43, 140, 255] : [62, 42, 98, 255];
});
for (const [name, fixture, backdropHue, eqHue] of [
  ['monochrome with red', monochromeRed, null, 0],
  ['charcoal with gold', charcoalGold, null, 43],
  ['blue mountains with a warm subject', blueMountains, 196, 196],
  ['purple with a warm glint', purpleArtwork, 267, 267]
]) {
  const palette = paletteFromSample(fixture, 'balanced');
  if (backdropHue === null) {
    assert.ok(spread(palette.background) <= 10 && spread(palette.gradientEnd) <= 10,
      name + ' should keep a neutral backdrop');
  } else {
    assert.ok(withinHue(palette.background, backdropHue, 18, 15), name + ' should use the main background color');
    assert.ok(withinHue(palette.gradientEnd, backdropHue, 18, 15), name + ' should not use the small accent as a background stop');
  }
  assertSpectrumHue(palette, eqHue, name, 18);
  for (const surface of [palette.background, palette.gradientEnd, palette.panel]) {
    assert.ok(contrastRatio(palette.text, surface) >= 4.5, name + ' should retain readable text');
  }
}

const warmDenim = pixelSample((x, y) => {
  if (y >= 38 && x >= 13 && x < 35) return [68, 91, 119, 255];
  if (x >= 15 && x < 35 && y < 29) return [171, 139, 112, 255];
  return (x + y) % 3 ? [135, 99, 74, 255] : [77, 55, 45, 255];
});
for (const style of styleNames) {
  const warmTheme = paletteFromSample(warmDenim, style);
  const { hue } = hueOf(...channels(warmTheme.portraitAccent));
  assert.ok(Math.abs(hue - 24) <= 12 && spread(warmTheme.portraitAccent) >= 12,
    `${style} aura should use the dominant warm color found in the cover: ${warmTheme.portraitAccent}`);
}

const black = pixelSample(() => [0, 0, 0, 255]);
const white = pixelSample((x, y) => {
  if (x >= 18 && x < 28 && y >= 12 && y < 37) return [40, 40, 40, 255];
  if (x >= 4 && x < 12 && y >= 4 && y < 12) return [138, 24, 197, 255]; // Small publisher logo.
  return [250, 250, 250, 255];
});
const whiteWithFooter = pixelSample((x, y) => y >= 44 && x >= 6 && x < 42
  ? [198, 20, 126, 255] : [250, 250, 250, 255]);
assert.ok(white.achromatic && black.achromatic);
assert.ok(whiteWithFooter.achromatic, 'a colorful footer should not tint a nearly white cover');
const whiteTheme = paletteFromSample(white, 'balanced');
assert.ok(Math.min(...channels(whiteTheme.background)) >= 235);
assert.ok(Math.min(...channels(whiteTheme.gradientEnd)) >= 220);
assert.ok(channels(paletteFromSample(black, 'balanced').background)[0] <= 60);
for (const cover of [black, white, whiteWithFooter]) {
  const neutralStyles = styleNames.map(style => paletteFromSample(cover, style));
  assert.equal(new Set(neutralStyles.map(style => style.background)).size, 6);
  for (const style of neutralStyles) {
    assert.ok(Object.values(style).filter(value => typeof value === 'string').every(value => spread(value) === 0));
    assert.ok(contrastRatio(style.text, style.background) >= 4.5);
    assert.ok(contrastRatio(style.text, style.gradientEnd) >= 4.5);
    assert.equal(new Set([style.spectrumStart, style.spectrumMid, style.spectrumEnd]).size, 3);
  }
}

const cream = pixelSample(() => [251, 246, 232, 255]);
const creamPalette = paletteFromSample(cream, 'balanced');
assert.ok(cream.achromatic);
const [creamR, , creamB] = channels(creamPalette.background);
assert.ok(creamR > creamB && spread(creamPalette.background) <= 8, 'retain a restrained warm tint from the cover');
const cool = pixelSample(() => [234, 245, 252, 255]);
const [coolR, , coolB] = channels(paletteFromSample(cool, 'balanced').background);
assert.ok(cool.achromatic && coolB > coolR, 'retain a restrained cool tint from the cover');

const warmPortrait = pixelSample((x, y) => x >= 14 && x < 33 && y >= 11 && y < 38
  ? [218, 115, 52, 255] : [246, 245, 243, 255]);
assert.ok(!warmPortrait.achromatic && warmPortrait.neutralBackdrop);
const portraitTheme = paletteFromSample(warmPortrait, 'balanced');
assert.ok(spread(portraitTheme.background) < 5);
assert.ok(spread(portraitTheme.accent) > 50);
assert.ok(contrastRatio(portraitTheme.text, portraitTheme.background) >= 4.5);

const whiteWithShadows = pixelSample((x, y) => {
  if (x < 24) return [249, 249, 248, 255];
  if (y < 13) return [27, 182, 206, 255];
  return [20, 21, 24, 255];
});
assert.equal(whiteWithShadows.brightBackdrop, true);
const whiteWithAccent = paletteFromSample(whiteWithShadows, 'balanced');
assert.ok(Math.min(...channels(whiteWithAccent.background)) >= 235);
assert.ok(spread(whiteWithAccent.accent) > 50);
assert.ok(contrastRatio(whiteWithAccent.text, whiteWithAccent.gradientEnd) >= 6);
assert.ok(Math.max(...channels(paletteFromSample(whiteWithShadows, 'dark').background)) < 60);
const lightWithColor = paletteFromSample(redFrame, 'light');
assert.ok(Math.min(...channels(lightWithColor.background)) >= 230);
assert.ok(contrastRatio(lightWithColor.text, lightWithColor.gradientEnd) >= 6);

const transparentEdges = pixelSample((x, y) => x >= 14 && x < 33 && y >= 11 && y < 38
  ? [219, 81, 20, 255] : [255, 255, 255, 0]);
assert.ok(!transparentEdges.neutralBackdrop && !transparentEdges.achromatic);
assert.ok(spread(paletteFromSample(transparentEdges, 'balanced').background) > 35);

assert.equal(extractCoverColors(new Uint8ClampedArray(16), 2, 2), null);
console.log('PASS: validation, migration, area-based cover backgrounds, single-hue auto spectrum, neutral artwork and contrast');
