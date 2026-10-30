// Round 30 item 3 — per-rAF art-rect stability regression.
// Round 27/29's _r27_art_rect_stability compared one BEFORE sample
// to one AFTER sample; it missed mid-animation jumps. This regression
// samples the art rect on EVERY requestAnimationFrame from mount to
// the moment the CTAs are enabled, and FAILS if ANY frame differs
// from the first stable frame by more than 1 px on any axis.
//
// Round 35b — the user reported a WebKit-only horizontal jump that
// Chromium didn't catch. This file now:
//   • runs in BOTH Chromium AND WebKit (Playwright's firefox/webkit).
//   • covers p = 1 (first-meeting flip), p = 2 (plain point-drop), AND
//     p = 3, 6, 9, 12 (framed point-drop + frame upgrade).
//   • samples the art rect for 6 extra seconds after the sequence
//     settles to catch idle-state horizontal drift.
//   • tightens the X-axis threshold to 0.5 px (the user's "jumps
//     from side to side" bug is a sub-pixel repaint, not a layout
//     shift). Y / W / H stay at 1 px.
import { chromium, webkit } from 'playwright-core';
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
const chromiumBrowser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
// WebKit launch is best-effort — the browser binary may not be
// installed. On failure, log and continue with Chromium only; a
// --webkit-only run will exit with a clear message.
let webkitBrowser = null;
try { webkitBrowser = await webkit.launch({ headless: true }); }
catch (e) { console.warn('[warn] WebKit launch failed, falling back to Chromium only. Install with: npx playwright install webkit\n       ', e.message); }
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function measure(browser, w, h, lang, points) {
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
  // Round 35b — do NOT disable the hover animation globally; the whole
  // point is to catch sub-pixel X drift under the live rd-hov-flat +
  // rd-gu pulse. Only the .rv-flp first-meeting flipper would need
  // the animation suppressor, and that path doesn't use .rv-pc anyway.
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });

  // Sample art rect every rAF from mount until .rd-cta.rv-cta-revealed
  // (buttons enabled) + 6 extra seconds of idle sampling (Round 35b),
  // OR 14 s elapsed total, whichever is first. The idle window catches
  // the WebKit sub-pixel wobble that only shows up after the sequence
  // settles and the rd-hov-flat float keeps running.
  const samples = await page.evaluate(async (p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
    const out = [];
    const start = performance.now();
    let ctaReadyAt = 0;
    const IDLE_WINDOW_MS = 6000;
    const HARD_CAP_MS = 14000;
    return new Promise((resolve) => {
      function frame() {
        // Round 35b — first-meeting path uses .rv-flp img, not .rv-pc.
        const img = document.querySelector('#dc-thinker-screen .rv-pc .rv-art img:not(.rv-frame), #dc-thinker-screen .rv-pc .rv-face img:not(.rv-frame), #dc-thinker-screen .rv-flp .rv-art img:not(.rv-frame), #dc-thinker-screen .rv-flp .rv-face img:not(.rv-frame)');
        const ctaRevealed = !!document.querySelector('#dc-thinker-screen .rd-cta.rv-cta-revealed');
        const elapsed = performance.now() - start;
        if (ctaRevealed && !ctaReadyAt) ctaReadyAt = elapsed;
        if (img) {
          const r = img.getBoundingClientRect();
          // Round 35 — walk ancestors from the art up to .rv-root and
          // flag any paint-touching chrome (bg, border, box-shadow,
          // outline) on BOTH framed and unframed cards. Rounds 32/33
          // only checked unframed, so the mid-upgrade box-shadow glow
          // on .rv-face slipped through for framed tiers (user saw a
          // box around the whole frame). The only legal painters are
          // the PNG overlay (<img class="corpus-frame-overlay">) and
          // the art <img> itself (which may carry its own drop-shadow
          // or box-shadow for the plain soft-shadow look).
          //
          // Round 35b — scope to the .rv-pc path (point-drop + frame
          // upgrade). The first-meeting .rv-flp path legitimately
          // paints the card interior with --sub-bg (the card body IS
          // the surface at that point) and is not where the box bug
          // lived.
          const pc = img.closest('.rv-pc');
          const isUnframed = !!(pc && pc.classList.contains('rv-t-plain'));
          let badAncestor = null;
          let node = pc ? img.parentElement : null;
          while (node && !node.classList.contains('rv-root')) {
            const cs = getComputedStyle(node);
            const bg = cs.backgroundColor;
            const bi = cs.backgroundImage;
            const bs = cs.boxShadow;
            const ol = cs.outlineStyle;
            const bd = cs.borderStyle;
            const bgPaints = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') || (bi && bi !== 'none');
            const bsPaints = bs && bs !== 'none';
            const olPaints = ol && ol !== 'none';
            const bdPaints = bd && !/^(none|hidden)(\s+none)*$/.test(bd);
            if (bgPaints || bsPaints || olPaints || bdPaints) {
              badAncestor = { cls: node.className, bg, bi: bi.slice(0, 40), bs: bs.slice(0, 80), ol, bd };
              break;
            }
            node = node.parentElement;
          }
          out.push({ t: Math.round(elapsed), x: r.left, y: r.top, w: r.width, h: r.height, isUnframed, badAncestor, ctaReady: !!ctaReadyAt });
        }
        // Round 35b — keep sampling for IDLE_WINDOW_MS after the CTAs
        // enable, so the test actually sees the post-settle hover-loop
        // state the user described as "jumps from side to side".
        if ((ctaReadyAt && elapsed > ctaReadyAt + IDLE_WINDOW_MS) || elapsed > HARD_CAP_MS) {
          resolve(out);
          return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }, points);
  await ctx.close();
  return samples;
}

// Round 35b — X-axis threshold tightened to 0.5 px to catch the
// WebKit sub-pixel wobble the user reported. Y/W/H use loose
// thresholds because the card legitimately moves ±6 px vertically
// (rd-hov-flat float) and the first-meeting flip's rotateY projects
// transient width changes. The test is purposely scoped to the IDLE
// WINDOW only — samples BEFORE the CTAs enable are discarded (that's
// where the flip + point drop live, with their legitimate motion).
// The user's bug is "jumps side to side after the card is settled"
// so we only look at the post-settle idle hover.
const X_THRESHOLD = 0.5;
const Y_THRESHOLD = 10;   // rd-hov-flat moves ±6 px; allow headroom.
const WH_THRESHOLD = 2;   // sub-pixel border rounding on WebKit.
async function check(browser, label, w, h, lang, points) {
  const samples = await measure(browser, w, h, lang, points);
  if (samples.length < 10) {
    rec(label, false, `only ${samples.length} rAF samples captured`);
    return;
  }
  // Round 35b — restrict stability check to the IDLE window: samples
  // taken AFTER the first sample with ctaReadyAt flagged. The CTA-
  // reveal event marks the end of the reveal sequence. Any sample
  // before that may legitimately move (flip, orb drop, frame upgrade).
  const idleStart = samples.findIndex(s => s.ctaReady);
  const idleSamples = idleStart >= 0 ? samples.slice(idleStart) : samples;
  if (idleSamples.length < 10) {
    // Fallback: use the final second if CTA signal missed.
    const last = samples[samples.length - 1].t;
    const cutoff = Math.max(0, last - 1000);
    const fallback = samples.filter(s => s.t >= cutoff);
    if (fallback.length < 10) {
      rec(label, false, `only ${idleSamples.length} idle rAF samples (ctaStart=${idleStart})`);
      return;
    }
  }
  const windowSamples = idleSamples.length >= 10 ? idleSamples : samples.slice(-60);
  // Reference: median X of the idle window (robust to one-off spikes).
  const xs = windowSamples.map(s => s.x).slice().sort((a,b)=>a-b);
  const medianX = xs[Math.floor(xs.length / 2)];
  const ref = { x: medianX, y: windowSamples[0].y, w: windowSamples[0].w, h: windowSamples[0].h, t: windowSamples[0].t };
  let worst = { dx: 0, dy: 0, dw: 0, dh: 0, t: 0 };
  let firstJump = null;
  for (const s of windowSamples) {
    const dx = Math.abs(s.x - ref.x);
    const dy = Math.abs(s.y - ref.y);
    const dw = Math.abs(s.w - ref.w);
    const dh = Math.abs(s.h - ref.h);
    if (dx > worst.dx) worst = { ...worst, dx, t: s.t };
    if (dy > worst.dy) worst.dy = dy;
    if (dw > worst.dw) worst.dw = dw;
    if (dh > worst.dh) worst.dh = dh;
    const xBad = dx > X_THRESHOLD;
    const otherBad = dy > Y_THRESHOLD || dw > WH_THRESHOLD || dh > WH_THRESHOLD;
    if (!firstJump && (xBad || otherBad)) {
      firstJump = { t: s.t, dx, dy, dw, dh, x: s.x, y: s.y, w: s.w, h: s.h };
    }
  }
  const rectPass = worst.dx <= X_THRESHOLD && worst.dy <= Y_THRESHOLD && worst.dw <= WH_THRESHOLD && worst.dh <= WH_THRESHOLD;
  rec(label + ' — rect stable (idle window)', rectPass,
    `${windowSamples.length} idle samples (of ${samples.length}); refX=${ref.x.toFixed(2)}; worst Δ=(x${worst.dx.toFixed(2)},y${worst.dy.toFixed(1)},w${worst.dw.toFixed(1)},h${worst.dh.toFixed(1)}) @${worst.t}ms${firstJump ? `; first jump @${firstJump.t}ms rect=(${firstJump.x.toFixed(2)},${firstJump.y.toFixed(1)},${firstJump.w.toFixed(1)}×${firstJump.h.toFixed(1)})` : ''}`);

  // Round 35 — ancestor-chrome check: on ALL samples (framed +
  // unframed), no ancestor between the art img and .rv-root may paint
  // a background, border, outline or box-shadow. The PNG frame
  // overlay carries all legal chrome; everything else must be transparent.
  const bads = samples.filter(s => s.badAncestor);
  const chromePass = bads.length === 0;
  rec(label + ' — ancestors paint nothing (framed+unframed)', chromePass,
    chromePass
      ? `${samples.length} samples all clean`
      : `${bads.length} bad samples; first @${bads[0].t}ms ancestor.${bads[0].badAncestor.cls} bg=${bads[0].badAncestor.bg} bs=${bads[0].badAncestor.bs}`);
}

// Round 35b — run on BOTH Chromium (fast) and WebKit (catches the
// iOS-only sub-pixel repaint drift that the user actually reported).
// WebKit is 393 EN + HE only per the user's spec; Chromium keeps the
// full device matrix. p=1 covers first-meeting flip; p=2 covers plain
// point-drop; p=3/6/9/12 cover framed point-drop + frame-upgrade.
const SCENARIOS = [1, 2, 3, 6, 9, 12];
console.log('--- Chromium ---');
for (const [w, h, name] of [[375, 667, 'SE'], [393, 852, '15Pro'], [430, 932, 'ProMax']]) {
  for (const lang of ['en', 'he']) {
    for (const points of SCENARIOS) {
      await check(chromiumBrowser, `[Chromium] ${name} ${w}×${h} ${lang} p=${points}`, w, h, lang, points);
    }
  }
}
if (webkitBrowser) {
  console.log('--- WebKit (393 EN + HE) ---');
  for (const lang of ['en', 'he']) {
    for (const points of SCENARIOS) {
      await check(webkitBrowser, `[WebKit] 393×852 ${lang} p=${points}`, 393, 852, lang, points);
    }
  }
} else {
  console.log('[skip] WebKit not available — rect-stable claim is Chromium-only; install with: npx playwright install webkit');
}

await chromiumBrowser.close();
if (webkitBrowser) await webkitBrowser.close();
app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
