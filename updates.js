'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 8000;

function updateErrorMessage(error) {
  const code = String(error?.code || '');
  const detail = `${code} ${error?.message || error || ''}`;
  // Provider errors can contain entire HTTP responses, XML feeds and nested stacks.
  // Only fixed, actionable messages cross into the browser UI.
  if (/CERT_|certificate|SSL|TLS/i.test(detail)) return 'Could not securely connect to the update server. Check your clock and network, then try again.';
  if (/\b(403|429)\b|rate.limit/i.test(detail)) return 'GitHub is temporarily limiting or denying update requests. Try again later.';
  if (/ENOTFOUND|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|CONNECTION_[A-Z_]+|TIMED_OUT)|timed? ?out/i.test(detail)) return 'Could not reach the update server. Check your internet connection and try again.';
  if (/ERR_UPDATER_(CHANNEL_FILE_NOT_FOUND|NO_PUBLISHED_VERSIONS|LATEST_VERSION_NOT_FOUND)/.test(code) || /\b404\b|No published versions/i.test(detail)) return 'No downloadable Windows update is available yet. Vinyl will try again automatically after the build finishes.';
  if (/ERR_UPDATER_(INVALID_RELEASE_FEED|INVALID_VERSION|INVALID_UPDATE_INFO|NO_FILES_PROVIDED)|YAMLException/.test(detail)) return 'The published update information is invalid. A corrected release is needed; your installed version has not changed.';
  if (/sha512|checksum|signature|ERR_UPDATER_INVALID_SIGNATURE/i.test(detail)) return 'The downloaded update could not be verified. It was not installed. Try checking again later.';
  if (/ENOSPC/i.test(detail)) return 'There is not enough disk space to download the update. Free some space and try again.';
  if (/EACCES|EPERM/i.test(detail)) return 'Vinyl could not save the update. Check access to your downloads and temporary folders, then try again.';
  return 'The update could not be completed. Try again later; your installed version has not changed.';
}

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
  const reportFailure = error => {
    const message = updateErrorMessage(error);
    status.progress = 0;
    status.nextVersion = null;
    if (status.state !== 'error' || status.message !== message) notify('error', message);
    return { ...status };
  };

  const check = () => {
    if (!app.isPackaged) return Promise.reject(new Error('Install Vinyl to check for updates.'));
    if (!updater) return Promise.reject(new Error('This installation does not have a GitHub update channel.'));
    if (status.state === 'ready' || status.state === 'downloading') return Promise.resolve({ ...status });
    if (checkInFlight) return checkInFlight;
    checkInFlight = Promise.resolve().then(() => updater.checkForUpdates())
      .then(result => {
        // Automatic downloads finish after checkForUpdates resolves. Handle their
        // rejections too, even when the library already emitted an error event.
        if (result?.downloadPromise) Promise.resolve(result.downloadPromise).catch(reportFailure);
        return { ...status };
      })
      .catch(reportFailure)
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
    updater.on('error', reportFailure);

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
      options.beforeInstall?.();
      // Let the IPC response reach the UI before the installer tears down windows.
      setImmediate(() => updater.quitAndInstall(true, true));
    }
  };
}

module.exports = { setupUpdater, hasReleaseChannel, updateErrorMessage };
