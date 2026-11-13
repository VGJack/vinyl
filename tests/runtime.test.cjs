'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { _electron: electron } = require(process.env.VINYL_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
const profile = fs.mkdtempSync(path.join(root,'tmp','runtime-'));
const env = {...process.env,VINYL_TEST_PROFILE:profile,VINYL_TEST_WEATHER:'1'};
delete env.ELECTRON_RUN_AS_NODE;
const server = http.createServer((req,res) => {
  res.setHeader('Content-Type','text/html');
  res.end('<title>Live tab test</title><input id="draft" value="original"><a href="/next">Next</a>');
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const app = await electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'runtime-fixture.cjs')],env,timeout:25000});
  const errors=[];
  app.on('window',page=>page.on('pageerror',e=>errors.push(String(e))));
  try {
    const page = await app.firstWindow();
    await page.waitForFunction(() => Boolean(window.vinyl));
    await page.waitForSelector('.tab');
    // Freeze the launch sequence at three positions to verify a real masked unroll.
    const maskHeights=[];
    for (const time of [0,750,1900]) {
      maskHeights.push(await page.evaluate(t=>{
        for(const animation of document.getAnimations()) {
          if(animation.effect?.target?.closest?.('#launch-splash')) {animation.pause();animation.currentTime=t;}
        }
        return parseFloat(getComputedStyle(document.querySelector('.mask-left')).height);
      },time));
      await page.locator('.material-emblem').screenshot({path:path.join(root,`preview-unroll-${time}.png`)});
    }
    assert.equal(maskHeights[0],0);
    assert.ok(maskHeights[1]>0 && maskHeights[1]<maskHeights[2]);
    assert.equal(maskHeights[2],190);
    await page.waitForTimeout(2900);
    const invoke=(name,payload)=>page.evaluate(([n,p])=>window.vinyl.invoke(n,p),[name,payload]);
    assert.equal((await invoke('app:state')).settings.addressBarMode,'always');
    await page.mouse.move(700,400);
    await page.waitForTimeout(3000);
    assert.equal(await page.locator('.toolbar').isVisible(),true,'controls do not auto-hide');
    assert.equal(await page.locator('.tab-title').first().innerText(),'Home');
    assert.equal(await page.locator('#toolbar-pin').count(),0);
    assert.equal(await page.locator('.toolbar #more-menu').count(),0);
    const settingsBounds=await page.locator('#more-menu').boundingBox(), minimizeBounds=await page.locator('#window-min').boundingBox();
    assert.ok(settingsBounds.x < minimizeBounds.x);
    assert.equal(settingsBounds.y,minimizeBounds.y,'Settings aligns with the window controls');
    assert.equal(settingsBounds.height,minimizeBounds.height);
    const controlStyles = await page.evaluate(()=>['#more-menu','#window-min'].map(selector=>{
      const s=getComputedStyle(document.querySelector(selector));
      return [s.background,s.border,s.borderRadius,s.boxShadow];
    }));
    assert.deepEqual(controlStyles[0],controlStyles[1]);

    assert.equal(await page.locator('.home-grid > section').count(),4);
    assert.equal(await page.locator('.home-eyebrow').count(),0);
    assert.equal(await page.locator('.news-card').count(),4);
    assert.equal(await page.locator('.tab .vinyl-outline').count(),1);
    await page.evaluate(async()=>{ui.homeFeed=await window.vinyl.invoke('home:setWeatherCity',{city:'Test City'});renderWeather();});
    await page.click('[data-view="hourly"]');
    assert.equal(await page.locator('.forecast-item').count(),12);
    await page.click('[data-modal-cancel]');
    await page.click('[data-view="daily"]');
    assert.equal(await page.locator('.forecast-item').count(),7);
    await page.screenshot({path:path.join(root,'preview-forecast-v072.png')});
    await page.keyboard.press('Escape');
    const toolbar = await page.locator('.toolbar').boundingBox();
    const viewport = await page.locator('#pageViewport').boundingBox();
    assert.ok(toolbar.y > viewport.y+viewport.height-2,'navigation is below content');
    await page.screenshot({path:path.join(root,'preview-home-v072.png')});
    await page.click('#dock-close');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.toolbar').isVisible(),false);
    assert.equal(await page.locator('#dock-close').isVisible(),false);
    assert.equal(await page.locator('#dock-reveal').isVisible(),true);
    await page.screenshot({path:path.join(root,'preview-hidden-v072.png')});
    const homeEdge=await page.locator('#dock-reveal').boundingBox();
    // The target disappears as soon as pointerenter opens the drawer.
    await page.mouse.move(homeEdge.x+homeEdge.width/2,homeEdge.y+homeEdge.height/2);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.toolbar').isVisible(),true);
    assert.equal(await page.locator('#dock-close').isVisible(),true);
    await page.mouse.move(700,400);
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('.toolbar').isVisible(),true,'revealed controls stay open until closed');
    await page.keyboard.press('Control+l');
    await page.waitForFunction(()=>document.activeElement.id==='address');
    const initial=(await invoke('app:state')).activeId;
    const second=await invoke('browser:newTab');
    await invoke('browser:reorder',{id:second,beforeId:initial});
    assert.deepEqual((await invoke('app:state')).tabs.map(t=>t.id),[second,initial]);
    await page.waitForFunction(id=>document.querySelector('[data-tab]')?.dataset.tab === id,second);
    // Pointer drag follows the same path as a user's tab gesture.
    let boxes=await page.locator('[data-tab]').all();
    const from=await boxes[0].boundingBox(),to=await boxes[1].boundingBox();
    await page.mouse.move(from.x+30,from.y+15);await page.mouse.down();
    await page.mouse.move(to.x+to.width-10,to.y+15,{steps:12});await page.mouse.up();
    await page.waitForTimeout(150);
    assert.deepEqual((await invoke('app:state')).tabs.map(t=>t.id),[initial,second]);
    await invoke('window:shelf',{open:true});await page.waitForTimeout(400);
    const shelf=app.windows().find(p=>p.url().includes('surface=shelf'));
    assert.ok(shelf,'external bookmark window created');
    const geometry=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({shelf:w.webContents.getURL().includes('surface=shelf'),bounds:w.getBounds(),visible:w.isVisible()})));
    const main=geometry.find(w=>!w.shelf),drawer=geometry.find(w=>w.shelf);
    assert.equal(drawer.bounds.x+drawer.bounds.width,main.bounds.x+1);
    assert.equal(drawer.visible,true);
    await app.evaluate(({BrowserWindow})=>{
      const drawer=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('surface=shelf'));
      globalThis.drawerChanges=[];
      for(const event of ['resize','hide','show']) drawer.on(event,()=>globalThis.drawerChanges.push(event));
    });
    await shelf.click('[data-section="toggles"]');
    await shelf.waitForSelector('.toggles-empty');
    assert.equal(await shelf.locator('#shelf-content button,#shelf-content input').count(),0);
    assert.equal((await invoke('app:state')).shelfSection,'toggles');
    await shelf.screenshot({path:path.join(root,'preview-toggles-v072.png')});
    await shelf.click('[data-section="bookmarks"]');
    for (let i=0;i<3;i++) {await shelf.click('[data-section="toggles"]');await shelf.click('[data-section="bookmarks"]');}
    await page.waitForTimeout(350);
    assert.deepEqual(await app.evaluate(()=>globalThis.drawerChanges),[],'switching sections never resizes or hides the drawer');
    await shelf.screenshot({path:path.join(root,'preview-shelf-v07.png')});
    await invoke('window:maximize');await page.waitForTimeout(350);
    assert.equal((await invoke('app:state')).shelfExternal,false);
    assert.ok((await page.locator('#shelf').boundingBox()).width > 250);
    await invoke('window:maximize');await invoke('window:shelf',{open:false});
    await page.click('#dock-close');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.toolbar').isVisible(),false);
    await page.click('#more-menu');
    assert.equal(await page.locator('#settings-page').isVisible(),true);
    assert.equal(await page.locator('.toolbar').isVisible(),false,'Settings does not reopen the bottom drawer');
    // CDP keyboard events bypass Electron's native before-input-event handler.
    await app.evaluate(({BrowserWindow})=>{
      const wc=BrowserWindow.getAllWindows().find(w=>!w.webContents.getURL().includes('surface=shelf')).webContents;
      wc.sendInputEvent({type:'keyDown',keyCode:'T',modifiers:['control']});
      wc.sendInputEvent({type:'keyUp',keyCode:'T',modifiers:['control']});
    });
    await page.waitForFunction(()=>document.activeElement.id==='home-address');
    assert.equal(await page.locator('.toolbar').isVisible(),false,'opening Home preserves collapsed controls');
    const extras=(await invoke('app:state')).tabs.filter(t=>t.id!==initial&&t.id!==second);
    for(const tab of extras) await invoke('browser:close',{id:tab.id});
    await invoke('browser:activate',{id:second});
    await page.keyboard.press('Control+l');
    await page.waitForFunction(()=>document.activeElement.id==='address');
    const url=`http://127.0.0.1:${server.address().port}/`;
    await invoke('browser:navigate',{address:url});
    await page.waitForTimeout(600);
    const wcId=await app.evaluate(({webContents})=>webContents.getAllWebContents().find(w=>w.getURL().startsWith('http://127.0.0.1:')).id);
    await page.click('#dock-close');
    await page.waitForTimeout(300);
    const edge=await page.locator('#dock-reveal').boundingBox();
    const webBounds=await page.locator('#pageViewport').boundingBox();
    assert.ok(webBounds.y+webBounds.height<=edge.y+1,'live webpage leaves the bottom hover target accessible');
    await page.mouse.move(edge.x+edge.width/2,edge.y+edge.height/2);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.toolbar').isVisible(),true);
    // Use a real navigation: Chromium may skip synthetic pushState entries without user gestures.
    await app.evaluate(({webContents},{id,url})=>webContents.fromId(id).loadURL(url),{id:wcId,url:url+'next'});
    await app.evaluate(({webContents},id)=>webContents.fromId(id).executeJavaScript('document.querySelector("#draft").value="keep this draft";window.onbeforeunload=()=>"unsaved";true'),wcId);
    await page.waitForFunction(() => window.vinyl.invoke('app:state').then(s=>s.active?.canGoBack));
    const dragged=await page.locator(`[data-tab="${second}"]`).boundingBox();
    await page.mouse.move(dragged.x+40,dragged.y+15);await page.mouse.down();
    await page.mouse.move(dragged.x+70,dragged.y+140,{steps:12});await page.mouse.up();
    await page.waitForFunction(id=>window.vinyl.invoke('app:state').then(s=>!s.tabs.some(t=>t.id===id)),second);
    await page.waitForTimeout(250);
    const other=app.windows().find(p=>p!==page && p.url().startsWith('file:') && !p.url().includes('surface=shelf'));
    assert.ok(other,'tear-out creates a browser window');
    const otherState=await other.evaluate(()=>window.vinyl.invoke('app:state'));
    assert.equal(otherState.activeId,second);
    assert.equal(otherState.active.canGoBack,true);
    assert.equal(await app.evaluate(({webContents},id)=>webContents.fromId(id).executeJavaScript('document.querySelector("#draft").value'),wcId),'keep this draft');
    await other.evaluate(()=>window.vinyl.invoke('browser:newTab'));
    assert.equal((await invoke('app:state')).tabs.length,1,'windows have independent tabs');
    await page.click('#google-profile');
    await page.waitForFunction(()=>window.vinyl.invoke('app:state').then(s=>s.active?.url.startsWith('https://accounts.google.com/')));
    const googleState=await invoke('app:state');
    assert.equal(new URL(googleState.active.url).hostname,'accounts.google.com');
    assert.equal(await app.evaluate(({webContents,session})=>webContents.getAllWebContents().filter(w=>w.getURL().startsWith('https://accounts.google.com/')).every(w=>w.session===session.defaultSession)),true);
    await invoke('browser:stop');
    await invoke('browser:openSettings',{section:'account'});
    await page.waitForSelector('[data-action="google-website"][data-site="google"]');
    assert.equal(await page.locator('#google-client-id,[data-action="google-signin"]').count(),0);
    assert.ok(!(await page.locator('#settings-main').innerText()).includes('OAuth'));
    await assert.rejects(()=>invoke('google:signIn'),/Unknown Vinyl action/);

    await invoke('settings:set',{key:'theme',value:'dark'});
    await invoke('browser:newTab');await page.waitForTimeout(600);
    await page.screenshot({path:path.join(root,'preview-dark-v07.png')});
    // Closing the source window must not close a transferred live WebContents.
    await invoke('window:close').catch(()=>{});
    assert.equal(await app.evaluate(({webContents},id)=>!webContents.fromId(id).isDestroyed(),wcId),true);
    await other.evaluate(id=>window.vinyl.invoke('browser:activate',{id}),second);
    await app.evaluate(({webContents},id)=>webContents.fromId(id).executeJavaScript('document.title="Transferred and still live"'),wcId);
    await other.waitForFunction(()=>document.title.includes('Transferred and still live'));
    assert.deepEqual(errors,[]);
    console.log('Runtime checks passed: aligned Settings, X-close/bottom-hover/Ctrl+L on Home and live pages, pointer reorder, stable shelf switching, live tab transfer/history, independent windows, Google entry, clean renderer.');
  } finally {
    await app.close(); server.close();
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
