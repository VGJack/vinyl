'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DEFAULT_SETTINGS = Object.freeze({
  theme: 'light', accent: 'blue', shelfEnabled: true,
  shelfPosition: 'left', autoCloseShelf: false,
  compactTabs: false, compactToolbar: false,
  roundedPanels: true, softShadows: true, showLabels: true,
  largeText: false, reduceMotion: false, showHomeShortcuts: true,
  searchEngine: 'google', defaultZoom: 100, spellcheck: true, doNotTrack: false,
  addressBarMode: 'always', showHomeNews: true, showHomeWeather: true, showRecentTabs: true
});

class Store {
  constructor(directory) {
    this.file = path.join(directory, 'vinyl-data.json');
    this.data = { settings: { ...DEFAULT_SETTINGS }, bookmarks: [], extensions: [], importedChrome: false, chromeProfileId: null, googleClientId: '', weatherLocation: null, recentTabs: [] };
    try {
      const saved = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (saved && typeof saved === 'object') {
        this.data.settings = { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };
        if (this.data.settings.addressBarMode === 'auto') this.data.settings.addressBarMode = 'always';
        this.data.bookmarks = Array.isArray(saved.bookmarks) ? saved.bookmarks : [];
        this.data.extensions = Array.isArray(saved.extensions) ? saved.extensions : [];
        this.data.importedChrome = Boolean(saved.importedChrome);
        this.data.chromeProfileId = typeof saved.chromeProfileId === 'string' ? saved.chromeProfileId : null;
        this.data.googleClientId = typeof saved.googleClientId === 'string' ? saved.googleClientId : '';
        this.data.weatherLocation = saved.weatherLocation && Number.isFinite(saved.weatherLocation.latitude) && Number.isFinite(saved.weatherLocation.longitude) ? saved.weatherLocation : null;
        this.data.recentTabs = Array.isArray(saved.recentTabs) ? saved.recentTabs.filter(item => typeof item.url === 'string' && /^https?:\/\//.test(item.url)).slice(0,12) : [];
      }
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn('Vinyl settings could not be read:', error.message);
    }
  }
  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = `${this.file}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(temporary, this.file);
  }
  setSetting(key, value) {
    if (!(key in DEFAULT_SETTINGS)) throw new Error('Unknown setting');
    const validation = {
      theme: ['light', 'dark', 'system'], accent: ['blue', 'graphite', 'sage', 'violet'],
      shelfPosition: ['left', 'right'], searchEngine:['google','duckduckgo','bing'], defaultZoom:[75,80,90,100,110,125,150],
      addressBarMode: ['always', 'compact']
    };
    if (validation[key] && !validation[key].includes(value)) throw new Error('Invalid option');
    if (!validation[key] && typeof value !== 'boolean') throw new Error('Expected a toggle value');
    this.data.settings[key] = value;
    this.save();
  }
  setWeatherLocation(location) {
    this.data.weatherLocation = location;
    this.save();
  }
  recordRecent({url,title,favicon}) {
    if (!/^https?:\/\//i.test(url || '')) return;
    const entry = {url:String(url).slice(0,2048),title:String(title || url).slice(0,160),favicon:String(favicon||'').slice(0,2048),visited:Date.now()};
    this.data.recentTabs = [entry,...this.data.recentTabs.filter(item=>item.url!==url)].slice(0,12);
    this.save();
  }
  setChromeProfile(profileId) { this.data.chromeProfileId = profileId; this.save(); }
  setGoogleClientId(clientId) { this.data.googleClientId = clientId; this.save(); }
  find(id, nodes = this.data.bookmarks, parent = null) {
    for (const node of nodes) {
      if (node.id === id) return { node, nodes, parent };
      if (Array.isArray(node.children)) {
        const found = this.find(id, node.children, node);
        if (found) return found;
      }
    }
    return null;
  }
  addBookmark({ title, url, folderId = null, pinned = false }) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('A valid HTTP or HTTPS address is required');
    const entry = { id: randomUUID(), title: String(title || new URL(url).hostname).slice(0, 160), url, pinned: Boolean(pinned) };
    const folder = folderId ? this.find(folderId)?.node : null;
    if (folderId && !Array.isArray(folder?.children)) throw new Error('Folder not found');
    (folder ? folder.children : this.data.bookmarks).push(entry);
    this.save();
    return entry;
  }
  addFolder({ title, folderId = null }) {
    const folder = folderId ? this.find(folderId)?.node : null;
    if (folderId && !Array.isArray(folder?.children)) throw new Error('Folder not found');
    const entry = { id: randomUUID(), title: String(title || 'New folder').slice(0, 120), children: [] };
    (folder ? folder.children : this.data.bookmarks).push(entry);
    this.save();
    return entry;
  }
  updateBookmark({ id, title, url }) {
    const found = this.find(id);
    if (!found) throw new Error('Bookmark not found');
    if (typeof title === 'string') found.node.title = title.slice(0, 160);
    if (typeof url === 'string' && !Array.isArray(found.node.children)) {
      if (!/^https?:\/\//i.test(url)) throw new Error('Invalid address');
      found.node.url = url;
    }
    this.save();
  }
  removeBookmark(id) {
    const found = this.find(id);
    if (!found) throw new Error('Bookmark not found');
    found.nodes.splice(found.nodes.indexOf(found.node), 1);
    this.save();
  }
  togglePin(id) {
    const found = this.find(id);
    if (!found || !found.node.url) throw new Error('Bookmark not found');
    found.node.pinned = !found.node.pinned;
    this.save();
  }
  moveBookmark(id, targetFolderId, position = null) {
    const found = this.find(id);
    if (!found) throw new Error('Bookmark not found');
    if (id === targetFolderId) throw new Error('Cannot move folder into itself');
    const destination = targetFolderId ? this.find(targetFolderId)?.node : null;
    if (targetFolderId && !Array.isArray(destination?.children)) throw new Error('Destination folder not found');
    if (destination && Array.isArray(found.node.children) && this.find(targetFolderId, found.node.children)) {
      throw new Error('Cannot move folder into its descendant');
    }
    found.nodes.splice(found.nodes.indexOf(found.node), 1);
    const siblings = destination ? destination.children : this.data.bookmarks;
    const index = Number.isInteger(position) ? Math.max(0, Math.min(siblings.length, position)) : siblings.length;
    siblings.splice(index, 0, found.node);
    this.save();
  }
  importBookmarkTree(nodes, label = 'Imported bookmarks') {
    let count = 0;
    const limit = 15000;
    const convert = (node, depth) => {
      if (depth > 30 || !node || typeof node !== 'object') return null;
      if (Array.isArray(node.children)) {
        const children = [];
        for (const item of node.children) {
          const converted = convert(item, depth + 1);
          if (converted) children.push(converted);
        }
        return { id: randomUUID(), title: String(node.title || 'Folder').slice(0, 160), children };
      }
      if (typeof node.url === 'string') {
        let url;
        try { url = new URL(node.url); } catch { return null; }
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        count += 1;
        if (count > limit) throw new Error('The bookmark collection is too large to import.');
        return { id: randomUUID(), title: String(node.title ?? '').slice(0, 160), url: url.href, pinned: false };
      }
      return null;
    };
    const children = nodes.map(item => convert(item, 0)).filter(Boolean);
    if (children.length === 0) throw new Error('No supported bookmarks were found.');
    this.data.bookmarks.push({id: randomUUID(), title: String(label).slice(0, 160), children});
    this.data.importedChrome = true;
    this.save();
    return count;
  }
  importChromeTree(nodes) {
    function convert(node) {
      if (node.type === 'folder') return { id: randomUUID(), title: String(node.name || 'Folder'), children: (node.children || []).map(convert).filter(Boolean) };
      if (node.type === 'url' && /^https?:\/\//i.test(node.url || '')) {
        return { id: randomUUID(), title: String(node.name ?? ''), url: node.url, pinned: false };
      }
      return null;
    }
    const imported = (nodes || []).map(convert).filter(Boolean);
    this.data.bookmarks.push(...imported);
    this.data.importedChrome = true;
    this.save();
    return imported.length;
  }
}
module.exports = { Store, DEFAULT_SETTINGS };
