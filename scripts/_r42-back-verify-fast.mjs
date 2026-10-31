// Fast back-button verify — single CDP session, re-seed state per
// scene, open layer, BACK, measure. Avoids force-stop/splash timing
// issues that masked results in the slow pass.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/android-back-verify';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
function screencap(name) { execSync(`adb exec-out screencap -p > ${OUT}/${name}.png`, { stdio: 'ignore' }); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function keyBack() { execSync('adb shell input keyevent 4', { stdio: 'ignore' }); await sleep(800); }

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];
const results = [];

async function readState() {
  return page.evaluate(() => {
    const openModals = Array.from(document.querySelectorAll('.modal-overlay.active'))
      .filter(m => getComputedStyle(m).display !== 'none').map(m => m.id);
    const activeOnb = document.querySelector('.onb-screen.onb-active');
    return {
      screen: (window.state && state.currentScreen) || null,
      modals: openModals,
      rv8: !!document.getElementById('rv8'),
      onbStep: activeOnb && activeOnb.id,
    };
  });
}

async function appAlive() {
  const t = execSync('adb shell dumpsys activity activities | grep topResumedActivity', { encoding: 'utf8' });
  return t.includes('com.corpusapp.corpus');
}

async function reseed(opts = {}) {
  await page.evaluate((o) => {
    try { localStorage.clear(); } catch(_) {}
    if (!o.onboarding) {
      localStorage.setItem('corpus_onboarding_done','1');
      localStorage.setItem('corpus_walkthrough_done','1');
    }
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang','en');
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:'philosophy', lang:'en',
      completedDays: { 'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,'philosophy-1-4':true,'philosophy-1-5':true },
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home',
      isPaid: !o.freeFree, dailyStreak:12, longestStreak:12,
      chapterCompleteShown:{}, bonusUnlockShown:{'bonus-ch1':true},
      unlockedThinkers:['socrates','plato','aristotle','kant','nietzsche'],
      _debugThinkerPoints:{socrates:12,plato:9,aristotle:6,kant:3,nietzsche:1},
    }));
    window._rvV8_ENABLED = true;
    try { loadState && loadState(); } catch(_) {}
    try { applyTheme && applyTheme(state.subject); } catch(_) {}
    try { setAppLang && setAppLang('en'); } catch(_) {}
    try { renderHome && renderHome(); } catch(_) {}
    // Close any lingering overlay
    document.querySelectorAll('.modal-overlay.active').forEach(m => { m.classList.remove('active'); m.style.display='none'; });
    document.querySelectorAll('.onb-screen.onb-active').forEach(m => { m.classList.remove('onb-active'); m.style.display='none'; });
    const rv8el = document.getElementById('rv8'); if (rv8el) rv8el.remove();
    try { showScreen(o.onboarding ? 'auth' : 'home'); } catch(_) {}
  }, opts);
  await sleep(800);
}

async function run(label, openerFn, opts = {}) {
  console.log(`\n--- ${label} ---`);
  await reseed(opts);
  await openerFn(page);
  await sleep(1500);
  const before = await readState();
  screencap(`${label}-before`);
  await keyBack();
  const after = await readState();
  screencap(`${label}-after`);
  const alive = await appAlive();
  results.push({ label, before, after, alive });
  console.log(`before: ${JSON.stringify(before)}`);
  console.log(`after:  ${JSON.stringify(after)}`);
  console.log(`alive:  ${alive}`);
}

// Scenes
await run('ch6-gift', async p => {
  await p.evaluate(() => { try { _openCh6GiftSheet(); } catch(_){} });
});
await run('paywall', async p => {
  await p.evaluate(() => { try { showPaywall({ reason:'chapter_lock', chapter:2 }); } catch(_){} });
}, { freeFree: true });
await run('reveal', async p => {
  await p.evaluate(() => { try { __corpusPreviewReveal('socrates', 9, { kind:'frame' }); } catch(_){} });
  await p.waitForFunction(() => {
    const c = document.getElementById('rv8-ctas');
    return c && !c.classList.contains('rv8-gated');
  }, { timeout: 15000 }).catch(()=>{});
});
await run('reader', async p => {
  await p.evaluate(() => { try { openReader(1,1); } catch(_){} });
});
await run('pantheon', async p => {
  await p.evaluate(() => { try { showPantheonScreen && showPantheonScreen(); } catch(_){}; const b = document.getElementById('bnav-pantheon'); if (b) b.click(); });
});
await run('onb-step3', async p => {
  await p.evaluate(() => { try { _onbShowStep(3); } catch(_){} });
}, { onboarding: true });
await run('home', async p => {
  await p.evaluate(() => { try { showScreen('home'); } catch(_){} });
});

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));

console.log('\n═══ RESULTS TABLE ═══');
console.log('layer         | before                                | after                                 | alive');
console.log('--------------+---------------------------------------+---------------------------------------+-------');
for (const r of results) {
  const b = `screen=${r.before.screen||'?'} modals=${r.before.modals.join('|')||'-'}${r.before.rv8?' rv8':''}${r.before.onbStep?' '+r.before.onbStep:''}`;
  const a = `screen=${r.after.screen||'?'} modals=${r.after.modals.join('|')||'-'}${r.after.rv8?' rv8':''}${r.after.onbStep?' '+r.after.onbStep:''}`;
  console.log(`${r.label.padEnd(13)} | ${b.padEnd(37)} | ${a.padEnd(37)} | ${r.alive}`);
}

await browser.close();
