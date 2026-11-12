'use strict';

const MAX_BOOKMARKS = 15000;

function decodeHTML(input) {
  const named = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', copy:'©', reg:'®' };
  return String(input || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const number = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : match;
    }
    return named[entity.toLowerCase()] || match;
  });
}

function cleanTitle(html) {
  return decodeHTML(String(html || '').replace(/<[^>]*>/g, '')).trim().slice(0, 160);
}

function safeURL(value) {
  try {
    const parsed = new URL(decodeHTML(value));
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch { return null; }
}

function parseNetscapeBookmarks(html) {
  if (typeof html !== 'string' || html.length > 8_000_000) throw new Error('Bookmark HTML file is too large.');
  if (!/<(?:!DOCTYPE\s+NETSCAPE-Bookmark-file-1|DL\b)/i.test(html)) throw new Error('This does not look like a Chrome bookmarks HTML export.');
  const roots = [];
  const stack = [roots];
  let pending = null;
  let count = 0;
  const token = /<DT\b[^>]*>\s*<H3\b[^>]*>([\s\S]*?)<\/H3\s*>|<DT\b[^>]*>\s*<A\b([^>]*)>([\s\S]*?)<\/A\s*>|<DL\b[^>]*>|<\/DL\s*>/gi;
  let match;
  while ((match = token.exec(html))) {
    const raw = match[0];
    if (/^<DL\b/i.test(raw)) {
      if (pending) { stack.push(pending.children); pending = null; }
      continue;
    }
    if (/^<\/DL/i.test(raw)) {
      if (stack.length > 1) stack.pop();
      pending = null;
      continue;
    }
    if (match[1] !== undefined) {
      if (++count > MAX_BOOKMARKS) throw new Error('Too many bookmarks in the export.');
      pending = { title: cleanTitle(match[1]) || 'Folder', children: [] };
      stack.at(-1).push(pending);
    } else if (match[2] !== undefined) {
      if (++count > MAX_BOOKMARKS) throw new Error('Too many bookmarks in the export.');
      const href = match[2].match(/\bHREF\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const url = href ? safeURL(href[1] ?? href[2] ?? href[3]) : null;
      if (url) stack.at(-1).push({ title: cleanTitle(match[3]), url });
      pending = null;
    }
  }
  return roots;
}

module.exports = { parseNetscapeBookmarks, decodeHTML, safeURL };
