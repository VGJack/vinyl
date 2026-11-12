'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromeProfiles, readChromeBookmarks, readChromeExtensions, findInTree } = require('../chrome-bridge');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vinyl-chrome-test-'));
try {
  const profile = path.join(root, 'Default');
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(profile, 'Preferences'), JSON.stringify({profile:{name:'Main Chrome'}}));
  const bar = { children:[
    {type:'url',id:'23',name:'Portal',url:'https://example.org'},
    {type:'folder',id:'24',name:'Work',children:[{type:'url',id:'25',name:'Docs',url:'https://docs.google.com'}]},
    {type:'url',id:'26',name:'Local URL',url:'file:///private/file'}
  ]};
  fs.writeFileSync(path.join(profile, 'Bookmarks'), JSON.stringify({roots:{bookmark_bar:bar,other:{children:[]},synced:{children:[]}}}));
  assert.deepEqual(chromeProfiles(root),[{id:'Default',name:'Main Chrome'}]);
  const nodes = readChromeBookmarks(root,'Default');
  assert.equal(nodes.length,2);
  assert.equal(findInTree('chrome:25',nodes).title,'Docs');
  assert.equal(findInTree('chrome:26',nodes), null);
  assert.throws(()=>readChromeBookmarks(root,'../secrets'),/not found/);
  const ext = path.join(profile, 'Extensions', 'a'.repeat(32), '1.0.0');
  fs.mkdirSync(ext, {recursive:true});
  fs.writeFileSync(path.join(ext,'manifest.json'),JSON.stringify({name:'Sample Extension',manifest_version:3,version:'1.0.0'}));
  const installed = readChromeExtensions(root,'Default');
  assert.equal(installed[0].name,'Sample Extension');
  assert.equal(installed[0].source,'chrome');
  console.log('Chrome integration tests passed');
} finally { fs.rmSync(root,{force:true,recursive:true}); }
