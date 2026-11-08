'use strict';

const { app, ipcMain, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { DiscordPresence } = require('./ymc-discord.cjs');

const requestedProfile = app.commandLine.getSwitchValue('user-data-dir');
const profile = path.isAbsolute(requestedProfile) ? requestedProfile
  : path.join(app.getPath('appData'), 'YMusic Customizer', 'Profile');
fs.mkdirSync(profile, { recursive: true, mode: 0o700 });
app.setName('Яндекс Музыка с Customizer');
app.setPath('userData', profile);
app.setPath('sessionData', profile);
app.setAppLogsPath(path.join(profile, 'Logs'));

// The official app retains its yandexmusic:// registration and update channel.
const setDefaultProtocol = app.setAsDefaultProtocolClient.bind(app);
app.setAsDefaultProtocolClient = (scheme, ...args) =>
  scheme === 'yandexmusic' ? false : setDefaultProtocol(scheme, ...args);
const updater = require('electron-updater').autoUpdater;
updater.autoInstallOnAppQuit = false;
updater.checkForUpdates = async () => null;
updater.quitAndInstall = () => {};

const discord = new DiscordPresence(path.join(profile, 'ymc-discord.json'));
const discordTimer = setInterval(() => discord.tick(), 5000);
let reportingWindow;

function trusted(event) {
  const frame = event.senderFrame;
  if (!frame || frame.parent || event.sender.getType() !== 'window') return false;
  try {
    const url = new URL(frame.url);
    return url.protocol === 'music-application:' && url.host === 'desktop' && !url.username && !url.password;
  } catch {
    return false;
  }
}

ipcMain.handle('ymc:discord:state', event => trusted(event) ? discord.state() : null);
ipcMain.handle('ymc:discord:config', (event, settings) =>
  trusted(event) ? discord.configure(settings) : { ok: false });
ipcMain.on('ymc:discord:track', (event, track) => {
  if (!trusted(event)) return;
  reportingWindow = event.sender;
  discord.report(track);
});

require('./ymc-update.cjs').attachUpdater(app, ipcMain, trusted);

app.on('web-contents-created', (_event, contents) => {
  const clear = () => {
    if (reportingWindow !== contents) return;
    reportingWindow = undefined;
    discord.report(null);
  };
  contents.on('did-start-navigation', details => {
    if (details.isMainFrame && !details.isSameDocument) clear();
  });
  contents.on('render-process-gone', clear);
  contents.on('destroyed', clear);
});
app.once('will-quit', () => {
  clearInterval(discordTimer);
  discord.close();
});

app.once('ready', () => {
  session.defaultSession.registerPreloadScript({ type: 'frame', filePath: path.join(__dirname, 'ymc-preload.cjs') });
});

require('./index.js');
