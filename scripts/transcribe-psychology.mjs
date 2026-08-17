#!/usr/bin/env node
// scripts/transcribe-psychology.mjs
//
// Transforms pre-extracted psychology-chapter dialogues (HE + EN plain
// text) into JS section objects matching the shape used in
// content/psychology.js.
//
// DESIGN
// ──────
// • Input: two .txt files (HE + EN) previously extracted from docx via
//   the user's python-docx flow. This script does not read .docx.
// • Output: stdout by default, or --out=PATH. NEVER writes to
//   content/psychology.js. That file is the source of truth for the app;
//   this script emits a starting point that the user pastes in
//   manually. Manual edits to content/psychology.js survive because
//   this script never opens it.
// • Source section: quote + attr are extracted verbatim from the docs
//   and the emitted section carries a `// TODO_VERIFY_QUOTE` comment.
//   Verified-quote substitution for freud/jung/skinner/rogers is a
//   per-dialogue judgment call — not automated.
// • Titles: only the 'idea' title is inferred (equals day title).
//   Titles for source / explanation / depth are `'TODO_TITLE'`
//   placeholders. Quiz titles are `שאלה N` / `Question N`.
// • Irregular dialogues: script auto-detects which section markers
//   appear. Dialogue 7 (no source, no depth, "Summary" as the header
//   thinker slot, extra 🗺️/🎯 sections mapped to 'explanation') and
//   dialogue 6 (2 questions) fall out of this: nothing is templated.
//
// USAGE
// ─────
//   node scripts/transcribe-psychology.mjs \
//     [--he=/tmp/psy_he.txt] [--en=/tmp/psy_en.txt] \
//     [--dialogues=3-7] [--out=/tmp/gen.js]
//
// VALIDATION (round-trip against hand-transcribed dialogues 1-2)
// ──────────────────────────────────────────────────────────────
//   node scripts/transcribe-psychology.mjs --dialogues=1-2 --out=/tmp/gen.js
// Then eyeball vs. content/psychology.js. Titles will differ
// (placeholders vs. hand-crafted). Source-quote for dialogue 1 will
// differ (the hand version already substituted the paraphrase for
// the verified Wundt quote); dialogue 2 should match verbatim.

import fs from 'node:fs';

// ─── CLI ──────────────────────────────────────────────────────────

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));

const HE_PATH  = args.he  || '/tmp/psy_he.txt';
const EN_PATH  = args.en  || '/tmp/psy_en.txt';
const OUT_PATH = args.out || null;
const DIALOGUES = (() => {
  if (!args.dialogues || args.dialogues === 'all') return null;
  const m = String(args.dialogues).match(/^(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`bad --dialogues: ${args.dialogues}`);
  const lo = +m[1], hi = +(m[2] || m[1]);
  const out = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
})();

// ─── Constants ────────────────────────────────────────────────────

// Same emojis mark the same section types in both HE and EN sources.
const SECTION_MARKERS = [
  { emoji: '💡', type: 'idea' },
  { emoji: '📜', type: 'source' },
  { emoji: '🔍', type: 'explanation' },
  { emoji: '🔬', type: 'depth' },
  { emoji: '🗺️', type: 'explanation' }, // dialogue 7 "The journey"
  { emoji: '🎯', type: 'explanation' }, // dialogue 7 "The question for the next chapter"
];

// U+2060 (word joiner) shows up before quiz-option letters and quote
// openings — strip it before parsing.
const STRIP_JOINER = /⁠/g;

// ─── Dialogue extraction ──────────────────────────────────────────

function parseDialogues(text, lang) {
  const headerRe = lang === 'he'
    ? /#?\s*פסיכולוגיה,\s+פרק\s+(\d+),\s+דיאלוג\s+(\d+)\s+[—–]\s+([^:\n]+?)\s*:\s+([^\n]+)/g
    : /Psychology,\s+Chapter\s+(\d+),\s+Dialogue\s+(\d+)\s+[—–]\s+([^:\n]+?)\s*:\s+([^\n]+)/g;

  const dialogues = [];
  const matches = [...text.matchAll(headerRe)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    dialogues.push({
      chapter: +m[1],
      dialogueId: +m[2],
      thinker: m[3].trim(),
      title: m[4].trim(),
      body: text.slice(start, end),
    });
  }
  return dialogues;
}

// ─── Section boundaries ───────────────────────────────────────────

function findMarkers(body, lang) {
  const positions = [];
  // HE source often prefixes markers with `## `. Match the whole marker
  // *including* the `## ` prefix so the chunk before it doesn't inherit
  // trailing `##` from the next section header.
  for (const { emoji, type } of SECTION_MARKERS) {
    const re = new RegExp('(?:^|\\n)(##\\s*)?' + emoji, 'g');
    let m;
    while ((m = re.exec(body))) {
      // start = position of the marker line (after leading \n if any)
      const start = m.index + (body[m.index] === '\n' ? 1 : 0);
      positions.push({ type, idx: start });
    }
  }
  // Quiz block: `\b` doesn't work for Hebrew word chars — match a
  // following whitespace/end-of-string instead. Same `## ` handling.
  const quizWord = lang === 'he' ? 'שאלות' : 'Questions';
  const quizRe = new RegExp('(?:^|\\n)(?:##\\s*)?' + quizWord + '(?=\\s|$)');
  const qm = body.match(quizRe);
  if (qm) positions.push({ type: 'quiz-block', idx: qm.index + (body[qm.index] === '\n' ? 1 : 0) });
  positions.sort((a, b) => a.idx - b.idx);
  return positions;
}

function sectionBodyFromChunk(chunk) {
  // First line = marker line ("💡 title" or "## 💡 title"). Drop it.
  const nl = chunk.indexOf('\n');
  return nl === -1 ? '' : chunk.slice(nl + 1).trim();
}

function parseSections(body, lang) {
  const positions = findMarkers(body, lang);
  const sections = [];
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1].idx : body.length;
    const chunk = body.slice(p.idx, end);
    if (p.type === 'quiz-block') {
      sections.push(...parseQuizzes(chunk, lang));
    } else if (p.type === 'source') {
      sections.push(parseSourceSection(sectionBodyFromChunk(chunk)));
    } else {
      sections.push({ type: p.type, _content: transformProse(sectionBodyFromChunk(chunk)) });
    }
  }
  return sections;
}

// ─── Prose transforms ─────────────────────────────────────────────

function transformProse(text) {
  text = text.replace(STRIP_JOINER, '');
  // docx→txt export gives one paragraph per line (blank lines between
  // paragraphs in HE, none in EN). Treat every non-empty non-hr line as
  // its own paragraph — works for both.
  const paras = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l !== '---');
  const out = paras.map(p => {
    p = p.replace(/\s+[—–]\s+/g, ', ');            // em/en dash → comma
    p = p.replace(/\*{2,}/g, '*');                 // collapse ** → *  (docx nesting artifact)
    p = p.replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>'); // *bold*
    return p;
  });
  return out.join('</p><p>');
}

// ─── Source section (verbatim from docs, flagged for review) ──────

function parseSourceSection(text) {
  text = text.replace(STRIP_JOINER, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let quote = '', attr = '';
  for (const l of lines) {
    if (l.startsWith('—') || l.startsWith('–')) {
      attr = l.replace(/^[—–]\s*/, '').trim();
    } else if (l.startsWith('"') || l.startsWith('“')) {
      quote = l;
    }
  }
  // Em-dashes inside the quote get the same treatment as everywhere
  // else (author-approved: no em-dashes in emitted content).
  quote = quote.replace(/\s+[—–]\s+/g, ', ');
  return { type: 'source', _quote: quote, _attr: attr, _flag: 'TODO_VERIFY_QUOTE' };
}

// ─── Quizzes ──────────────────────────────────────────────────────

function parseQuizzes(chunk, lang) {
  chunk = chunk.replace(STRIP_JOINER, '');
  const qHead = lang === 'he'
    ? /(?:^|\n)#{2,3}?\s*שאלה\s+(\d+)/g
    : /(?:^|\n)Question\s+(\d+)/g;
  const matches = [...chunk.matchAll(qHead)];
  return matches.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : chunk.length;
    return parseQuiz(chunk.slice(start, end), lang, +m[1]);
  });
}

function parseQuiz(body, lang, qNum) {
  const HE_LETTER_IDX = { 'א': 0, 'ב': 1, 'ג': 2, 'ד': 3 };
  const EN_LETTER_IDX = { A: 0, B: 1, C: 2, D: 3 };
  const letterIdx = lang === 'he' ? HE_LETTER_IDX : EN_LETTER_IDX;
  const optionRe = lang === 'he'
    ? /^\s*(?:[•·]\s*)?([א-ד])\.\s+(.+)$/
    : /^\s*([A-D])\.\s+(.+)$/;
  const optionsMarker = lang === 'he' ? /אפשרויות/ : /^Options:/;
  const correctMarker = lang === 'he'
    ? /תשובה נכונה[^:]*:\s*\**\s*([א-ד])/
    : /Correct answer:\s+([A-D])/;
  // `*פידבק:*` has an asterisk BEFORE and AFTER the colon+label pair —
  // consume both so no lone `*` leaks into the emitted explanation.
  const feedbackMarker = lang === 'he' ? /^\**\s*פידבק\**\s*:\**\s*/ : /^Feedback:\s*/;

  const lines = body.split('\n');
  const state = {
    question: [],
    options: [null, null, null, null],
    correctIndex: -1,
    explanationLines: [],
    phase: 'question',
  };

  for (const raw of lines) {
    let line = raw.trim();
    if (!line || line === '---') continue;

    if (state.phase === 'question') {
      if (optionsMarker.test(line)) { state.phase = 'options'; continue; }
      if (optionRe.test(line)) { state.phase = 'options'; /* fall through */ }
      else { state.question.push(line); continue; }
    }
    if (state.phase === 'options') {
      const om = line.match(optionRe);
      if (om) { state.options[letterIdx[om[1]]] = om[2].trim(); continue; }
      const cm = line.match(correctMarker);
      if (cm) { state.correctIndex = letterIdx[cm[1]]; state.phase = 'feedback'; continue; }
      continue;
    }
    if (state.phase === 'feedback') {
      line = line.replace(feedbackMarker, '').trim();
      if (line) state.explanationLines.push(line);
    }
  }

  const questionText = transformProse(state.question.join('\n\n')).replace(/<\/p><p>/g, ' ');
  const options = state.options.filter(o => o !== null).map(o => o.replace(/\s+[—–]\s+/g, ', '));
  const explanation = transformProse(state.explanationLines.join('\n\n'));

  return {
    type: 'quiz',
    _qNum: qNum,
    _question: questionText,
    _options: options,
    _correctIndex: state.correctIndex,
    _explanation: explanation,
  };
}

// ─── HE/EN merge ──────────────────────────────────────────────────

function mergeDialogues(heList, enList) {
  const merged = [];
  for (const he of heList) {
    const en = enList.find(d => d.chapter === he.chapter && d.dialogueId === he.dialogueId);
    if (!en) { console.error(`[warn] no EN for HE dialogue ${he.chapter}-${he.dialogueId}`); continue; }
    merged.push({
      chapter: he.chapter,
      dialogueId: he.dialogueId,
      thinkerHe: he.thinker,
      titleHe: he.title,
      thinkerEn: en.thinker,
      titleEn: en.title,
      sectionsHe: parseSections(he.body, 'he'),
      sectionsEn: parseSections(en.body, 'en'),
    });
  }
  return merged;
}

// ─── Emission ─────────────────────────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function emitSection(he, en, dialogue) {
  const type = (he && he.type) || (en && en.type);

  if (type === 'source') {
    return `          {
            type: 'source',
            title: 'TODO_TITLE', titleEn: 'TODO_TITLE',
            // TODO_VERIFY_QUOTE — docs' quote may be paraphrase. For
            // freud/jung/skinner/rogers, replace with the verified
            // quote from content/thinkers.js.
            quote: '${esc(he._quote)}',
            quoteEn: '${esc(en._quote)}',
            attr: '${esc(he._attr)}',
            attrEn: '${esc(en._attr)}',
            content: '',
            contentEn: '',
          },`;
  }

  if (type === 'quiz') {
    const optsHe = he._options.map(o => `              '${esc(o)}',`).join('\n');
    const optsEn = en._options.map(o => `              '${esc(o)}',`).join('\n');
    return `          {
            type: 'quiz',
            title: 'שאלה ${he._qNum}', titleEn: 'Question ${en._qNum}',
            question: '${esc(he._question)}',
            questionEn: '${esc(en._question)}',
            options: [
${optsHe}
            ],
            optionsEn: [
${optsEn}
            ],
            correctIndex: ${he._correctIndex},
            explanation: '${esc(he._explanation)}',
            explanationEn: '${esc(en._explanation)}',
          },`;
  }

  // idea / explanation / depth
  const isIdea = type === 'idea';
  const titleHe = isIdea ? dialogue.titleHe : 'TODO_TITLE';
  const titleEn = isIdea ? dialogue.titleEn : 'TODO_TITLE';
  return `          {
            type: '${type}',
            title: '${esc(titleHe)}', titleEn: '${esc(titleEn)}',
            content: '${esc(he._content)}',
            contentEn: '${esc(en._content)}',
          },`;
}

function emitDialogue(d) {
  // Summary dialogue: header carries "Summary"/"סיכום" in the thinker
  // slot. Omit thinker fields on the day and don't set thinkerId.
  const isSummary = /^(summary|סיכום)$/i.test(d.thinkerEn) || /^(summary|סיכום)$/i.test(d.thinkerHe);

  const dayHeader = isSummary
    ? `        { id: ${d.dialogueId}, title: '${esc(d.titleHe)}', titleEn: '${esc(d.titleEn)}', xp: 50, sections: [`
    : `        { id: ${d.dialogueId}, title: '${esc(d.titleHe)}', titleEn: '${esc(d.titleEn)}', thinker: '${esc(d.thinkerHe)}', thinkerEn: '${esc(d.thinkerEn)}', thinkerId: 'TODO_THINKER_ID', xp: 50, sections: [`;

  const n = Math.max(d.sectionsHe.length, d.sectionsEn.length);
  if (d.sectionsHe.length !== d.sectionsEn.length) {
    console.error(`[warn] section-count mismatch at dialogue ${d.dialogueId}: HE=${d.sectionsHe.length}, EN=${d.sectionsEn.length}`);
  }

  const parts = [dayHeader];
  for (let i = 0; i < n; i++) {
    const he = d.sectionsHe[i], en = d.sectionsEn[i];
    if (!he || !en) { console.error(`[warn] dialogue ${d.dialogueId} section ${i}: HE=${!!he}, EN=${!!en}`); continue; }
    if (he.type !== en.type) console.error(`[warn] dialogue ${d.dialogueId} section ${i}: type mismatch HE=${he.type} EN=${en.type}`);
    parts.push(emitSection(he, en, d));
  }
  parts.push(`          { type: 'quiz_summary' },`);
  parts.push(`        ]},`);
  return parts.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────

const heText = fs.readFileSync(HE_PATH, 'utf8');
const enText = fs.readFileSync(EN_PATH, 'utf8');
let merged = mergeDialogues(parseDialogues(heText, 'he'), parseDialogues(enText, 'en'));
if (DIALOGUES) merged = merged.filter(d => DIALOGUES.includes(d.dialogueId));

const out = [
  '// Generated by scripts/transcribe-psychology.mjs — a starting',
  '// point for content/psychology.js. Review before pasting in.',
  '// Search for TODO_ markers: TODO_TITLE (source/explanation/depth',
  '// title), TODO_VERIFY_QUOTE (freud/jung/skinner/rogers source',
  '// substitution), TODO_THINKER_ID (thinker id lookup).',
  '',
];
for (const d of merged) {
  out.push(`// ─── Chapter ${d.chapter}, Dialogue ${d.dialogueId} — ${d.thinkerEn}: ${d.titleEn} ───`);
  out.push(emitDialogue(d));
  out.push('');
}
const output = out.join('\n');

if (OUT_PATH) {
  fs.writeFileSync(OUT_PATH, output);
  console.error(`[wrote] ${OUT_PATH} (${output.length} bytes)`);
} else {
  process.stdout.write(output);
}
