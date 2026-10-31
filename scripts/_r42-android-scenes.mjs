// R42 Android smoke — Debug APK, one emulator (API 36), CDP + adb screencap.
// Scenes: onboarding first + step 21 first-card, home, reader, quiz,
// summary, reveal, Pantheon, streak, paywall, ch6 gift. EN + HE, light.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/android-r42';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
function screencap(name) { execSync(`adb exec-out screencap -p > ${OUT}/${name}.png`, { stdio: 'ignore' }); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];
let page = ctx.pages()[0];
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', e => consoleErrors.push('PAGEERR: ' + e.message));

async function seed(lang, body) {
  await page.evaluate(({ l, b }) => {
    try { localStorage.clear(); } catch(_) {}
    const o = JSON.parse(b);
    for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v);
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_appearance', 'light');
    window._rvV8_ENABLED = true;
    try { loadState && loadState(); } catch(_) {}
    try { applyTheme && applyTheme(state.subject); } catch(_) {}
    try { setAppLang && setAppLang(l); } catch(_) {}
    try { renderHome && renderHome(); } catch(_) {}
    try { showScreen && showScreen('home'); } catch(_) {}
  }, { l: lang, b: JSON.stringify(body) });
}

async function paidPhilosophy(lang) {
  const today = new Date();
  const activeDates = []; for (let i=0;i<12;i++){const d=new Date(today);d.setDate(today.getDate()-i);activeDates.push(d.toISOString().slice(0,10));}
  const cd = {}; for (let d=1;d<=5;d++) cd[`philosophy-1-${d}`] = true;
  await seed(lang, {
    corpus_onboarding_done:'1', corpus_walkthrough_done:'1', corpus_subject:'philosophy',
    corpus_state: JSON.stringify({
      v:3, subject:'philosophy', lang, completedDays:cd,
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:true,
      dailyStreak:12, longestStreak:12, activeDates, lastStreakShownDate:activeDates[0],
      chapterCompleteShown:{}, bonusUnlockShown:{'bonus-ch1':true},
      unlockedThinkers:['socrates','plato','aristotle','kant','nietzsche'],
      _debugThinkerPoints:{socrates:12,plato:9,aristotle:6,kant:3,nietzsche:1},
    }),
  });
}
async function freshFree(lang) {
  await seed(lang, {
    corpus_subject:'philosophy',
    corpus_state: JSON.stringify({ v:3, subject:'philosophy', lang, completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'auth', isPaid:false, unlockedThinkers:[] }),
  });
}
async function dismissWelcomeBack() {
  await page.evaluate(() => {
    try { closeWelcomeBackModal && closeWelcomeBackModal(); } catch(_) {}
    const wb = document.getElementById('welcome-back-modal');
    if (wb) { wb.classList.remove('active'); wb.style.display='none'; }
  });
}

for (const lang of ['en','he']) {
  const T = lang;

  // 1a. Onboarding first (welcome)
  await freshFree(lang);
  await page.evaluate(() => { try { _onbShowStep(1); } catch(_){} });
  await sleep(900);
  screencap(`${T}-01a-onb-welcome`);

  // 1b. Step 21 "Your first thinker"
  await page.evaluate(() => { try { _onbShowStep(21); } catch(_){} });
  await sleep(900);
  screencap(`${T}-01b-onb-first-thinker`);

  // 2. Home
  await paidPhilosophy(lang);
  await dismissWelcomeBack();
  screencap(`${T}-02-home`);

  // 3a. Reader
  await page.evaluate(() => { try { openReader(1,1); } catch(_){} });
  await sleep(1800);
  screencap(`${T}-03a-reader`);

  // 3b. Quiz — advance to quiz section
  for (let i=0;i<10;i++) {
    const atQuiz = await page.evaluate(() => !!document.querySelector('.quiz-option'));
    if (atQuiz) break;
    await page.evaluate(() => { const nb = document.getElementById('reader-next-btn'); if (nb && nb.offsetParent) nb.click(); });
    await sleep(600);
  }
  await sleep(500);
  screencap(`${T}-03b-quiz`);

  // 4. Summary — jump straight to dc-stats via _showDcStats
  await paidPhilosophy(lang);
  await dismissWelcomeBack();
  await page.evaluate(() => {
    state.currentWeek = 1; state.currentDay = 1; state.quizAttempts = {}; state.readerXP = 50;
    document.body.classList.add('on-reader-v7');
    const modal = document.getElementById('modal-complete'); if (modal) modal.classList.add('active');
    try { _showDcStats('Dialogue complete!', 'What makes a question moral?', 50, state.dailyStreak||12, { label:'Next Dialogue', fn:()=>{} }, {}); } catch(_){}
  });
  await sleep(1200);
  screencap(`${T}-04-summary`);

  // 5. Reveal (frame upgrade)
  await paidPhilosophy(lang);
  await dismissWelcomeBack();
  await page.evaluate(() => { try { __corpusPreviewReveal('socrates', 9, { kind:'frame' }); } catch(_){} });
  await page.waitForFunction(() => {
    const c = document.getElementById('rv8-ctas');
    return c && !c.classList.contains('rv8-gated');
  }, { timeout: 15000 }).catch(() => {});
  await sleep(1500);
  screencap(`${T}-05-reveal`);

  // 6. Pantheon
  await paidPhilosophy(lang);
  await dismissWelcomeBack();
  await page.evaluate(() => { const b = document.getElementById('bnav-pantheon'); if (b) b.click(); else try { showPantheonScreen(); } catch(_){} });
  await sleep(1500);
  screencap(`${T}-06-pantheon`);

  // 7. Streak
  await page.evaluate(() => { const b = document.getElementById('bnav-streak'); if (b) b.click(); else try { showStreakScreen(); } catch(_){} });
  await sleep(1500);
  screencap(`${T}-07-streak`);

  // 8. Paywall
  await paidPhilosophy(lang);
  await page.evaluate(() => {
    try { const s = JSON.parse(localStorage.corpus_state); s.isPaid = false; localStorage.corpus_state = JSON.stringify(s); loadState && loadState(); } catch(_) {}
  });
  await page.evaluate(() => { try { showPaywall({ reason:'chapter_lock', chapter: 2 }); } catch(_){} });
  await sleep(1200);
  screencap(`${T}-08-paywall`);

  // 9. Ch6 gift
  await paidPhilosophy(lang);
  await dismissWelcomeBack();
  await page.evaluate(() => { try { _openCh6GiftSheet(); } catch(_){} });
  await sleep(1200);
  screencap(`${T}-09-ch6-gift`);
}

// Back-button sanity
console.log('\n=== Back button ===');
const backTests = [];
async function keyBack() { execSync('adb shell input keyevent 4', { stdio: 'ignore' }); await sleep(600); }
async function appAlive() {
  const t = execSync(`adb shell dumpsys activity activities | grep topResumedActivity`, { encoding: 'utf8' });
  return t.includes('com.corpusapp.corpus');
}
async function test(name, setup) {
  await setup();
  await sleep(600);
  await keyBack();
  const alive = await appAlive();
  const screen = await page.evaluate(() => state && state.currentScreen);
  backTests.push({ name, alive, screen });
  screencap(`back-${name}`);
  console.log(`${name}: alive=${alive} screen=${screen}`);
}
await paidPhilosophy('en'); await dismissWelcomeBack();
await test('reader', async () => { await page.evaluate(() => { try { openReader(1,1); } catch(_){} }); });
await test('reveal', async () => { await page.evaluate(() => { try { __corpusPreviewReveal('socrates', 9, {kind:'frame'}); } catch(_){} }); await sleep(2000); });
await test('ch6-gift', async () => { await page.evaluate(() => { try { _openCh6GiftSheet(); } catch(_){} }); });
await test('paywall', async () => { await page.evaluate(() => { try { showPaywall({ reason:'chapter_lock', chapter:2 }); } catch(_){} }); });
await test('pantheon', async () => { await page.evaluate(() => { const b = document.getElementById('bnav-pantheon'); if (b) b.click(); }); await sleep(1200); });
await test('home', async () => { await page.evaluate(() => { try { showScreen('home'); } catch(_){} }); });

writeFileSync(`${OUT}/findings.json`, JSON.stringify({ backTests, consoleErrorsCount: consoleErrors.length, consoleErrors: consoleErrors.slice(0,30) }, null, 2));
await browser.close();
console.log(`\ndone — screens written to ${OUT}, ${consoleErrors.length} console errors`);
