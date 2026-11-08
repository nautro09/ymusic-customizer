'use strict';

const { contextBridge, ipcRenderer } = require('electron');

if (window === window.top && location.protocol === 'music-application:' && location.host === 'desktop' &&
    !location.username && !location.password) {
  contextBridge.exposeInMainWorld('ymcMac', {
    getState: () => ipcRenderer.invoke('ymc:discord:state'),
    setConfig: settings => ipcRenderer.invoke('ymc:discord:config', settings),
    reportTrack: track => ipcRenderer.send('ymc:discord:track', track),
    checkUpdate: () => ipcRenderer.invoke('ymc:update:check'),
    installUpdate: () => ipcRenderer.invoke('ymc:update:install')
  });
  contextBridge.executeInMainWorld({
    func: () => {
      /* YMC_RENDERER */
    }
  });
}
