'use strict';

const PATHS = {
  back: '<path d="m15 18-6-6 6-6"/><path d="M9 12h12"/>',
  forward: '<path d="m9 18 6-6-6-6"/><path d="M15 12H3"/>',
  reload: '<path d="M3 11a9 9 0 0 1 15.3-5.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 13a9 9 0 0 1-15.3 5.4L3 16"/><path d="M8 16H3v5"/>',
  stop: '<path d="M6 6h12v12H6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  bookmark: '<path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  bookmarkFill: '<path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/>',
  puzzle: '<path d="M19 13v6a2 2 0 0 1-2 2h-4v-3a2 2 0 1 0-4 0v3H5a2 2 0 0 1-2-2v-4h3a2 2 0 1 0 0-4H3V7a2 2 0 0 1 2-2h4V3a2 2 0 1 1 4 0v2h4a2 2 0 0 1 2 2v3h2a2 2 0 1 1 0 4h-2z"/>',
  sliders: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--surface)"/><circle cx="16" cy="17" r="2" fill="var(--surface)"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  edit: '<path d="m16 4 4 4-12 12H4v-4L16 4Z"/>',
  pin: '<path d="M16 3 21 8l-4 1-4 4v4l-2 2-5-5 2-2h4l4-4zM3 21l6-6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4"/><path d="M5 17v4h14v-4"/>',
  externally: '<path d="M13 4h7v7M20 4l-9 9"/><path d="M20 14v6H4V4h6"/>',
  command: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 10h10M7 14h7"/>',
  minimize: '<path d="M5 12h14"/>',
  maximize: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.4 1.4m11.34 11.34 1.4 1.4M2 12h2m16 0h2M4.93 19.07l1.4-1.4m11.34-11.34 1.4-1.4"/>',
  cloud: '<path d="M20 17a4 4 0 0 0-3-7.5 6 6 0 0 0-11 2.5A3.5 3.5 0 0 0 7 19h12"/>',
  'cloud-rain': '<path d="M20 16a4 4 0 0 0-3-7.5 6 6 0 0 0-11 2.5A3.5 3.5 0 0 0 7 18h12"/><path d="m9 19-1 3m6-3-1 3"/>'
};
function icon(name, size = 18) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || PATHS.globe}</svg>`;
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function hostname(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
function validFavicon(url) { try { const parsed = new URL(url); return ['https:','http:'].includes(parsed.protocol) ? `${parsed.origin}/favicon.ico` : ''; } catch { return ''; } }
function faviconFallbacks(url) { try { const host = new URL(url).hostname; return {second:`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`,third:`https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`}; } catch { return {second:'',third:''}; } }
function favicon(url, title, className = 'favicon') {
  const src = validFavicon(url);
  const fallback = faviconFallbacks(url);
  const letter = escapeHTML((title || hostname(url) || '?').charAt(0).toUpperCase());
  return `<span class="${className}" aria-hidden="true"><span>${letter}</span>${src ? `<img loading="lazy" src="${escapeHTML(src)}" data-fallback="${escapeHTML(fallback.second)}" data-fallback-last="${escapeHTML(fallback.third)}" alt=""/>` : ''}</span>`;
}

const ui = {
  state: null, shelfOpen: false, section: 'bookmarks', folderId: null,
  bookmarkSearch: '', shortcutSearch: '',
  contextId: null, menuOpen: false, settingsSection: 'appearance', selectedChromeProfile: '',
  dockHidden: false, splashComplete: false, homeFeed:null, homeLoadedAt:0
};
const shelfSurface = new URLSearchParams(location.search).get('surface') === 'shelf';
document.body.dataset.surface = shelfSurface ? 'shelf' : 'browser';
let tabDrag = null;
let noticeTimer;
let lastLayout = '';
const $ = selector => document.querySelector(selector);
const invoke = (channel, payload) => window.vinyl?.invoke(channel, payload) || Promise.reject(new Error('Vinyl desktop runtime is not connected'));
async function run(channel, payload, message) {
  try {
    const result = await invoke(channel, payload);
    if (message) toast(message);
    return result;
  } catch (error) { toast(error.message || 'This action could not be completed'); throw error; }
}
function toast(message) {
  const element = $('#toast');
  clearTimeout(noticeTimer);
  element.textContent = String(message);
  element.classList.add('visible');
  noticeTimer = setTimeout(() => element.classList.remove('visible'), 3000);
}
function settings() { return ui.state?.settings || {}; }
function active() { return ui.state?.tabs.find(tab => tab.id === ui.state.activeId) || null; }
function activeBookmarks(nodes = ui.state?.bookmarks || [], result = []) {
  for (const node of nodes) {
    if (node.url) result.push(node);
    else if (node.children) activeBookmarks(node.children, result);
  }
  return result;
}
function currentFolder() {
  function find(id, nodes, chain = []) {
    for (const node of nodes) {
      if (node.id === id) return { node, chain: [...chain, node] };
      if (node.children) { const nested = find(id, node.children, [...chain, node]); if (nested) return nested; }
    }
    return null;
  }
  return ui.folderId ? find(ui.folderId, ui.state.bookmarks) : null;
}
function applyAppearance() {
  const s = settings();
  const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.dataset.theme = s.theme === 'system' ? (systemIsDark ? 'dark' : 'light') : (s.theme || 'light');
  document.body.dataset.accent = s.accent || 'blue';
  document.body.dataset.platform = ui.state?.platform || 'win32';
  document.body.dataset.shelfExternal = String(Boolean(ui.state?.shelfExternal));
  document.body.dataset.shelf = (ui.shelfOpen && (s.shelfEnabled || ui.section === 'settings')) ? 'open' : 'closed';
  document.body.dataset.position = 'left';
  document.body.dataset.compactTabs = String(Boolean(s.compactTabs));
  document.body.dataset.compactToolbar = String(Boolean(s.compactToolbar));
  document.body.dataset.toolbarMode = s.addressBarMode === 'compact' ? 'compact' : 'always';
  document.body.dataset.page = !active()?.url ? 'home' : 'web';
  const dockVisible = !ui.dockHidden;
  document.body.dataset.toolbarVisible = String(dockVisible);
  $('.toolbar').inert = !dockVisible;
  $('#dock-handle').setAttribute('aria-expanded',String(dockVisible));
  $('#dock-handle').title = dockVisible ? 'Hide browser controls' : 'Show browser controls';
  $('#dock-handle').setAttribute('aria-label',$('#dock-handle').title);
  document.body.dataset.rounded = String(s.roundedPanels !== false);
  document.body.dataset.shadows = String(s.softShadows !== false);
  document.body.dataset.labels = String(s.showLabels !== false);
  document.body.dataset.largeText = String(Boolean(s.largeText));
  document.body.dataset.motion = s.reduceMotion ? 'reduce' : 'normal';
  $('#shelf').inert = !(ui.shelfOpen && (s.shelfEnabled || ui.section === 'settings'));
  $('#shelf-open').setAttribute('aria-expanded', String(ui.shelfOpen && s.shelfEnabled !== false && ui.section === 'bookmarks'));
  $('#shelf-open').setAttribute('aria-label',ui.shelfOpen ? 'Close bookmarks' : 'Open bookmarks');
  $('#home-shortcuts').hidden = s.showHomeShortcuts === false;
  $('#recent-block').hidden = s.showRecentTabs === false;
  $('#news-block').hidden = s.showHomeNews === false;
  $('#weather-block').hidden = s.showHomeWeather === false;
}
function renderTop() {
  if (!ui.state) return;
  const tabs = ui.state.tabs.map(tab => {
    const title = escapeHTML(tab.title || 'Home');
    const faviconImg = tab.favicon && /^https?:\/\//.test(tab.favicon)
      ? `<img class="tab-icon" src="${escapeHTML(tab.favicon)}" alt=""/>`
      : tab.url ? favicon(tab.url, tab.title, 'tab-favicon') : '<img class="tab-icon vinyl-outline" src="../assets/logo-outline.svg" alt=""/>';
    return `<div class="tab ${tab.id === ui.state.activeId ? 'active' : ''}" role="tab" tabindex="0" aria-selected="${tab.id === ui.state.activeId}" data-tab="${escapeHTML(tab.id)}" title="${title}">
      ${faviconImg}<span class="tab-title">${title}</span>
      <button class="tab-close" data-action="close-tab" data-id="${escapeHTML(tab.id)}" title="Close tab" aria-label="Close ${title}">${icon('x', 13)}</button>
    </div>`;
  }).join('');
  if (!tabDrag && ui.tabsMarkup !== tabs) { $('#tabs').innerHTML = tabs; ui.tabsMarkup = tabs; }
  const tab = active();
  $('#back').disabled = !tab?.canGoBack;
  $('#forward').disabled = !tab?.canGoForward;
  $('#reload').innerHTML = icon(tab?.loading ? 'stop' : 'reload', 17);
  $('#reload').title = tab?.loading ? 'Stop loading' : 'Reload page';
  $('#bookmark-current').disabled = !tab?.url;
  $('#bookmark-current').innerHTML = icon(tab?.url && activeBookmarks().some(bookmark => bookmark.url === tab.url) ? 'bookmarkFill' : 'bookmark', 17);
  const input = $('#address');
  if (document.activeElement !== input) input.value = tab?.url || '';
  $('#address-icon').innerHTML = icon(tab?.url?.startsWith('https://') ? 'lock' : 'search', 15);
  $('#google-profile').innerHTML = '<span class="google-letter">G</span>';
  $('#google-profile').title = 'Google account';
  $('#google-profile').setAttribute('aria-label','Google account');
  const onSettings = tab?.url === 'vinyl://settings';
  $('#home').style.display = tab?.url ? 'none' : 'block';
  if (!tab?.url && ui.homeTabId !== tab?.id) {
    ui.homeTabId = tab?.id;
    $('#home').classList.remove('home-enter');
    requestAnimationFrame(() => $('#home').classList.add('home-enter'));
  }
  $('#settings-page').hidden = !onSettings;
  if (onSettings) renderSettings();
  document.title = tab?.title && tab.title !== 'Home' ? `${tab.title} — Vinyl` : 'Vinyl';
  renderHomeShortcuts();
  renderRecentTabs();
  updateHomeClock();
}
function renderHomeShortcuts() {
  if (!ui.state) return;
  const pinned = activeBookmarks().filter(bookmark => bookmark.pinned).slice(0, 5);
  const defaults = [
    { title: 'Google', url: 'https://google.com/' },
    { title: 'YouTube', url: 'https://youtube.com/' },
    { title: 'Gmail', url: 'https://mail.google.com/' },
    { title: 'Drive', url: 'https://drive.google.com/' },
    { title: 'GitHub', url: 'https://github.com/' }
  ];
  const items = pinned.length ? pinned : defaults;
  const markup = items.map(bookmark => `<button class="shortcut" data-action="open-url" data-url="${escapeHTML(bookmark.url)}" title="${escapeHTML(bookmark.url)}"><span class="shortcut-icon">${favicon(bookmark.url, bookmark.title, 'home-favicon')}</span>${bookmark.title ? `<span>${escapeHTML(bookmark.title)}</span>` : ''}</button>`).join('');
  if ($('#home-shortcuts').innerHTML !== markup) $('#home-shortcuts').innerHTML = markup;
}
function updateHomeClock() {
  const now = new Date();
  const h = now.getHours();
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const greeting = $('#home-greeting');
  if (greeting) greeting.innerHTML = `Good ${period}, ${"Jack"}<span class="period">.</span>`;
  const time = new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).formatToParts(now);
  const hour = time.find(p=>p.type==='hour')?.value || '12';
  const min = time.find(p=>p.type==='minute')?.value || '00';
  $('#home-clock').textContent = `${hour}:${min}`;
  $('#home-ampm').textContent = time.find(p=>p.type==='dayPeriod')?.value || '';
  $('#home-date').textContent = new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(now);
}
function renderRecentTabs() {
  if (!$('#home-recents')) return;
  const recent = ui.state?.recentTabs || [];
  const markup = recent.slice(0,4).map(tab => `<button class="recent-card" data-action="open-recent" data-url="${escapeHTML(tab.url)}" title="${escapeHTML(tab.url)}">
    <div class="recent-preview">${tab.preview && tab.preview.startsWith('data:image/png;base64,') ? `<img class="recent-thumb" src="${escapeHTML(tab.preview)}" alt=""/>` : `<span class="recent-placeholder">${favicon(tab.url,tab.title,'home-favicon')}</span>`}</div>
    <div class="recent-caption">${favicon(tab.url,tab.title,'recent-site-icon')}<span>${escapeHTML(tab.title||hostname(tab.url))}</span></div>
  </button>`).join('');
  const empty = `<div class="home-empty recent-empty">Your recently visited pages will appear here.</div>`;
  const next = markup || empty;
  if ($('#home-recents').innerHTML !== next) $('#home-recents').innerHTML = next;
}
function renderNews() {
  const feed = ui.homeFeed;
  const items = feed?.news?.slice(0,4) || [];
  $('#home-news-items').innerHTML = Array.from({length:4},(_,i)=> {
    const item = items[i];
    if (!item) return '<div class="news-card news-unavailable"><span>'+(!feed ? 'Loading news…' : 'Story unavailable')+'</span></div>';
    const image = /^https:\/\//i.test(item.image || '') ? '<img class="news-image" src="'+escapeHTML(item.image)+'" alt="" referrerpolicy="no-referrer"/>' : '';
    return '<button class="news-card" data-action="open-url" data-url="'+escapeHTML(item.url)+'"><span class="news-photo"><span class="news-photo-fallback">Image unavailable</span>'+image+'</span><span class="news-card-copy"><span class="news-source">'+escapeHTML(item.source)+'</span><span class="news-copy">'+escapeHTML(item.title)+'</span></span></button>';
  }).join('');
}
function weatherType(code,isDay = true) {
  if (code >= 95) return 'storm';
  if ([71,73,75,77,85,86].includes(code)) return 'snow';
  if (code >= 51) return 'rain';
  if ([45,48].includes(code)) return 'fog';
  if (code === 3) return 'cloud';
  if (code === 2) return 'partly';
  return isDay ? 'sun' : 'moon';
}
function weatherSymbol(code,isDay = true) {
  const type = weatherType(code,isDay);
  const sun = '<g class="symbol-sun"><circle cx="38" cy="31" r="17"/><path d="M38 5v-4M38 61v-5M12 31H6M70 31h-6M19 12l-4-4M57 50l4 4M57 12l4-4M19 50l-4 4"/></g>';
  const moon = '<path class="symbol-moon" d="M52 10a25 25 0 1 0 20 36A26 26 0 0 1 52 10Z"/>';
  const cloud = '<path class="symbol-cloud" d="M25 59a15 15 0 1 1 2-30 23 23 0 0 1 43-1 16 16 0 1 1 9 31Z"/>';
  let art = type === 'sun' ? sun : type === 'moon' ? moon : (type === 'partly' ? (isDay ? sun : moon) : '')+cloud;
  if(type==='rain') art += '<path class="symbol-rain" d="m32 66-4 8m23-8-4 8m23-8-4 8"/>';
  if(type==='snow') art += '<g class="symbol-snow"><path d="M34 65v14m-6-10 12 7m-12 0 12-7M65 65v14m-6-10 12 7m-12 0 12-7"/></g>';
  if(type==='storm') art += '<path class="symbol-lightning" d="m51 47-15 22h12l-4 16 23-28H54l6-10Z"/>';
  if(type==='fog') art += '<path class="symbol-fog" d="M18 67h62M26 75h50"/>';
  return '<svg class="weather-symbol '+type+'" viewBox="0 0 100 86" aria-hidden="true">'+art+'</svg>';
}
const weatherValue = value => Number.isFinite(value) ? String(value) : '—';
function renderWeather() {
  const target = $('#home-weather-content');
  const feed = ui.homeFeed;
  if (!feed?.weatherLocation) {target.innerHTML='<div class="weather-setup">'+weatherSymbol(2)+'<button class="weather-empty" data-action="weather-location">Choose city</button></div>';return;}
  if (!feed.weather) {target.innerHTML='<div class="home-empty">'+(feed.weatherError ? 'Weather unavailable.' : 'Loading weather…')+'</div><button class="weather-change" data-action="weather-location">'+escapeHTML(feed.weatherLocation.name)+'</button>';return;}
  const w=feed.weather;
  $('#weather-block').dataset.weather = weatherType(w.code,w.isDay);
  target.innerHTML = '<div class="weather-current"><div class="weather-reading"><span class="weather-degrees">'+weatherValue(w.temperature)+'°</span><div class="weather-condition">'+escapeHTML(w.condition)+'</div><div class="weather-meta">H '+weatherValue(w.high)+'° · L '+weatherValue(w.low)+'°</div></div>'+weatherSymbol(w.code,w.isDay)+'</div><div class="weather-bottom"><button class="weather-change" data-action="weather-location">'+escapeHTML(w.city)+'</button><div class="weather-views"><button data-action="weather-extended" data-view="hourly">Hourly</button><button data-action="weather-extended" data-view="daily">7 days</button></div></div>';
}
function showWeatherView(view) {
  const w=ui.homeFeed?.weather;
  if(!w) return;
  const hourly=view==='hourly';
  const rows = (hourly ? w.hourly : w.daily) || [];
  const markup = rows.map(item=> {
    const label = hourly ? new Date(item.time).toLocaleTimeString('en-US',{hour:'numeric'}) : new Date(item.time+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    return '<div class="forecast-item"><span class="forecast-time">'+escapeHTML(label)+'</span>'+weatherSymbol(item.code,hourly?item.isDay:true)+'<strong>'+(hourly ? weatherValue(item.temperature)+'°' : weatherValue(item.high)+'° <span class="forecast-low">'+weatherValue(item.low)+'°</span>')+'</strong><span class="forecast-rain">'+weatherValue(item.rain)+'% precip.</span></div>';
  }).join('');
  $('#modal-root').innerHTML='<div class="modal-backdrop"><section class="modal weather-dialog" role="dialog" aria-modal="true" aria-labelledby="forecast-heading"><div class="forecast-head"><div><h2 id="forecast-heading">'+(hourly?'Hourly forecast':'7-day forecast')+'</h2><p>'+escapeHTML(w.city)+'</p></div><button class="icon-button" data-modal-cancel aria-label="Close forecast">'+icon('x')+'</button></div><div class="forecast-grid '+(hourly?'hourly':'daily')+'">'+(markup || '<p>Forecast unavailable.</p>')+'</div><div class="weather-details">Feels like '+weatherValue(w.feelsLike)+'° · Wind '+weatherValue(w.wind)+' mph · Humidity '+weatherValue(w.humidity)+'%</div></section></div>';
  $('.modal-backdrop').addEventListener('click',event=>{if(event.target===event.currentTarget || event.target.closest('[data-modal-cancel]')) closeModal();});
  $('[data-modal-cancel]').focus();
}
async function loadHomeFeed(force = false) {
  if (!window.vinyl || (!force && ui.homeLoadedAt && Date.now()-ui.homeLoadedAt < 15*60000)) return;
  ui.homeLoadedAt=Date.now();
  try {ui.homeFeed = await invoke('home:feed',{force});renderNews();renderWeather();}
  catch {ui.homeFeed={news:[],weather:null,newsError:'Feed unavailable'};renderNews();renderWeather();}
}
function setShelf(section = 'bookmarks', open = true) {
  if (settings().shelfEnabled === false) { toast('Enable the shelf in Settings → Browser.'); return; }
  ui.section = section === 'toggles' ? 'toggles' : 'bookmarks';
  ui.shelfOpen = open;
  run('window:shelf',{open,section:ui.section}).catch(() => {});
  applyAppearance();
  $('#shelf-heading').textContent = ui.section === 'toggles' ? 'Toggles' : 'Bookmarks';
  renderShelf();
  requestAnimationFrame(updateLayout);
}
function toggleShelf() { setShelf('bookmarks', !ui.shelfOpen || ui.section !== 'bookmarks'); }
function renderShelf() {
  if (!ui.state) return;
  const target = $('#shelf-content');
  const selected = document.activeElement;
  const preserve = selected?.id === 'shelf-search';
  const cursor = preserve ? selected.selectionStart : 0;
  $('#shelf-heading').textContent = ui.section === 'toggles' ? 'Toggles' : 'Bookmarks';
  $('.shelf-sections').querySelectorAll('button').forEach(button => {button.classList.toggle('selected',button.dataset.section===ui.section);button.setAttribute('aria-pressed',String(button.dataset.section===ui.section));});
  $('#toggles-open').setAttribute('aria-expanded',String(ui.shelfOpen && ui.section==='toggles'));
  const markup = ui.section === 'toggles' ? '<div class="toggles-empty">No toggles added.</div>' : bookmarksHTML();
  if (ui.shelfMarkup === markup) return;
  ui.shelfMarkup = markup; target.innerHTML = markup;
  if (preserve) {
    const updated = $(`#${selected.id}`);
    updated?.focus();
    if (updated) updated.setSelectionRange(cursor, cursor);
  }
}
function appTile(node) {
  const isFolder = Array.isArray(node.children);
  const readOnly = node.source === 'chrome';
  const accessibleName = node.title || hostname(node.url) || 'Folder';
  return `<div class="app-tile-wrap" ${readOnly ? '' : `draggable="true" data-drag-id="${escapeHTML(node.id)}"`}>
    <button class="app-tile" data-action="${isFolder ? 'open-folder' : 'open-bookmark'}" data-id="${escapeHTML(node.id)}" aria-label="${escapeHTML(accessibleName)}" title="${escapeHTML(accessibleName)}${readOnly ? ' · Chrome (read-only)' : ''}">
      <span class="app-tile-icon">${isFolder ? icon('folder',25) : favicon(node.url,node.title,'pin-image')}</span>
      ${node.title ? `<span class="app-tile-label">${escapeHTML(node.title)}</span>` : ''}
    </button>
    <button class="app-tile-more" data-action="bookmark-menu" data-id="${escapeHTML(node.id)}" title="Actions for ${escapeHTML(accessibleName)}" aria-label="Actions for ${escapeHTML(accessibleName)}">${icon('more',14)}</button>
  </div>`;
}
function bookmarksHTML() {
  const search = ui.bookmarkSearch.trim().toLowerCase();
  const folder = currentFolder();
  if (ui.folderId && !folder) ui.folderId = null;
  const shown = search ? activeBookmarks().filter(item => `${item.title} ${item.url}`.toLowerCase().includes(search)) : (folder?.node.children || ui.state.bookmarks);
  let body = `<div class="shelf-tools"><label class="search-mini">${icon('search',15)}<input id="shelf-search" type="search" value="${escapeHTML(ui.bookmarkSearch)}" placeholder="Search" aria-label="Search bookmarks"/></label><button class="mini-button" data-action="add-bookmark" title="Add bookmark">${icon('plus',18)}</button></div>`;
  if (folder && !search) body += `<div class="breadcrumb"><button data-action="folder-root">Bookmarks</button>${folder.chain.map(f => `${icon('chevron',11)}<button data-action="open-folder" data-id="${escapeHTML(f.id)}">${escapeHTML(f.title)}</button>`).join('')}</div>`;
  if (shown.length) body += `<div class="app-grid">${shown.map(appTile).join('')}</div>`;
  else body += `<div class="app-empty">${search ? 'No results' : 'No bookmarks'}<button class="text-button" data-action="${search ? 'clear-bookmark-search' : 'open-chrome-settings'}">${search ? 'Clear search' : 'Connect Chrome'}</button></div>`;
  return body;
}
const settingRows = [
  ['Appearance',
    { key:'theme', title:'Theme', detail:'Use your preferred appearance', options:[['system','System'],['light','Light'],['dark','Dark']] },
    { key:'accent', title:'Accent color', detail:'Used for selected controls', options:[['blue','Blue'],['sage','Sage'],['graphite','Graphite'],['violet','Violet']] },
    { key:'roundedPanels', title:'Rounded controls', detail:'Soft corners for the interface' },
    { key:'softShadows', title:'Soft shadows', detail:'Subtle depth on floating elements' },
    { key:'largeText', title:'Larger labels', detail:'Increase the size of shelf text' },
    { key:'reduceMotion', title:'Reduce motion', detail:'Disable interface animations' }
  ],
  ['Browser',
    { key:'searchEngine', title:'Search engine', detail:'Used when typing a search in the address bar', options:[['google','Google'],['duckduckgo','DuckDuckGo'],['bing','Bing']] },
    { key:'defaultZoom', title:'Page zoom', detail:'Default zoom for open pages', options:[[75,'75%'],[80,'80%'],[90,'90%'],[100,'100%'],[110,'110%'],[125,'125%'],[150,'150%']] },
    { key:'spellcheck', title:'Spell checking', detail:'Check English spelling on webpages' },
    { key:'shelfEnabled', title:'Bookmark shelf', detail:'Show the integrated bookmarks drawer' },
    { key:'autoCloseShelf', title:'Close after opening', detail:'Collapse the shelf after you open a bookmark' },
    { key:'compactTabs', title:'Compact tabs', detail:'Slightly smaller tabs' },
    { key:'addressBarMode', title:'Controls size', detail:'Use the bottom drawer handle to show or hide controls', options:[['always','Standard'],['compact','Compact']] },
    { key:'showLabels', title:'App labels', detail:'Display titles below shelf icons' },
    { key:'showHomeShortcuts', title:'Home shortcuts', detail:'Show your favorite websites on Home' },
    { key:'showRecentTabs', title:'Recent tabs', detail:'Show four recently visited pages on Home' },
    { key:'showHomeNews', title:'News on Home', detail:'Load current headlines from BBC News' },
    { key:'showHomeWeather', title:'Weather on Home', detail:'Display current weather for your chosen city' }
  ],
  ['Privacy',
    { key:'doNotTrack', title:'Do Not Track request', detail:'Send a request to websites; websites may ignore it' }
  ]
];
function settingRow(item) {
  const current = settings();
  return `<div class="setting-row"><div class="setting-info"><div class="setting-title">${escapeHTML(item.title)}</div><div class="setting-detail">${escapeHTML(item.detail)}</div></div>${item.options ? `<select class="setting-select" data-setting="${item.key}" aria-label="${escapeHTML(item.title)}">${item.options.map(([value,label]) => `<option value="${value}" ${String(current[item.key]) === String(value) ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}</select>` : `<button role="switch" aria-checked="${Boolean(current[item.key])}" aria-label="${escapeHTML(item.title)}" class="switch ${current[item.key] ? 'on' : ''}" data-action="toggle-setting" data-setting="${item.key}"></button>`}</div>`;
}
function renderSettings() {
  if (active()?.url !== 'vinyl://settings') return;
  const section = ui.settingsSection;
  $('#settings-nav').querySelectorAll('[data-settings-section]').forEach(button => button.classList.toggle('current', button.dataset.settingsSection === section));
  const main = $('#settings-main');
  if (['appearance','browser','privacy'].includes(section)) {
    const group = settingRows.find(([title]) => title.toLowerCase() === section);
    main.innerHTML = `<h1 class="settings-title">${group[0]}</h1><div class="settings-lead">${section === 'appearance' ? 'Theme, colors, and display options.' : section === 'browser' ? 'Everyday browsing preferences.' : 'Site permissions are requested as websites need them.'}</div><div class="settings-group">${group.slice(1).map(settingRow).join('')}</div>${section === 'privacy' ? `<div class="settings-fineprint">Vinyl's prototype browser does not yet include every Chrome security and privacy option. It will not claim to enforce protections that aren't implemented.</div>` : ''}`;
  } else if (section === 'account') {
    main.innerHTML = googleAccountSettings();
  } else if (section === 'chrome') {
    const chrome = ui.state.chrome || { profiles:[], linkedProfile:null, bookmarkCount:0,extensionCount:0 };
    const linked = chrome.profiles.find(p => p.id === chrome.linkedProfile);
    if (!ui.selectedChromeProfile || !chrome.profiles.some(p => p.id === ui.selectedChromeProfile)) ui.selectedChromeProfile = chrome.linkedProfile || chrome.profiles[0]?.id || '';
    const profiles = chrome.profiles.length ? `<select class="setting-select profile-select" id="chrome-profile" aria-label="Chrome profile">${chrome.profiles.map(p => `<option value="${escapeHTML(p.id)}" ${ui.selectedChromeProfile === p.id ? 'selected' : ''}>${escapeHTML(p.name)} (${escapeHTML(p.id)})</option>`).join('')}</select><button class="settings-action primary-button" data-action="link-chrome">${linked ? 'Switch profile' : 'Link profile'}</button>` : `<span class="settings-muted">Chrome wasn't found on this computer.</span>`;
    main.innerHTML = `<h1 class="settings-title">Chrome data</h1><div class="settings-lead">Bring your existing Chrome bookmarks into Vinyl.</div>
      <div class="settings-group"><div class="setting-row"><div class="setting-info"><div class="setting-title">Chrome profile</div><div class="setting-detail">Choose a profile to import or view bookmarks without changing Chrome.</div></div><div class="settings-inline">${profiles}</div></div>
      ${linked ? `<div class="setting-row"><div class="setting-info"><div class="setting-title">${escapeHTML(linked.name)}</div><div class="setting-detail">${chrome.bookmarkCount} items in the linked collection ${chrome.error ? `· ${escapeHTML(chrome.error)}` : ''}</div></div><div class="settings-inline"><button class="settings-action" data-action="refresh-chrome">Refresh</button><button class="settings-action" data-action="unlink-chrome">Unlink</button></div></div>` : ''}
      <div class="setting-row"><div class="setting-info"><div class="setting-title">Import from Chrome</div><div class="setting-detail">Copy bookmarks and folders into an editable Vinyl folder.</div></div><button class="settings-action primary-button" data-action="import-chrome" ${chrome.profiles.length ? '' : 'disabled'}>Import</button></div>
      <div class="setting-row"><div class="setting-info"><div class="setting-title">Import bookmarks HTML</div><div class="setting-detail">Use a Chrome-exported HTML file, including from another computer.</div></div><button class="settings-action" data-action="import-html">Choose file</button></div></div>
      <div class="settings-fineprint">Chrome remains unchanged. Importing again creates another folder. Cookies, passwords, and active Chrome extensions are not imported.</div>`;
  } else {
    main.innerHTML = `<h1 class="settings-title">About Vinyl</h1><div class="settings-lead">Standalone Chromium-powered desktop browser prototype.</div><div class="settings-group"><div class="setting-row"><div class="setting-info"><div class="setting-title">Vinyl</div><div class="setting-detail">Version ${escapeHTML(ui.state.updates?.version || '0.6.0')} — prototype</div></div></div><div class="setting-row"><div class="setting-info"><div class="setting-title">Browser engine</div><div class="setting-detail">Electron Chromium runtime. This is not yet a source-level Chromium fork.</div></div></div><div class="setting-row"><div class="setting-info"><div class="setting-title">Chrome compatibility</div><div class="setting-detail">Native extensions are not supported in Vinyl; future integrations will be browser features.</div></div></div></div>${updateSettingsHTML()}`;
  }
}
function googleAccountSettings() {
  return '<h1 class="settings-title">Google account</h1><div class="settings-lead">Sign in to Google in a Vinyl tab.</div><div class="settings-group"><div class="setting-row"><div class="setting-info"><div class="setting-title">Google</div><div class="setting-detail">Google websites share your saved browsing session in Vinyl.</div></div><button class="settings-action primary-button" data-action="google-website" data-site="google">Sign in to Google</button></div><div class="setting-row"><div class="setting-info"><div class="setting-title">Google websites</div></div><div class="settings-inline"><button class="settings-action" data-action="google-website" data-site="gmail">Gmail</button><button class="settings-action" data-action="google-website" data-site="youtube">YouTube</button></div></div></div><p class="settings-fineprint">Google may restrict sign-in in this browser. Chrome browser sign-in and Sync are unavailable in Vinyl.</p>';
}
function updateSettingsHTML() {
  const updates = ui.state?.updates || {state:'unconfigured',message:'Updates are not configured.',version:''};
  const ready = updates.state === 'ready';
  const busy = updates.state === 'downloading' || updates.state === 'checking';
  const progress = Math.max(0, Math.min(100, Math.round(Number(updates.progress) || 0)));
  const progressDisplay = updates.state === 'downloading'
    ? `<div class="update-progress" role="progressbar" aria-label="Downloading update" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="update-progress-fill" style="width:${progress}%"></div></div>`
    : '';
  const control = ready
    ? `<button class="settings-action primary-button" data-action="update-install">Restart to update</button>`
    : `<button class="settings-action" data-action="update-check" ${busy || updates.state === 'unconfigured' ? 'disabled' : ''}>${busy ? (updates.state === 'downloading' ? `${progress}%` : 'Checking…') : 'Check now'}</button>`;
  return `<h2 class="settings-subtitle">Software updates</h2>
    <div class="settings-group"><div class="setting-row"><div class="setting-info">
      <div class="setting-title">Vinyl ${escapeHTML(updates.version || '')}</div>
      <div class="setting-detail" aria-live="polite">${escapeHTML(updates.message)}</div>${progressDisplay}
      </div>${control}</div></div>
    <div class="settings-fineprint">Vinyl checks for new builds at startup and every five minutes, then downloads them automatically. When a download finishes, select Restart to update. Your bookmarks and browser data are preserved.</div>`;
}
function hideToolbar() {
  if ($('.toolbar').contains(document.activeElement)) $('#dock-handle').focus({preventScroll:true});
  ui.dockHidden = true;
  applyAppearance(); requestAnimationFrame(updateLayout);
}
function revealToolbar() {
  ui.dockHidden = false;
  applyAppearance(); requestAnimationFrame(updateLayout);
}
function toggleToolbar() { if (ui.dockHidden) revealToolbar(); else hideToolbar(); }
function updateLayout() {
  if (!window.vinyl || !ui.state || shelfSurface) return;
  const bounds = $('#pageViewport').getBoundingClientRect();
  const payload = { x:Math.round(bounds.x), y:Math.round(bounds.y), width:Math.round(bounds.width), height:Math.round(bounds.height) };
  const serialized = JSON.stringify(payload);
  if (serialized === lastLayout) return;
  lastLayout = serialized;
  invoke('browser:layout', payload).catch(() => {});
}
function render() {
  if (typeof ui.state?.shelfOpen === 'boolean') ui.shelfOpen = ui.state.shelfOpen;
  if (ui.state?.shelfSection) ui.section = ui.state.shelfSection;
  applyAppearance();
  if (!shelfSurface) renderTop();
  renderShelf();
  requestAnimationFrame(updateLayout);
}
function closeMenu() { $('#context-menu').classList.add('hidden'); ui.contextId = null; }
function bookmarkContext(id, e) {
  const book = locateBookmark(id);
  if (!book) return;
  ui.contextId = id;
  const actions = book.source === 'chrome' ? [['open-bookmark-new', 'Open in new tab', 'arrow']] : book.url ? [
    ['open-bookmark-new', 'Open in new tab', 'arrow'],
    ['pin-bookmark', book.pinned ? 'Unpin from favorites' : 'Pin to favorites', 'pin'],
    ['edit-bookmark', 'Edit bookmark', 'edit'],
    ['delete-bookmark', 'Delete bookmark', 'trash']
  ] : [ ['edit-bookmark','Rename folder','edit'],['delete-bookmark','Delete folder','trash'] ];
  const menu = $('#context-menu');
  menu.innerHTML = actions.map(([action,title,img]) => `<button class="${action === 'delete-bookmark' ? 'danger' : ''}" data-action="${action}" data-id="${escapeHTML(id)}">${icon(img,15)}${escapeHTML(title)}</button>`).join('');
  menu.style.left = `${Math.max(8, Math.min(innerWidth - 200,e.clientX))}px`;
  menu.style.top = `${Math.max(8, Math.min(innerHeight - actions.length * 37 - 15,e.clientY))}px`;
  menu.classList.remove('hidden');
}
function locateBookmark(id, items = ui.state?.bookmarks || []) {
  for (const b of items) { if (b.id === id) return b; if (b.children) { const found = locateBookmark(id,b.children); if (found) return found; } }
  return null;
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function modal({title,description, fields = [], submitLabel = 'Save', destructive = false, onSubmit}) {
  const fieldMarkup = fields.map(field => `<label class="form-label" for="field-${field.key}">${escapeHTML(field.label)}</label><input class="form-input" id="field-${field.key}" name="${field.key}" value="${escapeHTML(field.value || '')}" ${field.required ? 'required' : ''} ${field.type === 'url' ? 'type="text"' : 'type="text"'} placeholder="${escapeHTML(field.placeholder || '')}"/>`).join('');
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><form class="modal"><div class="modal-title">${escapeHTML(title)}</div><p class="modal-help">${escapeHTML(description)}</p>${fieldMarkup}<div class="modal-actions"><button type="button" data-modal-cancel>Cancel</button><button type="submit" class="primary-button" ${destructive ? 'style="background:#b94850;border-color:#b94850"' : ''}>${escapeHTML(submitLabel)}</button></div></form></div>`;
  const backdrop = $('.modal-backdrop');
  backdrop.addEventListener('click', event => { if (event.target === backdrop || event.target.closest('[data-modal-cancel]')) closeModal(); });
  backdrop.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await onSubmit(data); closeModal(); } catch (error) { toast(error.message || 'Could not save changes'); }
  });
  backdrop.querySelector('input')?.focus();
}
function modalAddBookmark(existing = null) {
  const current = active();
  modal({
    title: existing ? 'Edit bookmark' : 'Add bookmark',
    description: existing ? 'Change the name or website address.' : 'Add a website to your shelf.',
    fields: [
      {key:'title',label:'Name',value:existing?.title || (current?.url ? current.title : ''),placeholder:'Website name',required:true},
      {key:'url',label:'Website address',value:existing?.url || current?.url || '',placeholder:'https://example.com',required:true}
    ],
    submitLabel: existing ? 'Save changes' : 'Add bookmark',
    onSubmit: async data => {
      const url = normalizedBookmark(data.url);
      if (existing) await run('bookmark:update', {id:existing.id,title:data.title,url}, 'Bookmark updated');
      else await run('bookmark:add', { title:data.title,url,folderId:ui.folderId }, 'Bookmark added');
    }
  });
}
function normalizedBookmark(value) {
  const text = String(value || '').trim();
  const url = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error('Enter a valid website address');
  return parsed.href;
}
function modalFolder(existing = null) {
  modal({ title:existing ? 'Rename folder' : 'New folder', description:'Enter a folder name.', fields:[{key:'title',label:'Folder name',value:existing?.title || '',placeholder:'My bookmarks',required:true}],submitLabel:existing ? 'Save changes':'Create folder', onSubmit:data => existing ? run('bookmark:update',{id:existing.id,title:data.title},'Folder renamed') : run('bookmark:addFolder',{title:data.title,folderId:ui.folderId},'Folder created') });
}
function modalDelete(item) {
  modal({title:`Delete ${item.children ? 'folder' : 'bookmark'}?`,description:item.children ? `“${item.title}” and everything inside it will be removed from Vinyl.`:`“${item.title}” will be removed from your bookmarks.`,submitLabel:'Delete',destructive:true,onSubmit:()=>run('bookmark:remove',{id:item.id},'Bookmark removed')});
}
async function openBookmark(id, newTab = false) {
  await run('bookmark:open', {id,newTab});
  if (settings().autoCloseShelf) setShelf(ui.section,false);
}
async function executeAction(button, event) {
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action !== 'bookmark-menu') closeMenu();
  try {
    switch(action) {
      case 'shelf-section': return setShelf(button.dataset.section,true);
      case 'weather-extended': return showWeatherView(button.dataset.view);
      case 'close-tab': return run('browser:close',{id});
      case 'open-url': await run('browser:navigate',{address:button.dataset.url}); if (settings().autoCloseShelf) setShelf(ui.section,false); return;
      case 'open-bookmark': return openBookmark(id, event.ctrlKey || event.metaKey || event.button === 1);
      case 'open-bookmark-new': return openBookmark(id,true);
      case 'open-folder': ui.folderId = id; ui.bookmarkSearch=''; renderShelf(); return;
      case 'folder-root': ui.folderId = null; renderShelf(); return;
      case 'bookmark-menu': return bookmarkContext(id,event);
      case 'add-bookmark': return modalAddBookmark();
      case 'add-folder': return modalFolder();
      case 'edit-bookmark': { const item = locateBookmark(id); return item?.children ? modalFolder(item) : modalAddBookmark(item); }
      case 'pin-bookmark': return run('bookmark:pin',{id},'Favorites updated');
      case 'delete-bookmark': return modalDelete(locateBookmark(id));
      case 'clear-bookmark-search': ui.bookmarkSearch = ''; renderShelf(); return;
      case 'open-chrome-settings': { ui.settingsSection = 'chrome'; setShelf(ui.section,false); await run('browser:openSettings',{section:'chrome'}); return; }
      case 'link-chrome': return run('chrome:link',{profileId:ui.selectedChromeProfile},'Chrome profile linked');
      case 'unlink-chrome': return run('chrome:unlink',null,'Chrome profile unlinked');
      case 'refresh-chrome': return run('chrome:refresh',null,'Chrome data refreshed');
      case 'google-profile': return run('google:openWebsite',{site:'google'});
      case 'google-website': return run('google:openWebsite',{site:button.dataset.site});
      case 'update-check': return run('updates:check');
      case 'update-install': return run('updates:install');
      case 'import-chrome': { const count=await run('bookmark:importChrome',{profileId:ui.selectedChromeProfile}); if (count) toast(`${count} bookmarks imported`); return; }
      case 'import-html': { const count=await run('bookmark:importHTML'); if (count) toast(`${count} bookmarks imported`); return; }
      case 'weather-location': return modal({title:'Weather location',description:'Choose the city shown on your start page.',fields:[{key:'city',label:'City',value:ui.homeFeed?.weatherLocation?.name || '',placeholder:'e.g. Allentown, Pennsylvania',required:true}],submitLabel:'Save city',onSubmit:async ({city})=>{ui.homeFeed=await run('home:setWeatherCity',{city});renderWeather();}});
      case 'refresh-news': return loadHomeFeed(true);
      case 'open-recent': return run('browser:navigate',{address:button.dataset.url});
      case 'toggle-setting': return run('settings:set',{key:button.dataset.setting,value:!settings()[button.dataset.setting]});
    }
  } catch { /* Errors are shown in the toast. */ }
}
function focusAddress() {
  revealToolbar();
  requestAnimationFrame(() => { $('#address').focus({preventScroll:true}); $('#address').select(); });
}
function bindEvents() {
  $('#newtab').innerHTML = icon('plus',17);
  $('#back').innerHTML = icon('back',18);
  $('#forward').innerHTML = icon('forward',18);
  $('#reload').innerHTML = icon('reload',18);
  $('#close-shelf').innerHTML = icon('x',17);
  $('#shelf-open').innerHTML = icon('bookmark',18);
  $('#toggles-open').innerHTML = icon('sliders',18);
  $('#toggles-open').addEventListener('click',()=>setShelf('toggles',!ui.shelfOpen || ui.section !== 'toggles'));
  $('#more-menu').innerHTML = icon('settings',18);
  $('#window-min').innerHTML = icon('minimize',15);
  $('#window-max').innerHTML = icon('maximize',13);
  $('#window-close').innerHTML = icon('x',14);
  $('#home-search-icon').innerHTML = icon('search',20);

  $('#newtab').addEventListener('click', () => run('browser:newTab').then(() => $('#home-address').focus()).catch(() => {}));
  $('#back').addEventListener('click', () => run('browser:back').catch(() => {}));
  $('#forward').addEventListener('click', () => run('browser:forward').catch(() => {}));
  $('#reload').addEventListener('click', () => run(active()?.loading ? 'browser:stop' : 'browser:reload').catch(() => {}));
  $('#bookmark-current').addEventListener('click', () => run('browser:bookmarkCurrent',null,'Bookmark added').catch(() => {}));
  $('#shelf-open').addEventListener('click', toggleShelf);
  $('#close-shelf').addEventListener('click', () => setShelf(ui.section,false));
  $('#more-menu').addEventListener('click', () => { setShelf(ui.section,false); run('browser:openSettings').catch(() => {}); });
  $('#dock-handle').innerHTML = '<span class="drawer-grip"></span>'+icon('chevron',13);
  $('#dock-handle').addEventListener('click', toggleToolbar);
  $('#address').addEventListener('focus', revealToolbar);
  $('#window-min').addEventListener('click', () => run('window:minimize').catch(() => {}));
  $('#window-max').addEventListener('click', () => run('window:maximize').catch(() => {}));
  $('#window-close').addEventListener('click', () => run('window:close').catch(() => {}));
  $('#tabs').addEventListener('click', event => {
    if (event.target.closest('[data-action]') || ui.suppressTabClick) return;
    const tab = event.target.closest('[data-tab]');
    if (tab) run('browser:activate',{id:tab.dataset.tab}).catch(() => {});
  });
  $('#tabs').addEventListener('dragstart', event => event.preventDefault());
  $('#tabs').addEventListener('pointerdown', event => {
    const tab = event.target.closest('[data-tab]');
    if (event.button !== 0 || !tab || event.target.closest('button')) return;
    tabDrag = {id:tab.dataset.tab, startX:event.clientX, startY:event.clientY, pointerId:event.pointerId, moved:false};
    $('#tabs').setPointerCapture(event.pointerId);
  });
  $('#tabs').addEventListener('pointermove', event => {
    if (!tabDrag) return;
    if (Math.hypot(event.clientX-tabDrag.startX,event.clientY-tabDrag.startY) < 6 && !tabDrag.moved) return;
    tabDrag.moved = true;
    document.body.classList.add('tab-dragging');
    const strip = $('#tabs').getBoundingClientRect();
    if (event.clientX < strip.left+30) $('#tabs').scrollLeft -= 16;
    if (event.clientX > strip.right-30) $('#tabs').scrollLeft += 16;
    const target = [...$('#tabs').children].find(el => el.dataset.tab !== tabDrag.id && event.clientX < el.getBoundingClientRect().x + el.getBoundingClientRect().width/2);
    document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
    target?.classList.add('drop-before');
    tabDrag.beforeId = target?.dataset.tab || null;
    const outside = event.clientY > strip.bottom+35 || event.clientY < -20 || event.clientX < -25 || event.clientX > innerWidth+25;
    document.body.classList.toggle('tab-detaching',outside);
    tabDrag.outside = outside;
  });
  const endTabDrag = async (event,cancel = false) => {
    if (!tabDrag) return;
    const drag = tabDrag; tabDrag = null;
    if ($('#tabs').hasPointerCapture(drag.pointerId)) $('#tabs').releasePointerCapture(drag.pointerId);
    document.body.classList.remove('tab-dragging','tab-detaching');
    document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
    if (drag.moved && !cancel) {
      ui.suppressTabClick = true;
      setTimeout(() => {ui.suppressTabClick = false;},100);
      await run(drag.outside ? 'browser:detach' : 'browser:reorder', {id:drag.id,beforeId:drag.beforeId,x:event.screenX,y:event.screenY}).catch(() => {});
    }
    renderTop();
  };
  $('#tabs').addEventListener('pointerup', event => endTabDrag(event));
  $('#tabs').addEventListener('pointercancel', event => endTabDrag(event,true));
  $('#tabs').addEventListener('keydown', event => {
    const tab = event.target.closest('[data-tab]');
    if (!tab || event.target.closest('button')) return;
    if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();run('browser:activate',{id:tab.dataset.tab}).catch(()=>{});}
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const index = ui.state.tabs.findIndex(t => t.id === tab.dataset.tab);
      const target = event.key === 'ArrowLeft' ? Math.max(0,index-1) : Math.min(ui.state.tabs.length,index+2);
      run('browser:reorder',{id:tab.dataset.tab,beforeId:ui.state.tabs[target]?.id || null}).catch(()=>{});
    }
  });
  $('#address').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); run('browser:navigate',{address:event.currentTarget.value}).then(() => $('#address').blur()).catch(() => {}); }
    if (event.key === 'Escape') { event.currentTarget.value = active()?.url || ''; event.currentTarget.blur(); }
  });
  $('#home-address').addEventListener('keydown', event => {
    if (event.key === 'Enter') run('browser:navigate',{address:event.currentTarget.value}).catch(() => {});
  });
  $('#shelf-content').addEventListener('input', event => {
    if (event.target.id === 'shelf-search') { ui.bookmarkSearch = event.target.value; renderShelf(); }
  });
  document.addEventListener('change', event => {
    const select = event.target.closest('[data-setting]');
    if (select?.tagName === 'SELECT') {
      const value = select.dataset.setting === 'defaultZoom' ? Number(select.value) : select.value;
      run('settings:set',{key:select.dataset.setting,value}).catch(() => {});
    }
    if (event.target.id === 'chrome-profile') ui.selectedChromeProfile = event.target.value;
  });
  $('#settings-nav').addEventListener('click', event => {
    const section = event.target.closest('[data-settings-section]')?.dataset.settingsSection;
    if (section) { ui.settingsSection = section; renderSettings(); $('#settings-scroll').scrollTop = 0; }
  });
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]');
    if (action) { event.preventDefault(); executeAction(action,event); return; }
    if (!event.target.closest('#context-menu')) closeMenu();
  });
  document.addEventListener('contextmenu', event => {
    const item = event.target.closest('.app-tile-wrap');
    const bookmark = item?.querySelector('[data-action="open-bookmark"], [data-action="open-folder"]');
    if (bookmark) { event.preventDefault(); bookmarkContext(bookmark.dataset.id,event); return; }
  });
  document.addEventListener('error', event => {
    if (event.target.matches?.('.news-image')) {event.target.remove();return;}
    if (event.target.tagName === 'IMG' && event.target.closest('.pin-image,.favicon,.home-favicon,.tab-favicon,.recent-thumb')) {
      const img = event.target;
      if (img.dataset.fallback) { img.src=img.dataset.fallback;img.dataset.fallback=img.dataset.fallbackLast || '';img.dataset.fallbackLast=''; }
      else img.remove();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeMenu(); closeModal(); if (tabDrag) endTabDrag(event,true);  }
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'h' && event.shiftKey) { event.preventDefault(); hideToolbar(); }
      else if (event.key.toLowerCase() === 'b' && event.shiftKey) { event.preventDefault(); setShelf('bookmarks',!ui.shelfOpen || ui.section !== 'bookmarks'); }
      else if (event.key.toLowerCase() === 'l') { event.preventDefault(); focusAddress(); }
    }
  });
  document.addEventListener('dragstart', event => {
    const item = event.target.closest('[data-drag-id]');
    if (item && event.dataTransfer) { event.dataTransfer.setData('text/vinyl-bookmark', item.dataset.dragId); event.dataTransfer.effectAllowed = 'move'; }
  });
  document.addEventListener('dragover', event => { if (event.target.closest('[data-drag-id]') && event.dataTransfer?.types.includes('text/vinyl-bookmark')) event.preventDefault(); });
  document.addEventListener('drop', event => {
    const target = event.target.closest('[data-drag-id]');
    const dragged = event.dataTransfer?.getData('text/vinyl-bookmark');
    if (!target || !dragged || target.dataset.dragId === dragged) return;
    event.preventDefault();
    const destination = locateBookmark(target.dataset.dragId);
    let folderId = destination?.children ? destination.id : ui.folderId;
    let position = null;
    if (!destination?.children) {
      const siblings = currentFolder()?.node.children || ui.state.bookmarks;
      position = siblings.findIndex(item => item.id === target.dataset.dragId);
      const sourceIndex = siblings.findIndex(item => item.id === dragged);
      if (sourceIndex >= 0 && sourceIndex < position) position -= 1;
      if (position < 0) position = null;
    }
    run('bookmark:move',{id:dragged,folderId,position}).catch(() => {});
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyAppearance);
  const splash = $('#launch-splash');
  if (shelfSurface) splash.remove();
  else setTimeout(() => { splash.classList.add('splash-finished'); $('#home').classList.remove('home-enter'); requestAnimationFrame(() => $('#home').classList.add('home-enter')); setTimeout(() => splash.remove(), 650); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 2100);
  new ResizeObserver(() => requestAnimationFrame(updateLayout)).observe($('#pageViewport'));
  setInterval(updateHomeClock, 15000);
  setInterval(()=>{if(!$('#home').hidden && $('#home').style.display !== 'none')loadHomeFeed();},120000);
  window.addEventListener('resize', () => requestAnimationFrame(updateLayout));
  window.vinyl?.onState(incoming => { ui.state = incoming; render(); });
  window.vinyl?.onCommand(command => {
    if (command.startsWith('settings:')) { ui.settingsSection = command.slice(9); renderSettings(); }
    if (command === 'hide-controls') hideToolbar();
    else if (command === 'focus-address') { focusAddress(); }
    else if (command === 'focus-home') requestAnimationFrame(() => $('#home-address').focus({preventScroll:true}));
    else if (command === 'open-bookmarks') setShelf('bookmarks',true);
    else if (command === 'bookmark-current') run('browser:bookmarkCurrent',null,'Bookmark added').catch(() => {});
  });
}
async function init() {
  bindEvents();
  if (!window.vinyl) {
    document.body.dataset.shelf = 'open';
    return;
  }
  try { ui.state = await invoke('app:state'); render(); loadHomeFeed(); }
  catch (error) { toast(`Vinyl could not initialize: ${error.message}`); }
}
init();
