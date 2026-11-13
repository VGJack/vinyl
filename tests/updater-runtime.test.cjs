'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {_electron:electron} = require(process.env.VINYL_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
const profile = fs.mkdtempSync(path.join(root,'tmp','update-runtime-'));
const live = process.argv.includes('--live');
const env = {...process.env,VINYL_TEST_PROFILE:profile,VINYL_TEST_LIVE_UPDATES:live?'1':'0'};
delete env.ELECTRON_RUN_AS_NODE;
(async()=>{
  const app = await electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'updater-runtime-fixture.cjs')],env,timeout:25000});
  try {
    const page = await app.firstWindow();
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.waitForSelector('.tab');
    await page.waitForSelector('#launch-splash',{state:'detached'});
    await page.evaluate(()=>window.vinyl.invoke('browser:openSettings',{section:'about'}));
    await page.click('[data-action="update-check"]');
    await page.waitForFunction(()=>['error','current','downloading'].includes(ui.state?.updates?.state),null,{timeout:60000});
    const status = await page.evaluate(()=>window.vinyl.invoke('app:state').then(s=>s.updates));
    const providerError = await app.evaluate(()=>globalThis.updateTestError);
    assert.ok(status.message.length < 200);
    assert.equal(await page.locator('#toast.visible').count(),0,'no raw IPC error popup');
    assert.ok(!(await page.locator('#settings-main').innerText()).includes('Huge server response'));
    if (!live) {
      assert.equal(status.state,'error');
      assert.match(status.message,/No downloadable Windows update/);
      assert.ok(providerError.length>20000,'the original provider error is deliberately huge');
      assert.equal(await page.locator('[data-action="update-check"]').isEnabled(),true);
      await page.screenshot({path:path.join(root,'preview-update-error-v073.png')});
      await page.click('[data-action="update-check"]');
      await page.waitForFunction(()=>ui.state?.updates?.state==='current');
    }
    assert.deepEqual(errors,[]);
    console.log(live ? {liveCheck:status,providerError} : 'Updater UI passed: large provider error stays out of IPC/toast, concise status, retry succeeds.');
  } finally {await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
