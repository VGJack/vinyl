'use strict';
const assert = require('node:assert/strict');
const { parseRepository, resolveRepository } = require('../scripts/release-config');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
assert.deepEqual(parseRepository('owner/vinyl'), { owner: 'owner', repo: 'vinyl' });
assert.deepEqual(parseRepository('my-team/Vinyl.Browser'), { owner: 'my-team', repo: 'Vinyl.Browser' });
assert.equal(parseRepository(''), null);
for (const invalid of ['https://github.com/owner/vinyl', 'vinyl', 'owner/vinyl/other', '../vinyl', 'owner/vinyl.git']) {
  assert.throws(() => parseRepository(invalid), /repository/);
}
assert.deepEqual(resolveRepository(root, { GITHUB_REPOSITORY: 'example/Vinyl' }), { owner: 'example', repo: 'Vinyl' });
assert.deepEqual(resolveRepository(root, { VINYL_GITHUB_REPOSITORY: 'another/Vinyl' }), { owner: 'another', repo: 'Vinyl' });
console.log('GitHub release configuration tests passed');
