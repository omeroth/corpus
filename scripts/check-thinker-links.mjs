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

// A thinker's full subject set. Primary `subject` (or the philosophy
// default) is always included; `subjects[]` extends membership so a
// dialogue in a secondary subject can reference the thinker without
// tripping the subject-mismatch check. Runtime bucketing (pantheon
// section, frame color, share-card palette) still uses `subject` alone
// — see index.html:14197 / 18804 and generate-share-cards.mjs.
function effectiveSubjects(thinker) {
  const primary = effectiveSubject(thinker);
  const extras = Array.isArray(thinker && thinker.subjects) ? thinker.subjects : [];
  const set = new Set([primary, ...extras]);
  return [...set];
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
      // Uses effectiveSubjects so a thinker with subjects=['economics','psychology']
      // can legitimately appear in dialogues of either subject.
      for (const [langLabel, rec] of [['HE', he], ['EN', en]]) {
        if (!rec) continue;
        const subs = effectiveSubjects(rec);
        if (!subs.includes(subject)) {
          forwardIssues.push({
            issue: 'subject mismatch', where: dayLabel, thinkerId: tid,
            detail: `${langLabel} thinker subjects=${JSON.stringify(subs)}, dialogue subject=${subject}`,
          });
        }
      }

      // Portrait presence — check both HE and EN records since either could
      // point at a missing file. Same file usually shared across languages.
      // Also checks every entry in a per-subject t.images{} map for
      // multi-subject thinkers (Kahneman etc).
      const imgs = new Set();
      const collect = (rec) => {
        if (!rec) return;
        if (rec.image) imgs.add(rec.image);
        if (rec.images && typeof rec.images === 'object') {
          for (const p of Object.values(rec.images)) {
            if (typeof p === 'string' && p) imgs.add(p);
          }
        }
      };
      collect(he); collect(en);
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

// ─── Quiz option shape check ─────────────────────────────────────────────
//
// Catches two shapes that render as broken quizzes without producing any
// runtime error, both of which shipped in psychology chapter 3 before this
// check existed:
//
//   1. Packed options: a single string holding all three answers with the
//      option letters inline (e.g. `'text A ב. text B ג. text C'`). The
//      renderer iterates options[] and creates one button per element, so a
//      packed size-1 array renders as one giant button with A/B/C letters
//      as content instead of chip labels. Caused by the psychology-ch3
//      transcribe pass predating the HE-option-splitter preprocessor.
//
//   2. HE/EN length mismatch: options.length !== optionsEn.length. Renderer
//      picks by state.lang so one language would silently show the wrong
//      button count. Any legitimate dialogue always mirrors 1:1.
//
// Both are hard errors — they mask as garbled UI on device, not as
// runtime exceptions, so nothing else in the pipeline surfaces them.

const HE_OPT_MARKER = /\s[בגד]\.\s/;    // ` ב. ` embedded in HE prose
const EN_OPT_MARKER = /\s[B-D]\.\s/;    // ` B. ` embedded in EN prose
const quizIssues = [];

function walkQuizzes(day, dayLabel) {
  const sections = Array.isArray(day.sections) ? day.sections : [];
  sections.forEach((sec, idx) => {
    if (!sec || sec.type !== 'quiz') return;
    const where = `${dayLabel}, section ${idx} (${sec.title || sec.titleEn || 'quiz'})`;
    const he = Array.isArray(sec.options) ? sec.options : [];
    const en = Array.isArray(sec.optionsEn) ? sec.optionsEn : [];
    if (he.length !== en.length) {
      quizIssues.push({
        issue: 'options length mismatch', where,
        detail: `options=${he.length}, optionsEn=${en.length}`,
      });
    }
    he.forEach((s, i) => {
      if (typeof s === 'string' && HE_OPT_MARKER.test(s)) {
        quizIssues.push({
          issue: 'HE option contains letter marker', where,
          detail: `[${i}] "${s.slice(0, 100)}"…`,
        });
      }
    });
    en.forEach((s, i) => {
      if (typeof s === 'string' && EN_OPT_MARKER.test(s)) {
        quizIssues.push({
          issue: 'EN option contains letter marker', where,
          detail: `[${i}] "${s.slice(0, 100)}"…`,
        });
      }
    });
    if (he.length < 2 || en.length < 2) {
      quizIssues.push({
        issue: 'quiz has fewer than 2 options', where,
        detail: `options=${he.length}, optionsEn=${en.length}`,
      });
    }
  });
}

for (const { subject, data } of subjects) {
  for (const week of data.weeks) {
    if (!week || !Array.isArray(week.days)) continue;
    for (const day of week.days) {
      if (!day) continue;
      walkQuizzes(day, `${subject}: chapter ${week.id}, day ${day.id}`);
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

// ─── Tag-balance check ──────────────────────────────────────────────────
//
// Walks every string field in every loaded const and flags:
//   - HTML tags leaking into text-only fields (title/attr/name/etc.,
//     rendered as textContent by the app, so raw <strong> shows as
//     literal text). Root cause pattern: a bold-emphasis pass that
//     wrapped a phrase happened to hit its first occurrence inside a
//     title, not the body copy.
//   - Malformed / unbalanced <strong> in HTML-rendering fields
//     (content/quote/explanation/etc.): mismatched opens/closes,
//     stray closes, missing spaces, half-tags. These render as
//     visible garbage even if the browser tries to fix them.
//
// The rule: title/attr-style fields must have zero tags. HTML fields
// must have equal open/close counts AND proper nesting (stack empties
// at end).

// Fields whose values are rendered as textContent (or interpolated into
// a JS text attribute like `alt=`) in at least one code path in
// index.html. Any HTML in these fields renders as literal text and
// leaks. Audit performed by grepping for each field's render sinks:
//
//   Quiz fields — reader uses qText.textContent = q.question (line
//     14171), so question / questionEn leak tags. options and
//     explanation currently interpolate into an innerHTML template in
//     the main reader (so tags *would* render), but they're kept
//     plain-text here for two reasons: (a) reduces XSS surface on
//     unescaped ${text} interpolation; (b) makes future renderer
//     refactors safe by default.
//
//   Thinker fields — thinker-modal uses textContent for name/era/bio/
//     quote (lines 13931, 13941, 14648, 16187, 16201). Cards mix
//     innerHTML and textContent, so plain-text is the safe policy.
//
//   Content-day / week / section titles — mixed innerHTML/textContent
//     sinks (share cards, lesson list, section headings). Plain-text.
//
//   image / id / emoji / attr — never HTML.
const TEXT_ONLY_FIELDS = new Set([
  // section-base / day / week text fields
  'title', 'titleEn', 'subtitle', 'subtitleEn',
  // thinker refs on days
  'thinker', 'thinkerEn',
  // thinker records
  'name', 'era', 'bio',
  // per-record quote (not source-section quote — that's HTML-safe)
  // Handled via array/parent context: only THINKERS/THINKERS_EN
  // records' `quote` field is text-only. Source sections use `quote`
  // as HTML-capable. Since walker checks by field name only, we
  // exclude 'quote' here and let the section-source path stay HTML.
  // Thinker cards render t.quote via textContent (16201) but our
  // ~500-line thinker records have short one-line quotes without
  // <strong>, so the check catches accidental additions.
  // (Adding 'quote' to this set would also flag every source section.)
  // Quiz question is textContent (reader line 14171) — the only
  // genuine leak. options/optionsEn and explanation/explanationEn
  // interpolate into innerHTML templates (line 14179 for options,
  // 14457/14484 for explanation), so tags in them render as intended
  // emphasis; stripping them would delete visible bold from live
  // content. If a future refactor swaps those sinks to textContent,
  // add the fields here and strip in one pass.
  'question', 'questionEn',
  // Attribution / metadata
  'attr', 'attrEn', 'emoji', 'image', 'id',
]);

// Paragraph tags are used as a separator convention (`</p><p>` between
// paragraphs; the outer <p> is added by the renderer). They aren't real
// markup we need to balance, so we exclude them from the stack check.
// Same for <br> (self-closing separator).
const IGNORE_TAGS = new Set(['p', 'br']);

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
// Anything that looks like a half-tag (no closing `>` before EOL/next `<`)
const HALF_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9]*(?![^<]*>)/g;

const tagIssues = [];

function checkString(str, path, isTextOnly) {
  if (!str) return;
  if (isTextOnly) {
    // Any HTML-like tag in a text-only field is a leak.
    const anyTag = str.match(TAG_RE);
    if (anyTag) {
      tagIssues.push({
        issue: 'html-in-text-field', where: path,
        detail: anyTag.join(' ') + ' — full: ' + str.slice(0, 60),
      });
    }
    return;
  }
  // HTML-rendering field: check balance + nesting for formatting tags
  // (<strong>, <em>, etc). Paragraph separator tags are ignored per
  // the IGNORE_TAGS set.
  const stack = [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(str))) {
    const [, slash, name, extra] = m;
    const lc = name.toLowerCase();
    if (IGNORE_TAGS.has(lc)) continue;
    if (extra && extra.trim()) {
      tagIssues.push({ issue: 'unexpected-attr', where: path, detail: m[0] });
    }
    if (slash) {
      const top = stack.pop();
      if (top !== lc) {
        tagIssues.push({
          issue: 'unmatched-close', where: path,
          detail: `</${name}> at ${m.index}; stack top was ${top || '(empty)'}`,
        });
      }
    } else {
      stack.push(lc);
    }
  }
  if (stack.length) {
    tagIssues.push({ issue: 'unclosed', where: path, detail: 'left open: ' + stack.join(', ') });
  }
  const half = str.match(HALF_TAG_RE);
  if (half) tagIssues.push({ issue: 'half-tag', where: path, detail: half.join(' ') });
  // Literal `*` in any content string. The bold pass converts
  // markdown `*emphasis*` to <strong>…</strong>; an orphaned `*`
  // that survives is either a paired-marker that lost its partner
  // (render as literal on device) or noise. Flag both. `attr` was
  // the historical exception because economics used `*Book Title*`
  // italics markers — retired 2026-08-19, so no field is exempt.
  const strayStar = str.match(/\*/g);
  if (strayStar) {
    tagIssues.push({
      issue: 'stray-asterisk', where: path,
      detail: `${strayStar.length}× \`*\` in "${str.slice(0, 80)}"…`,
    });
  }
}

function walk(obj, path, textCtx) {
  // textCtx propagates through arrays so options[] elements inherit
  // their parent field's text-only status (options/optionsEn are text
  // arrays; without propagation, the string elements would default to
  // HTML-safe and miss tag leaks).
  if (obj == null || typeof obj === 'string') {
    if (typeof obj === 'string') checkString(obj, path, !!textCtx);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, `${path}[${i}]`, textCtx));
    return;
  }
  if (typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    walk(obj[k], `${path}.${k}`, TEXT_ONLY_FIELDS.has(k));
  }
}

for (const { subject, constName, data } of subjects) {
  walk(data, `${constName} (${subject})`);
}
walk(thinkers.THINKERS, 'THINKERS');
walk(thinkers.THINKERS_EN, 'THINKERS_EN');

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
reportTable('Tag-balance errors (HTML in text-only fields / malformed / unclosed <strong>)', tagIssues);
reportTable('Quiz option shape errors (packed / length mismatch / too few)', quizIssues);
reportTable('Unreferenced thinkers (never appear in any dialogue — warning only)', unreferenced);

const hardErrorCount = forwardIssues.length + arrayIssues.length + tagIssues.length + quizIssues.length;
if (hardErrorCount > 0) {
  console.error(`\nFAIL: ${hardErrorCount} hard error(s). Also: ${noThinkerRows.length} no-thinker day(s), ${unreferenced.length} unreferenced thinker(s).`);
  process.exit(1);
}
console.log(`\nOK: no hard errors. ${noThinkerRows.length} no-thinker day(s), ${unreferenced.length} thinker(s) unreferenced.`);
