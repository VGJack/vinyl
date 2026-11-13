'use strict';
const { app, BrowserWindow, WebContentsView, ipcMain, dialog, session, Menu, nativeTheme, shell, safeStorage, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { Store } = require('./store');
const chromeBridge = require('./chrome-bridge');
const { parseNetscapeBookmarks } = require('./import-bookmarks');
const { GoogleAccount, isDesktopClientId } = require('./google-account');
const { setupUpdater } = require('./updates');
const {fetchNews,fetchWeather,resolveCity} = require('./home-data');

app.setName('Vinyl');
if (process.platform === 'win32') app.setAppUserModelId('app.vinyl.browser');
const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();

let store;
let googleAccount;
let updater;
const contexts = new Set();
const ipcOwners = new Map();
const registeredChannels = new Set();
let quitting = false;
function broadcastAll() { for (const context of contexts) context.broadcast(); }
function prepareShutdown() {
  quitting = true;
  for (const context of contexts) context.disposePages();
}
async function openBrowser(options = {}) {
  const context = browserContext();
  contexts.add(context);
  try { await context.createWindow(options); return context; }
  catch (error) { context.destroy(); contexts.delete(context); throw error; }
}
function browserContext() {
let window;
let shelfWindow = null;
let shelfOpen = false;
let shelfSection = 'bookmarks';
let shelfAnimation = null;
const handlers = new Map();
const context = { broadcast, createWindow, createTab, capturePreview, browserShortcuts, disposePages, updateBrowserPreferences, watchLinkedChrome, setShelf,
  get window() { return window; },
  acceptTab(tab) { tab.owner = context; tabs.push(tab); activateTab(tab.id); },
  destroy() { if (window && !window.isDestroyed()) window.destroy(); }
};
let tabs = [];
let activeId = null;
let browserArea = { x: 0, y: 104, width: 1100, height: 700 };
let chromeBookmarks = [];
let chromeWatcher = null;
let chromeListener = null;
let chromeError = '';
let chromeUpdated = null;
const previews = new Map();
let feedCache = {news:[],weather:null,newsFetched:0,weatherFetched:0,newsError:'',weatherError:''};
let homeRequest = null;

async function refreshHome(force = false) {
  if (homeRequest) return homeRequest;
  homeRequest = (async () => {
    const now = Date.now();
    const city = store.data.weatherLocation;
    const jobs = [];
    if (force || now - feedCache.newsFetched > 20*60*1000) {
      jobs.push(fetchNews().then(items=>{feedCache.news=items;feedCache.newsFetched=Date.now();feedCache.newsError='';}).catch(e=>{feedCache.newsError=e.message;feedCache.newsFetched=Date.now();}));
    }
    if (city && (force || now - feedCache.weatherFetched > 15*60*1000)) {
      jobs.push(fetchWeather(city).then(item=>{feedCache.weather=item;feedCache.weatherFetched=Date.now();feedCache.weatherError='';}).catch(e=>{feedCache.weatherError=e.message;feedCache.weatherFetched=Date.now();}));
    }
    await Promise.all(jobs);
    return {...feedCache,weatherLocation:city};
  })();
  try { return await homeRequest; } finally { homeRequest = null; }
}
function noteRecent(tab) {
  if (!store || !tab || !/^https?:\/\//.test(tab.url || '')) return;
  store.recordRecent(tab);
  capturePreview(tab);
}
function capturePreview(tab) {
  if (store.data.settings.showRecentTabs === false) return;
  const wc = tab?.view?.webContents;
  if (!wc || wc.isDestroyed() || tab.id !== activeId || !/^https?:\/\//i.test(tab.url || '')) return;
  const currentURL = tab.url;
  wc.capturePage().then(image => {
    if (image.isEmpty()) return;
    const resized = image.resize({width:320,quality:'good'});
    const src = resized.toDataURL();
    if (src.length > 160000 || currentURL !== tab.url) return;
    previews.delete(currentURL); previews.set(currentURL,src);
    while (previews.size > 12) previews.delete(previews.keys().next().value);
    broadcast();
  }).catch(()=>{});
}


function activeTab() { return tabs.find(tab => tab.id === activeId) || null; }
function normalizedAddress(value) {
  const entered = String(value || '').trim();
  if (!entered) return '';
  if (/^https?:\/\//i.test(entered)) {
    try { return new URL(entered).href; } catch { return ''; }
  }
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(entered)) return `http://${entered}`;
  if (/^[^\s/]+\.[a-z]{2,}(?::\d+)?(\/[^\s]*)?$/i.test(entered)) return `https://${entered}`;
  const engine = store?.data.settings.searchEngine || 'google';
  const base = { google:'https://www.google.com/search?q=', duckduckgo:'https://duckduckgo.com/?q=', bing:'https://www.bing.com/search?q=' }[engine];
  return `${base}${encodeURIComponent(entered)}`;
}
function state() {
  const selected = activeTab();
  for (const tab of tabs) updateNavigation(tab);
  return {
    tabs: tabs.map(({id, title, url, favicon, loading, canGoBack, canGoForward}) => ({id, title, url, favicon, loading, canGoBack, canGoForward})),
    recentTabs: store.data.recentTabs.slice(0,4).map(item=>({...item,preview:previews.get(item.url)||''})),
    activeId, bookmarks: [...store.data.bookmarks, ...chromeBookmarks], settings: store.data.settings,
    google: { ...(googleAccount?.status() || {connected:false,profile:null,busy:false,persistent:false}), clientId:store.data.googleClientId },
    updates: updater?.status || {state:'unconfigured',message:'Update feed not configured.'},
    chrome: { profiles: chromeBridge.chromeProfiles(), linkedProfile: store.data.chromeProfileId,
      bookmarkCount: chromeBookmarks.length, lastUpdated: chromeUpdated, error: chromeError },

    importedChrome: store.data.importedChrome,
    active: selected ? { title: selected.title, url: selected.url, canGoBack: selected.canGoBack, canGoForward: selected.canGoForward, loading: selected.loading } : null,
    maximized: Boolean(window && window.isMaximized()), fullscreen: Boolean(window?.isFullScreen()),
    shelfOpen, shelfSection, shelfExternal: externalShelf(), platform: process.platform
  };
}
function broadcast() {
  for (const target of [window, shelfWindow]) {
    if (target && !target.isDestroyed() && !target.webContents.isLoadingMainFrame()) target.webContents.send('vinyl:state', state());
  }
}
function disposePages() {
  stopChromeWatcher();
  clearInterval(shelfAnimation);
  for (const tab of tabs) {
    if (tab.view && !tab.view.webContents.isDestroyed()) tab.view.webContents.close({waitForBeforeUnload:false});
    tab.view = null;
  }
}
function externalShelf() {
  return Boolean(window && !window.isDestroyed() && !window.isMaximized() && !window.isFullScreen());
}
function shelfBounds(width = 308) {
  const b = window.getBounds();
  return {x:b.x-width+1, y:b.y+54, width:Math.max(1,width), height:Math.max(300,b.height-108)};
}
function syncShelf() {
  if (!window || window.isDestroyed()) return;
  if (!shelfOpen || !externalShelf() || window.isMinimized()) shelfWindow?.hide();
  else if (shelfWindow && !shelfWindow.isDestroyed()) {
    clearInterval(shelfAnimation);
    shelfWindow.setBounds(shelfBounds()); shelfWindow.showInactive();
  }
  broadcast();
}
async function setShelf(open, section = shelfSection) {
  if (['bookmarks','toggles'].includes(section)) shelfSection = section;
  shelfOpen = Boolean(open) && store.data.settings.shelfEnabled !== false;
  clearInterval(shelfAnimation);
  if (!shelfOpen || !externalShelf()) { syncShelf(); return; }
  // Make room on the current display before extending the attached drawer.
  const bounds = window.getBounds();
  const work = screen.getDisplayMatching(bounds).workArea;
  if (bounds.x < work.x+308) window.setBounds({...bounds,x:work.x+308,width:Math.min(bounds.width,work.width-308)});
  if (!shelfWindow || shelfWindow.isDestroyed()) {
    shelfWindow = new BrowserWindow({ ...shelfBounds(1), show:false, frame:false,
      transparent:true, resizable:false, skipTaskbar:true, parent:window, hasShadow:true,
      webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:true,nodeIntegration:false}
    });
    const shelfId = shelfWindow.webContents.id;
    ipcOwners.set(shelfId, {handlers, isShelf:true});
    shelfWindow.webContents.setWindowOpenHandler(() => ({action:'deny'}));
    shelfWindow.webContents.on('will-navigate', event => event.preventDefault());
    shelfWindow.on('closed', () => {ipcOwners.delete(shelfId); shelfWindow = null;});
    await shelfWindow.loadFile(path.join(__dirname,'ui','index.html'), {query:{surface:'shelf'}});
  }
  if (!shelfOpen || !externalShelf()) return;
  shelfWindow.showInactive();
  const start = Date.now();
  shelfAnimation = setInterval(() => {
    if (!shelfWindow || shelfWindow.isDestroyed() || !window || window.isDestroyed()) {clearInterval(shelfAnimation);return;}
    const progress = store.data.settings.reduceMotion ? 1 : Math.min(1,(Date.now()-start)/240);
    const width = Math.round(1+307*(1-Math.pow(1-progress,3)));
    shelfWindow.setBounds(shelfBounds(width));
    if (progress === 1) clearInterval(shelfAnimation);
  },16);
  broadcast();
}
function viewFor(tab) {
  // The shared default session persists cookies across tabs and app restarts.
  if (tab.view) return tab.view;
  const view = new WebContentsView({ webPreferences: {
    nodeIntegration: false, contextIsolation: true, sandbox: true,
    webSecurity: true, session: session.defaultSession
  }});
  tab.view = view;
  const wc = view.webContents;
  wc.setZoomFactor(store.data.settings.defaultZoom / 100);
  wc.setWindowOpenHandler(({url}) => {
    if (/^https?:\/\//i.test(url)) tab.owner.createTab(url, true);
    return { action: 'deny' };
  });
  wc.on('page-title-updated', (_event, title) => { tab.title = title || tab.title; tab.owner.broadcast(); });
  wc.on('page-favicon-updated', (_event, urls) => {
    const safe = urls.find(url => /^https?:\/\//i.test(url));
    tab.favicon = safe || '';
    tab.owner.broadcast();
  });
  wc.on('did-start-loading', () => { tab.loading = true; tab.owner.broadcast(); });
  wc.on('did-stop-loading', () => { tab.loading = false; updateNavigation(tab); if (tab.url) { store.recordRecent(tab); setTimeout(() => tab.owner.capturePreview(tab), 900); } tab.owner.broadcast(); });
  wc.on('did-navigate', (_event, url) => { updateURL(tab, url); });
  wc.on('did-navigate-in-page', (_event, url) => { updateURL(tab, url); });
  wc.on('render-process-gone', () => { tab.loading = false; tab.title = 'Page crashed'; tab.owner.broadcast(); });
  wc.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
    if (code !== -3 && isMainFrame) { tab.loading = false; tab.title = 'Cannot load page'; tab.owner.broadcast(); }
  });
  wc.on('before-input-event', (event,input) => tab.owner.browserShortcuts(event,input));
  return view;
}
function updateNavigation(tab) {
  if (!tab.view || tab.view.webContents.isDestroyed()) return;
  const nav = tab.view.webContents.navigationHistory;
  tab.canGoBack = nav.canGoBack();
  tab.canGoForward = nav.canGoForward();
}
function updateURL(tab, url) {
  if (/^https?:\/\//i.test(url)) tab.url = url;
  updateNavigation(tab);
  tab.owner.broadcast();
}
function detach(tab) {
  if (tab?.view && window && !window.isDestroyed()) {
    try { window.contentView.removeChildView(tab.view); } catch { /* Already detached. */ }
  }
}
function activateTab(id) {
  const next = tabs.find(tab => tab.id === id);
  if (!next) return;
  if (activeId !== id) { noteRecent(activeTab()); detach(activeTab()); }
  activeId = id;
  if (next.view) {
    window.contentView.addChildView(next.view);
    next.view.setBounds(browserArea);
    next.view.webContents.focus();
  } else {
    window.webContents.focus();
  }
  broadcast();
}
function createTab(url = '', activate = true) {
  const tab = { id: randomUUID(), title: 'New tab', url: '', favicon: '', loading: false,
    canGoBack: false, canGoForward: false, view: null, owner: context };
  tabs.push(tab);
  if (activate || !activeId) activateTab(tab.id);
  if (url === 'vinyl://settings') { tab.url = url; tab.title = 'Settings'; tab.special = 'settings'; broadcast(); }
  else if (url) navigate(tab.id, url);
  return tab.id;
}
function navigate(id, input) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  if (input === 'vinyl://settings') {
    detach(tab);
    tab.url = input; tab.title = 'Settings'; tab.special = 'settings';
    if (tab.view && !tab.view.webContents.isDestroyed()) { tab.view.webContents.close({waitForBeforeUnload:false}); tab.view = null; }
    broadcast(); return;
  }
  const target = normalizedAddress(input);
  if (!target) return;
  if (tab.url && tab.url !== target) noteRecent(tab);
  tab.url = target; tab.special = null;
  tab.title = (() => { try { return new URL(target).hostname; } catch { return 'Loading'; } })();
  tab.favicon = '';
  const view = viewFor(tab);
  if (id === activeId) {
    window.contentView.addChildView(view);
    view.setBounds(browserArea);
  }
  view.webContents.loadURL(target).catch(() => {});
  broadcast();
}
function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index < 0) return;
  const [closed] = tabs.splice(index, 1);
  noteRecent(closed);
  detach(closed);
  if (closed.view && !closed.view.webContents.isDestroyed()) closed.view.webContents.close({waitForBeforeUnload:false});
  if (activeId === id) {
    activeId = null;
    if (!tabs.length) createTab();
    else activateTab(tabs[Math.min(index, tabs.length - 1)].id);
  }
  broadcast();
}
function navigateHistory(method) {
  const tab = activeTab();
  if (!tab?.view) return;
  const history = tab.view.webContents.navigationHistory;
  if (method === 'back' && history.canGoBack()) history.goBack();
  if (method === 'forward' && history.canGoForward()) history.goForward();
}
function command(name) {
  if (window && !window.isDestroyed()) window.webContents.send('vinyl:command', name);
}
function browserShortcuts(event, input) {
  if (input.type !== 'keyDown') return;
  const key = input.key.toLowerCase();
  const modifier = process.platform === 'darwin' ? input.meta : input.control;
  if (key === 'f11') { event.preventDefault(); window.setFullScreen(!window.isFullScreen()); }
  else if (modifier && input.shift && key === 'h') { event.preventDefault(); command('hide-controls'); }
  else if (modifier && key === 'l') { event.preventDefault(); command('focus-address'); }
  else if (modifier && key === 't') { event.preventDefault(); createTab(); command('focus-address'); }
  else if (modifier && key === 'w') { event.preventDefault(); closeTab(activeId); }
  else if (modifier && key === 'r') { event.preventDefault(); activeTab()?.view?.webContents.reload(); }
  else if (modifier && key === 'd') { event.preventDefault(); command('bookmark-current'); }
  else if (modifier && key === ',') { event.preventDefault(); openSettings(); }
  else if (modifier && input.shift && key === 'b') { event.preventDefault(); command('open-bookmarks'); }
  else if (modifier && key === 'tab') {
    event.preventDefault(); const i = tabs.findIndex(t => t.id === activeId);
    activateTab(tabs[(i + (input.shift ? tabs.length - 1 : 1)) % tabs.length].id);
  }
  else if (input.alt && key === 'arrowleft') { event.preventDefault(); navigateHistory('back'); }
  else if (input.alt && key === 'arrowright') { event.preventDefault(); navigateHistory('forward'); }
}
function openSettings() {
  const existing = tabs.find(tab => tab.special === 'settings');
  if (existing) activateTab(existing.id);
  else createTab('vinyl://settings');
}
function stopChromeWatcher() {
  if (chromeWatcher && chromeListener) fs.unwatchFile(chromeWatcher,chromeListener);
  chromeWatcher = null;
  chromeListener = null;
}
function refreshLinkedChrome() {
  const profile = store.data.chromeProfileId;
  if (!profile) { chromeBookmarks = []; chromeError = ''; chromeUpdated = null; broadcast(); return; }
  try {
    chromeBookmarks = chromeBridge.readChromeBookmarks(chromeBridge.chromeRoot(), profile);
    chromeError = ''; chromeUpdated = Date.now();
  } catch (error) { chromeError = `Cannot read the selected Chrome profile: ${error.message}`; }
  broadcast();
}
function watchLinkedChrome() {
  stopChromeWatcher(); refreshLinkedChrome();
  if (!store.data.chromeProfileId) return;
  const file = path.join(chromeBridge.chromeRoot(), store.data.chromeProfileId, 'Bookmarks');
  chromeWatcher = file;
  chromeListener = (current, previous) => {
    if (current.mtimeMs !== previous.mtimeMs || current.size !== previous.size) refreshLinkedChrome();
  };
  fs.watchFile(file, { interval: 3000 }, chromeListener);
}
async function importChrome({profileId} = {}) {
  const profiles = chromeBridge.chromeProfiles();
  if (!profiles.length) throw new Error('No local Chrome profiles were found. Try Import HTML instead.');
  let selected = profiles.find(profile => profile.id === profileId)
    || profiles.find(profile => profile.id === store.data.chromeProfileId);
  if (!selected) {
    if (profiles.length === 1) selected = profiles[0];
    else {
      const response = await dialog.showMessageBox(window, {
        type:'question', title:'Import Chrome bookmarks',
        message:'Choose the Chrome profile to import.',
        detail:'The imported bookmarks will be editable in Vinyl. Chrome will not be changed.',
        buttons:[...profiles.map(profile => profile.name), 'Cancel'], cancelId: profiles.length
      });
      if (response.response >= profiles.length) return 0;
      selected = profiles[response.response];
    }
  }
  const nodes = chromeBridge.readChromeBookmarks(chromeBridge.chromeRoot(), selected.id);
  return store.importBookmarkTree(nodes, `Chrome — ${selected.name}`);
}
async function importChromeHTML() {
  const answer = await dialog.showOpenDialog(window, {
    title:'Import bookmarks HTML',
    filters:[{name:'Bookmarks HTML', extensions:['html','htm']}],
    properties:['openFile']
  });
  if (answer.canceled || !answer.filePaths?.[0]) return 0;
  const file = answer.filePaths[0];
  if (fs.statSync(file).size > 8_000_000) throw new Error('Bookmark HTML file is too large.');
  const entries = parseNetscapeBookmarks(fs.readFileSync(file, 'utf8'));
  return store.importBookmarkTree(entries, `Chrome export — ${path.basename(file, path.extname(file))}`);
}
function currentBookmarkPayload() {
  const tab = activeTab();
  if (!tab?.url || !/^https?:\/\//i.test(tab.url)) throw new Error('Open a website before bookmarking it');
  return { title: tab.title || tab.url, url: tab.url, pinned: true };
}
function updateWindowAppearance() {
  nativeTheme.themeSource = store?.data.settings.theme || 'system';
}
function updateBrowserPreferences() {
  if (!store) return;
  const prefs = store.data.settings;
  for (const tab of tabs) {
    if (tab.view && !tab.view.webContents.isDestroyed()) tab.view.webContents.setZoomFactor(prefs.defaultZoom / 100);
  }
  session.defaultSession.spellCheckerEnabled = prefs.spellcheck;
  if (prefs.spellcheck) session.defaultSession.setSpellCheckerLanguages(['en-US']);
}
async function createWindow({empty = false, position} = {}) {
  window = new BrowserWindow({
    width: 1380, height: 880, minWidth: 880, minHeight: 600,
    ...(position || {}),
    backgroundColor: '#f5f7f8', title: 'Vinyl', show: false,
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'vinyl.ico' : 'vinyl.png'),
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 16, y: 13 } } : { frame: false, thickFrame: true }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true,
      nodeIntegration: false, webviewTag: false
    }
  });
  Menu.setApplicationMenu(null);
  window.webContents.on('before-input-event', browserShortcuts);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  for (const event of ['maximize','unmaximize','enter-full-screen','leave-full-screen','move','resize','restore']) window.on(event,syncShelf);
  window.on('minimize', () => shelfWindow?.hide());
  const shellId = window.webContents.id;
  ipcOwners.set(shellId, {handlers, isShelf:false});
  registerIpc();
  window.on('close', disposePages);
  window.on('closed', () => {
    disposePages();
    if (shelfWindow && !shelfWindow.isDestroyed()) shelfWindow.destroy();
    ipcOwners.delete(shellId); contexts.delete(context);
    tabs = []; window = null;
  });
  await window.loadFile(path.join(__dirname, 'ui', 'index.html'));
  if (!empty) createTab();
  updateWindowAppearance();
  updateBrowserPreferences();
  watchLinkedChrome();
  window.show();
  // Browser extensions are not enabled in Vinyl's current feature set.

}

function registerIpc() {
  const receive = (name, handler) => {
    handlers.set(name, handler);
    if (registeredChannels.has(name)) return;
    registeredChannels.add(name);
    ipcMain.handle(name, async (event,payload) => {
      const owner = ipcOwners.get(event.sender.id);
      if (!owner || event.senderFrame !== event.sender.mainFrame) throw new Error('Untrusted Vinyl action');
      if (owner.isShelf && name === 'browser:layout') return;
      const result = await owner.handlers.get(name)(payload || {});
      if (!['browser:layout','app:state'].includes(name)) broadcastAll();
      return result;
    });
  };
  receive('app:state', () => state());
  receive('window:minimize', () => window.minimize());
  receive('window:maximize', () => { if (window.isMaximized()) window.unmaximize(); else window.maximize(); });
  receive('window:close', () => window.close());
  receive('browser:newTab', ({ url = '' }) => createTab(url));
  receive('browser:activate', ({id}) => activateTab(id));
  receive('browser:close', ({id}) => closeTab(id));
  receive('window:shelf', ({open,section}) => setShelf(open,section));
  receive('browser:reorder', ({id,beforeId}) => {
    const index = tabs.findIndex(t => t.id === id);
    if (index < 0 || id === beforeId || (beforeId && !tabs.some(t => t.id === beforeId))) return;
    const [tab] = tabs.splice(index,1);
    const target = beforeId ? tabs.findIndex(t => t.id === beforeId) : tabs.length;
    tabs.splice(target,0,tab);
  });
  receive('browser:detach', async ({id,x,y}) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab || tab.transferring) return;
    tab.transferring = true;
    let destination;
    try {
      const point = Number.isFinite(x) && Number.isFinite(y) ? {x:Math.round(x),y:Math.round(y)} : screen.getCursorScreenPoint();
      const work = screen.getDisplayNearestPoint(point).workArea;
      const width = Math.min(1200,work.width), height = Math.min(820,work.height);
      destination = await openBrowser({empty:true,position:{width,height,x:Math.max(work.x,Math.min(work.x+work.width-width,point.x-160)),y:Math.max(work.y,Math.min(work.y+work.height-height,point.y-20))}});
      if (!window || window.isDestroyed() || !tabs.includes(tab)) {destination.destroy();return;}
      detach(tab);
      tabs.splice(tabs.indexOf(tab),1);
      if (activeId === id) {activeId = null;if (tabs.length) activateTab(tabs[0].id);}
      destination.acceptTab(tab);
      if (!tabs.length) window.close();
    } catch (error) { destination?.destroy(); throw error; }
    finally { tab.transferring = false; }
  });
  receive('browser:navigate', ({id, address}) => navigate(id || activeId, address));
  receive('browser:back', () => navigateHistory('back'));
  receive('browser:forward', () => navigateHistory('forward'));
  receive('browser:reload', () => activeTab()?.view?.webContents.reload());
  receive('browser:stop', () => activeTab()?.view?.webContents.stop());
  receive('browser:duplicate', () => createTab(activeTab()?.url || ''));
  receive('browser:openSettings', ({section}) => { openSettings(); if (['chrome','account','about','browser','appearance'].includes(section)) command(`settings:${section}`); });
  receive('browser:bookmarkCurrent', () => store.addBookmark(currentBookmarkPayload()));
  receive('browser:layout', area => {
    if (!window || window.isDestroyed()) return;
    const [w, h] = window.getContentSize();
    if (![area.x, area.y, area.width, area.height].every(Number.isFinite)) return;
    browserArea = {
      x: Math.max(0, Math.min(w, Math.round(area.x))), y: Math.max(0, Math.min(h, Math.round(area.y))),
      width: Math.max(0, Math.min(w, Math.round(area.width))), height: Math.max(0, Math.min(h, Math.round(area.height)))
    };
    if (activeTab()?.view && browserArea.width > 0 && browserArea.height > 0) activeTab().view.setBounds(browserArea);
  });
  receive('home:feed', ({force}) => refreshHome(Boolean(force)));
  receive('home:setWeatherCity', async ({city}) => {
    const location = await resolveCity(city);
    store.setWeatherLocation(location);
    feedCache.weatherFetched = 0;
    return refreshHome(true);
  });
  receive('bookmark:add', payload => store.addBookmark(payload));
  receive('bookmark:addFolder', payload => store.addFolder(payload));
  receive('bookmark:update', payload => store.updateBookmark(payload));
  receive('bookmark:remove', ({id}) => store.removeBookmark(id));
  receive('bookmark:pin', ({id}) => store.togglePin(id));
  receive('bookmark:move', ({id, folderId, position}) => store.moveBookmark(id, folderId || null, position));
  receive('bookmark:open', ({id, newTab}) => {
    const bookmark = store.find(id)?.node || chromeBridge.findInTree(id, chromeBookmarks);
    if (!bookmark?.url) throw new Error('Bookmark not found');
    if (newTab) createTab(bookmark.url);
    else navigate(activeId, bookmark.url);
  });
  receive('bookmark:importChrome', payload => importChrome(payload));
  receive('bookmark:importHTML', () => importChromeHTML());
  receive('settings:set', ({key, value}) => {
    store.setSetting(key, value);
    if (key === 'shelfEnabled' && !value) for (const owner of contexts) owner.setShelf(false);
    if (key === 'theme') updateWindowAppearance();
    if (key === 'defaultZoom' || key === 'spellcheck') for (const owner of contexts) owner.updateBrowserPreferences();
  });
  receive('chrome:link', ({profileId}) => {
    if (!chromeBridge.chromeProfiles().some(p => p.id === profileId)) throw new Error('Chrome profile not found');
    store.setChromeProfile(profileId); for (const owner of contexts) owner.watchLinkedChrome();
  });
  receive('chrome:unlink', () => { store.setChromeProfile(null); for (const owner of contexts) owner.watchLinkedChrome(); });
  receive('chrome:refresh', () => refreshLinkedChrome());
  receive('google:setClientId', ({clientId}) => {
    const next = String(clientId || '').trim();
    if (next && !isDesktopClientId(next)) throw new Error('This is not a valid Google OAuth desktop client ID.');
    store.setGoogleClientId(next);
  });
  receive('google:openWebsite', ({site}) => {
    const urls = {youtube:'https://www.youtube.com/', gmail:'https://mail.google.com/', google:'https://accounts.google.com/'};
    if (!Object.hasOwn(urls, site)) throw new Error('Unknown Google site');
    createTab(urls[site], true);
  });
  receive('google:signIn', async () => {
    const result = await googleAccount.signIn(store.data.googleClientId, url => shell.openExternal(url));
    if (window && !window.isDestroyed()) window.focus();
    return result;
  });
  receive('google:signOut', () => googleAccount.signOut());
  receive('updates:check', () => updater.check());
  receive('updates:install', () => updater.install());
  receive('app:about', () => ({ electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node, version: app.getVersion() }));
}
return context;
}
if (primaryInstance) app.whenReady().then(async () => {
  store = new Store(app.getPath('userData'));
  googleAccount = new GoogleAccount(app.getPath('userData'), safeStorage);
  updater = setupUpdater(app, broadcastAll, {beforeInstall:() => store.save()});
  nativeTheme.themeSource = store.data.settings.theme || 'system';
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (store?.data.settings.doNotTrack) details.requestHeaders.DNT = '1';
    callback({ requestHeaders: details.requestHeaders });
  });
  session.defaultSession.setPermissionRequestHandler(async (webContents, permission, callback, details) => {
    const domain = (() => { try { return new URL(details.requestingUrl || webContents.getURL()).hostname; } catch { return 'this website'; } })();
    try {
      const { response } = await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'question', buttons: ['Allow', 'Block'], defaultId: 1, cancelId: 1,
        title: 'Website permission', message: `${domain} requests ${permission} access.`,
        detail: 'Only allow this if you trust the website.'
      });
      callback(response === 0);
    } catch { callback(false); }
  });
  await openBrowser();
  googleAccount.restore().then(broadcastAll).catch(error => console.warn('Google account restoration:', error.message));
  app.on('activate', () => { if (!quitting && contexts.size === 0) openBrowser(); });
}).catch(error => dialog.showErrorBox('Vinyl failed to launch', error.stack || String(error)));

app.on('before-quit', prepareShutdown);
app.on('second-instance', () => { const window = [...contexts][0]?.window; if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
