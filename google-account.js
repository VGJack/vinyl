'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, createHash } = require('node:crypto');

const AUTH_HOST = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_HOST = 'https://oauth2.googleapis.com/token';
const PROFILE_HOST = 'https://openidconnect.googleapis.com/v1/userinfo';

function isDesktopClientId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{15,160}\.apps\.googleusercontent\.com$/.test(value.trim());
}
function tokenVerifier() { return randomBytes(40).toString('base64url'); }
function challenge(verifier) { return createHash('sha256').update(verifier).digest('base64url'); }
function cleanProfile(raw) {
  if (!raw || typeof raw.sub !== 'string' || !raw.sub || typeof raw.email !== 'string') throw new Error('Google did not provide the requested account details.');
  return { id: raw.sub.slice(0, 180), email: raw.email.slice(0, 220), name: String(raw.name || raw.email).slice(0, 160), picture: /^https:\/\//.test(raw.picture || '') ? raw.picture.slice(0, 600) : '' };
}

class GoogleAccount {
  constructor(directory, safeStorage) {
    this.file = path.join(directory, 'google-account.enc');
    this.safeStorage = safeStorage;
    this.profile = null;
    this.refreshToken = null;
    this.clientId = null;
    this.busy = false;
  }
  status() { return { profile: this.profile, connected: Boolean(this.profile), busy: this.busy, persistent: Boolean(this.refreshToken && this.canEncrypt()) }; }
  canEncrypt() { return Boolean(this.safeStorage?.isEncryptionAvailable?.()); }
  async exchange(fields) {
    const response = await fetch(TOKEN_HOST, { method:'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields), signal: AbortSignal.timeout(15000) });
    const body = await response.json();
    if (!response.ok || !body.access_token) throw new Error(body.error_description || body.error || `Google returned HTTP ${response.status}`);
    return body;
  }
  async userInfo(token) {
    const response = await fetch(PROFILE_HOST, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Google account details could not be retrieved.');
    return cleanProfile(await response.json());
  }
  persist() {
    if (!this.canEncrypt() || !this.refreshToken || !this.clientId || !this.profile) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const bytes = this.safeStorage.encryptString(JSON.stringify({ clientId:this.clientId, refreshToken:this.refreshToken, profile:this.profile }));
    fs.writeFileSync(this.file, bytes, { mode:0o600 });
  }
  async restore() {
    if (!this.canEncrypt() || !fs.existsSync(this.file)) return this.status();
    try {
      const data = JSON.parse(this.safeStorage.decryptString(fs.readFileSync(this.file)));
      if (!isDesktopClientId(data.clientId) || !data.refreshToken) return this.status();
      const tokens = await this.exchange({ client_id:data.clientId, refresh_token:data.refreshToken, grant_type:'refresh_token' });
      this.profile = await this.userInfo(tokens.access_token);
      this.clientId = data.clientId;
      this.refreshToken = tokens.refresh_token || data.refreshToken;
      this.persist();
    } catch (error) {
      console.warn('Vinyl Google session could not be restored:', error.message);
      this.profile = null;
      this.refreshToken = null;
    }
    return this.status();
  }
  signOut() {
    this.profile = null;
    this.refreshToken = null;
    this.clientId = null;
    try { fs.unlinkSync(this.file); } catch (error) { if (error.code !== 'ENOENT') console.warn(error.message); }
    return this.status();
  }
  async signIn(clientId, openExternal) {
    if (!isDesktopClientId(clientId)) throw new Error('Enter a valid Google OAuth Desktop client ID in Settings.');
    if (this.busy) throw new Error('A sign-in is already in progress.');
    this.busy = true;
    const state = randomBytes(24).toString('base64url');
    const verifier = tokenVerifier();
    let server;
    let timeout;
    let redirectUri;
    try {
      const result = await new Promise((resolve, reject) => {
        let complete = false;
        const finish = (error, code) => {
          if (complete) return;
          complete = true;
          if (timeout) clearTimeout(timeout);
          server?.close();
          if (error) reject(error); else resolve(code);
        };
        server = http.createServer((req, response) => {
          const callback = new URL(req.url || '/', 'http://127.0.0.1');
          if (callback.pathname !== '/vinyl/google/callback') { response.writeHead(404).end('Not found'); return; }
          if (callback.searchParams.get('state') !== state) { response.writeHead(400).end('Invalid sign-in session'); return; }
          const error = callback.searchParams.get('error');
          const code = callback.searchParams.get('code');
          response.writeHead(error || !code ? 400 : 200, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'" });
          response.end(`<html><body style="font:16px system-ui;padding:50px;background:#f4f7f8;color:#27333e"><h2>${error || !code ? 'Sign-in not completed' : 'Google account connected to Vinyl'}</h2><p>You can close this tab and return to Vinyl.</p></body></html>`);
          finish(error || !code ? new Error(error || 'Google returned no authorization code') : null, code);
        });
        server.once('error', finish);
        server.listen(0, '127.0.0.1', () => {
          const redirect = `http://127.0.0.1:${server.address().port}/vinyl/google/callback`;
          redirectUri = redirect;
          const auth = new URL(AUTH_HOST);
          for (const [key, value] of Object.entries({ client_id:clientId.trim(), redirect_uri:redirect, response_type:'code', scope:'openid email profile', state, code_challenge:challenge(verifier), code_challenge_method:'S256', access_type:'offline', prompt:'consent' })) auth.searchParams.set(key, value);
          timeout = setTimeout(() => finish(new Error('Google sign-in timed out.')), 180000);
          Promise.resolve().then(() => openExternal(auth.toString())).catch(error => finish(error));
        });
      });
      const tokens = await this.exchange({ client_id:clientId.trim(), code:result, code_verifier:verifier, redirect_uri:redirectUri, grant_type:'authorization_code' });
      const profile = await this.userInfo(tokens.access_token);
      this.profile = profile;
      this.clientId = clientId.trim();
      this.refreshToken = tokens.refresh_token || null;
      this.persist();
      return this.status();
    } finally { if (timeout) clearTimeout(timeout); server?.close(); this.busy = false; }
  }
}
module.exports = { GoogleAccount, isDesktopClientId, challenge, cleanProfile };
