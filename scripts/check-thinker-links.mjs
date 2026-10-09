#!/usr/bin/env node
// Validates the join between dialogue content and thinker records,
// plus the surfacing layer that exposes those records to the app.
//
// Content-side checks:
//   - days with no thinkerId
//   - days pointing at an id that exists in neither THINKERS array
//   - thinkers present in one language array and missing from the other
//   - subject mismatch (thinker.subject vs the source's subject)
//     [philosophy thinkers omit .subject by convention — see index.html:19370
//      for the runtime bucketing rule]
//   - portraits referenced but not present under ./images/
//   - quiz option shape (packed options, HE/EN length mismatch, too few)
//   - CAROUSEL_ORDER coverage (missing / unknown / duplicate ids)
//   - tag balance in text-only vs HTML-rendering fields
//
// Surfacing check (added after the ch5 Freedom-of-Choice regression):
//   - every chapter present in content/*.js surfaces through getW()
//   - every id getW() returns has a backing content entry
//   - no duplicate ids in the surfaced output
// Catches the class of bug where content is correct but the home-screen
// data pipeline silently drops it.
//
// Correct-answer distribution check (added after the rebalance pass):
//   - no single correct-letter > 50% of a chapter's 3-option quizzes
//   - no run of 4+ identical correct answers within a chapter
// Catches the "always B" authoring template the source documents keep
// arriving with — 14-17 of 21 correct answers at B is the baseline.
//
// Distractor length-signature check (added after the length audit):
//   - no new chapter where the correct option is strict-longest in more
//     than 60% of its 3-option quizzes (chance baseline: 33%)
// Catches the "long correct answer, short dismissive wrongs" authoring
// template. Grandfathered allowlist exempts chapters that pre-date the
// rule, pending a per-chapter distractor rewrite.
//
// HTML entity check (added after the &quot; audit):
//   - no HTML entity (&quot; &amp; &lt; &gt; &#39; &nbsp; or numeric)
//     may appear in any content string field
// Content strings are data, not HTML. Escaping belongs in the render
// path. Scoped to every string field across the four content files.
//
// Reverse content check: thinkers present in either array but never
// referenced by any dialogue → they can never be unlocked and probably
// shouldn't ship.
//
// Extraction: reads index.html, plucks the const declarations and the
// getW() function body by regex + balanced-brace scan (comment- and
// string-aware), and evaluates in an isolated vm sandbox. Doesn't load
// the rest of index.html (which would fail because it depends on the
// browser environment).
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
const INDEX_HTML = path.join(REPO_ROOT, 'index.html');

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
// respects string boundaries (', ", `) AND skips // + /* */ comments so
// braces / quotes inside comments don't fool the depth counter. The
// comment-skipping was added on 2026-09-29 after a `//` comment
// containing `Richard Howard\'s` (a spurious escape) caused the scanner
// to treat the rest of the file as a JS string. Any content file with
// commentary that includes apostrophes, unbalanced quotes, or braces
// would have failed the same way.
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
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i++; }
      continue;
    }
    if (escape) { escape = false; continue; }
    if (inString) {
      if (c === '\\') { escape = true; continue; }
      if (c === stringChar) { inString = false; }
      continue;
    }
    // Comment starts — only recognized outside strings.
    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
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

// ─── CAROUSEL_ORDER extraction ──────────────────────────────────────────
//
// The order-list lives in index.html (not content/) and drives the home
// carousel + the pantheon grid. A thinker missing from it is invisible
// on both surfaces even if their dialogue, dictionary entry, share card,
// and reveal render fine — a silent gap that shipped for Foucault before
// this check existed (2026-09-29). Extract with the same balanced-brace
// scanner used above.
let carouselOrder = null;
try {
  const indexSrc = fs.readFileSync(INDEX_HTML, 'utf8');
  const literal = extractConstLiteral(indexSrc, 'CAROUSEL_ORDER');
  if (!literal) {
    console.warn('[extract] CAROUSEL_ORDER not found in index.html — skipping order-list check');
  } else {
    carouselOrder = evalLiteral(literal, 'CAROUSEL_ORDER');
  }
} catch (e) {
  console.warn('[extract] CAROUSEL_ORDER extraction failed: ' + e.message);
}

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

// ─── CAROUSEL_ORDER coverage check ──────────────────────────────────────
//
// Every thinker present in the dictionary (either language) must be listed
// in CAROUSEL_ORDER[subject] for each of their effective subjects. Every id
// listed in CAROUSEL_ORDER must exist in both dictionary arrays. Duplicate
// ids within one subject's array are also flagged — they'd render the
// pantheon cell twice.
//
// Multi-subject rule: effectiveSubjects() returns primary + subjects[], so a
// thinker with subject='economics' + subjects=['psychology'] must appear
// in both economics and psychology arrays. The runtime bucketing at
// index.html:24989 iterates CAROUSEL_ORDER[subject] once per subject render,
// so an omission is silent — nothing else in the pipeline surfaces it.

const orderIssues = [];
if (carouselOrder && typeof carouselOrder === 'object') {
  // Forward: every dictionary thinker → present in CAROUSEL_ORDER[subject]
  // for each of their effective subjects.
  const allIds = new Set([...heIndex.keys(), ...enIndex.keys()]);
  for (const id of allIds) {
    const rec = heIndex.get(id) || enIndex.get(id);
    if (!rec) continue; // extraction sanity — can't happen given how allIds is built
    const subs = effectiveSubjects(rec);
    for (const subject of subs) {
      const order = carouselOrder[subject];
      if (!Array.isArray(order)) {
        orderIssues.push({
          issue: 'CAROUSEL_ORDER missing subject key',
          id, detail: `subject=${subject} has no array in CAROUSEL_ORDER`,
        });
        continue;
      }
      if (!order.includes(id)) {
        orderIssues.push({
          issue: 'thinker missing from CAROUSEL_ORDER',
          id, detail: `expected in CAROUSEL_ORDER.${subject} (thinker: ${rec.name || ''})`,
        });
      }
    }
  }
  // Reverse: every id in CAROUSEL_ORDER → present in both dictionaries.
  // Also: duplicates within one subject's array.
  for (const [subject, order] of Object.entries(carouselOrder)) {
    if (!Array.isArray(order)) continue;
    const seenIds = new Set();
    for (const id of order) {
      if (seenIds.has(id)) {
        orderIssues.push({
          issue: 'duplicate id in CAROUSEL_ORDER',
          id, detail: `subject=${subject}`,
        });
      }
      seenIds.add(id);
      if (!heIndex.has(id)) {
        orderIssues.push({
          issue: 'CAROUSEL_ORDER id missing from THINKERS',
          id, detail: `subject=${subject}`,
        });
      }
      if (!enIndex.has(id)) {
        orderIssues.push({
          issue: 'CAROUSEL_ORDER id missing from THINKERS_EN',
          id, detail: `subject=${subject}`,
        });
      }
    }
  }
}

// ─── Correct-answer distribution check ────────────────────────────────
//
// Across the catalogue, every source document the authors send has had
// 14-17 of 21 correct answers at option B. Picking B every time scores
// well above chance — the whole quiz surface loses meaning. Once the
// rebalance pass is done, this check keeps the catalogue from drifting
// back. Each new chapter has to be shaped at authoring time (or
// rebalanced before merge) rather than caught weeks later by a user
// noticing the pattern.
//
// Rules (hard errors):
//   - Any letter above 50% of the chapter's quizzes.
//   - Any run of 4 or more identical consecutive correct answers
//     within a single chapter.
// Counts every quiz with 3 options (True/False and other shapes are
// excluded from the share-of-letter rule; they'd distort it unfairly).
// Run detection uses all quizzes to catch "always B" patterns that
// span dialogue types.

const distributionIssues = [];
for (const { subject, data } of subjects) {
  if (!Array.isArray(data.weeks)) continue;
  for (const week of data.weeks) {
    if (!week || !Array.isArray(week.days) || week.days.length === 0) continue;
    const abcLetters = []; // only 3-option quizzes
    const allLetters = []; // all quizzes (for run detection)
    for (const day of week.days) {
      if (!day || !Array.isArray(day.sections)) continue;
      for (const sec of day.sections) {
        if (!sec || sec.type !== 'quiz') continue;
        const letter = 'ABC'[sec.correctIndex];
        if (!letter) continue;
        allLetters.push(letter);
        if (Array.isArray(sec.options) && sec.options.length === 3) abcLetters.push(letter);
      }
    }
    if (abcLetters.length === 0) continue;
    // Share-of-letter rule
    const counts = { A: 0, B: 0, C: 0 };
    for (const l of abcLetters) counts[l]++;
    for (const [letter, n] of Object.entries(counts)) {
      const share = n / abcLetters.length;
      if (share > 0.50) {
        distributionIssues.push({
          issue: 'correct-letter share > 50%',
          where: `${subject} chapter ${week.id}`,
          detail: `${letter}=${n}/${abcLetters.length} (${Math.round(share * 100)}%). ` +
                  `Rebalance so no single letter exceeds 50%.`,
        });
      }
    }
    // Run detection on all quizzes (both ABC and TF, so a TF run
    // between ABC answers still contributes).
    let runLetter = null, runLen = 0, runStart = 0;
    for (let i = 0; i <= allLetters.length; i++) {
      const l = allLetters[i];
      if (l === runLetter) {
        runLen++;
      } else {
        if (runLen >= 4) {
          distributionIssues.push({
            issue: 'run of 4+ identical correct answers',
            where: `${subject} chapter ${week.id}`,
            detail: `${runLetter}×${runLen} starting at quiz #${runStart + 1} ` +
                    `(sequence: ${allLetters.join('')}). ` +
                    `Interleave the correct-answer position so no letter streaks ≥ 4.`,
          });
        }
        runLetter = l;
        runLen = 1;
        runStart = i;
      }
    }
  }
}

// ─── Distractor length-signature check ──────────────────────────────
//
// A reader who picks the longest option scores ~83% across the current
// catalogue, against a 33% chance baseline. The pattern comes from the
// authoring source: correct answers are long and nuanced, wrong answers
// are short and dismissive. Position rebalance (above) didn't close
// this — it just moved the correct TEXT to a different slot without
// shortening it.
//
// Rule: if more than 60% of a chapter's 3-option quizzes have the
// correct option as the strict longest, fail. 60% is roughly 2× chance
// and leaves authors room for natural variance while catching severe
// cases (bonus1 shipped at 100%). Checks both HE and EN; either
// exceeding fires the error.
//
// Grandfather list: every chapter present in the catalogue when this
// rule was added. The fix for grandfathered chapters is a content
// rewrite of the distractors — a separate workstream, scoped
// chapter-by-chapter. When a chapter has been rewritten, remove its
// id from GRANDFATHER_LENGTH_CHECK so it starts being enforced. New
// chapters not in the list are enforced by default.
//
// Authoring guidance for distractors lives in AUTHORING.md at repo
// root. The thresholds here match what the guidance tells authors.
const LENGTH_RULE_THRESHOLD = 0.60;
const GRANDFATHER_LENGTH_CHECK = new Set([
  'philosophy:1', 'philosophy:2', 'philosophy:3', 'philosophy:4',
  'philosophy:5', 'philosophy:bonus1',
  'economics:1',  'economics:2',  'economics:3',  'economics:4',
  'economics:5',  'economics:6',  'economics:bonusEcon1',
  'psychology:1', 'psychology:2', 'psychology:3', 'psychology:4',
  'psychology:5', 'psychology:6', 'psychology:bonusPsy1',
]);

const lengthIssues = [];
for (const { subject, data } of subjects) {
  if (!Array.isArray(data.weeks)) continue;
  for (const week of data.weeks) {
    if (!week || !Array.isArray(week.days) || week.days.length === 0) continue;
    const key = `${subject}:${week.id}`;
    if (GRANDFATHER_LENGTH_CHECK.has(key)) continue;
    let total = 0, heLongest = 0, enLongest = 0;
    for (const day of week.days) {
      if (!day || !Array.isArray(day.sections)) continue;
      for (const sec of day.sections) {
        if (!sec || sec.type !== 'quiz') continue;
        if (!Array.isArray(sec.options) || sec.options.length !== 3) continue;
        if (!Array.isArray(sec.optionsEn) || sec.optionsEn.length !== 3) continue;
        total++;
        const heLens = sec.options.map(s => (s || '').length);
        const enLens = sec.optionsEn.map(s => (s || '').length);
        const heWrong = heLens.filter((_, i) => i !== sec.correctIndex);
        const enWrong = enLens.filter((_, i) => i !== sec.correctIndex);
        if (heLens[sec.correctIndex] > Math.max(...heWrong)) heLongest++;
        if (enLens[sec.correctIndex] > Math.max(...enWrong)) enLongest++;
      }
    }
    if (total === 0) continue;
    const hePct = heLongest / total;
    const enPct = enLongest / total;
    if (hePct > LENGTH_RULE_THRESHOLD) {
      lengthIssues.push({
        issue: 'correct option is strict longest in > 60% of quizzes',
        where: `${subject} chapter ${week.id} (HE)`,
        detail: `${heLongest}/${total} (${Math.round(hePct * 100)}%). ` +
                `Rewrite wrong options to match correct-option length and specificity. See AUTHORING.md.`,
      });
    }
    if (enPct > LENGTH_RULE_THRESHOLD) {
      lengthIssues.push({
        issue: 'correct option is strict longest in > 60% of quizzes',
        where: `${subject} chapter ${week.id} (EN)`,
        detail: `${enLongest}/${total} (${Math.round(enPct * 100)}%). ` +
                `Rewrite wrong options to match correct-option length and specificity. See AUTHORING.md.`,
      });
    }
  }
}

// ─── HTML entity check ────────────────────────────────────────────────
//
// Content strings are data, not HTML. Any HTML entity (&quot; &amp;
// &lt; &gt; &#39; &nbsp; or numeric &#NNN;/&#xNN;) in a content string
// is a bug: either the field is rendered via textContent and the user
// sees the literal entity (we saw this in quiz question text, where
// `&quot;` showed as `&quot;` on screen), or the field happens to be
// rendered via innerHTML today and the entity decodes correctly — but
// that's luck, not correctness. The moment a render path is changed
// from innerHTML to textContent, every entity in that field surfaces.
//
// Fix for authors: write the literal character in the source. Hebrew
// source quotes use ״ (gershayim); scare quotes and English quotes
// use ASCII ". If a field needs an actual `&` in displayed text, the
// source should contain a literal `&` and the render path handles it.
// Escaping belongs in the render path, never in the data.
//
// Scope: every string field in every loaded content constant plus
// THINKERS / THINKERS_EN. Already covered by the TAG_RE walker above
// in a limited way (half-tag detection), but entities are a different
// class of mistake — they're well-formed HTML that still shouldn't
// be in the source.

const ENTITY_RE = /&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/g;
const entityIssues = [];

function walkEntities(obj, path) {
  if (obj == null) return;
  if (typeof obj === 'string') {
    const matches = obj.match(ENTITY_RE);
    if (matches) {
      // One row per unique entity in this string, with the count + a
      // short context snippet so the reviewer sees what to fix.
      const counts = {};
      for (const m of matches) counts[m] = (counts[m] || 0) + 1;
      for (const [entity, n] of Object.entries(counts)) {
        const idx = obj.indexOf(entity);
        const before = obj.substring(Math.max(0, idx - 20), idx);
        const after  = obj.substring(idx + entity.length, idx + entity.length + 20);
        entityIssues.push({
          issue: 'html entity in content',
          where: path, detail: `${entity} ×${n} — "…${before}[${entity}]${after}…"`,
        });
      }
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkEntities(v, path + '[' + i + ']'));
    return;
  }
  if (typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) walkEntities(obj[k], path + '.' + k);
}

for (const { subject, constName, data } of subjects) {
  walkEntities(data, `${constName} (${subject})`);
}
walkEntities(thinkers.THINKERS, 'THINKERS');
walkEntities(thinkers.THINKERS_EN, 'THINKERS_EN');

// ─── Chapter surfacing check (getW ↔ content) ──────────────────────────
//
// The content validator used to inspect only the content files. That
// caught malformed dialogues, broken thinker joins, carousel coverage
// gaps, etc. — but not whether the surfacing layer (getW() in
// index.html) actually exposed every chapter present in the content.
//
// Context: philosophy's getW() branch used to hand-roll each chapter
// (week1..week4 + bonusWeek1 + comingSoonChapters). A populated chapter
// without an explicit constructor and without a comingSoon:true flag
// fell through every bucket. Freedom of Choice (ch5) shipped as such
// and was invisible on home for a release cycle. The validator was
// green the whole time because the content file was correct.
//
// This check runs the real getW() against the real content files,
// then asserts the surfaced chapter-id set equals the content-file
// chapter-id set, per subject. Catches:
//   - populated chapter in content but not surfaced (the ch5 bug)
//   - coming-soon chapter in content but not surfaced
//   - orphan id in getW output that doesn't exist in content
//   - any future per-subject branch that drops a chapter
//
// Extraction technique: same balanced-brace scan the validator already
// uses on CAROUSEL_ORDER / WEEKS / etc, extended to pull `function foo
// (...) { ... }` declarations. Runs in a vm sandbox with just the
// loaded data constants + a minimal state shim; no DOM, no fetch.

function extractFunctionDecl(source, name) {
  const re = new RegExp('\\bfunction\\s+' + name + '\\s*\\(', 'g');
  const m = re.exec(source);
  if (!m) return null;
  const start = m.index;
  const bodyOpen = source.indexOf('{', start);
  if (bodyOpen < 0) return null;
  // Same hardened scan as extractConstLiteral — respects strings,
  // template literals, and // / /* */ comments so braces inside them
  // don't confuse the depth counter.
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escape = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = bodyOpen; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i++; }
      continue;
    }
    if (escape) { escape = false; continue; }
    if (inString) {
      if (c === '\\') { escape = true; continue; }
      if (c === stringChar) { inString = false; }
      continue;
    }
    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return source.substring(start, i + 1);
    }
  }
  throw new Error(`${name}: unbalanced function braces`);
}

const surfacingIssues = [];
try {
  const indexSrc = fs.readFileSync(INDEX_HTML, 'utf8');
  const getWSrc = extractFunctionDecl(indexSrc, 'getW');
  if (!getWSrc) {
    surfacingIssues.push({
      issue: 'getW extraction failed',
      subject: '(all)',
      detail: 'function getW not found in index.html — can\'t validate surfacing',
    });
  } else {
    // Legacy WEEKS/WEEKS_EN arrays are referenced only by philosophy's
    // old code path and may still be referenced elsewhere in the file.
    // Pull them if present; default to [] if not (future-proof against
    // their eventual removal).
    let WEEKS_lit, WEEKS_EN_lit;
    try { WEEKS_lit    = extractConstLiteral(indexSrc, 'WEEKS'); }    catch (_) {}
    try { WEEKS_EN_lit = extractConstLiteral(indexSrc, 'WEEKS_EN'); } catch (_) {}
    const WEEKS_val    = WEEKS_lit    ? evalLiteral(WEEKS_lit,    'WEEKS')    : [];
    const WEEKS_EN_val = WEEKS_EN_lit ? evalLiteral(WEEKS_EN_lit, 'WEEKS_EN') : [];

    // Build a vm context with everything getW() reads from its enclosing
    // scope. State is a minimal shim — getW only reads state.subject (if
    // called without arg) and state.lang. We pass subject explicitly so
    // only state.lang matters; set it per-run below.
    const context = {
      state: { subject: 'philosophy', lang: 'en' },
      corpusData:    subjects.find(s => s.subject === 'philosophy')?.data ?? null,
      economicsData: subjects.find(s => s.subject === 'economics')?.data  ?? null,
      psychologyData:subjects.find(s => s.subject === 'psychology')?.data ?? null,
      WEEKS: WEEKS_val,
      WEEKS_EN: WEEKS_EN_val,
    };
    vm.createContext(context);
    // Expose getW on the sandbox global by assigning the function
    // expression. The function declaration itself needs to execute in
    // the context so it binds there.
    vm.runInContext(getWSrc + '\nglobalThis._getW = getW;', context);

    for (const { subject, data } of subjects) {
      const contentIds = data.weeks.map(w => w && w.id).filter(id => id != null);
      const contentIdSet = new Set(contentIds.map(String));
      // Run in both languages — if the branch logic depends on lang
      // (as philosophy's hand-rolled branch used to), a bug could
      // surface differently in HE vs EN. Run both to catch that.
      for (const lang of ['en', 'he']) {
        context.state.subject = subject;
        context.state.lang = lang;
        let surfaced;
        try {
          surfaced = context._getW(subject);
        } catch (e) {
          surfacingIssues.push({
            issue: 'getW threw', subject, detail: `[lang=${lang}] ${e.message}`,
          });
          continue;
        }
        if (!Array.isArray(surfaced)) {
          surfacingIssues.push({
            issue: 'getW returned non-array', subject, detail: `[lang=${lang}] got ${typeof surfaced}`,
          });
          continue;
        }
        const surfacedIds = surfaced.map(w => w && w.id).filter(id => id != null).map(String);
        const surfacedIdSet = new Set(surfacedIds);

        // Content chapters that getW didn't surface — the ch5 class.
        for (const id of contentIdSet) {
          if (!surfacedIdSet.has(id)) {
            surfacingIssues.push({
              issue: 'chapter in content but not surfaced by getW',
              subject,
              detail: `[lang=${lang}] chapter id=${id} present in ${subject === 'philosophy' ? 'corpusData' : subject + 'Data'}.weeks but missing from getW('${subject}') output`,
            });
          }
        }
        // Orphan ids that getW produces without a backing content entry.
        for (const id of surfacedIdSet) {
          if (!contentIdSet.has(id)) {
            surfacingIssues.push({
              issue: 'chapter surfaced by getW but not in content',
              subject,
              detail: `[lang=${lang}] getW('${subject}') returned chapter id=${id} with no matching entry in content`,
            });
          }
        }
        // Duplicate ids in the surfaced output — would render the
        // chapter card twice on home.
        if (surfacedIds.length !== surfacedIdSet.size) {
          const counts = surfacedIds.reduce((acc, id) => (acc[id] = (acc[id] || 0) + 1, acc), {});
          const dups = Object.entries(counts).filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`).join(', ');
          surfacingIssues.push({
            issue: 'duplicate chapter id in getW output',
            subject,
            detail: `[lang=${lang}] ${dups}`,
          });
        }
      }
    }
  }
} catch (e) {
  surfacingIssues.push({
    issue: 'surfacing check failed', subject: '(all)',
    detail: e.message,
  });
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
reportTable('Tag-balance errors (HTML in text-only fields / malformed / unclosed <strong>)', tagIssues);
reportTable('Quiz option shape errors (packed / length mismatch / too few)', quizIssues);
reportTable('CAROUSEL_ORDER coverage errors (thinker missing from order-list / order references unknown id / duplicates)', orderIssues);
reportTable('Chapter surfacing errors (content ↔ getW mismatch)', surfacingIssues);
reportTable('Correct-answer distribution errors (letter > 50% / run ≥ 4)', distributionIssues);
reportTable('Distractor length-signature errors (correct option strict-longest > 60%)', lengthIssues);
reportTable('HTML entity errors (content strings should contain literal characters, not entities)', entityIssues);
reportTable('Unreferenced thinkers (never appear in any dialogue — warning only)', unreferenced);

const hardErrorCount = forwardIssues.length + arrayIssues.length + tagIssues.length + quizIssues.length + orderIssues.length + surfacingIssues.length + distributionIssues.length + lengthIssues.length + entityIssues.length;
if (hardErrorCount > 0) {
  console.error('');
  console.error('╔════════════════════════════════════════════════════════════════════╗');
  console.error(`║ FAIL: ${String(hardErrorCount).padEnd(4)} hard error(s). Fix before shipping.` +
                ' '.repeat(Math.max(0, 68 - `║ FAIL: ${hardErrorCount} hard error(s). Fix before shipping.`.length)) + '║');
  console.error('╚════════════════════════════════════════════════════════════════════╝');
  console.error(`Also: ${noThinkerRows.length} no-thinker day(s), ${unreferenced.length} unreferenced thinker(s).`);
  process.exit(1);
}
console.log(`\nOK: no hard errors. ${noThinkerRows.length} no-thinker day(s), ${unreferenced.length} thinker(s) unreferenced.`);
