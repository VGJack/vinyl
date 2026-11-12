'use strict';
const assert = require('node:assert/strict');
const {parseNewsRss,decodeXml,weatherLabel} = require('../home-data');
assert.equal(decodeXml('A &amp; B &#8212; &lt;example&gt;'),'A & B — <example>');
const news = parseNewsRss(`<rss><channel><item><title><![CDATA[Story &amp; more - The Paper]]></title><link>https://news.google.com/rss/articles/abc</link><source>The Paper</source><pubDate>${new Date().toUTCString()}</pubDate></item><item><title>Invalid</title><link>javascript:alert(1)</link></item></channel></rss>`);
assert.equal(news.length,1);
assert.equal(news[0].title,'Story & more');
assert.equal(weatherLabel(61),'Light rain');
console.log('Home feeds parsing passed');
