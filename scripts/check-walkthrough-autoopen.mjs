// Regression test for "walkthrough end → open first uncompleted dialogue".
// The v2 flow no longer writes to state.completedDays during onboarding
// (step 15 is the "mirror" reflection screen, taste steps 18–21 render
// preview UI only — the single real completion writer is
// _commitDialogueCompletion at ~39242), so a brand-new user lands on
// home with an empty completedDays map. This change wires
// _walkthroughFinish to open the first uncompleted dialogue via
// openReader instead of firing the frames explainer, gated on a
// _walkthroughAutoOpenAfter latch set from _onbComplete.
//
// Scenarios asserted:
//   A — autoOpen path: reader opens on the first dialogue of state.subject,
//       state.completedDays still empty at the moment it opens, frames
//       explainer modal NOT present.
//   B — dev _replayWalkthrough path (no autoOpenFirstDialogue opt):
//       finishes on home with no reader open.
//   C — fallback: every dialogue already completed → frames explainer
//       shows and no reader opens.
//   D — PostHog event fires exactly once in the autoOpen path with the
//       right subject + weekId + dayId.
//
// Run: node scripts/check-walkthrough-autoopen.mjs
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',  '.png': 'image/png', '.webp': 'image/webp',
  '.woff2':'font/woff2',               '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
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
const ctx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__CORPUS_DEBUG_BUILD = true;
  // Initial posthog stub covers any captures that fire in the window
  // before the app's inline posthog.init() reassigns window.posthog
  // (see index.html:85). The real stub is reinstalled AFTER page load
  // in the test body below — that's the one the assertions read from.
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
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
// Reinstall the posthog stub AFTER the app's inline posthog.init() (at
// index.html:85) has run — it replaces window.posthog with the real
// posthog-js instance, which would otherwise swallow captures and
// fail the Scenario D assertions.
await page.evaluate(() => {
  window.__phEvents = [];
  window.posthog = {
    capture: (name, props) => { window.__phEvents.push({ name, props: props || {} }); },
    identify: () => {}, reset: () => {}, register: () => {}, people: { set: () => {} },
    onFeatureFlags: () => {}, isFeatureEnabled: () => false, getFeatureFlag: () => undefined,
  };
});

function label(name, pass, detail) {
  const mark = pass ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ' — ' + detail : ''}`);
  return pass;
}
let allPass = true;
let assertCount = 0;
async function assert(name, fn) {
  assertCount++;
  const { pass, detail } = await fn();
  if (!label(name, pass, detail)) allPass = false;
}

// Boot a brand-new user to the home screen with onboarding "complete" and
// walkthrough NOT YET run — this mirrors the moment right after
// _onbComplete has called renderHome() + showScreen('home') +
// _walkthroughStartIfEligible({ bypassCompletionGate: true,
// autoOpenFirstDialogue: true }).  We'd rather call _walkthroughFinish()
// directly than simulate clicks through six spotlight steps: the goal is
// to assert the FINISH-time branching, not the per-step UX (which other
// tests cover).  The walkthrough-active overlay is already torn down
// before openReader runs (per _walkthroughTeardown's sync overlay flip
// inside _walkthroughFinish), so the latch is all that matters at the
// moment of truth.
async function bootFreshUser() {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_appearance', 'light');
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3, subject: 'philosophy', lang: 'en',
      completedDays: {},
      framesExplainerSeen: false, streakIntroSeen: true,
      currentScreen: 'home',
      isPaid: true, dailyStreak: 0, longestStreak: 0, activeDates: [],
    }));
    try { loadState(); setAppLang('en'); renderHome(); showScreen('home'); } catch (_) {}
    window.__phEvents = [];
    window.__openReaderCalls = [];
    window.__fallbackCalls = 0;
  });
  await page.waitForTimeout(300);
}

// Install spies ONCE so later scenarios don't stack wrappers (which
// would double-count fallback calls as an intercepted call flows
// through every nested wrapper). Original references captured on the
// window so each bootFreshUser() just resets the counters.
await page.evaluate(() => {
  window.__origOpenReader = window.openReader;
  window.openReader = function (weekId, dayId, opts) {
    window.__openReaderCalls.push({
      weekId, dayId, opts: opts || {},
      completedDaysCount: Object.keys(state.completedDays || {}).length,
      subject: state.subject,
    });
    return window.__origOpenReader(weekId, dayId, opts);
  };
  window.__origMaybeShowFE = window._maybeShowFramesExplainerAtTourEnd;
  window._maybeShowFramesExplainerAtTourEnd = function () {
    window.__fallbackCalls++;
    return window.__origMaybeShowFE();
  };
});

// ── Scenario A — autoOpen path ─────────────────────────────────────
//
// Set the latch (as _walkthroughStartIfEligible would), then invoke
// _walkthroughFinish() and assert the reader opened on the first
// uncompleted dialogue AND state.completedDays stayed empty at that
// moment.  The "state.completedDays still empty" check is captured
// INSIDE openReader via a one-shot wrapper so we observe the snapshot
// at the exact moment of open, not after.
await bootFreshUser();
await page.evaluate(() => {
  _walkthroughAutoOpenAfter = true;
  _walkthroughFinish();
});
await page.waitForTimeout(400);

await assert('A1 · reader opens with entry="walkthrough_end"', async () => {
  const r = await page.evaluate(() => ({
    calls: window.__openReaderCalls || [],
    screen: state.currentScreen,
  }));
  const call = r.calls[0];
  return {
    pass: r.calls.length === 1
      && call && call.opts && call.opts.entry === 'walkthrough_end'
      && r.screen === 'reader',
    detail: `callCount=${r.calls.length} entry=${call?.opts?.entry} screen=${r.screen}`,
  };
});
await assert('A2 · reader opens on first week + first day of state.subject', async () => {
  const r = await page.evaluate(() => {
    const weeks = (typeof getW === 'function') ? getW(state.subject) : [];
    const expected = weeks && weeks[0] && weeks[0].days && weeks[0].days[0]
      ? { weekId: weeks[0].id, dayId: weeks[0].days[0].id }
      : null;
    const call = (window.__openReaderCalls || [])[0];
    return { expected, actual: call ? { weekId: call.weekId, dayId: call.dayId } : null };
  });
  return {
    pass: r.expected && r.actual
      && r.expected.weekId === r.actual.weekId
      && r.expected.dayId === r.actual.dayId,
    detail: `expected=${JSON.stringify(r.expected)} actual=${JSON.stringify(r.actual)}`,
  };
});
await assert('A3 · state.completedDays empty at moment of open', async () => {
  const r = await page.evaluate(() => (window.__openReaderCalls || [])[0]);
  return {
    pass: r && r.completedDaysCount === 0,
    detail: `completedDaysCount=${r?.completedDaysCount}`,
  };
});
await assert('A4 · frames explainer modal NOT visible at moment of open', async () => {
  const r = await page.evaluate(() => {
    const fe = document.getElementById('modal-frames-explainer');
    return {
      present:   !!fe,
      feOpen:    fe ? fe.classList.contains('fe-open') : null,
      display:   fe ? getComputedStyle(fe).display : null,
      seenFlag:  !!state.framesExplainerSeen,
    };
  });
  // Explainer may EXIST in the DOM as the static overlay element (it
  // always does — mounted at index.html:26875) but must not be `fe-open`
  // and framesExplainerSeen must not have been flipped by this path.
  return {
    pass: r.present && r.feOpen === false && r.seenFlag === false,
    detail: JSON.stringify(r),
  };
});
await assert('A5 · _walkthroughAutoOpenAfter latch reset to false', async () => {
  const v = await page.evaluate(() => _walkthroughAutoOpenAfter);
  return { pass: v === false, detail: `_walkthroughAutoOpenAfter=${v}` };
});

// ── Scenario B — dev _replayWalkthrough path ───────────────────────
//
// _replayWalkthrough passes no opts to _walkthroughStartIfEligible, so
// the latch stays false and _walkthroughFinish must NOT auto-open.
// Simulate by clearing the latch, invoking _walkthroughFinish(), and
// asserting the reader did not open and the user stays off `reader`.
await bootFreshUser();
await page.evaluate(() => {
  _walkthroughAutoOpenAfter = false;
  _walkthroughFinish();
});
await page.waitForTimeout(400);

await assert('B1 · no reader opens when latch is false', async () => {
  const r = await page.evaluate(() => ({
    calls: window.__openReaderCalls || [],
    screen: state.currentScreen,
  }));
  return {
    pass: r.calls.length === 0 && r.screen !== 'reader',
    detail: `callCount=${r.calls.length} screen=${r.screen}`,
  };
});
await assert('B2 · fallback path invokes _maybeShowFramesExplainerAtTourEnd', async () => {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const n = await page.evaluate(() => window.__fallbackCalls);
  return { pass: n === 1, detail: `fallbackCalls=${n}` };
});

// ── Scenario C — every dialogue completed → fallback to explainer ──
//
// A pathological case the fallback must handle: if the walker finds no
// uncompleted dialogue (e.g. a returning user whose state somehow still
// has the latch set), fall through to the frames explainer instead of
// crashing or leaving the user on a blank screen.
await bootFreshUser();
await page.evaluate(() => {
  // Populate completedDays with every (week, day) key for state.subject.
  const weeks = (typeof getW === 'function') ? getW(state.subject) : [];
  state.completedDays = state.completedDays || {};
  for (const w of weeks) {
    for (const d of (w.days || [])) {
      state.completedDays[dayKey(w.id, d.id, state.subject)] = true;
    }
  }
  _walkthroughAutoOpenAfter = true;
  _walkthroughFinish();
});
await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
await page.waitForTimeout(300);

await assert('C1 · no reader opens when every dialogue is completed', async () => {
  const r = await page.evaluate(() => ({
    calls: window.__openReaderCalls || [],
    screen: state.currentScreen,
  }));
  return {
    pass: r.calls.length === 0 && r.screen !== 'reader',
    detail: `callCount=${r.calls.length} screen=${r.screen}`,
  };
});
await assert('C2 · all-completed path falls through to the frames-explainer helper', async () => {
  const n = await page.evaluate(() => window.__fallbackCalls);
  return { pass: n === 1, detail: `fallbackCalls=${n}` };
});

// ── Scenario D — PostHog event fires once with correct props ───────
//
// Re-run the Scenario A setup and assert the walkthrough_dialogue_autoopen
// capture happened exactly once with the right subject + weekId + dayId.
await bootFreshUser();
await page.evaluate(() => {
  _walkthroughAutoOpenAfter = true;
  _walkthroughFinish();
});
await page.waitForTimeout(300);

await assert('D1 · walkthrough_dialogue_autoopen fired exactly once', async () => {
  const r = await page.evaluate(() => (window.__phEvents || []).filter(e => e.name === 'walkthrough_dialogue_autoopen'));
  return { pass: r.length === 1, detail: `matches=${r.length}` };
});
await assert('D2 · event props carry subject, week_id, day_id', async () => {
  const r = await page.evaluate(() => {
    const evs = (window.__phEvents || []).filter(e => e.name === 'walkthrough_dialogue_autoopen');
    const ev = evs[0];
    const weeks = (typeof getW === 'function') ? getW(state.subject) : [];
    const expected = weeks && weeks[0] && weeks[0].days && weeks[0].days[0]
      ? { subject: state.subject, week_id: weeks[0].id, day_id: weeks[0].days[0].id }
      : null;
    return { event: ev, expected };
  });
  const ok = r.event && r.expected
    && r.event.props.subject === r.expected.subject
    && r.event.props.week_id === r.expected.week_id
    && r.event.props.day_id  === r.expected.day_id;
  return { pass: !!ok, detail: `event=${JSON.stringify(r.event)} expected=${JSON.stringify(r.expected)}` };
});

await browser.close();
app.s.close();

console.log(`\n${allPass ? '✅ ALL PASS' : '❌ FAILURES'} — ${assertCount} assertions`);
process.exit(allPass ? 0 : 1);
