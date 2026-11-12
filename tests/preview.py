from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import base64

root = Path(__file__).resolve().parents[1]
settings = {
    'theme':'light','accent':'blue','shelfEnabled':True,'shelfPosition':'left',
    'autoCloseShelf':False,'compactTabs':False,'compactToolbar':False,
    'roundedPanels':True,'softShadows':True,'showLabels':True,
    'largeText':False,'reduceMotion':False,'showHomeShortcuts':True,
    'searchEngine':'google','defaultZoom':100,'spellcheck':True,'doNotTrack':False,'addressBarMode':'always'
}
state = {
 'tabs':[{'id':'a','title':'New tab','url':'','favicon':'','loading':False,'canGoBack':False,'canGoForward':False}],
 'activeId':'a','settings':settings,'platform':'win32',
 'bookmarks': [
    {'id':'1','title':'Gmail','url':'https://mail.google.com/','pinned':True},
    {'id':'2','title':'YouTube','url':'https://youtube.com/','pinned':True},
    {'id':'3','title':'Google Drive','url':'https://drive.google.com/','pinned':True},
    {'id':'4','title':'Calendar','url':'https://calendar.google.com/','pinned':True},
    {'id':'5','title':'Work','children':[{'id':'10','title':'Classroom','url':'https://classroom.google.com/','pinned':False}]},
    {'id':'6','title':'Notion','url':'https://notion.so/','pinned':False},
    {'id':'7','title':'Documents','url':'https://docs.google.com/','pinned':False},
    {'id':'8','title':'GitHub','url':'https://github.com/','pinned':False},
    {'id':'9','title':'Figma','url':'https://figma.com/','pinned':False},
    {'id':'11','title':'School portal','url':'https://example.com/','pinned':False},
    {'id':'12','title':'Reference','children':[]},
    {'id':'chrome:44','title':'Maps','url':'https://maps.google.com/','source':'chrome'}
 ],
 'extensions':[{'id':'ext1','name':'Dark Reader','enabled':True,'path':'/test','hasPopup':True,'hasOptions':True,'error':None},
               {'id':'ext2','name':'OneTab','enabled':True,'path':'/test','hasPopup':False,'hasOptions':True,'error':None}],
 'chromeExtensions':[{'id':'chrome-ext:abc','name':'Grammarly','icon':'','source':'chrome'},
                     {'id':'chrome-ext:def','name':'uBlock Origin','icon':'','source':'chrome'},
                     {'id':'chrome-ext:ghi','name':'ColorZilla','icon':'','source':'chrome'}],
 'chrome':{'profiles':[{'id':'Default','name':'Person 1'},{'id':'Profile 1','name':'Work'}], 'linkedProfile':'Default',
           'bookmarkCount':10,'extensionCount':3,'error':'','lastUpdated':1000},
 'active':{'title':'New tab','url':'','canGoBack':False,'canGoForward':False,'loading':False},
 'google':{'clientId':'','connected':False,'busy':False,'profile':None},
 'updates':{'state':'unconfigured','message':'Update feed not configured.'}
}
script = f'''(() => {{
 let state = {json.dumps(state)};
 let listeners = [];
 const broadcast = () => listeners.forEach(fn => fn(state));
 window.vinyl = {{
   invoke: async (channel,payload={{}}) => {{
      if(channel==='app:state') return state;
      if(channel==='settings:set') {{state.settings[payload.key]=payload.value;broadcast();}}
      if(channel==='browser:openSettings') {{
        let existing=state.tabs.find(t=>t.id==='s');
        if(!existing) {{existing={{id:'s',title:'Settings',url:'vinyl://settings',favicon:'',loading:false,canGoBack:false,canGoForward:false}};state.tabs.push(existing);}}
        existing.url='vinyl://settings';existing.title='Settings';state.activeId='s';broadcast();
      }}
      if(channel==='browser:navigate') {{const tab=state.tabs.find(t=>t.id===state.activeId);tab.url=payload.address;tab.title='Example';state.active={{title:'Example',url:tab.url,canGoBack:false,canGoForward:false,loading:false}};broadcast();}}
      if(channel==='chrome:link') {{state.chrome.linkedProfile=payload.profileId;broadcast();}}
      if(channel==='chrome:unlink') {{state.chrome.linkedProfile=null;broadcast();}}
      if(channel==='browser:activate') {{state.activeId=payload.id;broadcast();}}
      return null;
   }},
   onState: fn => {{listeners.push(fn);return ()=>{{}};}},
   onCommand: fn => () => {{}}
 }};
}})();'''
raw = (root / 'ui/index.html').read_text()
raw = raw.replace(next(line for line in raw.splitlines() if 'Content-Security-Policy' in line), '')
raw = raw.replace('<link rel="stylesheet" href="./styles.css"/>', '<style>' + (root / 'ui/styles.css').read_text() + '</style>')
raw = raw.replace('<script src="./app.js" defer></script>', '<script>' + script + '</script><script>' + (root / 'ui/app.js').read_text() + '</script>')
raw = raw.replace('../assets/logo.svg', 'data:image/svg+xml;base64,' + base64.b64encode((root / 'assets/logo.svg').read_bytes()).decode())
with sync_playwright() as p:
 browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 page = browser.new_page(viewport={'width':1360,'height':870},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(raw)
 page.wait_for_timeout(2500)
 page.click('#shelf-open')
 page.wait_for_timeout(400)
 assert page.locator('body').get_attribute('data-shelf') == 'open'
 assert page.locator('.app-tile').count() == 12
 assert not page.locator('.panel-note').count()
 page.screenshot(path=str(root / 'preview-bookmarks.png'), full_page=True)
 page.click('[data-section="extensions"]')
 assert page.locator('.app-tile').count()==5
 page.screenshot(path=str(root / 'preview-extensions.png'), full_page=True)
 page.click('#more-menu')
 assert page.locator('#settings-page').is_visible()
 page.wait_for_timeout(250)
 page.screenshot(path=str(root / 'preview-settings.png'), full_page=True)
 page.click('[data-setting="roundedPanels"]')
 assert page.locator('body').get_attribute('data-rounded')=='false'
 page.select_option('[data-setting="theme"]','dark')
 assert page.locator('body').get_attribute('data-theme')=='dark'
 page.screenshot(path=str(root / 'preview-dark.png'), full_page=True)
 page.click('[data-settings-section="chrome"]')
 assert page.locator('#chrome-profile').is_visible()
 page.screenshot(path=str(root / 'preview-chrome.png'), full_page=True)
 page.click('[data-settings-section="account"]')
 assert page.locator('#google-client-id').is_visible()
 page.screenshot(path=str(root / 'preview-account.png'), full_page=True)
 page.click('[data-settings-section="browser"]')
 page.select_option('[data-setting="addressBarMode"]','auto')
 assert page.locator('body').get_attribute('data-toolbar-mode')=='auto'
 page.evaluate("window.vinyl.invoke('browser:navigate',{address:'https://example.com/'})")
 page.wait_for_timeout(1800)
 assert page.locator('body').get_attribute('data-toolbar-visible')=='false'
 page.evaluate('focusAddress()')
 assert page.locator('body').get_attribute('data-toolbar-visible')=='true'
 page.wait_for_function("document.activeElement === document.querySelector('#address')")
 page.evaluate("window.vinyl.invoke('browser:openSettings')")
 page.click('[data-settings-section="about"]')
 assert 'Software updates' in page.locator('#settings-main').inner_text()
 print('screenshots saved; frontend errors:', errors)
 assert not errors, errors
 browser.close()
