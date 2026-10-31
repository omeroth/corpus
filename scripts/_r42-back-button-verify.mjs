// R42 Android back-button verification: fresh state per scene, open the
// layer, screencap before, press BACK, screencap after, read current
// state. Report a table.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/android-back-verify';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
function screencap(name) { execSync(`adb exec-out screencap -p > ${OUT}/${name}.png`, { stdio: 'ignore' }); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function keyBack() { execSync('adb shell input keyevent 4', { stdio: 'ignore' }); await sleep(700); }

async function readState(page) {
  return page.evaluate(() => {
    const openModals = Array.from(document.querySelectorAll('.modal-overlay.active'))
      .filter(m => getComputedStyle(m).display !== 'none').map(m => m.id);
    const rv8 = !!document.getElementById('rv8');
    const activeOnb = document.querySelector('.onb-screen.onb-active');
    return {
      screen: (window.state && state.currentScreen) || null,
      modals: openModals,
      rv8,
      onbStep: activeOnb && activeOnb.id,
    };
  });
}

async function freshState(page, lang = 'en', opts = {}) {
  await page.evaluate(({ l, o }) => {
    try { localStorage.clear(); } catch(_) {}
    if (!o.onboarding) {
      localStorage.setItem('corpus_onboarding_done','1');
      localStorage.setItem('corpus_walkthrough_done','1');
    }
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:'philosophy', lang:l,
      completedDays: { 'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,'philosophy-1-4':true,'philosophy-1-5':true },
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid: !o.freeFree,
      dailyStreak:12, longestStreak:12,
      chapterCompleteShown:{}, bonusUnlockShown:{'bonus-ch1':true},
      unlockedThinkers:['socrates','plato','aristotle','kant','nietzsche'],
      _debugThinkerPoints:{socrates:12,plato:9,aristotle:6,kant:3,nietzsche:1},
    }));
    window._rvV8_ENABLED = true;
    try { loadState && loadState(); } catch(_) {}
    try { applyTheme && applyTheme(state.subject); } catch(_) {}
    try { setAppLang && setAppLang(l); } catch(_) {}
    try { renderHome && renderHome(); } catch(_) {}
    try { showScreen && showScreen(o.onboarding ? 'auth' : 'home'); } catch(_) {}
    // dismiss welcome-back if it fires
    try { closeWelcomeBackModal && closeWelcomeBackModal(); } catch(_) {}
    const wb = document.getElementById('welcome-back-modal');
    if (wb) { wb.classList.remove('active'); wb.style.display='none'; }
  }, { l: lang, o: opts });
}

async function setup() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = browser.contexts()[0].pages()[0];
  return { browser, page };
}

const results = [];

async function run(label, openerFn, opts = {}) {
  // Terminate + relaunch for fresh state
  execSync('adb shell am force-stop com.corpusapp.corpus', { stdio: 'ignore' });
  await sleep(500);
  execSync('adb shell am start -n com.corpusapp.corpus/.MainActivity', { stdio: 'ignore' });
  await sleep(4000);
  const pid = execSync('adb shell pidof com.corpusapp.corpus', { encoding:'utf8' }).trim();
  execSync('adb forward --remove tcp:9222', { stdio: 'ignore' });
  execSync(`adb forward tcp:9222 localabstract:webview_devtools_remote_${pid}`, { stdio: 'ignore' });
  await sleep(500);
  const { browser, page } = await setup();

  console.log(`\n--- ${label} ---`);
  await freshState(page, 'en', opts);
  await sleep(600);
  await openerFn(page);
  await sleep(1200);
  const before = await readState(page);
  screencap(`${label}-before`);
  await keyBack();
  const after = await readState(page);
  screencap(`${label}-after`);
  // Also check app still alive after BACK
  const alive = execSync('adb shell dumpsys activity activities | grep topResumedActivity', { encoding:'utf8' });
  const stillAlive = alive.includes('com.corpusapp.corpus');
  results.push({ label, before, after, stillAlive });
  console.log('before:', JSON.stringify(before));
  console.log('after: ', JSON.stringify(after));
  console.log('alive: ', stillAlive);
  await browser.close();
}

// 1. ch6 gift sheet
await run('ch6-gift', async p => {
  await p.evaluate(() => { try { _openCh6GiftSheet(); } catch(_){} });
});
// 2. paywall
await run('paywall', async p => {
  await p.evaluate(() => { try { showPaywall({ reason:'chapter_lock', chapter:2 }); } catch(_){} });
}, { freeFree: true });
// 3. reveal (settled, not mid-animation)
await run('reveal', async p => {
  await p.evaluate(() => { try { __corpusPreviewReveal('socrates', 9, { kind:'frame' }); } catch(_){} });
  await p.waitForFunction(() => {
    const c = document.getElementById('rv8-ctas');
    return c && !c.classList.contains('rv8-gated');
  }, { timeout: 15000 }).catch(()=>{});
});
// 4. reader
await run('reader', async p => {
  await p.evaluate(() => { try { openReader(1,1); } catch(_){} });
});
// 5. Pantheon
await run('pantheon', async p => {
  await p.evaluate(() => { const b = document.getElementById('bnav-pantheon'); if (b) b.click(); });
});
// 6. onboarding step 3
await run('onb-step3', async p => {
  await p.evaluate(() => { try { _onbShowStep(3); } catch(_){} });
}, { onboarding: true });
// 7. home → minimize
await run('home', async p => {
  await p.evaluate(() => { try { showScreen('home'); } catch(_){} });
});

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log('\n=== DONE ===');
for (const r of results) {
  console.log(`${r.label.padEnd(14)}  BEFORE screen=${r.before.screen||'?'} modals=${r.before.modals.join('|')||'(none)'} rv8=${r.before.rv8}  →  AFTER screen=${r.after.screen||'?'} modals=${r.after.modals.join('|')||'(none)'} rv8=${r.after.rv8}  alive=${r.stillAlive}`);
}
