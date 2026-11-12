'use strict';
const fs = require('node:fs');
const path = require('node:path');

function getUpdateFeed(app) {
  const file = path.join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'update-config.json');
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const url = new URL(config.feedUrl || '');
    if (url.protocol === 'https:') return url.href.replace(/\/?$/, '/');
  } catch { /* No update server has been configured. */ }
  return null;
}
function setupUpdater(app, broadcast) {
  const feedUrl = getUpdateFeed(app);
  const status = { state: feedUrl ? 'idle' : 'unconfigured', message: feedUrl ? 'No update check has run.' : 'An update feed has not been configured.', progress:0 };
  let updater;
  if (app.isPackaged && feedUrl) {
    const { autoUpdater } = require('electron-updater');
    updater = autoUpdater;
    updater.autoDownload = true;
    updater.autoInstallOnAppQuit = false;
    updater.setFeedURL({ provider:'generic', url:feedUrl });
    const change = (state, message) => { status.state=state; status.message=message; broadcast(); };
    updater.on('checking-for-update', () => change('checking', 'Checking for updates…'));
    updater.on('update-available', info => change('downloading', `Downloading Vinyl ${info.version}…`));
    updater.on('download-progress', progress => { status.progress = progress.percent || 0; broadcast(); });
    updater.on('update-not-available', () => change('current', 'Vinyl is up to date.'));
    updater.on('update-downloaded', info => change('ready', `Vinyl ${info.version} is ready to install.`));
    updater.on('error', error => change('error', `Update failed: ${error.message}`));
    app.whenReady().then(() => setTimeout(() => updater.checkForUpdates().catch(() => {}), 6500));
  }
  return {
    status,
    check: async () => {
      if (!app.isPackaged) throw new Error('Update checks are available in installed builds.');
      if (!updater) throw new Error('An HTTPS update feed must be configured before building Vinyl.');
      await updater.checkForUpdates();
      return status;
    },
    install: () => {
      if (!updater || status.state !== 'ready') throw new Error('No update is ready to install.');
      updater.quitAndInstall(false, true);
    }
  };
}
module.exports = { setupUpdater, getUpdateFeed };
