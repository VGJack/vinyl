'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseRepository(value) {
  if (!value) return null;
  const cleaned = String(value).trim();
  const match = /^([A-Za-z0-9][A-Za-z0-9_.-]{0,99})\/([A-Za-z0-9_.-]{1,100})$/.exec(cleaned);
  if (!match || match[2] === '.' || match[2] === '..' || match[2].endsWith('.git')) {
    throw new Error('GitHub repository must be written as owner/repository (for example: myname/vinyl).');
  }
  return { owner: match[1], repo: match[2] };
}

function resolveRepository(root, env = process.env) {
  const configurationFile = path.join(root, 'update-config.json');
  const config = fs.existsSync(configurationFile)
    ? JSON.parse(fs.readFileSync(configurationFile, 'utf8'))
    : {};
  const chosen = env.VINYL_GITHUB_REPOSITORY || env.GITHUB_REPOSITORY || config.githubRepository || '';
  return parseRepository(chosen);
}

module.exports = { parseRepository, resolveRepository };
