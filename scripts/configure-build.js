'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { resolveRepository } = require('./release-config');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const config = structuredClone(manifest.build);
const releaseRequested = process.argv.includes('--release');
const repository = resolveRepository(root);

if (releaseRequested && !repository) {
  throw new Error('Set the public GitHub repository in update-config.json or VINYL_GITHUB_REPOSITORY to publish Vinyl updates.');
}

config.publish = repository ? [{
  provider: 'github',
  owner: repository.owner,
  repo: repository.repo,
  releaseType: 'draft'
}] : null;

fs.writeFileSync(path.join(root, 'builder.generated.json'), JSON.stringify(config, null, 2) + '\n');
console.log(repository
  ? `Vinyl update channel: https://github.com/${repository.owner}/${repository.repo}/releases`
  : 'Installer can be built, but no GitHub update channel is configured.');
