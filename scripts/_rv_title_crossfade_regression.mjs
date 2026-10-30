// Round 26 item 2 — sequential title crossfade on the frame-upgrade
// screen. Pre-round-26 both .rv-t1 ("<name> again!") and .rv-t2
// ("<Tier> frame!") used the same .4s transition on opacity + transform
// and fired simultaneously on .rv-framed, so for ~400 ms both titles
// were legible on top of each other.
//
// Fix (CSS): .rv-t1 { transition: opacity .3s } runs the fade-out first;
// .rv-t2 { transition: opacity .3s .35s } waits for t1 to settle before
// fading in. This regression samples both opacities every 50 ms through
// the swap and fails if both are above 0.15 at the same time.
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

async function openFrameUpgrade(w, h, lang, points) {
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
  await page.waitForTimeout(300);
  await page.evaluate((p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
  }, points);
  return { ctx, page };
}

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function sampleCrossfade(w, h, lang, points) {
  const { ctx, page } = await openFrameUpgrade(w, h, lang, points);
  // Start sampling IMMEDIATELY on page open — the frame-upgrade swap
  // can land anywhere in a 0-5 s window after _debugThinkerReveal. The
  // sampler runs for 5.5 s so we definitely cover the swap, including
  // the focus-mode pause and the final .rv-framed transition. The test
  // then slices to just the frames where the swap was active.
  const samples = await page.evaluate(async () => {
    const out = [];
    const start = performance.now();
    while (performance.now() - start < 7000) {
      const t1 = document.querySelector('#dc-thinker-screen .rv-t1');
      const t2 = document.querySelector('#dc-thinker-screen .rv-t2');
      out.push({
        t: Math.round(performance.now() - start),
        t1Op: t1 ? parseFloat(getComputedStyle(t1).opacity) : null,
        t2Op: t2 ? parseFloat(getComputedStyle(t2).opacity) : null,
        framed: !!(document.querySelector('.rv-root.rv-framed')),
      });
      await new Promise(r => setTimeout(r, 40));
    }
    return out;
  });
  await ctx.close();
  return samples;
}

async function check(label, w, h, lang, points) {
  const samples = await sampleCrossfade(w, h, lang, points);
  // Find the moment where root.rv-framed first appears — this is the
  // boundary where t1 begins fading out. We need to see that boundary
  // in the samples to confirm the swap actually happened; otherwise
  // the test is a no-op.
  const framedStart = samples.findIndex(s => s.framed);
  // Look for any sample where BOTH t1 and t2 are above 0.15.
  const overlapping = samples.filter(s => s.t1Op > 0.15 && s.t2Op > 0.15);
  const swapCaptured = framedStart >= 0;
  rec(`${label}: swap captured + no moment where both titles > 0.15`,
      swapCaptured && overlapping.length === 0,
      overlapping.length
        ? `overlapping=${overlapping.length}, first @ t=${overlapping[0].t}ms t1=${overlapping[0].t1Op.toFixed(2)} t2=${overlapping[0].t2Op.toFixed(2)}`
        : `framedStart=${framedStart} (${samples[framedStart] ? samples[framedStart].t + 'ms' : 'never'}), samples=${samples.length}`);
}

// Frame-upgrade boundaries at p=3 (plain→bronze), 6 (bronze→silver),
// 12 (gold→diamond). Three devices × EN + HE.
for (const [w, h, name] of [[375, 667, 'SE'], [393, 852, '15Pro'], [430, 932, 'ProMax']]) {
  for (const lang of ['en', 'he']) {
    for (const points of [6, 12]) {
      await check(`${name} ${w}×${h} ${lang} p=${points}`, w, h, lang, points);
    }
  }
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
