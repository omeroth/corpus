// Round 18 follow-up — regression for the quizAnswered reset lifecycle.
// Round 18 item 3 removed the quizAnswered/quizAttempts reset from
// readerGoBack so answered questions stay locked when the user taps Back.
// This test proves the reset still fires at the three places that MUST
// still clear it:
//   A. openReader() — new dialogue opens with no stale answered state.
//   B. _quizSummaryRetry() — Try again on the quiz summary wipes answers.
//   C. Reopening a completed dialogue (via openReader) wipes answers.
// If any of these ever regresses the reader will carry stale lock state
// into a different dialogue — surfacing as questions marked correct/wrong
// before the user touches them.
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
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  const st = { v:3, subject:'philosophy', lang:'en',
    completedDays:{'philosophy-1-1':true,'philosophy-1-2':true},
    framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
    bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
  localStorage.setItem('corpus_state', JSON.stringify(st));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.waitForTimeout(800);

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// Case A: openReader on a FRESH dialogue clears any stale answered state.
{
  const r = await page.evaluate(() => {
    // Seed stale answered state from a previous dialogue.
    state.quizAnswered = { 2: true, '3-0': true };
    state.quizAttempts = { 2: 2, '3-0': 1 };
    // Open dialogue 1-3 (never completed in the seeded state).
    openReader(1, 3);
    return {
      quizAnswered: state.quizAnswered,
      quizAttempts: state.quizAttempts,
      week: state.currentWeek, day: state.currentDay,
    };
  });
  const emptyA = Object.keys(r.quizAnswered).length === 0 && Object.keys(r.quizAttempts).length === 0;
  rec('A. openReader(new dialogue) clears quizAnswered + quizAttempts', emptyA,
    `quizAnswered=${JSON.stringify(r.quizAnswered)} quizAttempts=${JSON.stringify(r.quizAttempts)} week=${r.week} day=${r.day}`);
}

// Case B: _quizSummaryRetry clears quizAnswered + quizAttempts.
{
  const r = await page.evaluate(() => {
    // Pretend we just finished a dialogue's quiz.
    state.currentWeek = 1; state.currentDay = 3;
    state.quizAnswered = { 2: true, 4: true };
    state.quizAttempts = { 2: 1, 4: 2 };
    const key = `${state.subject}-${state.currentWeek}-${state.currentDay}`;
    state.dayQuizResults = { [key]: { 2: { correct: true, attempts: 1 }, 4: { correct: false, attempts: 2 } } };
    // Tap "Try again" on the summary.
    _quizSummaryRetry();
    return {
      quizAnswered: state.quizAnswered,
      quizAttempts: state.quizAttempts,
      // dayQuizFirstTry should carry a snapshot of the pre-retry results.
      firstTry: state.dayQuizFirstTry && state.dayQuizFirstTry[key],
      // currentSection must land on the first quiz section of the dialogue.
      currentSection: state.currentSection,
    };
  });
  const emptyB = Object.keys(r.quizAnswered).length === 0 && Object.keys(r.quizAttempts).length === 0;
  const snapshotKept = r.firstTry && r.firstTry[2] && r.firstTry[4];
  rec('B. _quizSummaryRetry() clears quizAnswered + quizAttempts', emptyB,
    `quizAnswered=${JSON.stringify(r.quizAnswered)} quizAttempts=${JSON.stringify(r.quizAttempts)} section=${r.currentSection}`);
  rec('B. _quizSummaryRetry() snapshots first-try results into dayQuizFirstTry', !!snapshotKept,
    `firstTry=${JSON.stringify(r.firstTry)}`);
}

// Case C: Reopening a COMPLETED dialogue for review (via openReader) also
// clears quizAnswered + quizAttempts. Prior lock state must not leak into
// the review pass — a user reopening a completed dialogue should see the
// questions fresh, not pre-answered.
{
  const r = await page.evaluate(() => {
    // 1-1 and 1-2 are marked completed in the init seed.
    state.quizAnswered = { 2: true, 4: true };
    state.quizAttempts = { 2: 1, 4: 1 };
    openReader(1, 1);  // completed dialogue
    return {
      quizAnswered: state.quizAnswered,
      quizAttempts: state.quizAttempts,
      week: state.currentWeek, day: state.currentDay,
      // completedDays entry still present (openReader must NOT un-complete it).
      stillCompleted: state.completedDays && state.completedDays['philosophy-1-1'] === true,
    };
  });
  const emptyC = Object.keys(r.quizAnswered).length === 0 && Object.keys(r.quizAttempts).length === 0;
  rec('C. openReader(completed dialogue review) clears quizAnswered + quizAttempts', emptyC && r.stillCompleted,
    `quizAnswered=${JSON.stringify(r.quizAnswered)} quizAttempts=${JSON.stringify(r.quizAttempts)} week=${r.week} day=${r.day} stillCompleted=${r.stillCompleted}`);
}

// Case D: After the back-button change (round 18 item 3), readerGoBack
// must NOT reset quizAnswered — this is the negative test guarding
// against the removed line being accidentally restored. If this trips,
// the "answered questions stay locked when I go back" guarantee is gone.
{
  const r = await page.evaluate(() => {
    state.currentWeek = 1; state.currentDay = 1;
    state.currentSection = 3;  // some non-zero section
    state.quizAnswered = { 2: true };
    state.quizAttempts = { 2: 1 };
    readerGoBack();
    return {
      quizAnswered: state.quizAnswered,
      quizAttempts: state.quizAttempts,
      currentSection: state.currentSection,
    };
  });
  const preserved = r.quizAnswered && r.quizAnswered[2] === true && r.quizAttempts && r.quizAttempts[2] === 1;
  const backWalked = r.currentSection < 3;
  rec('D. readerGoBack preserves quizAnswered (answered questions stay locked)',
      preserved && backWalked,
      `quizAnswered=${JSON.stringify(r.quizAnswered)} quizAttempts=${JSON.stringify(r.quizAttempts)} section=${r.currentSection}`);
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
