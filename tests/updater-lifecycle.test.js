'use strict';
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setupUpdater, updateErrorMessage } = require('../updates');

(async () => {
  const resources = fs.mkdtempSync(path.join(os.tmpdir(), 'vinyl-updater-lifecycle-'));
  try {
    fs.writeFileSync(path.join(resources, 'app-update.yml'), 'provider: github\nowner: example\nrepo: vinyl\n');
    const autoUpdater = new EventEmitter();
    autoUpdater.checkForUpdates = async () => ({ version: '0.7.0' });
    let installed = false;
    let prepared = false;
    autoUpdater.quitAndInstall = (silent, restart) => { assert.equal(prepared,true); assert.equal(silent,true); assert.equal(restart,true); installed = true; };
    const app = { isPackaged: true, getVersion: () => '0.6.0', whenReady: () => new Promise(() => {}) };
    let broadcasts = 0;
    const client = setupUpdater(app, () => { broadcasts++; }, { resourcesDirectory: resources, autoUpdater, beforeInstall: () => {prepared = true;} });
    assert.equal(client.status.state, 'idle');
    assert.equal(client.status.version, '0.6.0');
    autoUpdater.emit('checking-for-update');
    assert.equal(client.status.state, 'checking');
    autoUpdater.emit('update-available', { version: '0.7.0' });
    assert.equal(client.status.nextVersion, '0.7.0');
    assert.equal(client.status.state, 'downloading');
    autoUpdater.emit('download-progress', { percent: 72.8 });
    assert.equal(client.status.progress, 72.8);
    autoUpdater.emit('update-downloaded', { version: '0.7.0' });
    assert.equal(client.status.progress, 100);
    assert.equal(client.status.state, 'ready');
    client.install();
    assert.equal(prepared, true);
    assert.equal(installed, false, 'IPC caller can receive its response before shutdown');
    await new Promise(setImmediate);
    assert.equal(installed, true);
    assert.ok(broadcasts >= 4);
    assert.equal((await client.check()).state, 'ready');

    const failingUpdater = new EventEmitter();
    const failedClient = setupUpdater(app, () => {}, { resourcesDirectory: resources, autoUpdater: failingUpdater });
    const largeError = Object.assign(new Error('Cannot find latest.yml: 404\n<html>' + 'response body '.repeat(1000) + '</html>\n at GitHubProvider.getLatestVersion'), {code:'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND'});
    let calls = 0;
    failingUpdater.checkForUpdates = async () => {
      calls++;
      failingUpdater.emit('checking-for-update');
      failingUpdater.emit('error', largeError);
      throw largeError;
    };
    const first = failedClient.check();
    assert.equal(failedClient.check(), first, 'simultaneous checks share one request');
    const failure = await first;
    assert.equal(calls, 1);
    assert.equal(failure.state, 'error');
    assert.match(failure.message, /No downloadable Windows update/);
    assert.ok(failure.message.length < 200);
    assert.ok(!JSON.stringify(failure).includes('response body'));
    assert.ok(!JSON.stringify(failure).includes('GitHubProvider'));

    // Some adapters reject without emitting an error event.
    failingUpdater.checkForUpdates = async () => { throw new Error('ENOTFOUND github.com/releases/latest.yml'); };
    assert.match((await failedClient.check()).message, /internet connection/);
    assert.match(updateErrorMessage(new Error('HTTP 429 latest.yml')), /limiting/);
    assert.match(updateErrorMessage(new Error('ERR_CERT_DATE_INVALID')), /securely connect/);
    assert.match(updateErrorMessage(new Error('ENOSPC')), /disk space/);
    assert.match(updateErrorMessage(new Error('sha512 checksum mismatch')), /not be verified/);
    assert.match(updateErrorMessage({code:'ERR_UPDATER_INVALID_RELEASE_FEED',message:'XML payload'}), /information is invalid/);
    assert.ok(!updateErrorMessage(new Error('Unexpected ' + 'private response '.repeat(1000))).includes('private response'));

    // Download rejection is separate from the check promise. It must be consumed.
    let rejectDownload;
    failingUpdater.checkForUpdates = async () => {
      failingUpdater.emit('update-available', {version:'0.7.3'});
      return {downloadPromise:new Promise((resolve,reject)=>{rejectDownload=reject;})};
    };
    assert.equal((await failedClient.check()).state, 'downloading');
    rejectDownload(new Error('ECONNRESET while downloading'));
    await new Promise(setImmediate);
    assert.equal(failedClient.status.state, 'error');
    assert.equal(failedClient.status.nextVersion, null);
    assert.match(failedClient.status.message, /internet connection/);
    failingUpdater.checkForUpdates = async () => {
      failingUpdater.emit('checking-for-update');
      failingUpdater.emit('update-not-available');
      return {};
    };
    assert.equal((await failedClient.check()).state, 'current', 'a failed check/download can be retried');
  } finally {
    fs.rmSync(resources, { recursive: true, force: true });
  }
  console.log('Vinyl update lifecycle tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
