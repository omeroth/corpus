#!/usr/bin/env node
// mark-live — bump version.json to a specific version after Apple approval.
//
// Usage:
//   node scripts/mark-live.mjs 1.3.4
//   npm run mark-live 1.3.4
//
// What it does:
//   1. Writes { "ios": "<version>" } to version.json (repo root).
//   2. Writes the same to www/version.json (Capacitor-shipped copy).
//      Doing both here rather than relying on `npm run sync-web` means
//      you don't need to remember a second command — mark-live is the
//      whole ceremony.
//   3. Refuses to lower the version. version.json controls the iOS
//      update banner (checkForUpdate compares APP_VERSION < version.json
//      .ios); lowering it would tell users on a newer build that an
//      "update" to an older version is available.
//
// Why this exists:
//   Between v1.0.5 (July 2026) and v1.3.6 (August 2026) the app shipped
//   eight iOS versions to the App Store. version.json never got bumped
//   after any of those approvals — so the in-app update banner has been
//   silently dead for months. The bump-version.mjs script deliberately
//   doesn't touch version.json (it can't know when Apple approves), so
//   the followup lived only in a comment and got skipped every time.
//   This command is the discrete post-approval ceremony that comment
//   was gesturing at.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = {
  root: join(REPO, 'version.json'),
  www:  join(REPO, 'www/version.json'),
};

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/mark-live.mjs <version>');
  console.error('       version must be semver x.y.z (e.g. 1.3.4)');
  console.error('');
  console.error('Run this ONLY after Apple approves the release. Bumping');
  console.error('version.json before the release is live nudges users toward');
  console.error('a version they cannot download.');
  process.exit(1);
}

// Semver-aware comparator: returns negative if a < b, positive if a > b, 0 if equal.
function cmpSemver(a, b) {
  const [aM, am, ap] = a.split('.').map(n => parseInt(n, 10));
  const [bM, bm, bp] = b.split('.').map(n => parseInt(n, 10));
  return (aM - bM) || (am - bm) || (ap - bp);
}

// Read current version.json — the repo-root copy is the source of truth;
// www/version.json is a sync target. If they diverge, warn but don't
// block (the write below will re-align them).
if (!existsSync(FILES.root)) {
  console.error('mark-live: version.json missing at repo root — refusing to create from nothing');
  process.exit(1);
}
let current;
try {
  current = JSON.parse(readFileSync(FILES.root, 'utf8')).ios;
} catch (e) {
  console.error('mark-live: version.json is not valid JSON: ' + e.message);
  process.exit(1);
}
if (!current || !/^\d+\.\d+\.\d+$/.test(current)) {
  console.error(`mark-live: version.json has malformed "ios" value: ${JSON.stringify(current)}`);
  process.exit(1);
}

const diff = cmpSemver(version, current);
if (diff < 0) {
  console.error(`mark-live: refusing to lower version.json from ${current} to ${version}.`);
  console.error('           This would tell users on newer builds that an older version is an "update".');
  console.error('           If you really need to lower it, edit version.json by hand.');
  process.exit(1);
}
if (diff === 0) {
  console.log(`mark-live: version.json is already at ${current}. Nothing to do.`);
  process.exit(0);
}

// Warn if www/version.json diverged before we overwrite it.
if (existsSync(FILES.www)) {
  try {
    const wwwCurrent = JSON.parse(readFileSync(FILES.www, 'utf8')).ios;
    if (wwwCurrent !== current) {
      console.warn(`mark-live: WARNING www/version.json (${wwwCurrent}) differs from root (${current}) — realigning both to ${version}.`);
    }
  } catch (e) { /* malformed www copy — we'll overwrite it below */ }
}

const payload = `{ "ios": "${version}" }\n`;
writeFileSync(FILES.root, payload);
writeFileSync(FILES.www,  payload);

console.log('');
console.log(`  version.json         ios  ${current} → ${version}`);
console.log(`  www/version.json     ios  ${current} → ${version}  (synced)`);
console.log('');
console.log(`  ✔  Marked ${version} as live.`);
console.log('');
console.log('     Next: commit + push both remotes so the served version.json updates');
console.log('     on corpusapp.io. The in-app update banner will fire on the next');
console.log('     app_opened for any user running APP_VERSION < ' + version + '.');
console.log('');
