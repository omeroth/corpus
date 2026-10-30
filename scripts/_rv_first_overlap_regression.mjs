// Round 24 item 3 — first-meeting reveal must have NO overlap between
// any of these elements on SE (375×667), 393×852, 430×932, EN + HE,
// before AND after the flip:
//   title (h2 "You met …!")
//   subtitle (.rv-rvh "A new thinker joins you")
//   stage/card (#rv-stg + .rv-flp)
//   "Tap to reveal" hint (#rv-tap)
//   pill (.rv-pill)
//   track (#rv-trk / "N more to the Bronze frame" label)
//   CTA cluster (.rd-cta: Next Dialogue + Share/Home)
//
// Also measures the card's bounding rect before and after the flip to
// prove it stays stable (width stays within ±1px, same as round 22).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p); if (!abs.startsWith(root)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

async function openFirst(w, h, lang) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const st = { v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
    localStorage.setItem('corpus_state', JSON.stringify(st));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', 1);
  });
  await page.waitForTimeout(900);
  return { ctx, page };
}

async function measureAll(page) {
  return page.evaluate(() => {
    const sel = {
      title: '#dc-thinker-screen .rv-root.rv-first h2',
      sub: '#dc-thinker-screen .rv-root.rv-first .rv-rvh',
      stage: '#rv-stg',
      card: '#rv-flp',
      hint: '#rv-tap',
      pill: '#dc-thinker-screen .rv-pill',
      track: '#dc-thinker-screen #rv-trk',
      cta: '#dc-thinker-screen .rd-cta',
      ctaPrimary: '#rd-cta-next',
    };
    const out = {};
    for (const [k, s] of Object.entries(sel)) {
      const el = document.querySelector(s);
      if (!el) { out[k] = null; continue; }
      const r = el.getBoundingClientRect();
      out[k] = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    }
    return out;
  });
}

function overlapsVertically(a, b) {
  // Two rects overlap vertically if a.bottom > b.top AND a.top < b.bottom.
  // We want to check the STACKING overlap (top-to-bottom); use a 1px slop.
  if (!a || !b) return false;
  return (a.bottom > b.top + 1) && (a.top + 1 < b.bottom);
}

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// Elements in natural top-to-bottom order on the reveal screen.
const STACK_ORDER = ['title', 'sub', 'card', 'hint', 'pill', 'track', 'cta'];

async function check(w, h, lang, phase) {
  const { ctx, page } = await openFirst(w, h, lang);
  // phase: 'before' = pre-flip (no action); 'after' = post-flip
  if (phase === 'after') {
    await page.evaluate(() => {
      const stg = document.getElementById('rv-stg');
      if (stg && stg.onclick) stg.onclick();
    });
    await page.waitForTimeout(1800);  // flip animation + settle
  }
  const m = await measureAll(page);
  const label = `${w}×${h} ${lang} ${phase}`;
  // Check every adjacent pair in STACK_ORDER for vertical overlap.
  // Skip 'hint' when phase === 'after' (it's visibility: hidden, bbox
  // still has size for layout but we don't care about overlap with
  // invisible content).
  const stack = STACK_ORDER.filter(k => {
    if (phase === 'after' && k === 'hint') return false;
    return !!m[k];
  });
  const failures = [];
  for (let i = 0; i < stack.length - 1; i++) {
    const a = m[stack[i]], b = m[stack[i + 1]];
    if (overlapsVertically(a, b)) {
      failures.push(`${stack[i]}(${Math.round(a.top)}-${Math.round(a.bottom)}) ∩ ${stack[i + 1]}(${Math.round(b.top)}-${Math.round(b.bottom)})`);
    }
  }
  rec(`${label}: no vertical overlap between stacked elements`,
      failures.length === 0, failures.length ? failures.join(' | ') : `stack=[${stack.join(',')}]`);
  // Also: card bottom must be above pill top (card doesn't push into the body).
  if (m.card && m.pill) {
    const cardBelowPill = m.card.bottom > m.pill.top + 1;
    rec(`${label}: card.bottom ≤ pill.top`, !cardBelowPill,
        `card.bottom=${Math.round(m.card.bottom)} pill.top=${Math.round(m.pill.top)}`);
  }
  // Also: title.bottom < card.top (title not covered by card).
  if (m.title && m.card) {
    const titleCoveredByCard = m.card.top < m.title.bottom - 1;
    rec(`${label}: card.top ≥ title.bottom`, !titleCoveredByCard,
        `title.bottom=${Math.round(m.title.bottom)} card.top=${Math.round(m.card.top)}`);
  }
  await ctx.close();
  return m;
}

// Three device sizes, both languages, before + after.
const devices = [
  { w: 375, h: 667, name: 'SE' },
  { w: 393, h: 852, name: '15Pro' },
  { w: 430, h: 932, name: 'ProMax' },
];
for (const d of devices) {
  for (const lang of ['en', 'he']) {
    await check(d.w, d.h, lang, 'before');
    await check(d.w, d.h, lang, 'after');
  }
}

// Round 25b — minimum-width targets per device so the card can't
// silently shrink again. Targets are the user's round-25b ask.
async function checkMinWidth(w, h, lang, minWidth, phase) {
  const { ctx, page } = await openFirst(w, h, lang);
  if (phase === 'after') {
    await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s && s.onclick) s.onclick(); });
    await page.waitForTimeout(1800);
  }
  const w2 = await page.evaluate(() => {
    const c = document.getElementById('rv-flp');
    return c ? Math.round(c.getBoundingClientRect().width) : 0;
  });
  rec(`${w}×${h} ${lang} ${phase}: card width ≥ ${minWidth} (first-meeting target)`,
      w2 >= minWidth, `width=${w2} target=${minWidth}`);
  await ctx.close();
}
for (const d of devices) {
  const minW = d.w <= 375 ? 150 : d.w <= 393 ? 230 : 260;
  for (const lang of ['en', 'he']) {
    for (const phase of ['before', 'after']) {
      await checkMinWidth(d.w, d.h, lang, minW, phase);
    }
  }
}

// Card width stability through the flip (round 22 contract, re-verified).
{
  const { ctx, page } = await openFirst(430, 932, 'en');
  const r0 = await page.evaluate(() => {
    const c = document.getElementById('rv-flp');
    const r = c.getBoundingClientRect(); return { x: r.x, width: r.width };
  });
  await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s && s.onclick) s.onclick(); });
  await page.waitForTimeout(1800);
  const r1 = await page.evaluate(() => {
    const c = document.getElementById('rv-flp');
    const r = c.getBoundingClientRect(); return { x: r.x, width: r.width };
  });
  const xDrift = Math.abs(r1.x - r0.x), wDrift = Math.abs(r1.width - r0.width);
  rec('Card width/x stable through flip on 430×932',
      xDrift <= 1 && wDrift <= 1,
      `before=(${Math.round(r0.x)},${Math.round(r0.width)}) after=(${Math.round(r1.x)},${Math.round(r1.width)}) drift x=${xDrift.toFixed(1)} w=${wDrift.toFixed(1)}`);
  await ctx.close();
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
