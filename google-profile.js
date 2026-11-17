'use strict';
const GOOGLE_PAGES = new Set(['www.google.com','google.com','myaccount.google.com','mail.google.com','drive.google.com','docs.google.com','calendar.google.com','photos.google.com','keep.google.com','meet.google.com','www.youtube.com','youtube.com']);
function profilePage(value) {
  try {const url=new URL(value);return url.protocol==='https:' && !url.port && GOOGLE_PAGES.has(url.hostname);} catch {return false;}
}
function avatarURL(value) {
  if (typeof value!=='string' || value.length>4096) return '';
  try {
    const url=new URL(value);
    return url.protocol==='https:' && !url.username && !url.password && !url.port && /^(lh\d+\.googleusercontent\.com|yt\d+\.(googleusercontent\.com|ggpht\.com))$/.test(url.hostname) ? url.href : '';
  } catch {return '';}
}
// Read the account control already displayed on a Google page, never tokens,
// form fields, account-chooser portraits, or unrelated images in the page.
function readAccountPhoto() {
  const visible = element=>Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility!=='hidden' && getComputedStyle(element).display!=='none');
  const controls = document.querySelectorAll('a[href*="accounts.google.com/SignOutOptions"], [aria-label^="Google Account:"], [aria-label^="Google Account "], #avatar-btn');
  for (const control of controls) {
    if (!visible(control)) continue;
    const img=control.matches('img')?control:control.querySelector('img');
    if (visible(img)) return {picture:img.currentSrc || img.src};
  }
  const signIn=document.querySelector('header a[href*="accounts.google.com/ServiceLogin"], #gb a[href*="accounts.google.com/ServiceLogin"], ytd-masthead a[href*="accounts.google.com/ServiceLogin"]');
  return visible(signIn)?{signedOut:true}:null;
}
class GoogleProfile {
  constructor(store,changed) {this.store=store;this.changed=changed;this.picture=avatarURL(store.data.googleAvatar);this.epoch=0;}
  set(picture) {
    picture=avatarURL(picture);
    if (picture===this.picture) return;
    this.picture=picture;this.store.data.googleAvatar=picture;this.store.save();this.changed();
  }
  clear() {this.epoch++;this.set('');}
  async refresh(wc) {
    if (!wc || wc.isDestroyed() || !profilePage(wc.getURL()) || wc.isLoadingMainFrame()) return;
    const url=wc.getURL(), epoch=++this.epoch;
    try {
      const result=await wc.executeJavaScriptInIsolatedWorld(1001,[{code:`(${readAccountPhoto.toString()})()`}]);
      if (epoch!==this.epoch || wc.isDestroyed() || wc.getURL()!==url) return;
      if (avatarURL(result?.picture)) this.set(result.picture);
      else if (result?.signedOut) this.clear();
    } catch { /* A navigation or a page without an account control leaves the last known photo alone. */ }
  }
}
module.exports={GoogleProfile,profilePage,avatarURL,readAccountPhoto};
