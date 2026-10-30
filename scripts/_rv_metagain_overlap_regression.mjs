// Round 24 follow-up — same pairwise overlap checks on the met-again,
// point-drop and frame-upgrade reveal branches. These use .rv-pc (flat
// card, not .rv-flp), so round 24's first-meeting fix (height: 100% +
// visibility: hidden on rv-tap/rv-rvh) didn't cover them.
//
// Branches exercised:
//   point-drop (non-boundary): points=5 → bronze tier, dot 2 filled.
//     Element stack: title(h2 inside rv-t1) → eyebrow → card → body
//     (track + preLabel: "1 more to the Silver frame"). No .rv-fmsg.
//   frame-upgrade (boundary):  points=6 → bronze→silver swap. On settle
//     rv-t1 fades out and rv-t2 ("New frame" + "Silver frame!") fades in;
//     .rv-fmsg ("6 dialogues with…") shows. Track resets.
//   diamond cap:               points=13 → "Highest frame reached".
//     Simpler layout: ey + h2 + stage + body (track with the cap label).
//
// Devices: SE (375×667), 393×852, 430×932. EN + HE. Each (branch × device
// × lang) is captured at TWO phases:
//   phase "settle"       = after initial render + ~1s. Point not yet
//                          landed, title still rv-t1 for boundary.
//   phase "post-land"    = after orb lands on dot (~1800ms). For
//                          boundary this is also post-swap (rv-t2 shown,
//                          rv-fmsg visible).
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

async function openCtx(w, h, lang) {
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
  return { ctx, page };
}

async function openReveal(page, points) {
  await page.evaluate((p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
  }, points);
  // Initial render + first beat. Point-drop at p=5 has no focus-mode
  // transform at this point. Frame-upgrade at p=6 is still pre-orb-drop.
  await page.waitForTimeout(900);
}

// Wait for the fully-settled state. For a non-boundary point-drop that
// just means the orb landed (rv-landed class added, no transforms
// remain). For a frame-upgrade boundary we also wait for the focus
// moment to end (rv-framed class added, transforms cleared).
async function waitSettled(page, branch) {
  if (branch === 'frame') {
    // Max ~5s: orb drop + focus mode + swap + un-focus.
    await page.waitForFunction(() => {
      const root = document.querySelector('#dc-thinker-screen .rv-root');
      return root && root.classList.contains('rv-framed');
    }, { timeout: 6000 }).catch(()=>{});
  } else {
    // Non-boundary point-drop: wait for rv-landed on the pc.
    await page.waitForFunction(() => {
      const pc = document.getElementById('rv-pc');
      return pc && pc.classList.contains('rv-landed');
    }, { timeout: 4000 }).catch(()=>{});
  }
  // Then wait for any transition on .rv-pc to end (transform back to
  // identity for the post-focus state).
  await page.waitForFunction(() => {
    const pc = document.getElementById('rv-pc');
    if (!pc) return true;
    const t = getComputedStyle(pc).transform;
    if (!t || t === 'none') return true;
    // Identity-ish matrix: matrix(1,0,0,1,x,y) where x,y are small
    // (hover translate up to 6px).
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return true;
    const parts = m[1].split(',').map(parseFloat);
    const [a, b, c, d, tx, ty] = parts;
    // Accept 1,0,0,1 (identity) with any small translation.
    return Math.abs(a - 1) < 0.05 && Math.abs(d - 1) < 0.05;
  }, { timeout: 2000 }).catch(()=>{});
  await page.waitForTimeout(300);
}

async function measureAll(page, branch) {
  return page.evaluate((b) => {
    // Diamond-cap uses .rv-ey + h2 directly in the root.
    // Point-drop / frame-upgrade uses .rv-ttlw > (.rv-t1 .rv-ey + h2,
    //   .rv-t2 .rv-ey + h2). We pick whichever title is visible — the
    // one with opacity > 0.1.
    const titleEl = b === 'diamond'
      ? document.querySelector('#dc-thinker-screen .rv-root h2')
      : (function(){
          const t2 = document.querySelector('#dc-thinker-screen .rv-t2');
          const t1 = document.querySelector('#dc-thinker-screen .rv-t1');
          if (t2 && parseFloat(getComputedStyle(t2).opacity) > 0.5) return t2.querySelector('h2');
          return t1 ? t1.querySelector('h2') : null;
        })();
    const eyEl = b === 'diamond'
      ? document.querySelector('#dc-thinker-screen .rv-root > .rv-ey')
      : (function(){
          const t2 = document.querySelector('#dc-thinker-screen .rv-t2');
          const t1 = document.querySelector('#dc-thinker-screen .rv-t1');
          if (t2 && parseFloat(getComputedStyle(t2).opacity) > 0.5) return t2.querySelector('.rv-ey');
          return t1 ? t1.querySelector('.rv-ey') : null;
        })();

    // Round 25b — use .rv-face (not .rv-pc) as the "card" for overlap
     // purposes. .rv-pc has 16 px padding-top for the floating crest,
     // which is a narrow centred decoration — the bbox includes it but
     // it doesn't visually overlap the wide centred title text. Measuring
     // .rv-face catches real overlap of the card surface against the
     // title / body / CTA.
    const sel = {
      eyebrow: eyEl,
      title:   titleEl,
      stage:   document.getElementById('rv-stg'),
      card:    document.querySelector('#rv-pc .rv-face') || document.getElementById('rv-pc'),
      body:    document.querySelector('#dc-thinker-screen .rv-root .rv-body'),
      track:   document.getElementById('rv-trk'),
      glab:    document.getElementById('rv-glab'),
      fmsg:    document.getElementById('rv-fmsg'),
      cta:     document.querySelector('#dc-thinker-screen .rd-cta'),
      ctaPrimary: document.getElementById('rd-cta-next'),
    };
    const out = {};
    for (const [k, el] of Object.entries(sel)) {
      if (!el) { out[k] = null; continue; }
      const cs = getComputedStyle(el);
      // Ignore elements that are visually off (opacity 0, display none,
      // or visibility hidden) — their bbox may still have size but they
      // don't visually overlap.
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) {
        out[k] = null; continue;
      }
      const r = el.getBoundingClientRect();
      // Zero-sized boxes (e.g. .rv-fmsg collapsed on narrow viewports)
      // don't visually overlap anything — treat as absent so they don't
      // trip the pairwise checks.
      if (r.width < 1 || r.height < 1) { out[k] = null; continue; }
      out[k] = { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    }
    return out;
  }, branch);
}

function overlapsVertically(a, b, slop = 1) {
  if (!a || !b) return false;
  return (a.bottom > b.top + slop) && (a.top + slop < b.bottom);
}

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function checkBranch(label, w, h, lang, points, branch) {
  const { ctx, page } = await openCtx(w, h, lang);
  await openReveal(page, points);
  // Settle phase — right after render + first beat
  const settle = await measureAll(page, branch);
  const settleStack = ['eyebrow', 'title', 'card', 'glab', 'cta'].filter(k => settle[k]);
  const failuresSettle = [];
  for (let i = 0; i < settleStack.length - 1; i++) {
    const a = settle[settleStack[i]], b = settle[settleStack[i+1]];
    if (overlapsVertically(a, b)) failuresSettle.push(`${settleStack[i]}(${Math.round(a.top)}-${Math.round(a.bottom)}) ∩ ${settleStack[i+1]}(${Math.round(b.top)}-${Math.round(b.bottom)})`);
  }
  rec(`${label} settle: no vertical overlap`,
      failuresSettle.length === 0,
      failuresSettle.length ? failuresSettle.join(' | ') : `stack=[${settleStack.join(',')}]`);
  // Card doesn't push into body (point-drop) or go past viewport bottom
  if (settle.card && settle.body) {
    const cardBelowBody = settle.card.bottom > settle.body.top + 1;
    rec(`${label} settle: card.bottom ≤ body.top`,
        !cardBelowBody,
        `card.bottom=${Math.round(settle.card.bottom)} body.top=${Math.round(settle.body.top)}`);
  }
  if (settle.card && settle.cta) {
    const cardOverCta = settle.card.bottom > settle.cta.top + 1;
    rec(`${label} settle: card.bottom ≤ cta.top`,
        !cardOverCta,
        `card.bottom=${Math.round(settle.card.bottom)} cta.top=${Math.round(settle.cta.top)}`);
  }

  // Post-land phase — wait for the real settled state. For point-drop:
  // orb landed, no transforms. For frame-upgrade: frame swap complete,
  // .rv-framed on root, focus-mode transforms cleared. waitSettled bails
  // after a sensible timeout so a never-settling animation still produces
  // a measurable (and failing) rect rather than hanging the test.
  await waitSettled(page, branch);
  const post = await measureAll(page, branch);
  const postStack = ['eyebrow', 'title', 'card', 'glab', 'fmsg', 'cta'].filter(k => post[k]);
  const failuresPost = [];
  for (let i = 0; i < postStack.length - 1; i++) {
    const a = post[postStack[i]], b = post[postStack[i+1]];
    if (overlapsVertically(a, b)) failuresPost.push(`${postStack[i]}(${Math.round(a.top)}-${Math.round(a.bottom)}) ∩ ${postStack[i+1]}(${Math.round(b.top)}-${Math.round(b.bottom)})`);
  }
  rec(`${label} post-land: no vertical overlap`,
      failuresPost.length === 0,
      failuresPost.length ? failuresPost.join(' | ') : `stack=[${postStack.join(',')}]`);
  if (post.card && post.cta) {
    const cardOverCta = post.card.bottom > post.cta.top + 1;
    rec(`${label} post-land: card.bottom ≤ cta.top`,
        !cardOverCta,
        `card.bottom=${Math.round(post.card.bottom)} cta.top=${Math.round(post.cta.top)}`);
  }
  // For frame-upgrade boundary, assert rv-fmsg sits between body/track
  // and the CTA (not overlapping).
  if (branch === 'frame' && post.fmsg) {
    const beforeCta = post.cta ? post.fmsg.bottom <= post.cta.top + 1 : true;
    rec(`${label} post-land: fmsg sits above CTA`,
        beforeCta,
        `fmsg.bottom=${Math.round(post.fmsg.bottom)} cta.top=${post.cta ? Math.round(post.cta.top) : 'null'}`);
  }
  await ctx.close();
}

const devices = [
  { w: 375, h: 667, name: 'SE' },
  { w: 393, h: 852, name: '15Pro' },
  { w: 430, h: 932, name: 'ProMax' },
];
// Branch × device × lang matrix. We test:
//   point-drop (p=5): non-boundary mid-tier drop. Simplest animation
//     (orb falls, lands, done). No focus mode, no frame swap.
//   frame-upgrade (p=6): bronze→silver boundary. Full sequence: orb
//     drops, focus mode engages (card scales 1.25x), tier swaps,
//     focus mode releases, .rv-framed state settles.
//   frame-upgrade (p=12): gold→diamond boundary. Same sequence but
//     final tier. Serves as the "diamond-reached" check since
//     _debugThinkerReveal caps points at 12, so a true diamond-cap
//     (points > 12) render-only state can't be reached from the
//     debug helper.
for (const d of devices) {
  for (const lang of ['en', 'he']) {
    await checkBranch(`${d.name} ${lang} point-drop (p=5)`, d.w, d.h, lang, 5, 'point-drop');
    await checkBranch(`${d.name} ${lang} frame-upgrade bronze→silver (p=6)`, d.w, d.h, lang, 6, 'frame');
    await checkBranch(`${d.name} ${lang} frame-upgrade gold→diamond (p=12)`, d.w, d.h, lang, 12, 'frame');
  }
}

// Round 25b — min-width targets so the met-again card can't silently
// shrink again.
// Round 25c — SE floor restored to the user's 150 target. The 25b
// 132 ceiling came from reserving 430 vh-px for the full fmsg sentence;
// 25c swaps fmsg to a one-line short form on short screens (see the
// .rv-fmsg-short / @media (max-height: 700px) rule) so SE now hits 160.
async function checkMetagainMinWidth(w, h, name, points, minWidth) {
  const { ctx, page } = await openCtx(w, h, 'en');
  await openReveal(page, points);
  await waitSettled(page, points === 5 ? 'point-drop' : 'frame');
  const cardW = await page.evaluate(() => {
    const pc = document.getElementById('rv-pc');
    return pc ? Math.round(pc.getBoundingClientRect().width) : 0;
  });
  rec(`${name} ${w}×${h} point-drop/frame (p=${points}): .rv-pc width ≥ ${minWidth}`,
      cardW >= minWidth, `width=${cardW} target=${minWidth}`);
  await ctx.close();
}
for (const d of devices) {
  // Round 34 — reveal .rv-pc width cap was reduced from 315 to 250 so
  // the inner art stays ≈218 px (the frame now = 1.149 × art, slot =
  // frame aspect). Adjust the "big enough to be legible" floor to the
  // new sizing: SE still gets ~150 (vh calc dominates), 393/430 land
  // at the 250 cap, so 235 gives 15 px slack for layout wiggles.
  const minW = d.w <= 375 ? 150 : 235;
  for (const points of [5, 6, 12]) {
    await checkMetagainMinWidth(d.w, d.h, d.name, points, minW);
  }
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
