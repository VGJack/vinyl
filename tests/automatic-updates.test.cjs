'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const yaml = require('js-yaml');
const {buildVersion,prepareUpdate} = require('../scripts/prepare-update');
const {updateFiles,publishUpdate} = require('../scripts/publish-update.cjs');

(async()=>{
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'vinyl-auto-update-'));
  try {
    assert.equal(buildVersion('0.7.3','8'),'0.7.11');
    assert.equal(buildVersion('0.7.3','9'),'0.7.12');
    for (const run of ['',0,-1,'abc','1.2',65535]) assert.throws(()=>buildVersion('0.7.3',run));
    assert.throws(()=>buildVersion('v0.7','8'));
    fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'0.7.3'}));
    fs.writeFileSync(path.join(root,'package-lock.json'),JSON.stringify({version:'0.7.3',packages:{'':{version:'0.7.3'}}}));
    const version = prepareUpdate(root,'8');
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'))).packages[''].version,version);
    fs.mkdirSync(path.join(root,'dist'));
    const installer = `Vinyl-Setup-${version}.exe`;
    const data = Buffer.from('harmless installer fixture');
    const sha512 = crypto.createHash('sha512').update(data).digest('base64');
    fs.writeFileSync(path.join(root,'dist',installer),data);
    fs.writeFileSync(path.join(root,'dist',`${installer}.blockmap`),'blockmap fixture');
    const metadata = {version,path:installer,sha512,files:[{url:installer,sha512,size:data.length}]};
    fs.writeFileSync(path.join(root,'dist','latest.yml'),yaml.dump(metadata));
    assert.equal(updateFiles(root).version,version);
    const context = {ref:'refs/heads/main',repo:{owner:'test',repo:'vinyl'},sha:'source-commit'};
    const core = {notice:()=>{}};
    function fakeGitHub(options={}) {
      const state = {releases:[],assets:[],events:[],branchReads:0};
      const repos = {
        getBranch:async()=>({data:{commit:{sha:(++state.branchReads>1 && options.newerPush)?'newer-commit':context.sha}}}),
        listReleases:async()=>({data:state.releases}),
        listReleaseAssets:async()=>({data:state.assets}),
        createRelease:async payload=>{state.events.push('create-draft');const release={...payload,id:1};state.releases.push(release);return {data:release};},
        deleteReleaseAsset:async ({asset_id})=>{state.events.push('delete-asset');state.assets=state.assets.filter(a=>a.id!==asset_id);},
        uploadReleaseAsset:async payload=>{
          if(options.failUpload && state.assets.length===1)throw new Error('upload interrupted');
          state.events.push(`upload:${payload.name}`);
          state.assets.push({id:state.assets.length+1,name:payload.name,size:payload.data.length,state:'uploaded',digest:`sha256:${crypto.createHash('sha256').update(payload.data).digest('hex')}`});
        },
        updateRelease:async payload=>{
          state.events.push('publish');
          assert.equal(state.assets.length,3,'all three assets exist before publication');
          assert.equal(payload.make_latest,'true');
          Object.assign(state.releases[0],payload);
        }
      };
      return {github:{rest:{repos},paginate:async(fn,args)=>(await fn(args)).data},state};
    }
    const run = mock=>publishUpdate({github:mock.github,context,core,root});
    const normal = fakeGitHub();
    await run(normal);
    assert.equal(normal.state.events.at(-1),'publish');
    assert.equal(normal.state.releases[0].draft,false);
    assert.equal(normal.state.releases[0].target_commitish,context.sha);
    const eventCount = normal.state.events.length;
    await run(normal);
    assert.equal(normal.state.events.length,eventCount,'rerun cannot replace a live installer');
    await assert.rejects(()=>publishUpdate({github:normal.github,context:{...context,ref:'refs/heads/feature'},core,root}),/Only main/);
    normal.state.releases[0].target_commitish='different-commit';
    await assert.rejects(()=>run(normal),/already belongs/);

    const options = {failUpload:true};
    const interrupted = fakeGitHub(options);
    await assert.rejects(()=>run(interrupted),/upload interrupted/);
    assert.equal(interrupted.state.releases[0].draft,true);
    assert.ok(!interrupted.state.events.includes('publish'));
    options.failUpload=false;
    await run(interrupted);
    assert.equal(interrupted.state.releases[0].draft,false,'retry completes and publishes the same staged build');
    assert.equal(interrupted.state.events.filter(e=>e.startsWith('upload:')).length,3,'intact uploaded asset is reused');

    const outdated = fakeGitHub({newerPush:true});
    await run(outdated);
    assert.equal(outdated.state.releases[0].draft,true,'an outdated build is not promoted after a newer push');
    metadata.files[0].sha512='wrong';
    fs.writeFileSync(path.join(root,'dist','latest.yml'),yaml.dump(metadata));
    const corrupt = fakeGitHub();
    await assert.rejects(()=>run(corrupt),/does not match/);
    assert.deepEqual(corrupt.state.events,[],'bad metadata is rejected before touching GitHub');
    const workflow = yaml.load(fs.readFileSync(path.join(__dirname,'../.github/workflows/windows-build.yml'),'utf8'));
    assert.deepEqual(workflow.on.push.branches,['main']);
    assert.equal(workflow.on.push.tags,undefined);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
  console.log('Automatic update pipeline passed: versioning, metadata integrity, complete uploads, failed-upload recovery, idempotence and superseded builds.');
})().catch(error=>{console.error(error);process.exitCode=1;});
