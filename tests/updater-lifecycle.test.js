'use strict';
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setupUpdater } = require('../updates');

(async () => {
  const resources = fs.mkdtempSync(path.join(os.tmpdir(), 'vinyl-updater-lifecycle-'));
  try {
    fs.writeFileSync(path.join(resources, 'app-update.yml'), 'provider: github\nowner: example\nrepo: vinyl\n');
    const autoUpdater = new EventEmitter();
    autoUpdater.checkForUpdates = async () => ({ version: '0.7.0' });
    let installed = false;
    autoUpdater.quitAndInstall = () => { installed = true; };
    const app = { isPackaged: true, getVersion: () => '0.6.0', whenReady: () => new Promise(() => {}) };
    let broadcasts = 0;
    const client = setupUpdater(app, () => { broadcasts++; }, { resourcesDirectory: resources, autoUpdater });
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
    assert.equal(installed, true);
    assert.ok(broadcasts >= 4);
    assert.equal((await client.check()).state, 'ready');
  } finally {
    fs.rmSync(resources, { recursive: true, force: true });
  }
  console.log('Vinyl update lifecycle tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
