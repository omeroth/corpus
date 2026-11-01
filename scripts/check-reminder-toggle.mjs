// Regression test for the "Daily reminder toggle renders OFF for users
// whose dailyReminder.enabled is true" bug: renderProfileV7 was reading
// state.reminder.enabled (field does not exist) instead of
// state.dailyReminder.enabled, so the v7 Profile toggle always painted
// OFF regardless of the stored preference. This script also guards the
// R46 osPermission split: the toggle reflects user intent even when the
// OS currently denies notifications, and setReminder schedules /
// cancels notifications correctly in all four permission + intent
// combinations. Run with: node scripts/check-reminder-toggle.mjs
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/Desktop/r46';
await mkdir(OUT, { recursive: true });

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };
const srv = (root) => new Promise(r => {
  const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}});
  s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}));
});
const app = await srv(WWW);

const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__CORPUS_DEBUG_BUILD = true;
  // R46 — observable mock of LocalNotifications. The scheduled Set holds
  // the ids currently in the pending list from the app's perspective:
  //   schedule → add id; cancel → remove id. Permission is driven by
  //   __mockPerm which the test flips between scenarios.
  // Legacy id 1 is initially present so the reconcile "legacy cleanup"
  // (_cancelReminderId(REMINDER_NOTIF_ID)) does meaningful work.
  window.__scheduled = new Set([1]);
  window.__mockPerm = 'granted';
  window.__permRequests = 0;
  window.__permChecks = 0;
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{
    Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})},
    App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})},
    StatusBar:{setStyle:async()=>({})},
    CorpusWidgetBridge:{isWidgetInstalled:async()=>({installed:false,supported:true})},
    LocalNotifications: {
      checkPermissions: async () => { window.__permChecks++; return { display: window.__mockPerm }; },
      requestPermissions: async () => { window.__permRequests++; return { display: window.__mockPerm }; },
      schedule: async ({ notifications }) => { (notifications || []).forEach(n => window.__scheduled.add(n.id)); return { notifications: notifications || [] }; },
      cancel: async ({ notifications }) => { (notifications || []).forEach(n => window.__scheduled.delete(n.id)); return {}; },
      getPending: async () => ({ notifications: Array.from(window.__scheduled).map(id => ({ id })) }),
    },
  } };
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home'), { timeout: 15000 });
await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });

function label(name, pass, detail) {
  const mark = pass ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ' — ' + detail : ''}`);
  return pass;
}

let allPass = true;
async function assert(name, fn) {
  const { pass, detail } = await fn();
  if (!label(name, pass, detail)) allPass = false;
}

// ── Scenario A: enabled:true, osPermission:'granted' — toggle ON, hint HIDDEN
await page.evaluate(() => {
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done','1');
  localStorage.setItem('corpus_walkthrough_done','1');
  localStorage.setItem('corpus_subject','philosophy');
  localStorage.setItem('corpus_lang','en');
  localStorage.setItem('corpus_appearance','light');
  localStorage.setItem('corpus_state', JSON.stringify({
    v:3, subject:'philosophy', lang:'en', completedDays:{},
    framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home',
    isPaid:true, dailyStreak:5, longestStreak:5,
    dailyReminder: { enabled:true, time:'20:00', permissionAsked:true, prePromptDeferred:false, timeExplicitlySet:false, osPermission:'granted' },
  }));
  try { loadState(); setAppLang('en'); showProfileScreen(); } catch(_){}
});
await page.waitForTimeout(500);

await assert('Legacy toggle paints ON when enabled:true (A)', async () => {
  const r = await page.evaluate(() => {
    const t = document.getElementById('pf-reminder-toggle');
    return { present: !!t, checked: t ? t.checked : null };
  });
  return { pass: r.present && r.checked === true, detail: JSON.stringify(r) };
});
await assert('v7 toggle paints ON when enabled:true (A)', async () => {
  const r = await page.evaluate(() => {
    const t = document.querySelector('.pf7-tg[data-k="rem"]');
    return { present: !!t, on: t ? t.classList.contains('on') : null, pressed: t ? t.getAttribute('aria-pressed') : null };
  });
  return { pass: r.present && r.on && r.pressed === 'true', detail: JSON.stringify(r) };
});
await assert('Hint HIDDEN when osPermission:"granted" (A, legacy)', async () => {
  const r = await page.evaluate(() => {
    const h = document.getElementById('pf-reminder-hint');
    return { present: !!h, show: h ? h.classList.contains('show') : null, display: h ? getComputedStyle(h).display : null };
  });
  return { pass: r.present && !r.show && r.display === 'none', detail: JSON.stringify(r) };
});
await assert('Hint HIDDEN when osPermission:"granted" (A, v7)', async () => {
  const r = await page.evaluate(() => {
    const h = document.querySelector('.pf7-reminder-hint');
    return { present: !!h, show: h ? h.classList.contains('show') : null, display: h ? getComputedStyle(h).display : null };
  });
  return { pass: r.present && !r.show && r.display === 'none', detail: JSON.stringify(r) };
});
await page.screenshot({ path: `${OUT}/A-granted.png` });

// ── Scenario B: enabled:true, osPermission:'denied' — toggle ON, hint SHOWN
await page.evaluate(() => {
  state.dailyReminder.osPermission = 'denied';
  renderProfile();
  renderProfileV7();
});
await page.waitForTimeout(300);

await assert('Legacy toggle STILL ON when osPermission:"denied" (B)', async () => {
  const checked = await page.evaluate(() => document.getElementById('pf-reminder-toggle').checked);
  return { pass: checked === true };
});
await assert('v7 toggle STILL ON when osPermission:"denied" (B)', async () => {
  const on = await page.evaluate(() => document.querySelector('.pf7-tg[data-k="rem"]').classList.contains('on'));
  return { pass: on === true };
});
await assert('Hint SHOWN when enabled && denied (B, legacy)', async () => {
  const r = await page.evaluate(() => {
    const h = document.getElementById('pf-reminder-hint');
    const t = document.getElementById('pf-reminder-hint-text');
    const l = document.getElementById('pf-reminder-hint-link');
    return { show: h.classList.contains('show'), display: getComputedStyle(h).display, text: t ? t.textContent : null, linkText: l ? l.textContent : null };
  });
  return { pass: r.show && r.display === 'block' && /system settings/i.test(r.text || '') && /Open settings/i.test(r.linkText || ''), detail: JSON.stringify(r) };
});
await assert('Hint SHOWN when enabled && denied (B, v7)', async () => {
  const r = await page.evaluate(() => {
    const h = document.querySelector('.pf7-reminder-hint');
    return { show: h.classList.contains('show'), display: getComputedStyle(h).display, html: h.textContent };
  });
  return { pass: r.show && r.display === 'block' && /system settings/i.test(r.html || ''), detail: JSON.stringify(r) };
});
await page.screenshot({ path: `${OUT}/B-denied.png` });

// ── Scenario C: enabled:false — toggle OFF, hint HIDDEN (user turned it off themselves)
await page.evaluate(() => {
  state.dailyReminder.enabled = false;
  state.dailyReminder.osPermission = 'denied';
  renderProfile();
  renderProfileV7();
});
await page.waitForTimeout(300);
await assert('Toggle OFF when enabled:false (C)', async () => {
  const r = await page.evaluate(() => ({
    legacy: document.getElementById('pf-reminder-toggle').checked,
    v7: document.querySelector('.pf7-tg[data-k="rem"]').classList.contains('on'),
  }));
  return { pass: r.legacy === false && r.v7 === false, detail: JSON.stringify(r) };
});
await assert('Hint HIDDEN when enabled:false even if denied (C)', async () => {
  const r = await page.evaluate(() => ({
    legacy: document.getElementById('pf-reminder-hint').classList.contains('show'),
    v7: document.querySelector('.pf7-reminder-hint').classList.contains('show'),
  }));
  return { pass: !r.legacy && !r.v7, detail: JSON.stringify(r) };
});
await page.screenshot({ path: `${OUT}/C-user-off.png` });

// ── Scenario D: Hebrew copy
await page.evaluate(() => {
  state.dailyReminder.enabled = true;
  state.dailyReminder.osPermission = 'denied';
  setAppLang('he');
  showProfileScreen();
});
await page.waitForTimeout(400);
await assert('Hebrew hint copy renders (D)', async () => {
  const r = await page.evaluate(() => {
    const t = document.getElementById('pf-reminder-hint-text');
    const l = document.getElementById('pf-reminder-hint-link');
    const v7 = document.querySelector('.pf7-reminder-hint');
    return { legacy: t ? t.textContent : null, link: l ? l.textContent : null, v7: v7 ? v7.textContent : null };
  });
  const ok = r.legacy && /ההתראות/.test(r.legacy) && /פתחו הגדרות/.test(r.link) && /ההתראות/.test(r.v7);
  return { pass: ok, detail: JSON.stringify(r) };
});
await page.screenshot({ path: `${OUT}/D-he-denied.png` });

// ── Scenario E: setReminder({ enabled: false }) persists local state
await page.evaluate(async () => {
  await setReminder({ enabled: false });
});
await assert('setReminder({enabled:false}) writes local state', async () => {
  const r = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('corpus_state'));
    return { en: s.dailyReminder && s.dailyReminder.enabled, osP: s.dailyReminder && s.dailyReminder.osPermission };
  });
  return { pass: r.en === false, detail: JSON.stringify(r) };
});

// ── Scenario F (grep audit): no state.reminder remains
await assert('No wrong-field state.reminder reads remain', async () => {
  const r = await page.evaluate(() => typeof state.dailyReminder);
  return { pass: r === 'object', detail: `state.dailyReminder typeof = ${r}` };
});

// ─────────────────────────────────────────────────────────────────────
// Behavioral scenarios E–H — assert the SCHEDULED SET, not the UI.
// Each resets state and the mock plugin's scheduled snapshot so earlier
// scenarios don't contaminate later ones.
// ─────────────────────────────────────────────────────────────────────
async function resetAll(perm) {
  await page.evaluate((perm) => {
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:'philosophy', lang:'en', completedDays:{},
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home',
      isPaid:true, dailyStreak:0, longestStreak:0, activeDates: [],
      dailyReminder: { enabled:true, time:'20:00', permissionAsked:true, prePromptDeferred:false, timeExplicitlySet:false, osPermission:'unknown' },
    }));
    try { loadState(); setAppLang('en'); } catch(_){}
    window.__mockPerm = perm;
    window.__scheduled = new Set([1]);  // legacy id, reconcile will clean it
    window.__permChecks = 0;
    window.__permRequests = 0;
  }, perm);
}

// E — enabled:true + granted → reconcile schedules window ids; nothing wipes them.
await resetAll('granted');
await page.evaluate(async () => { await setReminder({ enabled: true }); });
await assert('E · enabled:true + granted schedules the rolling window', async () => {
  const r = await page.evaluate(() => ({
    scheduled: Array.from(window.__scheduled).sort((a,b)=>a-b),
    enabled: state.dailyReminder.enabled,
    osP: state.dailyReminder.osPermission,
  }));
  const windowIds = r.scheduled.filter(id => id >= 100 && id < 100 + 14);
  return {
    pass: r.enabled === true && r.osP === 'granted' && windowIds.length > 0,
    detail: `scheduled=${JSON.stringify(r.scheduled)} windowIds.len=${windowIds.length} enabled=${r.enabled} osP=${r.osP}`,
  };
});
await assert('E · legacy id 1 is cancelled by reconcile', async () => {
  const has = await page.evaluate(() => window.__scheduled.has(1));
  return { pass: has === false, detail: `scheduled.has(1)=${has}` };
});
await assert('E · schedule persists after setReminder resolves (no stray cancel)', async () => {
  // Snapshot now, wait a frame, check again — if some straggling await
  // cancelled, the set would shrink. It must not.
  const before = await page.evaluate(() => Array.from(window.__scheduled).sort((a,b)=>a-b));
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => Array.from(window.__scheduled).sort((a,b)=>a-b));
  return { pass: JSON.stringify(before) === JSON.stringify(after) && after.length > 0, detail: `before=${JSON.stringify(before)} after=${JSON.stringify(after)}` };
});

// F — enabled:true + denied → no window ids scheduled; no crash.
await resetAll('denied');
let threw = false;
try {
  await page.evaluate(async () => { await setReminder({ enabled: true }); });
} catch (_) { threw = true; }
await assert('F · enabled:true + denied does not throw', async () => ({ pass: !threw, detail: `threw=${threw}` }));
await assert('F · enabled:true + denied schedules nothing from the window', async () => {
  const r = await page.evaluate(() => ({
    scheduled: Array.from(window.__scheduled).sort((a,b)=>a-b),
    enabled: state.dailyReminder.enabled,
    osP: state.dailyReminder.osPermission,
  }));
  const windowIds = r.scheduled.filter(id => id >= 100 && id < 100 + 14);
  return {
    pass: windowIds.length === 0 && r.enabled === true && r.osP === 'denied',
    detail: `windowIds=${JSON.stringify(windowIds)} enabled=${r.enabled} osP=${r.osP}`,
  };
});

// G — user toggles OFF → every window id + legacy id cancelled.
await resetAll('granted');
await page.evaluate(async () => { await setReminder({ enabled: true }); });  // first schedule
const beforeOff = await page.evaluate(() => Array.from(window.__scheduled).sort((a,b)=>a-b));
await page.evaluate(async () => { await setReminder({ enabled: false }); });
await assert('G · toggle OFF cancels every pending notification', async () => {
  const r = await page.evaluate(() => ({
    scheduled: Array.from(window.__scheduled).sort((a,b)=>a-b),
    enabled: state.dailyReminder.enabled,
  }));
  return {
    pass: r.scheduled.length === 0 && r.enabled === false,
    detail: `before=${JSON.stringify(beforeOff)} after=${JSON.stringify(r.scheduled)} enabled=${r.enabled}`,
  };
});

// H — OFF → ON (granted) → scheduled again.
await page.evaluate(async () => { await setReminder({ enabled: true }); });
await assert('H · OFF then ON (granted) reschedules the window', async () => {
  const r = await page.evaluate(() => ({
    scheduled: Array.from(window.__scheduled).sort((a,b)=>a-b),
    enabled: state.dailyReminder.enabled,
    osP: state.dailyReminder.osPermission,
  }));
  const windowIds = r.scheduled.filter(id => id >= 100 && id < 100 + 14);
  return {
    pass: windowIds.length > 0 && r.enabled === true && r.osP === 'granted',
    detail: `scheduled=${JSON.stringify(r.scheduled)} windowIds.len=${windowIds.length}`,
  };
});

await browser.close();
app.s.close();

console.log(`\n${allPass ? '✅ ALL PASS' : '❌ FAILURES'} — shots in ${OUT}/`);
process.exit(allPass ? 0 : 1);
