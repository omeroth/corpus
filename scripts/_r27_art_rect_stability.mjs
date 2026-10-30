// Round 27 (rewritten R40b) — the card art stays within 1 px when the
// frame arrives in a tier-upgrade sequence. Historical note: the
// pre-R35 reveal mounted art as a stack of two <img> elements (art +
// frame) inside `.rv-art`; the test sampled that img's rect across the
// swap. R35 revert replaced the whole card with a single canvas
// (`.rv-face.rv-composed > canvas.rv-bmp-canvas`) drawn by _rv8DrawCard;
// the frame upgrade is now a canvas redraw with an alpha-animated frame
// layer rather than a DOM swap, so the OLD selector (`.rv-art img`) no
// longer exists.
//
// The new sampling reads the canvas card's getBoundingClientRect and
// tracks `.rv-root.rv-framed` + `.rv-root.rv-focus` for sequence phase.
// Boundary points 3/6/9/12 trigger the bronze / silver / gold / diamond
// upgrades respectively. Three devices × EN+HE × four tiers = 24 cases.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
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

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function measure(w, h, lang, points) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  // Pin the card's hover bob so pre/post rect samples catch the same
  // phase. The rd-hov-flat keyframe bobs .rv-pc 0 → -6px → 0 across
  // 2.4 s; without this, samples several seconds apart land at
  // different bob positions and the test reads a 2-6 px shift that is
  // really just the bob.
  await page.addStyleTag({ content: `body.on-reader-v7 #dc-thinker-screen.rv-v7 .rv-pc { animation: none !important; }` });
  await page.waitForTimeout(200);
  const samples = await page.evaluate(async (p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
    const out = [];
    const start = performance.now();
    while (performance.now() - start < 8000) {
      const canvas = document.querySelector('#dc-thinker-screen .rv-pc .rv-face.rv-composed canvas.rv-bmp-canvas')
        || document.querySelector('#dc-thinker-screen .rv-pc canvas.rv-bmp-canvas');
      const root   = document.querySelector('.rv-root');
      const framed = !!(root && root.classList.contains('rv-framed'));
      const focus  = !!(root && root.classList.contains('rv-focus'));
      const pc = document.querySelector('#dc-thinker-screen .rv-pc');
      const pcTransform = pc ? getComputedStyle(pc).transform : null;
      // The canvas is 1D-pinned by inline width/height style, but we
      // measure the rendered rect to catch any upstream transform that
      // moved the whole stage.
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        out.push({ t: Math.round(performance.now() - start), framed, focus, pcTransform, x: r.left, y: r.top, w: r.width, h: r.height });
      } else {
        out.push({ t: Math.round(performance.now() - start), framed, focus, pcTransform, canvas: 'none' });
      }
      await new Promise(r => setTimeout(r, 40));
    }
    return out;
  }, points);
  await ctx.close();
  return samples;
}

async function check(label, w, h, lang, points) {
  const samples = await measure(w, h, lang, points);
  // BEFORE: last stable sample that is pre-focus AND pre-framed AND
  // without any transform on .rv-pc (identity matrix). This is the
  // moment right after the orb lands and before the frame-arrival
  // sequence begins. AFTER: last sample (post-settle, framed).
  const stableBefore = [...samples].reverse().find(s => s.canvas !== 'none' && !s.framed && !s.focus && (s.pcTransform === 'none' || s.pcTransform === 'matrix(1, 0, 0, 1, 0, 0)'));
  const framedAny = samples.some(s => s.framed);
  if (!framedAny) {
    rec(`${label}: swap captured (root.rv-framed appears)`, false, `.rv-framed never appeared in ${samples.length} samples`);
    return;
  }
  const after = samples[samples.length - 1];
  if (!stableBefore || stableBefore.canvas === 'none' || after.canvas === 'none') {
    rec(`${label}: canvas measurable before + after`, false, `stableBefore=${JSON.stringify(stableBefore)} after=${JSON.stringify(after)}`);
    return;
  }
  const dx = Math.abs(after.x - stableBefore.x);
  const dy = Math.abs(after.y - stableBefore.y);
  const dw = Math.abs(after.w - stableBefore.w);
  const dh = Math.abs(after.h - stableBefore.h);
  const pass = dx <= 1 && dy <= 1 && dw <= 1 && dh <= 1;
  rec(`${label}: canvas card rect stable (dx/dy/dw/dh ≤ 1px) through ${label.includes('p=3')?'plain→bronze':label.includes('p=6')?'bronze→silver':label.includes('p=9')?'silver→gold':'gold→diamond'} upgrade`, pass,
    `before=(${stableBefore.x.toFixed(1)},${stableBefore.y.toFixed(1)},${stableBefore.w.toFixed(1)}×${stableBefore.h.toFixed(1)}) after=(${after.x.toFixed(1)},${after.y.toFixed(1)},${after.w.toFixed(1)}×${after.h.toFixed(1)}) Δ=(${dx.toFixed(1)},${dy.toFixed(1)},${dw.toFixed(1)}×${dh.toFixed(1)})`);
}

for (const [w, h, name] of [[375, 667, 'SE'], [393, 852, '15Pro'], [430, 932, 'ProMax']]) {
  for (const lang of ['en', 'he']) {
    for (const points of [3, 6, 9, 12]) {
      await check(`${name} ${w}×${h} ${lang} p=${points}`, w, h, lang, points);
    }
  }
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
