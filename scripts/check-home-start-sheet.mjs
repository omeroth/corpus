// Regression test for the home-screen Start-sheet auto-open behaviour.
// Guards the Round 45 series of fixes:
//   • end-of-renderHome + showScreen hooks that keep the sheet open
//     across every entry path (launch, resume, return, Home tab);
//   • paywall/order split that routes the Unlock button to showPaywall
//     while leaving the Locked variant disabled;
//   • locked-fallback target so paywalled accounts scroll AND open on
//     their first locked dialogue (not only unlocked .next-up);
//   • _hvScrollNodeToCenter centring (within 2px of viewport centre);
//   • outside-tap latch exempting every interactive control, so a tap
//     on the jump arrow or Home nav doesn't dismiss the sheet.
//
// Scenarios asserted:
//   A — Launch, unlocked next-up: sheet opens, node centred ≤ 2 px.
//   B — Launch, paywalled: sheet opens on first locked dialogue,
//       button reads "Unlock", node centred ≤ 2 px.
//   C — Outside-tap closes the sheet and the sheet stays closed
//       while the user remains on home.
//   D — Leaving home (showScreen to pantheon) and coming back
//       reopens the sheet, still centred.
//   E — Jump arrow becomes visible after scrolling away, for both
//       the unlocked and paywalled state.
//   F — Tapping the arrow re-centres the target node and reopens
//       the sheet.
//   G — Order-locked lesson (prior day not finished) shows "Locked",
//       button is disabled, and tapping it does NOT open the paywall.
//
// Run: node scripts/check-home-start-sheet.mjs
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',  '.png': 'image/png', '.webp': 'image/webp',
  '.woff2':'font/woff2',               '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
  '.json': 'application/json',
};
const srv = (root) => new Promise((r) => {
  const s = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  });
  s.listen(0, '127.0.0.1', () => r({ s, port: s.address().port }));
});

const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });

// Per-scenario context + page. Takes a `seedCompleted` array of
// [weekId, dayId] pairs that will be marked complete BEFORE the cold
// reload, so initUI → renderHome → _hvMaybeAutoOpenPopover runs
// against the paywalled / unlocked state we want to exercise.
async function bootWithState(seedCompleted) {
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  await ctx.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.__phEvents = [];
    window.posthog = {
      capture: (name, props) => { window.__phEvents.push({ name, props: props || {} }); },
      identify: () => {}, reset: () => {}, register: () => {}, people: { set: () => {} },
      onFeatureFlags: () => {}, isFeatureEnabled: () => false, getFeatureFlag: () => undefined,
    };
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: {
      Haptics: { impact: async () => ({}) },
      SplashScreen: { hide: async () => ({}) },
      App: { addListener: () => ({ remove: () => {} }) },
      Preferences: { get: async () => ({}) },
      StatusBar: { setStyle: async () => ({}) },
      CorpusWidgetBridge: { isWidgetInstalled: async () => ({ installed: false, supported: true }) },
      LocalNotifications: {
        checkPermissions:  async () => ({ display: 'granted' }),
        requestPermissions:async () => ({ display: 'granted' }),
        schedule:          async () => ({ notifications: [] }),
        cancel:            async () => ({}),
        getPending:        async () => ({ notifications: [] }),
      },
    } };
    try { localStorage.setItem('corpus_onboarding_done', '1'); } catch(_) {}
  });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  // Wait for initUI to finish so dayKey is defined and state is bound.
  // state is a `const` at module scope so it's not on `window`; we
  // probe it inside an evaluated expression where it resolves as a
  // free identifier via the SPA's inline script scope.
  await page.waitForFunction(
    () => typeof window.dayKey === 'function'
      && (() => { try { return !!state; } catch(_) { return false; } })(),
    { timeout: 15000 }
  );
  if (seedCompleted && seedCompleted.length) {
    await page.evaluate((seed) => {
      for (const [w, d] of seed) state.completedDays[dayKey(w, d)] = true;
      try { if (typeof saveStateLocal === 'function') saveStateLocal(); } catch(_) {}
    }, seedCompleted);
    // Cold reload so the whole launch sequence (_fireLaunchPopover +
    // renderHome self-anchor + _hvMaybeAutoOpenPopover) runs against
    // the seeded completions.
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
  }
  // Long settle: _hvAwaitLayoutSettled(1500) + position-fn + late renderHome.
  await page.waitForTimeout(4500);
  return { ctx, page };
}

async function closeCtx({ ctx }) { await ctx.close(); }

function label(name, pass, detail) {
  const mark = pass ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ' — ' + detail : ''}`);
  return pass;
}
let allPass = true;
let assertCount = 0;
function assertSync(name, pass, detail) {
  assertCount++;
  if (!label(name, pass, detail)) allPass = false;
}

// Visibility probe: `visible` iff computed display != 'none' AND the
// element has a non-zero bounding box. Inline .style.display is NOT
// enough — it's what we SET, not what the user sees (a !important CSS
// rule can suppress the element entirely). That exact gap once hid a
// cross-subject card (`body.on-home-v7 #practice-card { display: none
// !important }`) while the inline-only check passed, so every visibility
// assertion in this file now goes through here.
async function probeVisible(page, selector) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { exists: false };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      exists: true,
      inlineDisplay: el.style.display || '',
      computedDisplay: cs.display,
      visibility: cs.visibility,
      width: r.width,
      height: r.height,
      visible: cs.display !== 'none' && cs.visibility !== 'hidden'
               && r.width > 0 && r.height > 0,
    };
  }, selector);
}

// Helper: nodeCenter of the resolved auto-open target vs viewport centre.
async function measureCentre(page) {
  return await page.evaluate(() => {
    const t = (typeof _hvAutoOpenTarget === 'function') ? _hvAutoOpenTarget() : null;
    let center = null;
    if (t && t.node) {
      const r = t.node.getBoundingClientRect();
      center = r.top + r.height / 2;
    }
    return {
      center, viewportH: window.innerHeight,
      weekId: t && t.weekId, dayId: t && t.dayId,
      locked: t ? !!t.locked : null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// A — Launch, unlocked: sheet opens + node centred within 2 px.
// ─────────────────────────────────────────────────────────────────────
{
  const h = await bootWithState([[1, 1], [1, 2]]);
  const m = await measureCentre(h.page);
  const popVis = await probeVisible(h.page, '#hv-popover');
  const pop = await h.page.evaluate(() => {
    const p = document.getElementById('hv-popover');
    const btn = p && p.querySelector('.hv-pop-btn');
    return {
      title: p && p.querySelector('.hv-pop-title') ? p.querySelector('.hv-pop-title').textContent : null,
      btnClass: btn ? [...btn.classList].find(c => c.startsWith('hv-pop-btn-')) : null,
    };
  });
  assertSync('A1 · launch unlocked: sheet visible',
    popVis.visible,
    `visible=${popVis.visible} computedDisplay=${popVis.computedDisplay} rect=${popVis.width}x${popVis.height} title="${pop.title}" btn=${pop.btnClass}`);
  const deltaA = (typeof m.center === 'number') ? Math.abs(m.center - m.viewportH / 2) : null;
  assertSync('A2 · launch unlocked: node centred within 2 px',
    deltaA != null && deltaA <= 2,
    `nodeCenter=${m.center && m.center.toFixed(2)} viewportCentre=${m.viewportH / 2} delta=${deltaA && deltaA.toFixed(2)}px`);
  await closeCtx(h);
}

// ─────────────────────────────────────────────────────────────────────
// B — Launch, paywalled: sheet on first locked dialogue, Unlock button,
//     centred within 2 px.
// ─────────────────────────────────────────────────────────────────────
let paywallHandle = null;
{
  const h = await bootWithState([[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]]);
  const m = await measureCentre(h.page);
  const popVis = await probeVisible(h.page, '#hv-popover');
  const btnVis = await probeVisible(h.page, '#hv-popover .hv-pop-btn');
  const pop = await h.page.evaluate(() => {
    const p = document.getElementById('hv-popover');
    const btn = p && p.querySelector('.hv-pop-btn');
    return {
      title: p && p.querySelector('.hv-pop-title') ? p.querySelector('.hv-pop-title').textContent : null,
      btnText: btn ? btn.textContent : null,
      btnDisabled: btn ? btn.disabled : null,
    };
  });
  assertSync('B1 · launch paywalled: sheet visible on locked target',
    popVis.visible && m.locked === true,
    `visible=${popVis.visible} computedDisplay=${popVis.computedDisplay} rect=${popVis.width}x${popVis.height} locked=${m.locked} tgt=w${m.weekId}d${m.dayId} title="${pop.title}"`);
  assertSync('B2 · launch paywalled: Unlock button is visible with the right text',
    btnVis.visible && pop.btnText === 'Unlock' && pop.btnDisabled === false,
    `btnVisible=${btnVis.visible} rect=${btnVis.width}x${btnVis.height} btnText="${pop.btnText}" disabled=${pop.btnDisabled}`);
  const deltaB = (typeof m.center === 'number') ? Math.abs(m.center - m.viewportH / 2) : null;
  assertSync('B3 · launch paywalled: node centred within 2 px',
    deltaB != null && deltaB <= 2,
    `nodeCenter=${m.center && m.center.toFixed(2)} viewportCentre=${m.viewportH / 2} delta=${deltaB && deltaB.toFixed(2)}px`);
  paywallHandle = h; // reused for E/F below
}

// ─────────────────────────────────────────────────────────────────────
// C — Outside-tap closes the sheet, stays closed.
//     Use a fresh unlocked context so B/E/F aren't disturbed.
// ─────────────────────────────────────────────────────────────────────
{
  const h = await bootWithState([[1, 1], [1, 2]]);
  // Confirm the sheet is visible before we dismiss.
  const openBefore = await probeVisible(h.page, '#hv-popover');
  // Tap a known-empty home spot: below the sheet but above the bottom nav.
  // The .hv-path at (50, 720) is non-interactive and not covered by the
  // outside-tap exemption selector.
  await h.page.mouse.click(50, 720);
  await h.page.waitForTimeout(400);
  const vis1 = await probeVisible(h.page, '#hv-popover');
  const dismissed1 = await h.page.evaluate(() =>
    (() => { try { return _hvHomeAutoDismissed; } catch(_) { return 'unreadable'; } })()
  );
  // Wait 3 s to confirm nothing re-opens it while the user stays on home.
  await h.page.waitForTimeout(3000);
  const vis2 = await probeVisible(h.page, '#hv-popover');
  assertSync('C1 · outside-tap closes the sheet',
    openBefore.visible === true && vis1.visible === false,
    `before=${openBefore.visible} after=${vis1.visible} computedAfter=${vis1.computedDisplay} dismissedFlag=${dismissed1}`);
  assertSync('C2 · sheet stays closed while on home',
    vis2.visible === false && dismissed1 === true,
    `after3s.visible=${vis2.visible} computed=${vis2.computedDisplay} dismissedFlag=${dismissed1}`);
  await closeCtx(h);
}

// ─────────────────────────────────────────────────────────────────────
// D — Leave home, come back: sheet reopens, centred.
// ─────────────────────────────────────────────────────────────────────
{
  const h = await bootWithState([[1, 1], [1, 2]]);
  // Dismiss the sheet so we know the reopen on return comes from the
  // showScreen hook, not from a stale open that never closed.
  await h.page.mouse.click(50, 720);
  await h.page.waitForTimeout(400);
  const dismissVis = await probeVisible(h.page, '#hv-popover');
  await h.page.evaluate(() => showScreen('pantheon'));
  await h.page.waitForTimeout(600);
  await h.page.evaluate(() => showScreen('home'));
  await h.page.waitForTimeout(2500);
  const m = await measureCentre(h.page);
  const popAfter = await probeVisible(h.page, '#hv-popover');
  const deltaD = (typeof m.center === 'number') ? Math.abs(m.center - m.viewportH / 2) : null;
  assertSync('D1 · return to home reopens the sheet',
    dismissVis.visible === false && popAfter.visible === true,
    `beforeLeave.visible=${dismissVis.visible} afterReturn.visible=${popAfter.visible} computed=${popAfter.computedDisplay} rect=${popAfter.width}x${popAfter.height}`);
  assertSync('D2 · reopened sheet is centred within 2 px',
    deltaD != null && deltaD <= 2,
    `nodeCenter=${m.center && m.center.toFixed(2)} delta=${deltaD && deltaD.toFixed(2)}px`);
  await closeCtx(h);
}

// ─────────────────────────────────────────────────────────────────────
// E — Jump arrow visible after scroll away (unlocked + paywalled).
// ─────────────────────────────────────────────────────────────────────
async function arrowProbeAfterScroll(h) {
  await h.page.evaluate(() => { try { _hvClosePopover('render'); } catch(_) {} window.scrollTo(0, 1800); });
  await h.page.waitForTimeout(700);
  return await probeVisible(h.page, '#hv-jump');
}
{
  const hU = await bootWithState([[1, 1], [1, 2]]);
  const arrowU = await arrowProbeAfterScroll(hU);
  assertSync('E1 · unlocked: jump arrow visible after scroll',
    arrowU.visible === true,
    `visible=${arrowU.visible} computedDisplay=${arrowU.computedDisplay} rect=${arrowU.width}x${arrowU.height}`);
  // For F: use this handle (unlocked) to tap the arrow below.
  // Keep the paywalled handle (paywallHandle) for E2.

  const arrowP = await arrowProbeAfterScroll(paywallHandle);
  assertSync('E2 · paywalled: jump arrow visible after scroll',
    arrowP.visible === true,
    `visible=${arrowP.visible} computedDisplay=${arrowP.computedDisplay} rect=${arrowP.width}x${arrowP.height}`);

  // ───────────────────────────────────────────────────────────────────
  // F — Arrow tap re-centres + reopens, in BOTH states.
  // ───────────────────────────────────────────────────────────────────
  async function tapArrow(h) {
    const btn = await h.page.evaluate(() => {
      const b = document.getElementById('hv-jump');
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await h.page.mouse.click(btn.x, btn.y);
    await h.page.waitForTimeout(2500);
  }
  await tapArrow(hU);
  const mU = await measureCentre(hU.page);
  const popU = await probeVisible(hU.page, '#hv-popover');
  const deltaU = (typeof mU.center === 'number') ? Math.abs(mU.center - mU.viewportH / 2) : null;
  assertSync('F1 · unlocked: arrow tap reopens + centres within 2 px',
    popU.visible === true && deltaU != null && deltaU <= 2,
    `pop.visible=${popU.visible} computed=${popU.computedDisplay} rect=${popU.width}x${popU.height} nodeCenter=${mU.center && mU.center.toFixed(2)} delta=${deltaU && deltaU.toFixed(2)}px`);

  await tapArrow(paywallHandle);
  const mP = await measureCentre(paywallHandle.page);
  const popP = await probeVisible(paywallHandle.page, '#hv-popover');
  const deltaP = (typeof mP.center === 'number') ? Math.abs(mP.center - mP.viewportH / 2) : null;
  assertSync('F2 · paywalled: arrow tap reopens + centres within 2 px',
    popP.visible === true && deltaP != null && deltaP <= 2,
    `pop.visible=${popP.visible} computed=${popP.computedDisplay} rect=${popP.width}x${popP.height} nodeCenter=${mP.center && mP.center.toFixed(2)} delta=${deltaP && deltaP.toFixed(2)}px`);

  await closeCtx(hU);
  await closeCtx(paywallHandle);
}

// ─────────────────────────────────────────────────────────────────────
// G — Order-locked lesson: "Locked", disabled, does NOT open paywall.
//     Force the variant by calling _hvOpenPopover on ch1 day 2 with
//     prior day not complete (lessonLocked true + canAccessWeek true).
// ─────────────────────────────────────────────────────────────────────
{
  const h = await bootWithState([]); // fresh state: nothing complete.
  const r = await h.page.evaluate(() => {
    try { _hvClosePopover('render'); } catch(_) {}
    const ws = getW();
    const w = ws.find(x => x && x.id === 1);
    const d = w.days[1]; // day 2, prior day (day 1) not complete → order lock
    _hvOpenPopover(w, d, 1, {
      isDone: false, isNextUp: false, lessonLocked: true, isSummary: false, wkLocked: false,
    });
    const pop = document.getElementById('hv-popover');
    const btn = pop.querySelector('.hv-pop-btn');
    return {
      btnText: btn.textContent,
      btnDisabled: btn.disabled,
      hasOnclick: !!btn.onclick,
      canAccess: canAccessWeek(state.subject, w.id),
    };
  });
  const popVisG = await probeVisible(h.page, '#hv-popover');
  const btnVisG = await probeVisible(h.page, '#hv-popover .hv-pop-btn');
  assertSync('G1 · order-locked sheet visible with "Locked" button',
    popVisG.visible && btnVisG.visible && r.btnText === 'Locked',
    `popVisible=${popVisG.visible} btnVisible=${btnVisG.visible} btnText="${r.btnText}" canAccessWeek=${r.canAccess}`);
  assertSync('G2 · order-locked button is disabled with no handler',
    btnVisG.visible && r.btnDisabled === true && r.hasOnclick === false,
    `btnVisible=${btnVisG.visible} disabled=${r.btnDisabled} hasOnclick=${r.hasOnclick}`);
  // Tap the button; verify the paywall does NOT open.
  await h.page.evaluate(() => {
    const btn = document.querySelector('#hv-popover .hv-pop-btn');
    if (btn) btn.click();
  });
  await h.page.waitForTimeout(500);
  const paywallActive = await h.page.evaluate(() => {
    const pw = document.getElementById('modal-paywall');
    return pw && pw.classList.contains('active');
  });
  assertSync('G3 · tapping an order-locked button does NOT open paywall',
    paywallActive === false,
    `#modal-paywall.active=${paywallActive}`);
  await closeCtx(h);
}

await browser.close();
app.s.close();

console.log(`\n${allPass ? '✅ ALL PASS' : '❌ FAILURES'} — ${assertCount} assertions`);
process.exit(allPass ? 0 : 1);
