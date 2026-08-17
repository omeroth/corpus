#!/usr/bin/env node
// Validates the join between dialogue content and thinker records.
//
// For every day in corpusData / economicsData / psychologyData (as they
// exist), resolves day.thinkerId against THINKERS (Hebrew) and THINKERS_EN
// (English) and reports each of:
//   - days with no thinkerId
//   - days pointing at an id that exists in neither array
//   - thinkers present in one array and missing from the other
//   - subject mismatch (thinker.subject vs the source's subject)
//     [philosophy thinkers omit .subject by convention — see index.html:19370
//      for the runtime bucketing rule]
//   - portraits referenced but not present under ./images/
//
// Reverse check: thinkers present in either array but never referenced by
// any dialogue → they can never be unlocked and probably shouldn't ship.
//
// Extraction: reads index.html, plucks the four const declarations we care
// about by regex + balanced-brace scan, and evaluates each in an isolated
// vm sandbox. Doesn't load the rest of index.html (which would fail because
// it depends on the browser environment).
//
// Exits non-zero iff any errors are found (empty warnings alone are OK
// for staging, so you can wire this into CI without breaking on WIP
// thinker rosters).
//
// Usage:
//   node scripts/check-thinker-links.mjs
//
// Add subjects: extend SUBJECTS_TO_EXTRACT below when psychologyData or a
// fourth subject ships.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content');
const IMAGES_DIR = path.join(REPO_ROOT, 'images');

// Which per-subject data constants to look for and their canonical subject
// name. If a constant isn't declared yet (e.g. psychologyData pre-launch),
// the script just skips it silently — no error.
const SUBJECTS_TO_EXTRACT = [
  { constName: 'corpusData',     subject: 'philosophy' },
  { constName: 'economicsData',  subject: 'economics'  },
  { constName: 'psychologyData', subject: 'psychology' },
];

const THINKER_CONST_NAMES = ['THINKERS', 'THINKERS_EN'];

// ─── Extraction ──────────────────────────────────────────────────────────

// The data blobs live in content/*.js as of the 2026-08-17 split. Concat
// every .js under that dir so subject+thinker declarations across files
// are all searchable by the same balanced-brace scan below.
const scriptSrc = fs.readdirSync(CONTENT_DIR)
  .filter(f => f.endsWith('.js'))
  .map(f => fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8'))
  .join('\n;\n');

// Extract a single top-level `const NAME = <literal>;` where <literal> is
// either an object or array literal. Uses a balanced-brace scan that
// respects string boundaries (', ", `) so a `}` or `]` inside a string
// doesn't fool the depth counter.
function extractConstLiteral(source, name) {
  const re = new RegExp('\\bconst\\s+' + name + '\\s*=\\s*', 'g');
  const m = re.exec(source);
  if (!m) return null;
  const start = m.index + m[0].length;
  const openChar = source[start];
  if (openChar !== '{' && openChar !== '[') {
    throw new Error(`${name}: expected object or array literal, got ${JSON.stringify(openChar)}`);
  }
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escape = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (c === '\\') { escape = true; continue; }
      if (c === stringChar) { inString = false; }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) return source.substring(start, i + 1);
    }
  }
  throw new Error(`${name}: unbalanced ${openChar}`);
}

function evalLiteral(literal, name) {
  try {
    return vm.runInNewContext('(' + literal + ')');
  } catch (e) {
    throw new Error(`${name}: eval failed — ${e.message}`);
  }
}

const subjects = [];
for (const { constName, subject } of SUBJECTS_TO_EXTRACT) {
  const literal = extractConstLiteral(scriptSrc, constName);
  if (!literal) {
    console.log(`[extract] ${constName} not declared, skipping`);
    continue;
  }
  const value = evalLiteral(literal, constName);
  if (!value || !Array.isArray(value.weeks)) {
    console.warn(`[extract] ${constName} has no .weeks[], skipping`);
    continue;
  }
  subjects.push({ subject, constName, data: value });
}

const thinkers = {};
for (const name of THINKER_CONST_NAMES) {
  const literal = extractConstLiteral(scriptSrc, name);
  if (!literal) {
    console.error(`[extract] ${name} not found — aborting`);
    process.exit(2);
  }
  thinkers[name] = evalLiteral(literal, name);
  if (!Array.isArray(thinkers[name])) {
    console.error(`[extract] ${name} is not an array — aborting`);
    process.exit(2);
  }
}

const imageFiles = new Set(fs.readdirSync(IMAGES_DIR));

// ─── Indexes ─────────────────────────────────────────────────────────────

// id → thinker record. Runtime bucketing rule (index.html:19370):
//   t.subject === subject || (!t.subject && subject === 'philosophy')
// so philosophy thinkers omit .subject by convention; economics/psychology
// set it explicitly.
function buildIndex(arr) {
  const out = new Map();
  for (const t of arr) {
    if (t && t.id) out.set(t.id, t);
  }
  return out;
}
const heIndex = buildIndex(thinkers.THINKERS);
const enIndex = buildIndex(thinkers.THINKERS_EN);

function effectiveSubject(thinker) {
  return thinker && thinker.subject ? thinker.subject : 'philosophy';
}

// ─── Forward check: dialogue → thinker ───────────────────────────────────

const forwardIssues = [];   // hard errors — bad thinkerId, subject mismatch, missing portrait
const noThinkerRows = [];   // informational — reviewer eyeballs
const referencedIds = new Set();

for (const { subject, data } of subjects) {
  for (const week of data.weeks) {
    if (!week || !Array.isArray(week.days)) continue;
    for (const day of week.days) {
      if (!day) continue;
      const dayLabel = `${subject}: chapter ${week.id}, day ${day.id}`;
      const tid = day.thinkerId;

      if (!tid) {
        // No-thinkerId days are legitimate for chapter summaries, chapter
        // intros, critique days, and bonus "Behind the Headline" intros.
        // The isRecap flag on sections is set inconsistently across
        // authors, so we don't try to categorize automatically — the
        // reader handles no-thinker days fine and the reviewer will
        // eyeball this list. Not a hard error.
        const sections = Array.isArray(day.sections) ? day.sections : [];
        const hasRecapSection = sections.some(s => s && s.isRecap) ? 'yes' : 'no';
        noThinkerRows.push({
          where: dayLabel,
          title: (day.title || day.titleEn || '').slice(0, 60),
          hasRecapSection,
        });
        continue;
      }
      referencedIds.add(tid);

      const he = heIndex.get(tid);
      const en = enIndex.get(tid);
      if (!he && !en) {
        forwardIssues.push({
          issue: 'unknown thinkerId', where: dayLabel, thinkerId: tid,
          detail: 'not in THINKERS or THINKERS_EN',
        });
        continue;
      }
      if (!he) forwardIssues.push({ issue: 'HE thinker missing', where: dayLabel, thinkerId: tid, detail: 'exists in THINKERS_EN only' });
      if (!en) forwardIssues.push({ issue: 'EN thinker missing', where: dayLabel, thinkerId: tid, detail: 'exists in THINKERS only' });

      // Subject-match check (only meaningful when both arrays have the record).
      for (const [langLabel, rec] of [['HE', he], ['EN', en]]) {
        if (!rec) continue;
        const ts = effectiveSubject(rec);
        if (ts !== subject) {
          forwardIssues.push({
            issue: 'subject mismatch', where: dayLabel, thinkerId: tid,
            detail: `${langLabel} thinker.subject=${JSON.stringify(rec.subject || '(unset → philosophy)')}, dialogue subject=${subject}`,
          });
        }
      }

      // Portrait presence — check both HE and EN records since either could
      // point at a missing file. Same file usually shared across languages.
      const imgs = new Set();
      if (he && he.image) imgs.add(he.image);
      if (en && en.image) imgs.add(en.image);
      for (const imgPath of imgs) {
        const filename = imgPath.replace(/^\.?\/?images\//, '');
        if (!imageFiles.has(filename)) {
          forwardIssues.push({
            issue: 'portrait missing', where: dayLabel, thinkerId: tid,
            detail: `expected images/${filename}`,
          });
        }
      }
    }
  }
}

// ─── Reverse check: thinker → dialogue ───────────────────────────────────

const unreferenced = [];
const seen = new Set();
for (const [id, rec] of [...heIndex, ...enIndex]) {
  if (seen.has(id)) continue;
  seen.add(id);
  if (!referencedIds.has(id)) {
    unreferenced.push({
      id,
      subject: effectiveSubject(rec),
      inHE: heIndex.has(id),
      inEN: enIndex.has(id),
      name: (heIndex.get(id) && heIndex.get(id).name) || (enIndex.get(id) && enIndex.get(id).name) || '',
    });
  }
}

// ─── Cross-array consistency ─────────────────────────────────────────────

const arrayIssues = [];
for (const id of heIndex.keys()) {
  if (!enIndex.has(id)) {
    arrayIssues.push({ issue: 'in THINKERS, not THINKERS_EN', id, detail: heIndex.get(id).name || '' });
  }
}
for (const id of enIndex.keys()) {
  if (!heIndex.has(id)) {
    arrayIssues.push({ issue: 'in THINKERS_EN, not THINKERS', id, detail: enIndex.get(id).name || '' });
  }
}

// ─── Report ──────────────────────────────────────────────────────────────

function reportTable(title, rows) {
  console.log('\n=== ' + title + ' (' + rows.length + ') ===');
  if (rows.length === 0) { console.log('  (none)'); return; }
  console.table(rows);
}

const totalSubjects = subjects.map(s => s.subject).join(', ') || '(none)';
console.log(`Loaded subjects: ${totalSubjects}`);
console.log(`THINKERS: ${heIndex.size}, THINKERS_EN: ${enIndex.size}, referenced by dialogues: ${referencedIds.size}`);

reportTable('Days with no thinkerId (informational — reviewer eyeballs)', noThinkerRows);
reportTable('Forward-check errors (unknown id / subject mismatch / missing portrait)', forwardIssues);
reportTable('Cross-array consistency errors (HE ↔ EN)', arrayIssues);
reportTable('Unreferenced thinkers (never appear in any dialogue — warning only)', unreferenced);

const hardErrorCount = forwardIssues.length + arrayIssues.length;
if (hardErrorCount > 0) {
  console.error(`\nFAIL: ${hardErrorCount} hard error(s). Also: ${noThinkerRows.length} no-thinker day(s), ${unreferenced.length} unreferenced thinker(s).`);
  process.exit(1);
}
console.log(`\nOK: no hard errors. ${noThinkerRows.length} no-thinker day(s), ${unreferenced.length} thinker(s) unreferenced.`);
