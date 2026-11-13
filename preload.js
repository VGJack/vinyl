'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const allowed = new Set([
  'app:state', 'window:minimize', 'window:maximize', 'window:close',
  'window:shelf', 'browser:reorder', 'browser:detach', 'browser:newTab', 'browser:activate', 'browser:close', 'browser:navigate',
  'browser:back', 'browser:forward', 'browser:reload', 'browser:stop',
  'browser:duplicate', 'browser:bookmarkCurrent', 'browser:layout', 'browser:openSettings',
  'bookmark:add', 'bookmark:addFolder', 'bookmark:remove', 'bookmark:update',
  'bookmark:pin', 'bookmark:move', 'bookmark:open', 'bookmark:importChrome', 'bookmark:importHTML',
  'home:feed', 'home:setWeatherCity', 'settings:set', 'chrome:link', 'chrome:unlink', 'chrome:refresh', 'app:about',
  'google:setClientId', 'google:signIn', 'google:signOut', 'google:openWebsite', 'updates:check', 'updates:install'
]);
contextBridge.exposeInMainWorld('vinyl', {
  invoke: (channel, payload) => {
    if (!allowed.has(channel)) return Promise.reject(new Error('Unknown Vinyl action'));
    return ipcRenderer.invoke(channel, payload);
  },
  onState: callback => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('vinyl:state', handler);
    return () => ipcRenderer.removeListener('vinyl:state', handler);
  },
  onCommand: callback => {
    if (typeof callback !== 'function') return () => {};
    const handler = (_event, command) => callback(command);
    ipcRenderer.on('vinyl:command', handler);
    return () => ipcRenderer.removeListener('vinyl:command', handler);
  }
});
