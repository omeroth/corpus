// R41 D item 4 — share art empty audit.
//
// For every (thinker, subject) combo across philosophy / economics /
// psychology, check that the thinker has a resolvable image for that
// subject. The share image generator (scripts/generate-share-cards.mjs
// line 1680) skips thinkers with no image, which means _thinkerPortraitFile
// 404s and shareThinker falls through to URL-only (no art).
//
// Also check the share PNG files actually exist on disk (share/thinkers/
// portrait/{lang}/{stem}.png) for every (thinker, subject, lang) combo.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const REPO = '/Users/omeroth/CORPUS';
function extract(filename, varName) {
  const src = fs.readFileSync(path.join(REPO, 'content', filename), 'utf8');
  const re = new RegExp('(?:const|var|window\\.)\\s*' + varName + '\\s*=\\s*(\\{[\\s\\S]*)');
  const m = src.match(re);
  if (!m) throw new Error('no match for ' + varName + ' in ' + filename);
  const start = m[0].indexOf('{');
  // Balanced-brace scan from the first { of the assignment.
  let depth = 0, end = -1;
  const text = src.slice(src.indexOf(m[0]) + start);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error('unbalanced braces in ' + filename);
  const code = 'var __out = ' + text.slice(0, end) + '; __out;';
  const ctx = { console, Math, Date };
  vm.createContext(ctx);
  return vm.runInContext(code, ctx);
}

const corpusData    = extract('philosophy.js', 'corpusData');
const economicsData = extract('economics.js', 'economicsData');
const psychologyData = extract('psychology.js', 'psychologyData');

// THINKERS carries image/images per thinker.
const thinkersSrc = fs.readFileSync(path.join(REPO, 'content', 'thinkers.js'), 'utf8');
const thMatch = thinkersSrc.match(/const\s+THINKERS\s*=\s*(\[[\s\S]*?\n\]);/);
if (!thMatch) throw new Error('THINKERS not found');
const THINKERS = vm.runInNewContext('(' + thMatch[1] + ')');

function subjectsForThinker(t) {
  if (Array.isArray(t.subjects) && t.subjects.length) return t.subjects;
  return [t.subject || 'philosophy'];
}

function resolveImage(thinker, subject) {
  if (thinker.images && thinker.images[subject]) return thinker.images[subject];
  if (thinker.image) return thinker.image;
  return null;
}

const results = { noImage: [], missingFile: [], ok: 0 };
let total = 0;

for (const t of THINKERS) {
  if (!t || !t.id) continue;
  const subs = subjectsForThinker(t);
  for (const subject of subs) {
    total++;
    const img = resolveImage(t, subject);
    if (!img) {
      results.noImage.push({ id: t.id, subject });
      continue;
    }
    // Check the generated share PNG exists on disk.
    const stem = subs.length > 1 ? `${t.id}-${subject}` : t.id;
    for (const lang of ['en', 'he']) {
      const portPath = path.join(REPO, 'share', 'thinkers', 'portrait', lang, `${stem}.png`);
      if (!fs.existsSync(portPath)) {
        results.missingFile.push({ id: t.id, subject, lang, stem, expected: portPath.replace(REPO + '/', '') });
      }
    }
    results.ok++;
  }
}

console.log(`\nTotal (thinker × subject) combos: ${total}`);
console.log(`With a resolvable image:          ${results.ok}`);
console.log(`\nThinkers with NO image (skipped by generator):`);
if (results.noImage.length === 0) console.log('  (none)');
for (const r of results.noImage) console.log(`  ${r.id} (subject: ${r.subject})`);

console.log(`\nMissing share PNG files on disk (${results.missingFile.length}):`);
const byId = {};
for (const r of results.missingFile) {
  const k = r.id + ':' + r.subject;
  byId[k] = byId[k] || [];
  byId[k].push(r.lang);
}
for (const k of Object.keys(byId).sort()) {
  console.log(`  ${k}: missing [${byId[k].join(', ')}]`);
}

const fail = results.noImage.length > 0 || results.missingFile.length > 0;
process.exit(fail ? 1 : 0);
