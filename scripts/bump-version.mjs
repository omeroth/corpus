#!/usr/bin/env node
// Version bumper — updates all four version surfaces atomically.
//
// Usage:
//   node scripts/bump-version.mjs 1.3.4
//   node scripts/bump-version.mjs 1.3.4 --ios 33 --android 42
//   npm run bump 1.3.4
//
// Surfaces (must stay in lockstep or the iOS update banner drifts):
//   1. index.html               — const APP_VERSION = '...';
//   2. www/index.html           — same (synced copy)
//   3. android/app/build.gradle — versionName "..." + versionCode NNN
//   4. ios/App/App.xcodeproj/project.pbxproj
//                               — MARKETING_VERSION = ...;
//                               — CURRENT_PROJECT_VERSION = NNN;
//                                 (both appear 2× — Debug + Release)
//
// Auto-increments iOS build (CURRENT_PROJECT_VERSION) and Android
// versionCode by 1 unless --ios / --android is passed.
//
// Refuses to write if any expected pattern is missing (partial bumps
// leave one platform behind — worse than not bumping). Refuses to lower
// a build number when overridden (Apple rejects non-monotonic builds).
//
// Deliberately does NOT touch version.json — that's the corpusapp.io-
// served file the update banner compares against, and it should only
// be bumped once the new release is actually live on the App Store.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = {
  indexHtml:      join(REPO, 'index.html'),
  wwwIndexHtml:   join(REPO, 'www/index.html'),
  androidGradle:  join(REPO, 'android/app/build.gradle'),
  iosPbxproj:     join(REPO, 'ios/App/App.xcodeproj/project.pbxproj'),
};

// --- args ---
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    ios:     { type: 'string' },
    android: { type: 'string' },
  },
});
const version = positionals[0];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/bump-version.mjs <version> [--ios N] [--android N]');
  console.error('       version must be semver x.y.z (e.g. 1.3.4)');
  process.exit(1);
}

// --- dirty-tree guard ---
// Refuse to run if any of the four version surfaces already has
// uncommitted changes. Catches an accidental second invocation before
// the first bump was committed — otherwise the auto-increment would
// silently step the build number twice (which happened during the
// 1.3.4 shakedown: builds landed at 43/34 instead of 42/33). Runs
// atomically before any file reads so a refusal writes nothing.
function isDirtySinceHead(absPath) {
  const rel = relative(REPO, absPath);
  try {
    const out = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', rel], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out.length > 0;
  } catch (e) {
    // git failure (not a repo, git missing, HEAD absent): don't block.
    // The guard is best-effort; the script's other refusals still apply.
    return false;
  }
}
const dirty = Object.entries(FILES)
  .filter(([, p]) => isDirtySinceHead(p))
  .map(([k, p]) => `  - ${k.padEnd(15)} (${relative(REPO, p)})`);
if (dirty.length) {
  console.error('bump-version: refusing to run — version surfaces have uncommitted changes:');
  console.error(dirty.join('\n'));
  console.error('');
  console.error('Commit or revert the pending bump first, then re-run.');
  console.error('(Silent double-invocation is exactly what this guard catches.)');
  process.exit(1);
}

// --- read current state ---
const APP_VERSION_RE       = /const APP_VERSION = '([\d.]+)';/;
const ANDROID_NAME_RE      = /versionName "([\d.]+)"/;
const ANDROID_CODE_RE      = /versionCode (\d+)/;
const IOS_MARKETING_RE     = /MARKETING_VERSION = ([\d.]+);/g;
const IOS_BUILD_RE         = /CURRENT_PROJECT_VERSION = (\d+);/g;

const indexHtml    = readFileSync(FILES.indexHtml, 'utf8');
const wwwIndexHtml = readFileSync(FILES.wwwIndexHtml, 'utf8');
const gradle       = readFileSync(FILES.androidGradle, 'utf8');
const pbxproj      = readFileSync(FILES.iosPbxproj, 'utf8');

function need(re, text, label) {
  const m = text.match(re);
  if (!m) throw new Error(`could not find ${label}`);
  return m[1];
}
function needAll(re, text, label) {
  const all = [...text.matchAll(re)].map(m => m[1]);
  if (!all.length) throw new Error(`could not find ${label}`);
  return all;
}

let current;
try {
  current = {
    indexAppVersion:    need(APP_VERSION_RE,       indexHtml,    'APP_VERSION in index.html'),
    wwwAppVersion:      need(APP_VERSION_RE,       wwwIndexHtml, 'APP_VERSION in www/index.html'),
    androidName:        need(ANDROID_NAME_RE,      gradle,       'versionName in build.gradle'),
    androidCode:        parseInt(need(ANDROID_CODE_RE, gradle,   'versionCode in build.gradle'), 10),
    iosMarketing:       needAll(IOS_MARKETING_RE,  pbxproj,      'MARKETING_VERSION in pbxproj'),
    iosBuild:           needAll(IOS_BUILD_RE,      pbxproj,      'CURRENT_PROJECT_VERSION in pbxproj'),
  };
} catch (e) {
  console.error('bump-version: ' + e.message + ' — refusing to write (would leave surfaces out of sync)');
  process.exit(1);
}

// Sanity-check iOS pairs match across configs.
const iosMarketingUnique = [...new Set(current.iosMarketing)];
const iosBuildUnique     = [...new Set(current.iosBuild)];
if (iosMarketingUnique.length > 1) {
  console.error('bump-version: iOS MARKETING_VERSION differs across configs: ' + current.iosMarketing.join(', ') + ' — fix by hand first');
  process.exit(1);
}
if (iosBuildUnique.length > 1) {
  console.error('bump-version: iOS CURRENT_PROJECT_VERSION differs across configs: ' + current.iosBuild.join(', ') + ' — fix by hand first');
  process.exit(1);
}
const curIosMarketing = iosMarketingUnique[0];
const curIosBuild     = parseInt(iosBuildUnique[0], 10);

// --- compute new build numbers ---
const newIosBuild     = values.ios     != null ? parseInt(values.ios, 10)     : curIosBuild + 1;
const newAndroidCode  = values.android != null ? parseInt(values.android, 10) : current.androidCode + 1;

if (Number.isNaN(newIosBuild) || Number.isNaN(newAndroidCode)) {
  console.error('bump-version: --ios / --android must be integers');
  process.exit(1);
}
if (newIosBuild < curIosBuild) {
  console.error(`bump-version: --ios ${newIosBuild} is lower than current ${curIosBuild}. Apple rejects non-monotonic builds. Refusing.`);
  process.exit(1);
}
if (newAndroidCode < current.androidCode) {
  console.error(`bump-version: --android ${newAndroidCode} is lower than current ${current.androidCode}. Google rejects non-monotonic versionCodes. Refusing.`);
  process.exit(1);
}

// --- write ---
writeFileSync(FILES.indexHtml,
  indexHtml.replace(APP_VERSION_RE, `const APP_VERSION = '${version}';`));
writeFileSync(FILES.wwwIndexHtml,
  wwwIndexHtml.replace(APP_VERSION_RE, `const APP_VERSION = '${version}';`));
writeFileSync(FILES.androidGradle,
  gradle
    .replace(ANDROID_NAME_RE, `versionName "${version}"`)
    .replace(ANDROID_CODE_RE, `versionCode ${newAndroidCode}`));
writeFileSync(FILES.iosPbxproj,
  pbxproj
    .replace(IOS_MARKETING_RE, `MARKETING_VERSION = ${version};`)
    .replace(IOS_BUILD_RE,     `CURRENT_PROJECT_VERSION = ${newIosBuild};`));

// --- summary ---
console.log('');
console.log('  index.html            APP_VERSION           ' + current.indexAppVersion + ' → ' + version);
console.log('  www/index.html        APP_VERSION           ' + current.wwwAppVersion   + ' → ' + version);
console.log('  android build.gradle  versionName           "' + current.androidName + '" → "' + version + '"');
console.log('  android build.gradle  versionCode           ' + current.androidCode + ' → ' + newAndroidCode);
console.log('  ios pbxproj           MARKETING_VERSION     ' + curIosMarketing + ' → ' + version + '  (×' + current.iosMarketing.length + ')');
console.log('  ios pbxproj           CURRENT_PROJECT_VER   ' + curIosBuild + ' → ' + newIosBuild + '  (×' + current.iosBuild.length + ')');
console.log('');
console.log('  ⚠  POST-APPROVAL STEP — version.json NOT touched by this bump.');
console.log('');
console.log('     Once Apple approves ' + version + ' and it goes live in the App Store, run:');
console.log('');
console.log('         npm run mark-live ' + version);
console.log('');
console.log('     version.json is what the iOS update banner compares against — bumping it');
console.log('     before the release is available would nudge users toward a version they');
console.log('     cannot download. Skipping the followup silently breaks the banner (this');
console.log('     got forgotten for the last eight releases, which is why mark-live now');
console.log('     exists as a dedicated command rather than a comment).');
console.log('');
