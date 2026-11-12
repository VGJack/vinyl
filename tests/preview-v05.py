from playwright.sync_api import sync_playwright
from pathlib import Path
import json, base64
root = Path(__file__).resolve().parents[1]
settings = {'theme':'light','accent':'blue','shelfEnabled':True,'shelfPosition':'left','autoCloseShelf':False,'compactTabs':False,'compactToolbar':False,'roundedPanels':True,'softShadows':True,'showLabels':True,'largeText':False,'reduceMotion':False,'showHomeShortcuts':True,'showRecentTabs':True,'showHomeWeather':True,'showHomeNews':True,'searchEngine':'google','defaultZoom':100,'spellcheck':True,'doNotTrack':False,'addressBarMode':'auto'}
state = {'tabs':[{'id':'1','title':'New tab','url':'','favicon':'','loading':False,'canGoBack':False,'canGoForward':False}], 'activeId':'1','settings':settings,'platform':'win32','bookmarks':[{'id':'1','title':'Gmail','url':'https://mail.google.com/','pinned':True},{'id':'2','title':'YouTube','url':'https://youtube.com/','pinned':True},{'id':'3','title':'Drive','url':'https://drive.google.com/','pinned':True},{'id':'4','title':'Calendar','url':'https://calendar.google.com/','pinned':True},{'id':'5','title':'','url':'https://github.com/','pinned':True},{'id':'6','title':'Documents','url':'https://docs.google.com/'},{'id':'7','title':'Learning','children':[{'id':'8','title':'Classroom','url':'https://classroom.google.com/'}]}], 'recentTabs':[{'url':'https://classroom.google.com','title':'Classroom','favicon':'','preview':''},{'url':'https://docs.google.com','title':'Google Docs','favicon':'','preview':''},{'url':'https://youtube.com','title':'YouTube','favicon':'','preview':''},{'url':'https://github.com','title':'GitHub','favicon':'','preview':''}], 'chrome':{'profiles':[],'linkedProfile':None,'bookmarkCount':0,'lastUpdated':None,'error':''}, 'google':{'clientId':'','connected':False,'busy':False,'profile':None}, 'updates':{'state':'unconfigured','message':'No update feed configured'}}
feed={'news':[{'title':'Sample headline showing a clean news layout','source':'Example','url':'https://news.google.com/rss/articles/a'},{'title':'A second headline provides a useful sense of spacing','source':'Example','url':'https://news.google.com/rss/articles/b'},{'title':'A brief third story with subtle source information','source':'Example','url':'https://news.google.com/rss/articles/c'},{'title':'The final headline in the current events section','source':'Example','url':'https://news.google.com/rss/articles/d'}], 'weather':{'city':'Sample City','temperature':62,'code':2,'condition':'Partly cloudy','high':67,'low':49},'weatherLocation':{'name':'Sample City','latitude':40,'longitude':-75}}
bridge='''(()=>{let state=STATE;const feed=FEED;let listeners=[];const broadcast=()=>listeners.forEach(fn=>fn(state));window.vinyl={invoke:async(channel,payload={})=>{if(channel==='app:state')return state;if(channel==='home:feed')return feed;if(channel==='settings:set'){state.settings[payload.key]=payload.value;broadcast();return null;}if(channel==='browser:openSettings'){const t={id:'s',title:'Settings',url:'vinyl://settings',favicon:'',loading:false,canGoBack:false,canGoForward:false};state.tabs.push(t);state.activeId='s';broadcast();return;}if(channel==='browser:navigate'){const t=state.tabs.find(t=>t.id===state.activeId);t.url=payload.address;t.title='Example';broadcast();return;}return null;},onState:fn=>{listeners.push(fn);return()=>{}},onCommand:fn=>()=>{}}})();'''.replace('STATE',json.dumps(state)).replace('FEED',json.dumps(feed))
html=(root/'ui/index.html').read_text()
html='\n'.join(line for line in html.splitlines() if 'Content-Security-Policy' not in line)
html=html.replace('<link rel="stylesheet" href="./styles.css"/>','<style>'+(root/'ui/styles.css').read_text()+'</style>')
html=html.replace('<script src="./app.js" defer></script>','<script>'+bridge+'</script><script>'+(root/'ui/app.js').read_text()+'</script>')
html=html.replace('../assets/logo.svg','data:image/svg+xml;base64,'+base64.b64encode((root/'assets/logo.svg').read_bytes()).decode())
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 page.wait_for_timeout(2700)
 assert page.locator('#home-greeting').inner_text().startswith('Good ')
 assert ', Jack' in page.locator('#home-greeting').inner_text()
 assert page.locator('.recent-card').count()==4
 assert page.locator('.news-line').count()==4
 assert page.locator('.weather-degrees').inner_text()=='62°'
 assert page.locator('#shelf-open').bounding_box()['x'] < page.locator('#tabs').bounding_box()['x']
 assert page.locator('.home-time').inner_text().strip()
 page.wait_for_timeout(300)
 assert page.locator('body').get_attribute('data-toolbar-visible')=='false'
 page.screenshot(path=str(root/'preview-home-v05.png'))
 page.click('#shelf-open');page.wait_for_timeout(350)
 assert page.locator('body').get_attribute('data-shelf')=='open'
 assert page.locator('[data-section="extensions"]').count()==0
 assert page.locator('.app-tile').count()==7
 assert page.locator('.app-tile-label').count()==6
 page.screenshot(path=str(root/'preview-bookmarks-v05.png'))
 page.click('#shelf-open');page.click('#toolbar-pin');page.wait_for_timeout(150)
 assert page.locator('body').get_attribute('data-toolbar-mode')=='always'
 page.click('#toolbar-pin');page.wait_for_timeout(1000)
 assert page.locator('body').get_attribute('data-toolbar-mode')=='auto'
 page.click('#more-menu')
 assert page.locator('#settings-page').is_visible()
 assert not errors,errors
 print('Vinyl v0.5 UI checks passed; saved previews')
 browser.close()
