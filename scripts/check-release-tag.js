'use strict';

const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const tag = process.env.GITHUB_REF_NAME || process.argv[2] || '';
if (!tag || tag !== `v${manifest.version}`) {
  console.error(`The GitHub tag must match Vinyl's package version: v${manifest.version}; received ${tag || '(none)'}.`);
  process.exitCode = 1;
} else {
  console.log(`Release tag ${tag} matches package.json.`);
}
