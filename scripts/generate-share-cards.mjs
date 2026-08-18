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
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return {
    corpusData:    _findJsLiteral(src, 'const corpusData = '),
    economicsData: _findJsLiteral(src, 'const economicsData = '),
    THINKERS:      _findJsLiteral(src, 'const THINKERS = '),
    THINKERS_EN:   _findJsLiteral(src, 'const THINKERS_EN = '),
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
// Palettes (must stay in lockstep with the in-app _SHARE_CARD_THEMES)
// ─────────────────────────────────────────────────────────────────────────

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
    const frame = _extractRootVar(src, 'frame-' + subject);
    themes[subject] = {
      bg:       v.bg,
      wordmark: v.accent,
      name:     v.ink,
      era:      v['text-2'],
      question: v['accent-dark'],
      frame:    frame,  // optional; may be null on branches without --frame-<subject>
    };
    // Only require the 5 fields we actually consume unconditionally.
    // `frame` is optional — guarded at the call site by USE_FRAME_RIM.
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
  // Portrait image
  if (thinker.image) {
    try {
      const imgPath = thinker.image.replace(/^\.\//, '');
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
<meta name="viewport" content="width=device-width, initial-scale=1">
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
// Main
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  _registerFonts();

  const { corpusData, economicsData, THINKERS, THINKERS_EN } = extractData();

  const subjects = [
    { subject: 'philosophy', data: corpusData    },
    { subject: 'economics',  data: economicsData },
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
  const pngs = [];
  for (const lang of fs.readdirSync(OUT_CARDS)) {
    const dir = path.join(OUT_CARDS, lang);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.png')) pngs.push(path.join(dir, f));
    }
  }
  if (!pngs.length) return;
  const before = pngs.reduce((a, p) => a + fs.statSync(p).size, 0);
  const args = ['--quality=70-90', '--strip', '--force', '--skip-if-larger', '--output'];
  for (const p of pngs) {
    spawnSync(pngquantBin, [...args, p, p], { stdio: 'ignore' });
  }
  const after  = pngs.reduce((a, p) => a + fs.statSync(p).size, 0);
  const savedKB = Math.round((before - after) / 1024);
  console.log(`[gen:share] compressed ${pngs.length} cards → ${Math.round(after / 1024)}KB total (−${savedKB}KB)`);
}

main().catch(err => {
  console.error('[gen:share] failed:', err);
  process.exit(1);
});
