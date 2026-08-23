#!/usr/bin/env node
// Build-time share card + share page generator for corpusapp.io.
//
// Reads the dialogue data structures out of index.html (corpusData +
// economicsData + THINKERS + THINKERS_EN), then for every dialogue that has
// a thinkerId, renders:
//   share/cards/<lang>/<subject>-<weekId>-<dayId>.png    — 1200×630 OG image
//   d/<subject>-<weekId>-<dayId>-<lang>.html             — landing page with OG tags
//
// The subject prefix (phil / econ / psyc) is what keeps philosophy week 1
// day 1 from silently clobbering economics week 1 day 1 (both data
// sources use the same numeric week/day ids). Keep _SUBJECT_SLUG below
// byte-identical to the mirror in index.html's shareCompletion.
// Both languages, both subject palettes. Also emits share/cards/manifest.json.
//
// This is a Node ESM script (.mjs) — run via `npm run gen:share` (see
// package.json) which uses node-canvas as a devDependency.
//
// Fonts: two variable-weight TTFs live in ./fonts:
//   - Rubik    → bi-script (Hebrew + Latin), used for all body text
//   - Nunito   → Latin only, used ONLY for the "Corpus" wordmark to match
//                the in-app .auth-logo-text (900 weight, -1px tracking)
// Rubik covers Hebrew glyphs; @napi-rs/canvas's bundled Noto fallback does
// not, which is why the Rubik font matters here. Nunito is only ever drawn
// against the Latin string "Corpus", so its lack of Hebrew glyphs is fine.
//
// The script never touches the app itself — pure static generator.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Two canvas backends supported: @napi-rs/canvas (prebuilt, no cairo needed)
// and node-canvas (needs cairo/pango via brew). Prefer napi-rs — installs
// without native compilation on macOS/Linux — fall back to canvas if only
// that is present. If neither loads, drop through to pages-only mode:
// HTML pages ship without PNG cards, so /d/<slug>-<w>-<d>-<lang>.html
// resolves, but the og:image URL will 404 until a run with a working
// canvas backend writes the PNGs.
let canvasModule = null;
let canvasKind = null;  // 'napi' | 'node' | null
try {
  canvasModule = await import('@napi-rs/canvas');
  canvasKind = 'napi';
} catch (e) {
  try {
    canvasModule = await import('canvas');
    canvasKind = 'node';
  } catch (e2) {
    console.warn('[gen:share] no canvas backend — pages only, no PNG cards.');
    console.warn('            Install with `npm i -D @napi-rs/canvas`.');
  }
}
const createCanvas   = canvasModule ? canvasModule.createCanvas   : null;
const loadImage      = canvasModule ? canvasModule.loadImage      : null;
// Font registration differs between backends: napi uses
// GlobalFonts.registerFromPath(file, family?), node uses
// registerFont(file, { family, weight, style }). Handled inside
// _registerFonts() below.
const CANVAS_ENABLED = !!canvasModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_CARDS = path.join(ROOT, 'share', 'cards');
const OUT_PAGES = path.join(ROOT, 'd');
// Thinker share cards + landing pages live in parallel to dialogue cards.
// Same generator, different asset trees so a thinker page and a dialogue
// page never share a slug. Landing paths: /t/{id}[-{subject}]-{lang}.html.
const OUT_THINKERS       = path.join(ROOT, 'share', 'thinkers');
const OUT_THINKER_PAGES  = path.join(ROOT, 't');
const SITE_URL = 'https://corpusapp.io';

// ─────────────────────────────────────────────────────────────────────────
// Data extraction: pull literal JS objects out of index.html
// ─────────────────────────────────────────────────────────────────────────
// The dialogue data lives inline in index.html as `const corpusData = { … };`,
// etc. Rather than refactor those into separate JSON (which would touch the
// runtime), we parse them out here with a balanced-bracket walker that
// respects strings and comments, then eval the extracted literal in an
// isolated Function scope. Only reads the file; nothing writes back.

function _findJsLiteral(src, prefix) {
  const start = src.indexOf(prefix);
  if (start === -1) throw new Error(`prefix not found: ${prefix}`);
  let i = start + prefix.length;
  while (i < src.length && src[i] !== '{' && src[i] !== '[') i++;
  const open = src[i];
  const close = open === '{' ? '}' : ']';
  let depth = 0, j = i, inStr = false, quote = '', escape = false;
  let inLineComment = false, inBlockComment = false;
  for (; j < src.length; j++) {
    const c = src[j], n = src[j + 1];
    if (escape) { escape = false; continue; }
    if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (c === '*' && n === '/') { inBlockComment = false; j++; } continue; }
    if (inStr) {
      if (c === '\\') { escape = true; continue; }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '/' && n === '/') { inLineComment = true; j++; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; j++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        const literal = src.slice(i, j + 1);
        // Function eval: the literal is trusted source (our own repo).
        // Wrap in `return (...)` so the last expression yields the value.
        return new Function('return (' + literal + ')')();
      }
    }
  }
  throw new Error(`unclosed literal starting at index ${i}`);
}

function extractData() {
  // Post-refactor (commit fb838dd), the subject data structures moved
  // out of index.html into content/*.js. Read each from its own file
  // rather than a monolithic index.html slice.
  //   content/philosophy.js  → corpusData
  //   content/economics.js   → economicsData
  //   content/psychology.js  → psychologyData
  //   content/thinkers.js    → THINKERS + THINKERS_EN
  const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const philo = readFile('content/philosophy.js');
  const econ  = readFile('content/economics.js');
  const psy   = readFile('content/psychology.js');
  const th    = readFile('content/thinkers.js');
  return {
    corpusData:      _findJsLiteral(philo, 'const corpusData = '),
    economicsData:   _findJsLiteral(econ,  'const economicsData = '),
    psychologyData:  _findJsLiteral(psy,   'const psychologyData = '),
    THINKERS:        _findJsLiteral(th,    'const THINKERS = '),
    THINKERS_EN:     _findJsLiteral(th,    'const THINKERS_EN = '),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────────────────

function _registerFonts() {
  if (!CANVAS_ENABLED) return;
  const fontsDir = path.join(__dirname, 'fonts');
  if (!fs.existsSync(fontsDir)) {
    console.warn('[gen:share] scripts/fonts missing — Hebrew will render as tofu.');
    return;
  }
  const files = fs.readdirSync(fontsDir).filter(f => /\.(ttf|woff2?)$/i.test(f));
  if (!files.length) {
    console.warn('[gen:share] no font files in scripts/fonts — Hebrew will render as tofu.');
    return;
  }
  const has = name => files.some(f => f.toLowerCase().includes(name.toLowerCase()));
  const tryReg = (file, family, opts) => {
    const p = path.join(fontsDir, file);
    try {
      if (canvasKind === 'napi') {
        const key = canvasModule.GlobalFonts.registerFromPath(p, family);
        if (!key) console.warn('[gen:share] register returned null for', file);
      } else {
        canvasModule.registerFont(p, { family, ...(opts || {}) });
      }
    } catch (e) {
      console.warn('[gen:share] register font failed for', file, e.message);
    }
  };
  // Rubik — single family covers Hebrew + Latin at all weights we use (500–900).
  // Variable font preferred (one file, full weight range); fall back to statics.
  if (has('Rubik-VariableFont')) {
    tryReg('Rubik-VariableFont_wght.ttf', 'Rubik');
  } else {
    if (has('Rubik-Regular'))    tryReg('Rubik-Regular.ttf',    'Rubik', { weight: '400' });
    if (has('Rubik-Medium'))     tryReg('Rubik-Medium.ttf',     'Rubik', { weight: '500' });
    if (has('Rubik-SemiBold'))   tryReg('Rubik-SemiBold.ttf',   'Rubik', { weight: '600' });
    if (has('Rubik-Bold'))       tryReg('Rubik-Bold.ttf',       'Rubik', { weight: '700' });
    if (has('Rubik-ExtraBold'))  tryReg('Rubik-ExtraBold.ttf',  'Rubik', { weight: '800' });
    if (has('Rubik-Black'))      tryReg('Rubik-Black.ttf',      'Rubik', { weight: '900' });
  }
  // Nunito Black — wordmark only. The app's .auth-logo-text / .topbar-logo
  // resolve font-weight: 900 to Nunito-Black in the browser; we register that
  // exact static Black woff2 (from @fontsource/nunito) as its own family so
  // the wordmark renders at true Black weight. @napi-rs/canvas's variable-font
  // wght axis matcher does NOT reach true Black on Nunito's variable file, so
  // a static Black glyph set is required for a pixel-accurate brand match.
  if (has('Nunito-Black.woff2')) {
    tryReg('Nunito-Black.woff2', 'Nunito Black');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Palettes (derived from index.html theme blocks at run time)
// ─────────────────────────────────────────────────────────────────────────
// The card fields map onto the app's CSS custom properties as:
//   bg       ← --bg
//   wordmark ← --accent
//   name     ← --ink
//   era      ← --text-2
//   question ← --accent-dark
//   frame    ← --thinker-frame  (used to be a fixed gold RIM)
// Extracting at runtime removes the drift that made the hardcoded
// psychology palette stale for weeks — the CSS is now the single
// source of truth. Runs once per gen:share invocation.

// Palette derived from index.html theme blocks at build time.
// Field mapping:
//   bg       ← --bg
//   wordmark ← --accent
//   name     ← --ink
//   era      ← --text-2
//   question ← --accent-dark
//   frame    ← --thinker-frame  (only used when USE_FRAME_RIM is true;
//                                may be null on branches without the
//                                --frame-<subject> :root tokens)

function _extractThemeVars(src, subject) {
  // Find `html.theme-<subject>,\n  #screen-subject.theme-<subject> {`
  // block, walk balanced braces, regex-scrape each `--name: value;`.
  const anchor = `html.theme-${subject},`;
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`theme block not found for ${subject}`);
  const braceOpen = src.indexOf('{', start);
  if (braceOpen === -1) throw new Error(`no { after ${anchor}`);
  let depth = 0, end = braceOpen;
  for (; end < src.length; end++) {
    const c = src[end];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) break; }
  }
  const body = src.slice(braceOpen, end);
  const vars = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body))) vars[m[1]] = m[2].trim();
  return vars;
}

function _extractRootVar(src, name) {
  const re = new RegExp('--' + name + '\\s*:\\s*(#[0-9A-Fa-f]{3,8})');
  const m = src.match(re);
  return m ? m[1] : null;
}

function buildThemes() {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const themes = {};
  for (const subject of ['philosophy', 'economics', 'psychology']) {
    const v = _extractThemeVars(src, subject);
    // --thinker-frame is set on :root (never on theme blocks in the
    // current CSS) via --frame-philosophy / --frame-economics /
    // --frame-psychology. Pull directly from :root.
    const frame = _extractRootVar(src, 'frame-' + subject);
    themes[subject] = {
      bg:       v.bg,
      surface2: v['surface-2'] || v.bg,   // fall back to bg if unset
      // `accent-tint-strong` is the subject's medium-saturation tint —
      // philosophy #D8C4FF (deep lavender), economics #BFDBFE (deep pale
      // blue), psychology #FED7AA (warm peach). Higher chroma than
      // surface-2, which matters because JPEG's chroma subsampling
      // strips the near-neutral surface-2 blue to gray. accent-tint-strong
      // survives JPEG cleanly and gives the portrait a warmer, more
      // clearly subject-identified surface.
      accentTintStrong: v['accent-tint-strong'] || v['surface-2'] || v.bg,
      wordmark: v.accent,
      name:     v.ink,
      era:      v['text-2'],
      question: v['accent-dark'],
      frame:    frame,  // optional; may be null on branches without --frame-<subject>
    };
    // Only require the 5 fields we actually consume unconditionally.
    // `frame` is optional — guarded at the call site by USE_FRAME_RIM.
    // `surface2` is optional (falls back to bg above).
    for (const k of ['bg', 'wordmark', 'name', 'era', 'question']) {
      if (!themes[subject][k]) throw new Error(`missing ${k} for ${subject}`);
    }
  }
  return themes;
}

const THEMES = buildThemes();

// When true, the portrait ring uses each subject's --thinker-frame
// (purple / blue / brown, matching the in-app portrait frame).
// When false, uses subject-agnostic gold — original behavior.
// If USE_FRAME_RIM is true but a subject's --frame-<subject> token is
// missing from :root, THEMES[subject].frame will be null and the rim
// falls back to gold RIM.
const USE_FRAME_RIM = false;

// Slug prefix keeps philosophy 1-1 and economics 1-1 (both real, both
// legitimate) from stomping on each other's page/card files. Kept in
// lockstep with the mirror inside index.html's shareCompletion.
const _SUBJECT_SLUG = {
  philosophy: 'phil',
  economics:  'econ',
  psychology: 'psyc',
};
// Landing pages for subjects in this set get `<meta name="robots"
// content="noindex, nofollow">`. Kept during soft-launch windows so
// crawlers don't surface dialogue titles + portraits before the
// subject is officially open in-app. Drop the entry from this set at
// the same time the subject launches.
const NOINDEX_SUBJECTS = new Set(['psychology']);
const PLATE   = '#FDFBF6';
const RIM     = '#E5C158';
const URL_TXT = '#B8860B';

// ─────────────────────────────────────────────────────────────────────────
// Text helpers (mirror the in-app implementation)
// ─────────────────────────────────────────────────────────────────────────

const LRI = '⁦', PDI = '⁩', RLM = '‏';

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const test = current ? current + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        current = words.slice(i).join(' ');
        break;
      }
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitQuestion(ctx, text, maxWidth, maxLines, fontFamily) {
  // Ceiling 80, floor 32, 4px steps. At each candidate size, the wrap MUST
  // (a) produce ≤ maxLines AND (b) every resulting line must actually
  // measure within maxWidth. Point (b) exists because wrapText's greedy
  // last-line dump ignores width when it hits maxLines − 1 — a long
  // titles like the section-title stress case "Science Is Not Absolute
  // Truth - It Is an Attempt at Refutation" (63 chars) can produce a
  // last line that lies outside the column even though .length ≤ maxLines.
  // Measure per line here so nothing ever bleeds into the portrait; if
  // no size in the loop clears both checks, floor at 32 wins as the hard
  // stop (rare visual overflow at 32 is still preferable to a build fail).
  for (let size = 80; size >= 32; size -= 4) {
    ctx.font = `800 ${size}px ${fontFamily}`;
    const lines = wrapText(ctx, text, maxWidth, maxLines);
    if (lines.length > maxLines) continue;
    let overflows = false;
    for (const line of lines) {
      if (ctx.measureText(line).width > maxWidth) { overflows = true; break; }
    }
    if (!overflows) return { size, lines };
  }
  ctx.font = `800 32px ${fontFamily}`;
  return { size: 32, lines: wrapText(ctx, text, maxWidth, maxLines) };
}

// ─────────────────────────────────────────────────────────────────────────
// Card renderer — 1200×630 landscape (OG standard)
// ─────────────────────────────────────────────────────────────────────────

async function renderCard({ thinker, dayTitle, subject, lang }) {
  const W = 1200, H = 630;
  const isEn = lang === 'en';
  const theme = THEMES[subject] || THEMES.philosophy;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  // Portrait — RIGHT third for LTR, LEFT third for RTL.
  // Radius trimmed 200 → 180 and portrait-side margin trimmed 60 → 40
  // to widen the text column, which is what actually gives the title
  // and thinker name room to breathe at thumbnail scale (raising the
  // font-size floor alone would overflow the longest day titles).
  const portraitR = 180;
  const OUTER_MARGIN_TEXT     = 60;   // outer margin on the text side
  const OUTER_MARGIN_PORTRAIT = 40;   // outer margin on the portrait side
  const GUTTER                = 80;   // space between text column and portrait
  const portraitCx = isEn ? (W - OUTER_MARGIN_PORTRAIT - portraitR)
                          : (OUTER_MARGIN_PORTRAIT + portraitR);
  const portraitCy = H / 2;

  // Plate
  ctx.beginPath();
  ctx.arc(portraitCx, portraitCy, portraitR, 0, Math.PI * 2);
  ctx.fillStyle = PLATE;
  ctx.fill();
  // Rim — per-subject when USE_FRAME_RIM is on and the theme has a
  // --thinker-frame value; otherwise the subject-agnostic gold RIM.
  ctx.lineWidth = 8;
  ctx.strokeStyle = (USE_FRAME_RIM && theme.frame) ? theme.frame : RIM;
  ctx.stroke();
  // Portrait image. Per-subject override via thinker.images[subject]
  // for multi-subject thinkers (Kahneman); falls through to
  // thinker.image otherwise. Same resolver semantics as
  // _thinkerImage in index.html.
  const _portraitPath = (thinker.images && thinker.images[subject])
    || thinker.image;
  if (_portraitPath) {
    try {
      const imgPath = _portraitPath.replace(/^\.\//, '');
      const abs = path.join(ROOT, imgPath);
      const img = await loadImage(abs);
      ctx.save();
      const innerR = portraitR - 6;
      ctx.beginPath();
      ctx.arc(portraitCx, portraitCy, innerR, 0, Math.PI * 2);
      ctx.clip();
      // Top-weighted crop (matches PORTRAIT_CROP_* from index.html)
      const PORTRAIT_CROP_TOP_RATIO    = 0.10;
      const PORTRAIT_CROP_HEIGHT_RATIO = 0.58;
      const iw = img.width, ih = img.height;
      const sx = 0, sy = ih * PORTRAIT_CROP_TOP_RATIO;
      const sw = iw, sh = ih * PORTRAIT_CROP_HEIGHT_RATIO;
      const scale = Math.max((innerR * 2) / sw, (innerR * 2) / sh);
      const dw = sw * scale, dh = sh * scale;
      const dx = portraitCx - dw / 2;
      const dy = portraitCy - dh / 2;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    } catch (e) {
      // Fallback: monogram
      ctx.fillStyle = theme.wordmark;
      ctx.font = '800 140px Rubik, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((thinker.name || '?').slice(0, 1), portraitCx, portraitCy);
      ctx.textBaseline = 'top';
    }
  }

  // Text column — opposite side from portrait. Anchored to OUTER_MARGIN_TEXT
  // (60) on its outer side; width = card − text-margin − portrait diameter
  // − gutter − portrait-margin = 1200 − 60 − 360 − 80 − 40 = 660.
  const colX      = isEn ? OUTER_MARGIN_TEXT : (W - OUTER_MARGIN_TEXT);
  const colWidth  = W - OUTER_MARGIN_TEXT - (portraitR * 2) - GUTTER - OUTER_MARGIN_PORTRAIT;
  const align     = isEn ? 'left' : 'right';
  ctx.textAlign = align;

  let y = 70;

  // Wordmark — Nunito Black, tracking scaled from the app's .auth-logo-text
  // reference: -1px @ 38px → -1 * 50/38 ≈ -1.32px at card size. Bumped 44
  // → 50 to gain a touch of thumbnail legibility without competing with the
  // title (which is the hero at 80). See earlier note on the "Nunito Black"
  // family — static woff2 required because the variable Nunito's wght axis
  // matcher does not reach true Black in @napi-rs/canvas.
  ctx.font = '50px "Nunito Black", Rubik, sans-serif';
  ctx.fillStyle = theme.wordmark;
  ctx.letterSpacing = '-1.32px';
  ctx.fillText('Corpus', colX, y);
  ctx.letterSpacing = '0px';
  y += 74;

  // Hero question (shrink-to-fit, up to 3 lines)
  const questionText = String(dayTitle || '').trim();
  if (questionText) {
    const { size, lines } = fitQuestion(ctx, questionText, colWidth, 3, 'Rubik, sans-serif');
    ctx.fillStyle = theme.question;
    ctx.font = `800 ${size}px Rubik, sans-serif`;
    const lineHeight = size * 1.2;
    for (const line of lines) {
      const rendered = !isEn ? (RLM + line + RLM) : line;
      ctx.fillText(rendered, colX, y);
      y += lineHeight;
    }
    y += 24;
  }

  // Thinker name — bumped 34 → 46 so the person's name reads at
  // thumbnail scale in feeds (LinkedIn/Threads/X shrink the card).
  ctx.fillStyle = theme.name;
  ctx.font = '900 46px Rubik, sans-serif';
  ctx.fillText(thinker.name, colX, y);
  y += 58;

  // Era (LRI/PDI wrap so digits never flip in Hebrew context)
  if (thinker.era) {
    ctx.fillStyle = theme.era;
    ctx.font = '600 22px Rubik, sans-serif';
    ctx.fillText(LRI + thinker.era + PDI, colX, y);
    y += 40;
  }

  // Gold divider — short bar under the era
  const divW = 80;
  const divY = y + 8;
  const divX = isEn ? colX : (colX - divW);
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(divX, divY);
  ctx.lineTo(divX + divW, divY);
  ctx.stroke();

  // corpusapp.io in the bottom of the text column
  ctx.fillStyle = URL_TXT;
  ctx.font = '700 22px Rubik, sans-serif';
  ctx.fillText('corpusapp.io', colX, H - 60);

  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────────────────────────────────
// Thinker card renderers — collectible-illustration hero
// ─────────────────────────────────────────────────────────────────────────
// The collectible IS the illustration (bust + bookshelves + book titles
// are baked into the artwork). Two variants:
//
//   • LANDSCAPE 1200×630 — for the /t/ page's og:image. WhatsApp/iMessage/
//     Twitter unfurls need 1.91:1 landscape. Composition: pantheon-style
//     illustration panel on one side (rounded rectangle, 2px subject-
//     colored frame, dark-gradient name/era at bottom — matches what the
//     user unlocks in-app), Corpus wordmark + tagline + URL on the other.
//
//   • PORTRAIT 1080×1920 — attached as a file to the native share sheet.
//     9:16 for Instagram Story / WhatsApp Status. Native art aspect
//     (670×1200 = 0.558) is almost exactly 9:16 (0.5625) — the art
//     was practically drawn for this format. Composition: illustration
//     fills the canvas edge-to-edge, small Corpus wordmark on a subtle
//     pill top-center, name/era bottom overlay. Frame around the whole
//     thing. Deliberately minimal chrome — the user is showing off, not
//     advertising, and heavy branding is what stops them posting it.

async function _loadThinkerPortrait(thinker, subject) {
  const rel = (thinker.images && thinker.images[subject]) || thinker.image;
  if (!rel) return null;
  // Prefer the higher-resolution PNG in images.original-backup/ when it
  // exists — the shipped webp is a downscaled export (670×1200) intended
  // for the in-app grid; the originals are up to 1536×2752 for some
  // philosophy / economics thinkers, dramatically sharper at portrait-
  // card size. Psychology thinkers aren't in the backup and fall back
  // to the shipped webp. Multi-subject variants (kahneman-econ.webp,
  // kahneman-psy.webp) also have no per-variant backup and fall back.
  const basename = path.basename(rel, path.extname(rel));
  const backupAbs = path.join(ROOT, 'images.original-backup', basename + '.png');
  if (fs.existsSync(backupAbs)) {
    try { return await loadImage(backupAbs); } catch (e) { /* fall through */ }
  }
  const abs = path.join(ROOT, rel.replace(/^\.\//, ''));
  try {
    return await loadImage(abs);
  } catch (e) {
    return null;
  }
}

// Single-source-of-truth aspect fitter: given the source image dims and
// a target HEIGHT, return { w, h } where h == target and w is derived
// from the source aspect ratio. The card renderers never set both card
// dimensions independently — one of the two ALWAYS comes from this
// helper — so the destination box is aspect-locked to the source and
// can't drift out of sync when the layout is tweaked.
function _cardBoxFromHeight(srcW, srcH, targetH) {
  const w = Math.round(targetH * (srcW / srcH));
  return { w, h: targetH };
}

// Rounded rectangle path — used for both the pantheon-style illustration
// panel and the portrait card's outer frame. Node canvas doesn't ship
// with roundRect on every backend version, so we polyfill via arcs.
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Draw the collectible illustration inside a rounded-rectangle panel,
// then paint the subject-colored frame stroke on top. Shared by both
// landscape and portrait renderers.
//
// The illustrations themselves already carry ornate frames, book titles,
// AND baked-in name/era banners at the bottom (visible on every card:
// "SOCRATES / ANCIENT GREEK PHILOSOPHER", "MELANIE KLEIN / PIONEER OF
// CHILD ANALYSIS", etc). We deliberately do NOT overlay our own name or
// gradient here — anything we add competes with the artist's engraved
// banner and looks like a bug. The subject-colored stroke is the only
// chrome, a subtle nod to the app's Pantheon frame color.
//
// Fit strategy is CONTAIN (min scale + centered), not cover: cropping
// even a few pixels at the edges chops the ornament that makes the card
// worth sharing. The letterbox on the short axis is a couple of pixels
// on the portrait canvas and zero on the landscape panel (native aspect
// matches). Letterbox area is left as whatever the caller already painted
// underneath (subject bg on portrait, subject bg on landscape).
function _drawCollectiblePanel(ctx, img, thinker, subject, x, y, w, h, opts) {
  const theme = THEMES[subject] || THEMES.philosophy;
  const frameColor = theme.frame || RIM;
  const radius = opts.radius;
  const frameWidth = opts.frameWidth;

  ctx.save();
  _roundRect(ctx, x, y, w, h, radius);
  ctx.clip();

  if (img) {
    const iw = img.width, ih = img.height;
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    // Fallback for a thinker with no shipped illustration — never
    // hit in production but keeps the generator resilient.
    ctx.fillStyle = PLATE;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = theme.wordmark;
    ctx.font = `800 ${Math.round(h * 0.4)}px Rubik, sans-serif`;
    const prevAlign = ctx.textAlign, prevBaseline = ctx.textBaseline;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((thinker.name || '?').slice(0, 1), x + w / 2, y + h / 2);
    ctx.textAlign = prevAlign;
    ctx.textBaseline = prevBaseline;
  }

  ctx.restore();

  // Frame stroke — drawn AFTER the clip is released so it sits cleanly
  // on the panel edge without being clipped in half. Skipped when
  // frameWidth is 0/falsy: portrait cards drop the stroke because the
  // illustration's own ornate frame is already dominant and a second
  // rectangle fights it visually.
  if (frameWidth > 0) {
    ctx.beginPath();
    _roundRect(ctx, x, y, w, h, radius);
    ctx.lineWidth = frameWidth;
    ctx.strokeStyle = frameColor;
    ctx.stroke();
  }
}

async function renderThinkerCardLandscape({ thinker, subject, lang }) {
  const W = 1200, H = 630;
  const isEn = lang === 'en';
  const theme = THEMES[subject] || THEMES.philosophy;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  // Pantheon panel — respect native 670×1200 art aspect (0.558). Panel
  // height fills all but 20px vertical margin; width follows aspect.
  const panelH = 590;
  const panelW = Math.round(panelH * (670 / 1200));  // ≈ 329
  const OUTER = 40;
  const panelY = Math.round((H - panelH) / 2);
  const panelX = isEn ? (W - OUTER - panelW) : OUTER;

  const img = await _loadThinkerPortrait(thinker, subject);
  _drawCollectiblePanel(ctx, img, thinker, subject, panelX, panelY, panelW, panelH, {
    radius:     18,
    frameWidth: 3,
  });

  // Text column — opposite side.
  const colX = isEn ? OUTER : (W - OUTER);
  ctx.textAlign = isEn ? 'left' : 'right';
  let y = 70;

  // Wordmark — same treatment as dialogue card so brand feels consistent
  // across the two share flavours.
  ctx.font = '50px "Nunito Black", Rubik, sans-serif';
  ctx.fillStyle = theme.wordmark;
  ctx.letterSpacing = '-1.32px';
  ctx.fillText('Corpus', colX, y);
  ctx.letterSpacing = '0px';
  y += 96;

  // Tagline — fixed marketing line, subject-agnostic. The share COPY
  // carries the per-subject hook ("one of history's great philosophers");
  // the card stays quiet.
  const tagline = isEn
    ? '5 minutes a day with\nhistory’s greatest minds'
    : '5 דקות ביום עם\nגדולי ההוגים';
  ctx.fillStyle = theme.question;
  ctx.font = '700 34px Rubik, sans-serif';
  const lineHeight = 44;
  for (const line of tagline.split('\n')) {
    ctx.fillText(!isEn ? (RLM + line + RLM) : line, colX, y);
    y += lineHeight;
  }
  y += 20;

  // Divider
  const divW = 80;
  const divY = y;
  const divX = isEn ? colX : (colX - divW);
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(divX, divY);
  ctx.lineTo(divX + divW, divY);
  ctx.stroke();

  ctx.fillStyle = URL_TXT;
  ctx.font = '700 22px Rubik, sans-serif';
  ctx.fillText('corpusapp.io', colX, H - 60);

  return canvas.toBuffer('image/png');
}

async function renderThinkerCardPortrait({ thinker, subject, lang }) {
  // 810×1440 = ¾ of 1080×1920 (Instagram Story native). Story platforms
  // recompress + upscale on upload, so the extra 33% pixels weren't
  // buying perceptual fidelity — shipping smaller halves per-share
  // download cost (~360KB → ~180KB after pngquant) with no visible
  // loss at either share-thumbnail or full-story-viewing scale.
  const W = 810, H = 1440;
  void lang;  // portrait card is symmetric — no LTR/RTL branching needed
  const theme = THEMES[subject] || THEMES.philosophy;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';

  // Flat subject-tinted surface. Uses `accent-tint-strong` (not
  // surface-2 or bg): the softer tokens are 95%+ luminance with tiny
  // chroma deltas that JPEG's chroma subsampling strips entirely,
  // making the bg render as neutral gray. accent-tint-strong is deep
  // enough per subject (philosophy #D8C4FF, economics #BFDBFE,
  // psychology #FED7AA) to keep its color through JPEG AND read as
  // a warm, clearly subject-identified surface — which is what the
  // user asked for after the previous white bg felt sterile.
  ctx.fillStyle = theme.accentTintStrong || theme.surface2 || theme.bg;
  ctx.fillRect(0, 0, W, H);

  // Card height first, width derived from source aspect via the
  // single-source-of-truth helper. Never set both dims independently:
  // if the layout budget changes, only `cardH` moves; `cardW` follows.
  // 915 = 1220 × 0.75, preserves 63.5% of canvas height for the card
  // when we shrunk the canvas from 1920 → 1440.
  const cardH = 915;
  const img = await _loadThinkerPortrait(thinker, subject);
  const srcW = (img && img.width)  || 670;
  const srcH = (img && img.height) || 1200;
  const { w: cardW } = _cardBoxFromHeight(srcW, srcH, cardH);
  const cardX = Math.round((W - cardW) / 2);

  // Type sizes + gaps scale ¾ from the 1080×1920 layout in lockstep with
  // the canvas so the wordmark still reads as attribution (not an ad)
  // and the URL stays a discreet discoverability hint.
  const wmSize      = 39;   // 52 × 0.75
  const urlSize     = 17;   // 22 × 0.75, rounded up
  const wmToUrlGap  = 18;   // 24 × 0.75
  const cardToWmGap = 72;   // 96 × 0.75

  // Vertically center the whole (card + gap + wm + gap + url) stack so
  // top and bottom margins match. Card is small enough that this leaves
  // ~180px above and ~180px below, real breathing room on both edges.
  const compoundH = cardH + cardToWmGap + wmSize + wmToUrlGap + urlSize;
  const topPad    = Math.round((H - compoundH) / 2);
  const cardY     = topPad;

  // No frame stroke — illustration already has an ornate frame drawn in.
  _drawCollectiblePanel(ctx, img, thinker, subject, cardX, cardY, cardW, cardH, {
    radius:     18,
    frameWidth: 0,
  });

  // Wordmark
  ctx.font = `${wmSize}px "Nunito Black", Rubik, sans-serif`;
  ctx.letterSpacing = '-1.4px';
  ctx.fillStyle = theme.wordmark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const wmY = cardY + cardH + cardToWmGap;
  ctx.fillText('Corpus', W / 2, wmY);
  ctx.letterSpacing = '0px';

  // corpusapp.io — subject ink instead of the landscape footer's gold.
  // Gold reads well on the landscape's plain-white bg but nearly
  // disappears on the portrait's tinted surface (pale blue for
  // economics, warm peach for psychology, etc.). Ink is the app's
  // primary text token — always high-contrast against surface.
  ctx.font = `700 ${urlSize}px Rubik, sans-serif`;
  ctx.fillStyle = theme.name;
  ctx.fillText('corpusapp.io', W / 2, wmY + wmSize + wmToUrlGap);

  // PNG output — @napi-rs/canvas's JPEG encoder ships a broken YCbCr
  // conversion that systematically shifts colours on encode (verified:
  // rgb(37,42,86) navy → rgb(61,50,118) purple, ~30-unit deltas per
  // channel, unchanged at q=1.0 so it's not a quality issue). Every
  // other card in this generator outputs PNG for the same reason. File
  // size climbs from ~30KB JPEG to ~200KB PNG post-pngquant — worth it
  // for a share card where colour fidelity IS the point.
  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────────────────────────────────
// HTML page renderer — one landing page per dialogue × language
// ─────────────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderPage({ weekId, dayId, thinker, dayTitle, subject, lang }) {
  const isEn = lang === 'en';
  const dir = isEn ? 'ltr' : 'rtl';
  const theme = THEMES[subject] || THEMES.philosophy;
  const slug = _SUBJECT_SLUG[subject] || 'phil';
  const cardUrl = `${SITE_URL}/share/cards/${lang}/${slug}-${weekId}-${dayId}.png`;
  const title = dayTitle || 'Corpus';
  // "Corpus" intentionally omitted from the description — the card image
  // carries the wordmark and the preview UI shows the domain, so mentioning
  // it in prose is redundant. Dropping it also eliminates the RTL-mixed-
  // script run (ב-Corpus … 5 …) that WhatsApp bidi-reordered.
  const description = isEn
    ? `A dialogue with ${thinker.name}. 5 minutes a day with history's greatest minds.`
    : `דיאלוג עם ${thinker.name}. 5 דקות ביום עם גדולי ההוגים.`;
  // Redirect destinations. Desktop drops back to the marketing site so a
  // shared link on X / Slack still opens something usable when tapped from
  // a laptop.
  const IOS_URL     = 'https://apps.apple.com/app/id6781227385';
  const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.corpusapp.corpus';
  const DESKTOP_URL = 'https://corpusapp.io';
  const redirectingText = isEn ? 'Opening Corpus…' : 'פותח את Corpus…';
  const manualCTA       = isEn ? 'Open Corpus'    : 'פתח את Corpus';
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${NOINDEX_SUBJECTS.has(subject) ? `
<meta name="robots" content="noindex, nofollow">` : ''}
<title>${escapeHtml(title)} · Corpus</title>
<meta name="description" content="${escapeHtml(description)}">

<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${cardUrl}">
<meta property="og:image:secure_url" content="${cardUrl}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${SITE_URL}/d/${slug}-${weekId}-${dayId}-${lang}.html">
<meta property="og:site_name" content="Corpus">
<meta property="og:locale" content="${isEn ? 'en_US' : 'he_IL'}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${cardUrl}">

<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Rubik:wght@500;600;700;800;900&display=swap" rel="stylesheet">

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:      ${theme.bg};
    --plate:   ${PLATE};
    --rim:     ${RIM};
    --wordmark: ${theme.wordmark};
    --name:    ${theme.name};
    --era:     ${theme.era};
    --question: ${theme.question};
    --url:     ${URL_TXT};
  }
  html, body {
    background: var(--bg);
    color: var(--name);
    font-family: 'Rubik', sans-serif;
    min-height: 100dvh;
    -webkit-font-smoothing: antialiased;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px 64px;
    text-align: center;
  }
  .wordmark {
    /* Mirrors index.html .auth-logo-text — Nunito 900, tight tracking, subject accent. */
    font-family: 'Nunito', 'Rubik', sans-serif;
    font-weight: 900;
    font-size: 26px;
    color: var(--wordmark);
    letter-spacing: -0.7px;
    margin-bottom: 32px;
  }
  .card {
    display: block;
    width: 100%;
    max-width: 640px;
    margin: 0 auto 32px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
  .redirecting {
    font-weight: 600;
    font-size: 18px;
    color: var(--name);
    margin-bottom: 20px;
    opacity: 0.75;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    padding: 14px 28px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 16px;
    text-decoration: none;
    background: var(--wordmark);
    color: #FFFFFF;
    transition: transform .15s;
  }
  .cta:active { transform: scale(.97); }
  .url {
    display: block;
    margin-top: 32px;
    color: var(--url);
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
  }
</style>
</head>
<body>
<main>
  <div class="wordmark">Corpus</div>
  <img class="card" src="${cardUrl}" alt="${escapeHtml(title)} — ${escapeHtml(thinker.name)}" width="1200" height="630">
  <p class="redirecting">${escapeHtml(redirectingText)}</p>
  <a class="cta" id="manual" href="${IOS_URL}">${escapeHtml(manualCTA)}</a>
  <a class="url" href="${SITE_URL}">corpusapp.io</a>
</main>
<script>
  // Client-side redirect + PostHog beacon telemetry.
  //
  // Crawlers (facebookexternalhit, WhatsApp, Twitterbot, Slackbot,
  // LinkedInBot) don't execute JS — they only read the OG tags above,
  // so the events below fire ONLY for real human visits. That's why
  // no is_bot flag is emitted; it'd be false on 100% of records.
  //
  // Direct capture via navigator.sendBeacon rather than loading the
  // PostHog SDK from CDN: the 250ms redirect timer is faster than the
  // SDK can hydrate on mobile data, so landing_page_view would be
  // silently undercounted. Beacon queues the request in the background
  // and survives location.replace by spec. text/plain blob avoids the
  // CORS preflight while PostHog's /i/v0/e/ endpoint still parses the
  // JSON body.
  (function () {
    var POSTHOG_KEY = 'phc_vUupVqSRdBay7mQ4Aswudhu8mFHnych6PKNRpP6BHoS4';
    var POSTHOG_URL = 'https://us.i.posthog.com/i/v0/e/';
    // Ephemeral distinct_id, per page load. Both events from this
    // visit (view + cta click) share it so the in-visit micro-funnel
    // joins; we deliberately don't persist across visits or stitch
    // into the app — see the scoped-attribution decision in the audit.
    var distinctId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('anon-' + Date.now() + '-' + Math.random().toString(36).slice(2));

    var ua = navigator.userAgent || '';
    var isIOS     = /iPhone|iPad|iPod/i.test(ua);
    var isAndroid = /Android/i.test(ua);
    var target     = ${JSON.stringify(DESKTOP_URL)};
    var targetKind = 'desktop';
    if (isIOS)          { target = ${JSON.stringify(IOS_URL)};     targetKind = 'ios'; }
    else if (isAndroid) { target = ${JSON.stringify(ANDROID_URL)}; targetKind = 'android'; }

    var baseProps = {
      dialogue_id: ${JSON.stringify(String(weekId) + '-' + String(dayId))},
      subject:     ${JSON.stringify(subject || 'philosophy')},
      lang:        ${JSON.stringify(lang)},
      target:      targetKind,
      referrer:    document.referrer || null,
      // Suppress Person creation on PostHog server side. The distinct_id
      // is a fresh UUID per page load, so without this every landing
      // would materialize a phantom Person — hundreds per day of empty
      // profiles polluting the project. identified_only in the app's
      // SDK init does not apply here since the beacon bypasses the SDK.
      $process_person_profile: false
    };

    function beacon(event, extraProps) {
      var props = extraProps ? Object.assign({}, baseProps, extraProps) : baseProps;
      var payload = {
        api_key:     POSTHOG_KEY,
        event:       event,
        distinct_id: distinctId,
        properties:  props,
        timestamp:   new Date().toISOString()
      };
      try {
        var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
        navigator.sendBeacon(POSTHOG_URL, blob);
      } catch (e) { /* never block the redirect on capture failure */ }
    }

    beacon('landing_page_view');

    var manual = document.getElementById('manual');
    if (manual) {
      manual.href = target;
      manual.addEventListener('click', function () {
        beacon('landing_cta_click');
      });
    }

    // Delay one tick so the visible fallback flashes long enough to
    // explain what's happening if the store app takes a moment to open.
    setTimeout(function () { location.replace(target); }, 250);
  })();
</script>
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────────────────
// Thinker landing page renderer — /t/{id}[-{subject}]-{lang}.html
// ─────────────────────────────────────────────────────────────────────────
// Structurally identical to renderPage: same layout, same redirect + beacon
// script, same OG/Twitter card meta. Deltas: /t/ path, description names
// the person (not a dialogue), landing-page telemetry carries thinker_id
// instead of dialogue_id.

function renderThinkerPage({ thinker, subject, lang, hasSubjectSuffix }) {
  const isEn = lang === 'en';
  const dir = isEn ? 'ltr' : 'rtl';
  const theme = THEMES[subject] || THEMES.philosophy;
  const stem = hasSubjectSuffix ? `${thinker.id}-${subject}` : thinker.id;
  const cardUrl = `${SITE_URL}/share/thinkers/${lang}/${stem}.png`;
  const pageUrl = `${SITE_URL}/t/${stem}-${lang}.html`;
  const title = thinker.name;
  const description = isEn
    ? `${thinker.name} on Corpus — ${thinker.era}. 5 minutes a day with history's greatest minds.`
    : `${thinker.name} ב-Corpus — ${thinker.era}. 5 דקות ביום עם גדולי ההוגים.`;
  const IOS_URL     = 'https://apps.apple.com/app/id6781227385';
  const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.corpusapp.corpus';
  const DESKTOP_URL = 'https://corpusapp.io';
  const redirectingText = isEn ? 'Opening Corpus…' : 'פותח את Corpus…';
  const manualCTA       = isEn ? 'Open Corpus'    : 'פתח את Corpus';
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${NOINDEX_SUBJECTS.has(subject) ? `
<meta name="robots" content="noindex, nofollow">` : ''}
<title>${escapeHtml(title)} · Corpus</title>
<meta name="description" content="${escapeHtml(description)}">

<meta property="og:type" content="profile">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${cardUrl}">
<meta property="og:image:secure_url" content="${cardUrl}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${pageUrl}">
<meta property="og:site_name" content="Corpus">
<meta property="og:locale" content="${isEn ? 'en_US' : 'he_IL'}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${cardUrl}">

<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Rubik:wght@500;600;700;800;900&display=swap" rel="stylesheet">

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:      ${theme.bg};
    --plate:   ${PLATE};
    --rim:     ${RIM};
    --wordmark: ${theme.wordmark};
    --name:    ${theme.name};
    --era:     ${theme.era};
    --question: ${theme.question};
    --url:     ${URL_TXT};
  }
  html, body {
    background: var(--bg);
    color: var(--name);
    font-family: 'Rubik', sans-serif;
    min-height: 100dvh;
    -webkit-font-smoothing: antialiased;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px 64px;
    text-align: center;
  }
  .wordmark {
    font-family: 'Nunito', 'Rubik', sans-serif;
    font-weight: 900;
    font-size: 26px;
    color: var(--wordmark);
    letter-spacing: -0.7px;
    margin-bottom: 32px;
  }
  .card {
    display: block;
    width: 100%;
    max-width: 640px;
    margin: 0 auto 32px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
  .redirecting {
    font-weight: 600;
    font-size: 18px;
    color: var(--name);
    margin-bottom: 20px;
    opacity: 0.75;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    padding: 14px 28px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 16px;
    text-decoration: none;
    background: var(--wordmark);
    color: #FFFFFF;
    transition: transform .15s;
  }
  .cta:active { transform: scale(.97); }
  .url {
    display: block;
    margin-top: 32px;
    color: var(--url);
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
  }
</style>
</head>
<body>
<main>
  <div class="wordmark">Corpus</div>
  <img class="card" src="${cardUrl}" alt="${escapeHtml(thinker.name)}" width="1200" height="630">
  <p class="redirecting">${escapeHtml(redirectingText)}</p>
  <a class="cta" id="manual" href="${IOS_URL}">${escapeHtml(manualCTA)}</a>
  <a class="url" href="${SITE_URL}">corpusapp.io</a>
</main>
<script>
  (function () {
    var POSTHOG_KEY = 'phc_vUupVqSRdBay7mQ4Aswudhu8mFHnych6PKNRpP6BHoS4';
    var POSTHOG_URL = 'https://us.i.posthog.com/i/v0/e/';
    var distinctId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('anon-' + Date.now() + '-' + Math.random().toString(36).slice(2));

    var ua = navigator.userAgent || '';
    var isIOS     = /iPhone|iPad|iPod/i.test(ua);
    var isAndroid = /Android/i.test(ua);
    var target     = ${JSON.stringify(DESKTOP_URL)};
    var targetKind = 'desktop';
    if (isIOS)          { target = ${JSON.stringify(IOS_URL)};     targetKind = 'ios'; }
    else if (isAndroid) { target = ${JSON.stringify(ANDROID_URL)}; targetKind = 'android'; }

    var baseProps = {
      thinker_id: ${JSON.stringify(thinker.id)},
      subject:    ${JSON.stringify(subject || 'philosophy')},
      lang:       ${JSON.stringify(lang)},
      target:     targetKind,
      referrer:   document.referrer || null,
      $process_person_profile: false
    };

    function beacon(event, extraProps) {
      var props = extraProps ? Object.assign({}, baseProps, extraProps) : baseProps;
      var payload = {
        api_key:     POSTHOG_KEY,
        event:       event,
        distinct_id: distinctId,
        properties:  props,
        timestamp:   new Date().toISOString()
      };
      try {
        var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
        navigator.sendBeacon(POSTHOG_URL, blob);
      } catch (e) { /* never block the redirect on capture failure */ }
    }

    beacon('thinker_landing_page_view');

    var manual = document.getElementById('manual');
    if (manual) {
      manual.href = target;
      manual.addEventListener('click', function () {
        beacon('thinker_landing_cta_click');
      });
    }

    setTimeout(function () { location.replace(target); }, 250);
  })();
</script>
</body>
</html>
`;
}

// Which subject(s) a thinker belongs to, in priority order for image /
// theme selection. Default is philosophy — matches the in-app default
// when `subject` is unset. Multi-subject thinkers (Kahneman) list all.
function _subjectsForThinker(t) {
  if (Array.isArray(t.subjects) && t.subjects.length) return t.subjects;
  if (t.subject) return [t.subject];
  return ['philosophy'];
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  _registerFonts();

  const { corpusData, economicsData, psychologyData, THINKERS, THINKERS_EN } = extractData();

  const subjects = [
    { subject: 'philosophy', data: corpusData     },
    { subject: 'economics',  data: economicsData  },
    { subject: 'psychology', data: psychologyData },
  ];

  // Manifest maps (subject, weekId, dayId, lang) → generated card + page paths.
  const manifest = { generatedAt: new Date().toISOString(), items: [] };

  for (const { subject, data } of subjects) {
    if (!data || !Array.isArray(data.weeks)) continue;
    for (const week of data.weeks) {
      if (!week || !Array.isArray(week.days)) continue;
      for (const day of week.days) {
        if (!day || !day.thinkerId) continue;

        for (const lang of ['he', 'en']) {
          const isEn = lang === 'en';
          const thinker = (isEn ? THINKERS_EN : THINKERS).find(t => t.id === day.thinkerId);
          if (!thinker) {
            console.warn('[gen:share] thinker not found for id', day.thinkerId, 'lang', lang);
            continue;
          }
          const dayTitle = isEn
            ? (day.titleEn || day.title)
            : (day.title    || day.titleEn);
          if (!dayTitle) continue;

          const slug = _SUBJECT_SLUG[subject] || 'phil';

          // Card PNG — only when canvas is available. Pages don't depend on
          // the card existing to round-trip; the og:image will just 404 until
          // a run with canvas installed writes the PNGs. Skip silently.
          if (CANVAS_ENABLED) {
            const cardDir  = path.join(OUT_CARDS, lang);
            const cardFile = path.join(cardDir, `${slug}-${week.id}-${day.id}.png`);
            fs.mkdirSync(cardDir, { recursive: true });
            const buf = await renderCard({ thinker, dayTitle, subject, lang });
            fs.writeFileSync(cardFile, buf);
          }

          // HTML landing page
          fs.mkdirSync(OUT_PAGES, { recursive: true });
          const pageFile = path.join(OUT_PAGES, `${slug}-${week.id}-${day.id}-${lang}.html`);
          fs.writeFileSync(pageFile, renderPage({
            weekId:   week.id,
            dayId:    day.id,
            thinker,
            dayTitle,
            subject,
            lang,
          }));

          manifest.items.push({
            weekId: week.id,
            dayId:  day.id,
            subject,
            lang,
            thinkerId: day.thinkerId,
            title:  dayTitle,
            card:   `share/cards/${lang}/${slug}-${week.id}-${day.id}.png`,
            page:   `d/${slug}-${week.id}-${day.id}-${lang}.html`,
          });
        }
      }
    }
  }

  // Manifest
  fs.mkdirSync(OUT_CARDS, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_CARDS, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );

  console.log(`[gen:share] wrote ${manifest.items.length} pages` +
              (CANVAS_ENABLED ? ` + ${manifest.items.length} cards` : ' (cards skipped — canvas not installed)'));
  if (CANVAS_ENABLED) console.log(`[gen:share] cards → ${path.relative(ROOT, OUT_CARDS)}`);
  console.log(`[gen:share] pages → ${path.relative(ROOT, OUT_PAGES)}`);
  console.log(`[gen:share] manifest → ${path.relative(ROOT, path.join(OUT_CARDS, 'manifest.json'))}`);

  // ─── Thinker cards + pages (parallel to dialogues; one variant per
  // subject a thinker belongs to, both languages). Multi-subject thinkers
  // (Kahneman) produce per-subject file variants so the portrait override
  // and theme match the sharing context.
  const thinkerManifest = { generatedAt: new Date().toISOString(), items: [] };
  for (const lang of ['he', 'en']) {
    const list = (lang === 'en') ? THINKERS_EN : THINKERS;
    for (const t of list) {
      if (!t || !t.id) continue;
      // Every thinker with an illustration gets a card. Quote is no
      // longer the hero — the collectible artwork is — so an unset
      // quote is not a skip reason.
      if (!t.image && !(t.images && Object.keys(t.images).length)) continue;
      const subs = _subjectsForThinker(t);
      const hasSubjectSuffix = subs.length > 1;
      for (const subject of subs) {
        const stem = hasSubjectSuffix ? `${t.id}-${subject}` : t.id;
        if (CANVAS_ENABLED) {
          // Landscape 1200×630 → og:image for the /t/ page.
          const landDir  = path.join(OUT_THINKERS, lang);
          const landFile = path.join(landDir, `${stem}.png`);
          fs.mkdirSync(landDir, { recursive: true });
          const landBuf = await renderThinkerCardLandscape({ thinker: t, subject, lang });
          fs.writeFileSync(landFile, landBuf);
          // Portrait 1080×1920 → native share-sheet file attachment. PNG
          // (not JPEG) — see the encoder-bug comment inside
          // renderThinkerCardPortrait. Kept in a `portrait/`
          // subdirectory so a directory listing tells the two variants
          // apart at a glance; pngquant compresses it in the post-pass.
          const portDir  = path.join(OUT_THINKERS, 'portrait', lang);
          const portFile = path.join(portDir, `${stem}.png`);
          fs.mkdirSync(portDir, { recursive: true });
          const portBuf = await renderThinkerCardPortrait({ thinker: t, subject, lang });
          fs.writeFileSync(portFile, portBuf);
        }
        fs.mkdirSync(OUT_THINKER_PAGES, { recursive: true });
        const pageFile = path.join(OUT_THINKER_PAGES, `${stem}-${lang}.html`);
        fs.writeFileSync(pageFile, renderThinkerPage({
          thinker: t, subject, lang, hasSubjectSuffix,
        }));
        thinkerManifest.items.push({
          thinkerId: t.id,
          subject,
          lang,
          name: t.name,
          era:  t.era,
          cardLandscape: `share/thinkers/${lang}/${stem}.png`,
          cardPortrait:  `share/thinkers/portrait/${lang}/${stem}.png`,
          page:          `t/${stem}-${lang}.html`,
        });
      }
    }
  }
  fs.mkdirSync(OUT_THINKERS, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_THINKERS, 'manifest.json'),
    JSON.stringify(thinkerManifest, null, 2) + '\n'
  );
  console.log(`[gen:share] wrote ${thinkerManifest.items.length} thinker pages` +
              (CANVAS_ENABLED ? ` + ${thinkerManifest.items.length * 2} thinker cards (landscape + portrait)` : ''));
  console.log(`[gen:share] thinker cards → ${path.relative(ROOT, OUT_THINKERS)}`);
  console.log(`[gen:share] thinker pages → ${path.relative(ROOT, OUT_THINKER_PAGES)}`);

  // Post-pass: pngquant compression. Cards render at ~200–330KB uncompressed;
  // quantizing to 70–90% quality drops that to ~50–100KB with no visible loss,
  // which keeps every card under the ~300KB WhatsApp/Twitter OG-image soft cap.
  // Skipped silently if pngquant-bin isn't installed (dev-only devDep).
  if (CANVAS_ENABLED) _compressCards();
}

function _compressCards() {
  // pngquant-bin ships the binary at node_modules/pngquant-bin/vendor/pngquant.
  // Probe that path directly — avoids ESM/CJS interop for a devDep that only
  // exposes its binary path.
  const pngquantBin = path.join(ROOT, 'node_modules', 'pngquant-bin', 'vendor', 'pngquant');
  if (!fs.existsSync(pngquantBin)) {
    console.warn('[gen:share] pngquant-bin not installed — skipping compression.');
    return;
  }
  // Recursive PNG walker — cards live at OUT_CARDS/{lang}/*.png and
  // OUT_THINKERS/{lang}/*.png plus OUT_THINKERS/portrait/{lang}/*.png,
  // so a flat one-level scan misses the portrait sibling.
  const pngs = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (entry.endsWith('.png')) pngs.push(full);
    }
  };
  walk(OUT_CARDS);
  walk(OUT_THINKERS);
  if (!pngs.length) return;
  const before = pngs.reduce((a, p) => a + fs.statSync(p).size, 0);
  // Two quality tiers. Portrait share cards get 60-80 (more aggressive)
  // because they'll be recompressed by Instagram / WhatsApp on upload
  // AND downloaded on every tap-to-share — so mobile data cost matters
  // more than lossless fidelity. Landscape / dialogue cards get 70-90
  // (the traditional quality) because they're the /d/ + /t/ og:image
  // that a viewer sees inline in the link preview at full resolution.
  const isPortrait = (p) => p.includes(path.sep + 'portrait' + path.sep);
  const compress = (files, quality) => {
    const args = ['--quality=' + quality, '--strip', '--force', '--skip-if-larger', '--output'];
    for (const p of files) {
      spawnSync(pngquantBin, [...args, p, p], { stdio: 'ignore' });
    }
  };
  compress(pngs.filter(p => !isPortrait(p)), '70-90');
  compress(pngs.filter(p =>  isPortrait(p)), '60-80');
  const after  = pngs.reduce((a, p) => a + fs.statSync(p).size, 0);
  const savedKB = Math.round((before - after) / 1024);
  console.log(`[gen:share] compressed ${pngs.length} cards → ${Math.round(after / 1024)}KB total (−${savedKB}KB)`);
}

main().catch(err => {
  console.error('[gen:share] failed:', err);
  process.exit(1);
});
