'use strict';
const fs = require('node:fs');
const path = require('node:path');

function buildVersion(baseVersion, runNumber) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(baseVersion);
  if (!match || !/^[1-9]\d*$/.test(String(runNumber))) throw new Error('A stable base version and positive GitHub run number are required.');
  const patch = Number(match[3]) + Number(runNumber);
  if (!Number.isSafeInteger(patch) || patch > 65535) throw new Error('Build number exceeds the Windows version limit. Increase the base minor version and reset the build numbering.');
  return `${match[1]}.${match[2]}.${patch}`;
}

function prepareUpdate(root, runNumber) {
  const manifestPath = path.join(root,'package.json');
  const lockPath = path.join(root,'package-lock.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath,'utf8'));
  const version = buildVersion(manifest.version,runNumber);
  manifest.version = lock.version = lock.packages[''].version = version;
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(lockPath,JSON.stringify(lock,null,2)+'\n');
  return version;
}

if (require.main === module) {
  const version = prepareUpdate(path.join(__dirname,'..'),process.env.GITHUB_RUN_NUMBER);
  console.log(`Automatic Windows build: ${version}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,`version=${version}\ntag=v${version}\n`);
}
module.exports = {buildVersion,prepareUpdate};
