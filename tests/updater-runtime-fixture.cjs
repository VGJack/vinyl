'use strict';
const {app} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {EventEmitter} = require('node:events');
const profile = process.env.VINYL_TEST_PROFILE;
if (!profile) throw new Error('An isolated test profile is required');
app.setPath('userData',profile);
const resources = path.join(profile,'update-resources');
fs.mkdirSync(resources,{recursive:true});
fs.writeFileSync(path.join(resources,'app-update.yml'),'provider: github\nowner: VGJack\nrepo: vinyl\nupdaterCacheDirName: vinyl-updater-test\n');
const updates = require('../updates');
const setup = updates.setupUpdater;
updates.setupUpdater = (_app,broadcast) => {
  const live = process.env.VINYL_TEST_LIVE_UPDATES === '1';
  const updater = live ? require('electron-updater').autoUpdater : new EventEmitter();
  if (live) {
    updater.forceDevUpdateConfig = true;
    updater.updateConfigPath = path.join(resources,'app-update.yml');
    updater.logger = null;
  } else {
    let checks = 0;
    updater.checkForUpdates = async () => {
      updater.emit('checking-for-update');
      if (++checks === 1) {
        const error = Object.assign(new Error('Cannot find latest.yml: 404\n'+'<html>Huge server response</html>'.repeat(1000)),{code:'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND'});
        updater.emit('error',error);
        throw error;
      }
      updater.emit('update-not-available');
      return {};
    };
  }
  updater.on('error',error=>{globalThis.updateTestError={code:error.code,length:String(error.message).length};});
  const client = setup({isPackaged:true,getVersion:()=>require('../package.json').version,whenReady:()=>new Promise(()=>{})},broadcast,{autoUpdater:updater,resourcesDirectory:resources});
  // The optional live smoke check only reads the public feed, never downloads/installs.
  if (live) updater.autoDownload = false;
  return client;
};
require('../main');
