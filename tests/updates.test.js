'use strict';
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { hasReleaseChannel } = require('../updates');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinyl-updater-'));
try {
  const development = { isPackaged: false };
  const installed = { isPackaged: true };
  assert.equal(hasReleaseChannel(development, dir), false);
  assert.equal(hasReleaseChannel(installed, dir), false);
  fs.writeFileSync(path.join(dir, 'app-update.yml'), 'provider: github\nowner: example\nrepo: vinyl\n');
  assert.equal(hasReleaseChannel(installed, dir), true);
  assert.equal(hasReleaseChannel(development, dir), false);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log('Vinyl updater configuration tests passed');
