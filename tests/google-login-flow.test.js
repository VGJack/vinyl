'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { GoogleAccount } = require('../google-account');

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vinyl-google-test-'));
  const vault = { isEncryptionAvailable:()=>true, encryptString: s => Buffer.from(s), decryptString: b => b.toString() };
  const id = '12345678901234567890-abcdefghijkl.apps.googleusercontent.com';
  const controller = new GoogleAccount(directory, vault);
  controller.exchange = async payload => {
    assert.equal(payload.client_id, id);
    assert.ok(payload.grant_type === 'authorization_code' || payload.grant_type === 'refresh_token');
    if (payload.grant_type === 'authorization_code') {
      assert.ok(payload.redirect_uri.startsWith('http://127.0.0.1:'));
      assert.equal(typeof payload.code_verifier, 'string');
    }
    return {access_token:'fake-access',refresh_token:'fake-refresh'};
  };
  controller.userInfo = async () => ({id:'123',email:'test@example.com',name:'Vinyl Test',picture:''});
  const status = await controller.signIn(id, async authUrl => {
    const auth = new URL(authUrl);
    assert.equal(auth.hostname, 'accounts.google.com');
    assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
    const redirect = new URL(auth.searchParams.get('redirect_uri'));
    redirect.searchParams.set('code', 'fake-auth-code');
    redirect.searchParams.set('state', auth.searchParams.get('state'));
    const response = await fetch(redirect);
    assert.equal(response.status, 200);
  });
  assert.equal(status.connected, true);
  assert.equal(status.profile.email, 'test@example.com');
  assert.equal(status.persistent, true);
  assert.ok(fs.existsSync(path.join(directory,'google-account.enc')));
  const restored = new GoogleAccount(directory, vault);
  restored.exchange = controller.exchange;
  restored.userInfo = controller.userInfo;
  assert.equal((await restored.restore()).connected,true);
  restored.signOut();
  assert.equal(fs.existsSync(path.join(directory,'google-account.enc')),false);
  fs.rmSync(directory,{recursive:true,force:true});
  console.log('Google OAuth loopback flow tests passed');
})().catch(error => { console.error(error); process.exitCode=1; });
