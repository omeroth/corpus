#!/usr/bin/env node
// check-privacy-invariants — fails (exit 1) if the source tree contains
// anything that would break the App Store / Play Store privacy declaration.
//
// The Meta App Events SDK integration (see plugins/corpus-meta-events/) is
// configured to send app events with all cross-app-tracking capabilities
// disabled. The App Store Connect privacy label and Play Data Safety
// declaration BOTH declare every data type Meta receives as "NOT USED FOR
// TRACKING". That declaration is only true if five specific tracking flags
// stay off across the ENTIRE binary — one violation anywhere flips the
// whole-app label.
//
// A comment saying "don't do this" is easy to miss six months from now
// when someone bumps the Meta SDK or copies a snippet from Stack Overflow.
// This script is the load-bearing check. Run it before every store
// submission:  `npm run privacy-check`
//
// If a violation surfaces here, the required workflow is:
//   1. Update the App Store Connect privacy label FIRST (change the
//      relevant data types from "not used for tracking" to "used for
//      tracking", walk through Apple's re-declaration UI).
//   2. Update the Play Data Safety declaration in the Play Console.
//   3. Update get.corpusapp.io/privacy.html to disclose the new use.
//   4. Only THEN ship the code that introduced the violation.
//
// The alternative — shipping a build that violates the declared label —
// is an Apple Guideline 5.1.2 rejection reason and a Play policy violation.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

// Plugin source files legitimately contain the flag NAMES in their
// DO-NOT-CHANGE header comments (that's what the header is for). The
// code-pattern scan below excludes them; a separate positive-assertion
// check further down verifies these files still set the flags to their
// safe values, not just mention them.
const PLUGIN_FILES = new Set([
  'plugins/corpus-meta-events/ios/Sources/CorpusMetaEventsPlugin/CorpusMetaEventsPlugin.swift',
  'plugins/corpus-meta-events/android/src/main/java/com/corpusapp/metaevents/CorpusMetaEventsPlugin.java',
]);

// Patterns match actual code (assignments / calls), not natural-language
// mentions. Comments in this repo use narrative phrasing ("NEVER set X = true")
// but the pattern is strict enough that the flag-name-followed-by-literal
// only appears in real code. We still filter // line-comment matches as
// belt-and-braces via isCommented() below.
const CODE_PATTERNS = [
  { rule: 1, name: 'ATT authorization request',
    re: /requestTrackingAuthorization\s*[({]/ },
  { rule: 2, name: 'isAdvertiserTrackingEnabled = true (iOS Swift)',
    re: /isAdvertiserTrackingEnabled\s*=\s*true\b/ },
  { rule: 2, name: 'setAdvertiserTrackingEnabled(true) / :YES (iOS ObjC)',
    re: /setAdvertiserTrackingEnabled\s*[:(]\s*(YES|true)\b/ },
  { rule: 3, name: 'isAdvertiserIDCollectionEnabled = true (iOS Swift)',
    re: /isAdvertiserIDCollectionEnabled\s*=\s*true\b/ },
  { rule: 3, name: 'setAdvertiserIDCollectionEnabled(true) (Android / iOS ObjC)',
    re: /setAdvertiserIDCollectionEnabled\s*\(\s*true\s*\)/ },
  { rule: 4, name: '.setUserData(...) — Advanced Matching entry point',
    re: /\.setUserData\s*\(/ },
  { rule: 5, name: 'isAutoLogSubscriptionsEnabled = true (iOS Swift)',
    re: /isAutoLogSubscriptionsEnabled\s*=\s*true\b/ },
  { rule: 5, name: 'setAutoLogSubscriptionsEnabled(true) (Android)',
    re: /setAutoLogSubscriptionsEnabled\s*\(\s*true\s*\)/ },
];

// Structured-file (XML) checks. These carry the flags as element values
// where the code-pattern scan wouldn't fire. Each check names a "bad"
// pattern; if it appears in the file, that's a violation.
const STRUCTURED_CHECKS = [
  { file: 'ios/App/App/Info.plist', checks: [
      { name: 'FacebookAdvertiserIDCollectionEnabled must be <false/>',
        bad: /<key>FacebookAdvertiserIDCollectionEnabled<\/key>\s*<true\s*\/>/ },
      { name: 'FacebookAutoLogSubscriptionsEnabled must not be <true/>',
        bad: /<key>FacebookAutoLogSubscriptionsEnabled<\/key>\s*<true\s*\/>/ },
      { name: 'NSUserTrackingUsageDescription must not be present (would gate ATT)',
        bad: /<key>NSUserTrackingUsageDescription<\/key>/ },
    ] },
  { file: 'android/app/src/main/AndroidManifest.xml', checks: [
      { name: 'com.facebook.sdk.AdvertiserIDCollectionEnabled meta-data must be "false"',
        bad: /com\.facebook\.sdk\.AdvertiserIDCollectionEnabled[^>]+android:value\s*=\s*"true"/ },
      { name: 'AD_ID uses-permission must remain tools:node="remove"',
        // Match any uses-permission line naming AD_ID that does NOT carry
        // the remove marker on the same line. The current manifest strips
        // the permission via tools:node="remove"; any re-addition without
        // that marker means the app declares AD_ID access, which flips
        // rule 3 on Android regardless of the SDK-side flag.
        bad: /<uses-permission[^>]+AD_ID(?![^>]*tools:node\s*=\s*"remove")[^>]*>/ },
    ] },
];

// Positive assertions on plugin files themselves: not just "the flag NAME
// appears in the comment" but "the flag is actually being set to the safe
// value in the load() call". If a well-meaning refactor removes the safe-
// value line while leaving the comment intact, this catches it.
const POSITIVE_CHECKS = [
  { file: 'plugins/corpus-meta-events/ios/Sources/CorpusMetaEventsPlugin/CorpusMetaEventsPlugin.swift',
    checks: [
      { name: 'iOS plugin must set isAdvertiserTrackingEnabled = false',
        need: /isAdvertiserTrackingEnabled\s*=\s*false\b/ },
      { name: 'iOS plugin must set isAdvertiserIDCollectionEnabled = false',
        need: /isAdvertiserIDCollectionEnabled\s*=\s*false\b/ },
    ] },
  { file: 'plugins/corpus-meta-events/android/src/main/java/com/corpusapp/metaevents/CorpusMetaEventsPlugin.java',
    checks: [
      { name: 'Android plugin must call setAdvertiserIDCollectionEnabled(false)',
        need: /setAdvertiserIDCollectionEnabled\s*\(\s*false\s*\)/ },
    ] },
];

// Files where the code-pattern scan is skipped. Beyond the plugin files
// themselves, node_modules and www (index.html mirror) shouldn't be scanned
// — node_modules is third-party SDK code we don't ship as authored code,
// and www is a byte-mirror of index.html that would double-count matches.
function shouldScanForCodePatterns(file) {
  if (PLUGIN_FILES.has(file)) return false;
  // This script itself names each violating pattern in a human-readable
  // string (see CODE_PATTERNS.name above); scanning it would flag the
  // pattern-names as violations. Self-exclude for the same reason plugin
  // files are excluded — they legitimately mention what they're guarding
  // against.
  if (file === 'scripts/check-privacy-invariants.mjs') return false;
  if (file.startsWith('node_modules/')) return false;
  if (file.startsWith('www/'))          return false;
  if (file.endsWith('.png')) return false;
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return false;
  if (file.endsWith('.webp')) return false;
  if (file.endsWith('.zip'))  return false;
  if (file.endsWith('.svg'))  return false;
  return true;
}

// Detect if a match position on a line sits inside a // line comment.
// Sufficient for Swift/Java/JS/TS — our source langs. Doesn't handle
// /* … */ block comments perfectly, but the patterns above don't fire
// inside typical block-comment prose either.
function isCommented(line, matchIdx) {
  const s = line.indexOf('//');
  return s !== -1 && s < matchIdx;
}

function listTrackedFiles() {
  const out = execSync('git ls-files', { cwd: REPO, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

// ── Run ─────────────────────────────────────────────────────────────────

const violations = [];
const tracked = listTrackedFiles();

// 1. Code-pattern scan
for (const file of tracked) {
  if (!shouldScanForCodePatterns(file)) continue;
  const path = join(REPO, file);
  if (!existsSync(path)) continue;
  let content;
  try { content = readFileSync(path, 'utf8'); }
  catch (_) { continue; }
  const lines = content.split('\n');
  for (const { rule, name, re } of CODE_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(re);
      if (m && !isCommented(lines[i], m.index)) {
        violations.push({ file, line: i + 1, rule, name, text: lines[i].trim() });
      }
    }
  }
}

// 2. Structured-file scan
for (const { file, checks } of STRUCTURED_CHECKS) {
  const path = join(REPO, file);
  if (!existsSync(path)) continue;
  const content = readFileSync(path, 'utf8');
  for (const { name, bad } of checks) {
    const m = content.match(bad);
    if (m) {
      const line = content.slice(0, m.index).split('\n').length;
      violations.push({ file, line, rule: '—', name, text: (m[0] || '').trim().slice(0, 200) });
    }
  }
}

// 3. Positive assertions on plugin files
for (const { file, checks } of POSITIVE_CHECKS) {
  const path = join(REPO, file);
  if (!existsSync(path)) {
    violations.push({ file, line: 0, rule: '—', name: 'Plugin file missing — where did the safe defaults go?', text: '(file not found)' });
    continue;
  }
  const content = readFileSync(path, 'utf8');
  for (const { name, need } of checks) {
    if (!need.test(content)) {
      violations.push({ file, line: 0, rule: '—', name: 'MISSING: ' + name, text: '(safe-default assignment not found)' });
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('');
  console.log('  ✔  privacy-check passed — no tracking-label violations.');
  console.log('');
  console.log('     Scanned ' + tracked.length + ' tracked files against ' + CODE_PATTERNS.length + ' code patterns');
  console.log('     + ' + STRUCTURED_CHECKS.reduce((n, s) => n + s.checks.length, 0) + ' structured-file assertions');
  console.log('     + ' + POSITIVE_CHECKS.reduce((n, s) => n + s.checks.length, 0) + ' plugin positive-assertion checks.');
  console.log('');
  process.exit(0);
}

console.error('');
console.error('  ✘  privacy-check FAILED — ' + violations.length + ' violation(s):');
console.error('');
for (const v of violations) {
  const loc = v.line > 0 ? (v.file + ':' + v.line) : v.file;
  console.error('    ' + loc + '   (rule ' + v.rule + ')  ' + v.name);
  if (v.text) console.error('      ' + v.text.slice(0, 200));
  console.error('');
}
console.error('  These patterns would flip the App Store Connect / Play Data Safety');
console.error('  privacy declaration from "not used for tracking" to "used for tracking".');
console.error('');
console.error('  Required workflow if you intend to ship one of these changes:');
console.error('    1. Update the App Store Connect privacy label FIRST.');
console.error('    2. Update the Play Data Safety declaration.');
console.error('    3. Update get.corpusapp.io/privacy.html.');
console.error('    4. Only THEN commit / ship the code.');
console.error('');
console.error('  See the DO-NOT-CHANGE header comment in');
console.error('  plugins/corpus-meta-events/ios/Sources/CorpusMetaEventsPlugin/CorpusMetaEventsPlugin.swift');
console.error('  and its Java sibling for the enumerated rules.');
console.error('');
process.exit(1);
