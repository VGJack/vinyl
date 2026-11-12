'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const updates = JSON.parse(fs.readFileSync(path.join(root, 'update-config.json'), 'utf8'));
const config = structuredClone(manifest.build);
if (updates.feedUrl) {
  const url = new URL(updates.feedUrl);
  if (url.protocol !== 'https:') throw new Error('Vinyl updates require an HTTPS feed URL.');
  config.publish = [{ provider:'generic', url:url.href.replace(/\/?$/, '/') }];
} else {
  config.publish = null;
}
fs.writeFileSync(path.join(root, 'builder.generated.json'), JSON.stringify(config, null, 2));
console.log(updates.feedUrl ? `Installer and update metadata configured for ${updates.feedUrl}` : 'Installer configured. Automatic update publishing is disabled until an HTTPS feed is configured.');
