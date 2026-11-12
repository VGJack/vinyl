'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { getUpdateFeed } = require('../updates');
const root = path.resolve(__dirname, '..');
assert.equal(getUpdateFeed({ isPackaged:false, getAppPath:()=>root }), null);
console.log('Update configuration tests passed');
