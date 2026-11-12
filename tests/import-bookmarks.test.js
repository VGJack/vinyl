'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseNetscapeBookmarks } = require('../import-bookmarks');
const { Store } = require('../store');

const sample = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p>
<DT><H3 ADD_DATE="172000">Resources &amp; Notes</H3>
<DL><p><DT><A HREF="https://youtube.com/">YouTube</A>
<DT><H3>Links</H3><DL><p><DT><A HREF="https://docs.google.com/document/">Docs</A></DL><p>
</DL><p><DT><A HREF="javascript:alert(1)">Unsafe</A>
<DT><A HREF="https://example.com/?a=1&amp;b=2">Example</A></DL>`;
const parsed = parseNetscapeBookmarks(sample);
assert.equal(parsed.length, 2);
assert.equal(parsed[0].title, 'Resources & Notes');
assert.equal(parsed[0].children[0].url, 'https://youtube.com/');
assert.equal(parsed[0].children[1].children[0].title, 'Docs');
assert.equal(parsed[1].url, 'https://example.com/?a=1&b=2');
assert.throws(() => parseNetscapeBookmarks('hello'));
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'vinyl-import-'));
try {
  const store = new Store(folder);
  const count = store.importBookmarkTree(parsed, 'Chrome HTML');
  assert.equal(count, 3);
  assert.equal(store.data.bookmarks[0].title, 'Chrome HTML');
  assert.equal(store.data.bookmarks[0].children[0].children[1].children[0].url, 'https://docs.google.com/document/');
  assert.equal(new Store(folder).data.bookmarks[0].children.length, 2);
} finally { fs.rmSync(folder, {recursive:true, force:true}); }
console.log('Bookmark import tests passed');
