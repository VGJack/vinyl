'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 8000;

function hasReleaseChannel(app, resourcesDirectory = process.resourcesPath) {
  return Boolean(app.isPackaged && fs.existsSync(path.join(resourcesDirectory, 'app-update.yml')));
}

function setupUpdater(app, broadcast, options = {}) {
  const configured = hasReleaseChannel(app, options.resourcesDirectory || process.resourcesPath);
  const status = {
    state: configured ? 'idle' : 'unconfigured',
    message: configured
      ? 'Vinyl checks for updates automatically.'
      : 'Automatic updates are available in the GitHub Releases build.',
    progress: 0,
    version: app.getVersion(),
    nextVersion: null
  };

  let updater = null;
  let checkInFlight = null;
  const notify = (state, message) => {
    status.state = state;
    status.message = message;
    broadcast();
  };

  const check = () => {
    if (!app.isPackaged) return Promise.reject(new Error('Install Vinyl to check for updates.'));
    if (!updater) return Promise.reject(new Error('This installation does not have a GitHub update channel.'));
    if (status.state === 'ready' || status.state === 'downloading') return Promise.resolve({ ...status });
    if (checkInFlight) return checkInFlight;
    checkInFlight = Promise.resolve().then(() => updater.checkForUpdates())
      .then(() => ({ ...status }))
      .finally(() => { checkInFlight = null; });
    return checkInFlight;
  };

  if (configured) {
    updater = options.autoUpdater || require('electron-updater').autoUpdater;
    updater.autoDownload = true;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;

    updater.on('checking-for-update', () => notify('checking', 'Checking GitHub Releases…'));
    updater.on('update-available', info => {
      status.nextVersion = info.version;
      status.progress = 0;
      notify('downloading', `Downloading Vinyl ${info.version}…`);
    });
    updater.on('download-progress', progress => {
      status.progress = Math.max(0, Math.min(100, Number(progress.percent) || 0));
      broadcast();
    });
    updater.on('update-not-available', () => {
      status.nextVersion = null;
      notify('current', 'Vinyl is up to date.');
    });
    updater.on('update-downloaded', info => {
      status.nextVersion = info.version;
      status.progress = 100;
      notify('ready', `Vinyl ${info.version} is ready to install.`);
    });
    updater.on('error', error => notify('error', `Update check failed: ${error.message}`));

    app.whenReady().then(() => {
      const initialTimer = setTimeout(() => check().catch(() => {}), INITIAL_CHECK_DELAY_MS);
      initialTimer.unref?.();
      const interval = setInterval(() => {
        if (status.state !== 'ready' && status.state !== 'downloading') check().catch(() => {});
      }, CHECK_INTERVAL_MS);
      interval.unref?.();
    });
  }

  return {
    status,
    check,
    install: () => {
      if (!updater || status.state !== 'ready') throw new Error('No downloaded update is ready to install.');
      updater.quitAndInstall(false, true);
    }
  };
}

module.exports = { setupUpdater, hasReleaseChannel };
