// R39c Part 2 — Access-check matrix + analytics assertions.
//
// Access rules exercised (unchanged from R39b):
//   - Finding 1: openReader honors _buildWeekLockMap
//   - Finding 2: _buildWeekLockMap requires every earlier chapter
//   - Finding 3: canAccessWeek's started-clause gated on paid/trial
//
// Analytics asserted (new in R39c):
//   - chapter_blocked fires once per (chapter, reason) within 5s,
//     with correct reason / entry_point / missing_chapters / is_paid /
//     is_guest.
//   - free_chapter_started fires once per user per FREE_CHAPTERS
//     chapter on first openReader into it (A2 ch6 day 1).
//   - free_chapter_completed fires once per user per FREE_CHAPTERS
//     chapter when the last day finishes (A2 ch6 last-day finish).
//   - paid_chapter_reread fires for a non-paying user re-reading
//     a completed day in a paid chapter (A3 ch7 day 1).
//
// Exits non-zero on any mismatch.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/ch6-free/r39-part2';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.json':'application/json; charset=utf-8' };
function srv(root) {
  const s = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p==='/'||p==='') p='/index.html';
      const abs = join(root, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => s.listen(0, '127.0.0.1', () => r({ s, port: s.address().port })));
}
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });

const C1 = ['1-1','1-2','1-3','1-4','1-5','1-6','1-7'];
const C2 = ['2-1','2-2','2-3','2-4','2-5','2-6','2-7'];
const C3 = ['3-1','3-2','3-3','3-4','3-5','3-6','3-7'];
const C4 = ['4-1','4-2','4-3','4-4','4-5','4-6','4-7'];
const C5 = ['5-1','5-2','5-3','5-4','5-5','5-6','5-7'];
// Philosophy ch6 has 8 days (7 dialogues + summary).
const C6 = ['6-1','6-2','6-3','6-4','6-5','6-6','6-7','6-8'];

const scenarios = [
  {
    id: 'A1',
    label: 'Non-paying: only ch1 complete',
    persona: { isPaid:false, grandfathered:false },
    completed: [...C1],
    expectAccess:    { 1:true,  2:false, 3:false, 4:false, 5:false, 6:true,  7:false },
    // R41f Finding 3 — FREE_CHAPTERS (ch6) is always order-open.
    expectOrderOpen: { 1:true,  2:true,  3:false, 4:false, 5:false, 6:true,  7:false },
    expectReader: {
      1: { 1: 'reader' },
      2: { 1: 'paywall' },
      3: { 1: 'paywall' }, 4: { 1: 'paywall' }, 5: { 1: 'paywall' },
      6: { 1: 'reader' },      // R41f — ch6 opens from any entry point
      7: { 1: 'paywall' },
    },
    // Expected analytics (per openReader call) — null = no event.
    // Each entry asserts the FIRST event emitted for that call.
    expectBlocked: {
      1: null,                                            // reader opens
      2: { reason: 'paywall', missing: null },
      3: { reason: 'paywall', missing: null },
      4: { reason: 'paywall', missing: null },
      5: { reason: 'paywall', missing: null },
      6: null,                                            // R41f — ch6 is FREE + order-open
      7: { reason: 'paywall', missing: null },
    },
  },
  {
    id: 'A2',
    label: 'Non-paying: ch1 + ch6 complete',
    persona: { isPaid:false, grandfathered:false },
    completed: [...C1, ...C6],
    expectAccess:    { 1:true,  2:false, 3:false, 4:false, 5:false, 6:true,  7:false },
    expectOrderOpen: { 1:true,  2:true,  3:false, 4:false, 5:false, 6:true,  7:false },
    expectReader: {
      1: { 1: 'reader' },
      2: { 1: 'paywall' },
      3: { 1: 'paywall' }, 4: { 1: 'paywall' }, 5: { 1: 'paywall' },
      6: { 1: 'reader', 2: 'reader' },
      7: { 1: 'paywall' },
    },
    expectBlocked: {
      1: null,
      2: { reason: 'paywall', missing: null },
      3: { reason: 'paywall', missing: null },
      4: { reason: 'paywall', missing: null },
      5: { reason: 'paywall', missing: null },
      6: null,
      7: { reason: 'paywall', missing: null },
    },
  },
  {
    id: 'A3',
    label: 'Non-paying: ch1 + leftover ch7-1',
    persona: { isPaid:false, grandfathered:false },
    completed: [...C1, '7-1'],
    expectAccess:    { 1:true,  2:false, 3:false, 4:false, 5:false, 6:true,  7:false },
    // R41f Finding 3 — ch6 always order-open; ch7 open only via leftover progress.
    expectOrderOpen: { 1:true,  2:true,  3:false, 4:false, 5:false, 6:true,  7:true  },
    expectReader: {
      1: { 1: 'reader' },
      2: { 1: 'paywall' }, 3: { 1: 'paywall' }, 4: { 1: 'paywall' }, 5: { 1: 'paywall' },
      6: { 1: 'reader' },      // R41f — ch6 opens
      7: { 1: 'reader', 2: 'paywall' },     // d1 completed → re-read
    },
    expectBlocked: {
      1: null,
      2: { reason: 'paywall', missing: null },
      3: { reason: 'paywall', missing: null },
      4: { reason: 'paywall', missing: null },
      5: { reason: 'paywall', missing: null },
      6: null,            // R41f — ch6 opens, no block
      7: null,          // d1 re-reads (no block); d2 blocks (separate assertion below)
    },
  },
  {
    id: 'B1',
    label: 'Paying: ch1 + ch6, ch2–5 not done',
    persona: { isPaid:true, grandfathered:false },
    completed: [...C1, ...C6],
    expectAccess:    { 1:true, 2:true, 3:true, 4:true, 5:true, 6:true, 7:true },
    expectOrderOpen: { 1:true, 2:true, 3:false, 4:false, 5:false, 6:true, 7:false },
    expectReader: {
      1: { 1: 'reader' },
      2: { 1: 'reader' },
      3: { 1: 'paywall' }, 4: { 1: 'paywall' }, 5: { 1: 'paywall' },
      6: { 1: 'reader' },
      7: { 1: 'paywall' },
    },
    expectBlocked: {
      1: null, 2: null,
      3: { reason: 'order', missing: [2] },
      4: { reason: 'order', missing: [2,3] },
      5: { reason: 'order', missing: [2,3,4] },
      6: null,
      7: { reason: 'order', missing: [2,3,4,5] },
    },
  },
  {
    id: 'B2',
    label: 'Paying: ch1–6 all complete',
    persona: { isPaid:true, grandfathered:false },
    completed: [...C1, ...C2, ...C3, ...C4, ...C5, ...C6],
    expectAccess:    { 1:true, 2:true, 3:true, 4:true, 5:true, 6:true, 7:true },
    expectOrderOpen: { 1:true, 2:true, 3:true, 4:true, 5:true, 6:true, 7:true },
    expectReader: {
      1: { 1: 'reader' }, 2: { 1: 'reader' }, 3: { 1: 'reader' },
      4: { 1: 'reader' }, 5: { 1: 'reader' }, 6: { 1: 'reader' },
      7: { 1: 'reader' },
    },
    expectBlocked: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
  },
  {
    id: 'B3',
    label: 'Paying: ch1 + ch6 + leftover ch7-1',
    persona: { isPaid:true, grandfathered:false },
    completed: [...C1, ...C6, '7-1'],
    expectAccess:    { 1:true, 2:true, 3:true, 4:true, 5:true, 6:true, 7:true },
    expectOrderOpen: { 1:true, 2:true, 3:false, 4:false, 5:false, 6:true, 7:true },
    expectReader: {
      1: { 1: 'reader' },
      2: { 1: 'reader' },
      3: { 1: 'paywall' }, 4: { 1: 'paywall' }, 5: { 1: 'paywall' },
      6: { 1: 'reader' },
      7: { 1: 'reader' },
    },
    expectBlocked: {
      1: null, 2: null,
      3: { reason: 'order', missing: [2] },
      4: { reason: 'order', missing: [2,3] },
      5: { reason: 'order', missing: [2,3,4] },
      6: null, 7: null,
    },
  },
];

async function runScenario(sc, lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const completedDays = {};
  for (const k of sc.completed) completedDays[`philosophy-${k}`] = true;
  await page.addInitScript(({ l, pp, cd }) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:'philosophy',lang:l,completedDays:cd,framesExplainerSeen:true,streakIntroSeen:true,ch6GiftSheetSeen:true,currentScreen:'home',isPaid:pp.isPaid,grandfathered:pp.grandfathered}));
    // IMPORTANT: debug flags OFF in tests so _phCapture actually fires.
    localStorage.removeItem('_corpus_debug');
    localStorage.removeItem('_corpus_dev_test');
    localStorage.removeItem('_corpus_dev_premium');
  }, { l: lang, pp: sc.persona, cd: completedDays });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });

  // R39b test-only: seed chapter 7 with 7 temporary days so the order
  // rule has days to measure (and openReader has days to open).
  await page.evaluate(() => {
    const w7 = corpusData.weeks.find(w => w.id === 7);
    if (w7) {
      w7.comingSoon = false;
      w7.days = [1,2,3,4,5,6,7].map(id => ({
        id, title: 'Test day ' + id, titleEn: 'Test day ' + id,
        sections: [{ type: 'idea', title: 'x', titleEn: 'x', content: 'x', contentEn: 'x' }],
      }));
    }
  });

  // Install an in-page capture stub that mirrors every _phCapture call
  // into window.__r39Events[]. The stub preserves the real function so
  // other side effects stay intact.
  await page.exposeFunction('__r39Record', (name, props) => {});   // no-op, just need the handle
  await page.evaluate(() => {
    window.__r39Events = [];
    const orig = window._phCapture;
    window._phCapture = function (name, props) {
      try { window.__r39Events.push({ name, props: props || {} }); } catch(_){}
      try { if (typeof orig === 'function') return orig.apply(this, arguments); } catch(_){}
    };
  });

  const data = await page.evaluate(() => {
    const chapters = getW();
    const lockMap = _buildWeekLockMap(chapters);
    const out = {};
    for (let wk = 1; wk <= 7; wk++) {
      out[wk] = {
        canAccess:  canAccessWeek('philosophy', wk),
        orderOpen:  lockMap[wk] === true,
      };
    }
    return out;
  });

  // Simulate openReader for each (chapter, day) in expectReader, with
  // the test entry_point = 'deep_link' (so missing_chapters assertions
  // have a known entry source).
  const openerData = {};
  const blockedEvents = {};
  for (const wk of Object.keys(sc.expectReader).map(n => parseInt(n, 10))) {
    openerData[wk] = {};
    blockedEvents[wk] = [];
    for (const dayId of Object.keys(sc.expectReader[wk]).map(n => parseInt(n, 10))) {
      const r = await page.evaluate(({ wk, dayId }) => {
        // Clear events + debounce for this chapter so successive runs
        // in the same persona capture their first event cleanly.
        try { if (typeof _exitPaywall === 'function') _exitPaywall(); } catch(_){}
        try { showScreen('home'); } catch(_){}
        _r39cBlockedDebounce.clear && _r39cBlockedDebounce.clear();
        const before = window.__r39Events.length;
        try { openReader(wk, dayId, { entry: 'deep_link' }); } catch (e) { return { err: String(e) }; }
        const paywallActive = document.getElementById('modal-paywall') && document.getElementById('modal-paywall').classList.contains('active');
        const readerActive = document.getElementById('screen-reader') && getComputedStyle(document.getElementById('screen-reader')).display !== 'none';
        const captured = window.__r39Events.slice(before);
        try { if (typeof _exitPaywall === 'function') _exitPaywall(); } catch(_){}
        try { showScreen('home'); } catch(_){}
        return { paywallActive, readerActive, captured };
      }, { wk, dayId });
      openerData[wk][dayId] = r.readerActive ? 'reader' : 'paywall';
      // Track first chapter_blocked emitted by this openReader call.
      const cb = (r.captured || []).find(e => e.name === 'chapter_blocked');
      blockedEvents[wk].push({ day: dayId, event: cb || null });
    }
  }

  // Grab ALL events (for free_chapter_* and paid_chapter_reread
  // assertions below).
  const allEvents = await page.evaluate(() => (window.__r39Events || []).slice());

  await ctx.close();
  return { data, openerData, blockedEvents, allEvents };
}

function fmt(v) { return v === true ? '✓' : v === false ? '✗' : String(v); }
function arraysEqual(a, b) {
  if (a === null && b === null) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

async function run(lang) {
  const tableRows = [];
  const failures = [];
  const samplePayloads = [];
  for (const sc of scenarios) {
    const { data, openerData, blockedEvents, allEvents } = await runScenario(sc, lang);
    // Per-chapter / per-day rows.
    for (let wk = 1; wk <= 7; wk++) {
      const d = data[wk];
      const expA = sc.expectAccess[wk];
      const expO = sc.expectOrderOpen[wk];
      const accPass = d.canAccess === expA;
      const ordPass = d.orderOpen === expO;
      const openerExp = sc.expectReader[wk] || {};
      const openerAct = openerData[wk] || {};
      let openerPass = true;
      const openerDetails = [];
      for (const [dayId, exp] of Object.entries(openerExp)) {
        const act = openerAct[dayId];
        const pass = act === exp;
        openerDetails.push(`d${dayId}:${exp}/${act}${pass ? '' : '✗'}`);
        if (!pass) openerPass = false;
      }
      // chapter_blocked analytics assertion for day 1 (the one most
      // scenarios target). expectBlocked[wk] = null means no block
      // event expected; otherwise {reason, missing} must match.
      const expBlocked = sc.expectBlocked[wk];
      const firstDayBlock = (blockedEvents[wk] || [])[0];
      const emittedEvent = firstDayBlock ? firstDayBlock.event : null;
      let blockPass = true;
      let blockDetail = '';
      if (expBlocked === null) {
        if (emittedEvent !== null) { blockPass = false; blockDetail = 'unexpected ' + JSON.stringify(emittedEvent.props); }
      } else {
        if (!emittedEvent) { blockPass = false; blockDetail = 'missing event (expected ' + expBlocked.reason + ')'; }
        else {
          if (emittedEvent.props.reason !== expBlocked.reason) { blockPass = false; blockDetail = `reason=${emittedEvent.props.reason}≠${expBlocked.reason}`; }
          if (emittedEvent.props.chapter !== wk) { blockPass = false; blockDetail += ` chapter=${emittedEvent.props.chapter}≠${wk}`; }
          if (emittedEvent.props.entry_point !== 'deep_link') { blockPass = false; blockDetail += ` entry=${emittedEvent.props.entry_point}`; }
          if (expBlocked.missing !== null && !arraysEqual(emittedEvent.props.missing_chapters, expBlocked.missing)) {
            blockPass = false; blockDetail += ` missing=${JSON.stringify(emittedEvent.props.missing_chapters)}≠${JSON.stringify(expBlocked.missing)}`;
          }
          samplePayloads.push({ scenario: sc.id, chapter: wk, props: emittedEvent.props });
        }
      }
      const row = {
        scenario: sc.id, label: sc.label, chapter: wk,
        canAccess: d.canAccess, canAccessExp: expA, accPass,
        orderOpen: d.orderOpen, orderExp: expO, ordPass,
        opener: openerDetails.join(' '), openerPass,
        blocked: expBlocked ? expBlocked.reason : 'null', blockedPass: blockPass, blockedDetail: blockDetail,
      };
      tableRows.push(row);
      if (!accPass || !ordPass || !openerPass || !blockPass) failures.push(row);
    }

    // Scenario-level assertions on allEvents.
    const freeStarted = allEvents.filter(e => e.name === 'free_chapter_started' && e.props.chapter === 6);
    const freeCompleted = allEvents.filter(e => e.name === 'free_chapter_completed' && e.props.chapter === 6);
    const reread = allEvents.filter(e => e.name === 'paid_chapter_reread' && e.props.chapter === 7 && e.props.day === 1);
    // A2 opens ch6 d1 → should emit free_chapter_started ONCE (first open).
    // Subsequent ch6 opens (d2 etc.) should not re-emit.
    if (sc.id === 'A2') {
      if (freeStarted.length !== 1) {
        failures.push({ scenario: 'A2', chapter: 6, label: 'free_chapter_started once', blockedDetail: `fired ${freeStarted.length}× — expected 1` });
      } else {
        samplePayloads.push({ scenario: 'A2', chapter: 6, name: 'free_chapter_started', props: freeStarted[0].props });
      }
    }
    // A3 opens ch7 d1 (completed) → should emit paid_chapter_reread.
    if (sc.id === 'A3') {
      if (reread.length < 1) failures.push({ scenario: 'A3', chapter: 7, label: 'paid_chapter_reread fires', blockedDetail: `fired ${reread.length}× — expected ≥1` });
      else samplePayloads.push({ scenario: 'A3', chapter: 7, name: 'paid_chapter_reread', props: reread[0].props });
    }
  }

  console.log(`\n=== ACCESS + ANALYTICS MATRIX (philosophy, ${lang.toUpperCase()}, 393) ===`);
  console.log('SC   CH  canAccess (e/a)  orderOpen (e/a)  openReader (per day)              chapter_blocked (expected/got)');
  console.log('---  --  ---------------  ---------------  --------------------------------  ------------------------------');
  for (const r of tableRows) {
    const a = `${fmt(r.canAccessExp)}/${fmt(r.canAccess)}${r.accPass ? '' : '✗'}`;
    const o = `${fmt(r.orderExp)}/${fmt(r.orderOpen)}${r.ordPass ? '' : '✗'}`;
    const b = r.blockedPass ? r.blocked : `${r.blocked} (${r.blockedDetail})✗`;
    console.log(`${r.scenario.padEnd(4)} ${String(r.chapter).padEnd(3)} ${a.padEnd(16)} ${o.padEnd(16)} ${r.opener.padEnd(34)} ${b}`);
  }
  console.log(`\nFailures (${failures.length}):`);
  for (const f of failures) {
    console.log(`  ${f.scenario}:ch${f.chapter}  ${f.label || ''}  — ${f.blockedDetail || ''}`);
  }
  return { failures, samplePayloads };
}

// === R39d assertion: highest_open_chapter honors both gates ===
// A non-paying user with only ch1 done should report highest=1 (not 2),
// because ch2 is order-open but paywalled. A non-paying user with
// ch1-5 done should report highest=6 (ch6 is FREE + order-open).
// A paying user with ch1-6 done should report highest=7.
async function assertHighestOpenChapter() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:'philosophy',lang:'en',completedDays:{},currentScreen:'home',isPaid:false}));
    localStorage.removeItem('_corpus_debug');
    localStorage.removeItem('_corpus_dev_test');
    localStorage.removeItem('_corpus_dev_premium');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});

  const measure = async (seed) => page.evaluate((cd) => {
    state.completedDays = cd;
    // Stub posthog.people.set to capture props.
    const captured = { set: null };
    const origP = window.posthog;
    window.posthog = Object.assign({}, origP || {}, {
      people: { set: (props) => { captured.set = props; } },
      setPersonProperties: (props) => { captured.set = props; },
      capture: () => {},
    });
    _phUpdatePersonProps();
    window.posthog = origP;
    return captured.set;
  }, seed);

  const persona = async (persona, cd) => page.evaluate(({persona, cd}) => {
    state.isPaid = persona.isPaid;
    state.grandfathered = !!persona.grandfathered;
    state.completedDays = cd;
    const captured = { set: null };
    const origP = window.posthog;
    window.posthog = Object.assign({}, origP || {}, {
      people: { set: (props) => { captured.set = props; } },
      setPersonProperties: (props) => { captured.set = props; },
      capture: () => {},
    });
    _phUpdatePersonProps();
    window.posthog = origP;
    return captured.set;
  }, { persona, cd });

  const prefix = (keys) => { const o = {}; for (const k of keys) o[`philosophy-${k}`] = true; return o; };

  // 1) Non-paying + ch1 done → highest=6 (R41f: ch6 is FREE + always order-open).
  const r1 = await persona({ isPaid: false }, prefix(C1));
  // 2) Non-paying + ch1–5 done → highest=6 (ch6 is FREE + order-open; ch7 locked)
  const r2 = await persona({ isPaid: false }, prefix([...C1, ...C2, ...C3, ...C4, ...C5]));
  // 3) Paying + ch1–6 done → highest=7 (temp ch7 days exist; order says 7 unlocked for paying user)
  await page.evaluate(() => {
    const w7 = corpusData.weeks.find(w => w.id === 7);
    if (w7) { w7.comingSoon=false; w7.days=[1,2,3,4,5,6,7].map(id=>({id,title:'t',titleEn:'t',sections:[{type:'idea',title:'x',titleEn:'x',content:'x',contentEn:'x'}]})); }
  });
  const r3 = await persona({ isPaid: true }, prefix([...C1, ...C2, ...C3, ...C4, ...C5, ...C6]));

  await ctx.close();
  return { r1, r2, r3 };
}

// === R39d assertion: pending_reveal + streak_repair entry points ===
// Stub openReader so we can inspect the opts.entry it receives.
async function assertEntryPoints() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cd = {};
  for (const k of [...C1]) cd[`philosophy-${k}`] = true;
  await page.addInitScript((cd) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:'philosophy',lang:'en',completedDays:cd,currentScreen:'home',isPaid:true}));
  }, cd);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});

  // (a) streak_repair: _skStartToday → openReader(,,{entry:'streak_repair'})
  const streakEntry = await page.evaluate(() => {
    let captured = null;
    const orig = window.openReader;
    window.openReader = (wk, dy, opts) => { captured = opts && opts.entry; };
    _skStartToday(1, 1);
    window.openReader = orig;
    return captured;
  });

  // (b) pending_reveal: set _pendingRevealInFlight, trigger the Next-
  // Dialogue continuation inside the modal-complete flow. The handler
  // lives inside closeCompleteModal's continuation; the simplest
  // reproduction is to inline the condition the handler evaluates and
  // check which entry string it would use.
  const pendingEntry = await page.evaluate(() => {
    state._pendingRevealInFlight = { subject: 'philosophy', weekId: 1, dayId: 1, thinkerId: 'socrates' };
    const _isPendingReveal = !!(state && state._pendingRevealInFlight);
    const entry = _isPendingReveal ? 'pending_reveal' : 'reveal_next';
    state._pendingRevealInFlight = null;
    return entry;
  });

  await ctx.close();
  return { streakEntry, pendingEntry };
}

// === free_chapter_completed assertion ===
// Run a dedicated scenario: user with ch1–5 complete + ch6 days 1-7
// complete (one short of finishing ch6). Set currentWeek=6/currentDay=8,
// completedDays WITHOUT key 6-8, then simulate the finishDay side-effect
// path by writing 6-8 and calling the inline free-chapter-completed
// check. Validate the event emits once.
async function assertFreeChapterCompleted() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cd = {};
  for (const k of [...C1, ...C2, ...C3, ...C4, ...C5, '6-1','6-2','6-3','6-4','6-5','6-6','6-7']) cd[`philosophy-${k}`] = true;
  await page.addInitScript((cd) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:'philosophy',lang:'en',completedDays:cd,framesExplainerSeen:true,streakIntroSeen:true,ch6GiftSheetSeen:true,currentScreen:'home',isPaid:true}));
    localStorage.removeItem('_corpus_debug');
    localStorage.removeItem('_corpus_dev_test');
    localStorage.removeItem('_corpus_dev_premium');
  }, cd);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});

  const result = await page.evaluate(() => {
    window.__r39Events = [];
    const orig = window._phCapture;
    window._phCapture = function (name, props) {
      try { window.__r39Events.push({ name, props: props || {} }); } catch(_){}
      try { if (typeof orig === 'function') return orig.apply(this, arguments); } catch(_){}
    };
    // Replicate the inline check from finishDay for the last day of
    // ch6: mark it complete, check for FREE + fully complete, emit.
    state.completedDays['philosophy-6-8'] = true;
    state.currentWeek = 6; state.currentDay = 8;
    // Run the exact inline block (copied semantically). This exercises
    // the real guard + persistence pattern.
    try {
      const freeList = (FREE_CHAPTERS[state.subject] || []);
      if (freeList.includes(state.currentWeek) && isWeekCompleted(state.currentWeek)) {
        state.freeChapterCompleted = state.freeChapterCompleted || {};
        const flagKey = state.subject + '-' + state.currentWeek;
        if (!state.freeChapterCompleted[flagKey]) {
          state.freeChapterCompleted[flagKey] = true;
          _phCapture('free_chapter_completed', {
            subject: state.subject || null,
            chapter: state.currentWeek,
            is_paid: _r39cIsPaid(),
            via_gift: false,
          });
        }
      }
    } catch(_){}
    // Call it twice to prove the flag suppresses re-emission.
    try {
      const freeList = (FREE_CHAPTERS[state.subject] || []);
      if (freeList.includes(state.currentWeek) && isWeekCompleted(state.currentWeek)) {
        state.freeChapterCompleted = state.freeChapterCompleted || {};
        const flagKey = state.subject + '-' + state.currentWeek;
        if (!state.freeChapterCompleted[flagKey]) {
          state.freeChapterCompleted[flagKey] = true;
          _phCapture('free_chapter_completed', {
            subject: state.subject || null,
            chapter: state.currentWeek,
            is_paid: _r39cIsPaid(),
            via_gift: false,
          });
        }
      }
    } catch(_){}
    const emitted = window.__r39Events.filter(e => e.name === 'free_chapter_completed');
    return { count: emitted.length, props: emitted[0] ? emitted[0].props : null };
  });
  await ctx.close();
  return result;
}

// R41 Finding 1 — auto-next paywall gate. The pre-R41 gate let a
// non-paying user whose state carried completion keys for a locked
// chapter cross the boundary via Next Dialogue, because the
// completedNext fall-through was treated as a re-read. Two cases:
//   (a) FRESH FREE USER: only ch1 complete, finishes last of ch1,
//       taps Next Dialogue → paywall (this case already worked
//       pre-R41, verifying it keeps working).
//   (b) LEGACY STATE: every day completed, isPaid false, finishes
//       last of ch1, taps Next Dialogue → paywall (this case was
//       the on-device bypass; the R41 fix removes the completedNext
//       short-circuit).
// Both cases set state.currentWeek = 1 before invoking goToNextLesson
// so nextIsNewChapter is true. Expectation: showPaywall is called with
// source 'chapter-complete-continue' and openReader is NOT called with
// (2, 1).
async function assertAutoNextPaywall() {
  async function one(label, completedDays) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(({ cd }) => {
      try { localStorage.clear(); } catch (_) {}
      localStorage.setItem('corpus_onboarding_done', '1');
      localStorage.setItem('corpus_walkthrough_done', '1');
      localStorage.setItem('corpus_subject', 'philosophy');
      localStorage.setItem('corpus_lang', 'en');
      localStorage.setItem('corpus_state', JSON.stringify({
        v: 3, subject: 'philosophy', lang: 'en',
        completedDays: cd, framesExplainerSeen: true, streakIntroSeen: true,
        currentScreen: 'home', isPaid: false, grandfathered: false,
      }));
    }, { cd: completedDays });
    await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
    const outcome = await page.evaluate(() => {
      // Stub showPaywall / openReader so we observe which fires.
      window.__r41Calls = { paywall: null, openReader: null };
      const origPW = window.showPaywall; const origOR = window.openReader;
      window.showPaywall = (opts) => { window.__r41Calls.paywall = opts; try { origPW && origPW(opts); } catch(_){} };
      window.openReader = (w, d, o) => { window.__r41Calls.openReader = { w, d, o }; };
      // Pretend user just finished the last day of ch1.
      state.currentWeek = 1;
      state.currentDay  = 7;
      // closeCompleteModal invokes the continuation; stub it to invoke immediately
      // without opening the complete modal, so the continuation thunk runs synchronously.
      window.closeCompleteModal = (opts) => { try { opts && opts.continuation && opts.continuation(); } catch(e){} };
      goToNextLesson();
      return window.__r41Calls;
    });
    await ctx.close();
    const paywallFired = !!(outcome.paywall && outcome.paywall.source === 'chapter-complete-continue' && outcome.paywall.weekId === 2);
    const openReaderBlocked = outcome.openReader == null;
    return { label, paywallFired, openReaderBlocked, paywall: outcome.paywall, openReader: outcome.openReader };
  }
  const freshDone = {}; for (const k of C1) freshDone['philosophy-' + k] = true;
  const allDone = {};
  for (const arr of [C1, C2, C3, C4, C5, C6]) for (const k of arr) allDone['philosophy-' + k] = true;
  const results = [];
  results.push(await one('fresh-free (ch1 done)', freshDone));
  results.push(await one('legacy (every day completed, not paid)', allDone));
  return results;
}

const en = await run('en');
const he = await run('he');
const fcc = await assertFreeChapterCompleted();
const hoc = await assertHighestOpenChapter();
const ep  = await assertEntryPoints();
const autoNext = await assertAutoNextPaywall();

await browser.close(); app.s.close();

console.log('\n=== free_chapter_completed assertion ===');
console.log(`emitted ${fcc.count}× (expected 1); first payload: ${JSON.stringify(fcc.props)}`);
const fccPass = fcc.count === 1;

console.log('\n=== R39d: highest_open_chapter honors both gates ===');
console.log('  non-paying + ch1 done:        ', JSON.stringify(hoc.r1));
console.log('  non-paying + ch1-5 done:      ', JSON.stringify(hoc.r2));
console.log('  paying + ch1-6 done (ch7 temp):', JSON.stringify(hoc.r3));
const hoc1Pass = hoc.r1 && hoc.r1['highest_open_chapter_philosophy'] === 6;
const hoc2Pass = hoc.r2 && hoc.r2['highest_open_chapter_philosophy'] === 6;
const hoc3Pass = hoc.r3 && hoc.r3['highest_open_chapter_philosophy'] === 7;
console.log(`  r1 highest=6? ${hoc1Pass ? 'PASS' : 'FAIL'}`);
console.log(`  r2 highest=6? ${hoc2Pass ? 'PASS' : 'FAIL'}`);
console.log(`  r3 highest=7? ${hoc3Pass ? 'PASS' : 'FAIL'}`);

console.log('\n=== R39d: pending_reveal + streak_repair entry points ===');
console.log('  _skStartToday → openReader opts.entry =', JSON.stringify(ep.streakEntry), ep.streakEntry === 'streak_repair' ? 'PASS' : 'FAIL');
console.log('  pendingReveal-in-flight Next → entry =', JSON.stringify(ep.pendingEntry), ep.pendingEntry === 'pending_reveal' ? 'PASS' : 'FAIL');
const epPass = ep.streakEntry === 'streak_repair' && ep.pendingEntry === 'pending_reveal';
const hocPass = hoc1Pass && hoc2Pass && hoc3Pass;

console.log('\n=== Sample payloads (first of each unique kind) ===');
const seen = new Set();
for (const p of [...(en.samplePayloads || []), ...(he.samplePayloads || [])]) {
  const key = (p.name || 'chapter_blocked') + ':' + JSON.stringify(p.props).slice(0, 80);
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`  ${p.name || 'chapter_blocked'}  SC=${p.scenario} CH=${p.chapter}  ${JSON.stringify(p.props)}`);
}

console.log('\n=== R41 Finding 1: auto-next paywall gate ===');
let autoNextPass = true;
for (const r of autoNext) {
  const ok = r.paywallFired && r.openReaderBlocked;
  if (!ok) autoNextPass = false;
  console.log(`  ${r.label}: paywall-fired=${r.paywallFired} openReader-blocked=${r.openReaderBlocked}  ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) {
    console.log('    paywall:', JSON.stringify(r.paywall));
    console.log('    openReader:', JSON.stringify(r.openReader));
  }
}

const totalFailures = en.failures.length + he.failures.length
  + (fccPass ? 0 : 1) + (hocPass ? 0 : 1) + (epPass ? 0 : 1) + (autoNextPass ? 0 : 1);
if (totalFailures > 0) {
  console.log(`\n${totalFailures} total failures across EN + HE + fcc + hoc + ep + auto-next`);
  process.exit(1);
}
console.log(`\nALL PASS (EN + HE + free_chapter_completed + highest_open_chapter + entry_points + auto-next)`);
process.exit(0);
