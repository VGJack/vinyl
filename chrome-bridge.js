'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function chromeRoot(platform = process.platform, home = os.homedir(), environment = process.env) {
  if (platform === 'win32') return path.join(environment.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'Google', 'Chrome', 'User Data');
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'Google', 'Chrome');
  return path.join(home, '.config', 'google-chrome');
}
function chromeProfiles(root = chromeRoot()) {
  if (!fs.existsSync(root)) return [];
  let folders;
  try { folders = fs.readdirSync(root, { withFileTypes: true }); }
  catch { return []; }
  return folders.filter(entry => entry.isDirectory() && (entry.name === 'Default' || /^Profile \d+$/.test(entry.name)))
    .filter(entry => fs.existsSync(path.join(root, entry.name, 'Bookmarks')))
    .map(entry => {
      let display = entry.name;
      try {
        const preferences = JSON.parse(fs.readFileSync(path.join(root, entry.name, 'Preferences'), 'utf8'));
        display = String(preferences.profile?.name || display).slice(0, 90);
      } catch { /* Chrome may not have profile preferences available. */ }
      return { id: entry.name, name: display };
    }).sort((a, b) => a.id === 'Default' ? -1 : b.id === 'Default' ? 1 : a.id.localeCompare(b.id));
}
function convertChromeNode(node) {
  if (!node || typeof node !== 'object') return null;
  const common = { id: `chrome:${String(node.id || '')}`, title: String(node.name ?? '').slice(0, 200), source: 'chrome' };
  if (node.type === 'folder') return { ...common, children: Array.isArray(node.children) ? node.children.map(convertChromeNode).filter(Boolean) : [] };
  if (node.type === 'url' && typeof node.url === 'string' && /^https?:\/\//i.test(node.url)) return { ...common, url: node.url, pinned: false };
  return null;
}
function readChromeBookmarks(root, profileId) {
  if (!chromeProfiles(root).some(profile => profile.id === profileId)) throw new Error('Chrome profile not found');
  const file = path.join(root, profileId, 'Bookmarks');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bar = raw.roots?.bookmark_bar?.children || [];
  const other = raw.roots?.other?.children || [];
  const mobile = raw.roots?.synced?.children || [];
  const nodes = bar.map(convertChromeNode).filter(Boolean);
  if (other.length) nodes.push({ id: 'chrome:other-root', title: 'Other bookmarks', source:'chrome', children: other.map(convertChromeNode).filter(Boolean) });
  if (mobile.length) nodes.push({ id: 'chrome:mobile-root', title: 'Mobile bookmarks', source:'chrome', children: mobile.map(convertChromeNode).filter(Boolean) });
  return nodes;
}
function iconFromFolder(folder, icons = {}) {
  const iconFile = icons['48'] || icons['32'] || icons['128'] || icons['16'];
  if (!iconFile || typeof iconFile !== 'string') return '';
  const full = path.resolve(folder, iconFile);
  if (!full.startsWith(path.resolve(folder) + path.sep)) return '';
  const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' }[path.extname(full).toLowerCase()];
  if (!mime) return '';
  try {
    const bytes = fs.readFileSync(full);
    return bytes.length <= 250_000 ? `data:${mime};base64,${bytes.toString('base64')}` : '';
  } catch { return ''; }
}
function readChromeExtensions(root, profileId) {
  const extensions = path.join(root, profileId, 'Extensions');
  if (!fs.existsSync(extensions)) return [];
  const records = [];
  let ids;
  try { ids = fs.readdirSync(extensions, { withFileTypes: true }); } catch { return []; }
  for (const entry of ids.slice(0, 250)) {
    if (!entry.isDirectory() || !/^[a-p]{32}$/.test(entry.name)) continue;
    const extensionFolder = path.join(extensions, entry.name);
    let versions;
    try { versions = fs.readdirSync(extensionFolder, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name).sort().reverse(); }
    catch { continue; }
    for (const version of versions) {
      const folder = path.join(extensionFolder, version);
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
        let name = manifest.name || entry.name;
        if (/^__MSG_.*__$/.test(name)) {
          const key = name.slice(6, -2);
          for (const locale of [manifest.default_locale, 'en', 'en_US'].filter(Boolean)) {
            try {
              const messages = JSON.parse(fs.readFileSync(path.join(folder, '_locales', locale, 'messages.json'), 'utf8'));
              const match = Object.keys(messages).find(k => k.toLowerCase() === key.toLowerCase());
              if (match && messages[match].message) { name = messages[match].message; break; }
            } catch { /* Other locales may still be available. */ }
          }
        }
        records.push({ id: `chrome-ext:${entry.name}`, name: String(name).slice(0, 120), icon: iconFromFolder(folder, manifest.icons), source: 'chrome' });
        break;
      } catch { /* Continue to an earlier version. */ }
    }
  }
  return records.sort((a, b) => a.name.localeCompare(b.name));
}
function findInTree(id, nodes) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) { const found = findInTree(id, node.children); if (found) return found; }
  }
  return null;
}
module.exports = { chromeRoot, chromeProfiles, convertChromeNode, readChromeBookmarks, readChromeExtensions, findInTree };
