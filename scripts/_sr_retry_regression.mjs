// Streak-repair retry regression (round 15).
// Verifies the one-retry-per-question rule:
//   1. First wrong answer:    rtry=1, option goes faded+locked, hint shows.
//   2. Second wrong (same q): rtry→0, final-reveal + jump straight to fail.
//   3. First wrong then correct: advances to next question, correctCount++.
//   4. All 3 correct (first try): win.
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

async function fresh() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    const st = { v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home' };
    localStorage.setItem('corpus_state', JSON.stringify(st));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    // Seed the repair flow with 3 synthetic questions. Each has 3 options,
    // correctIndex=1. _displayCorrect is cached so handleRepairAnswer uses
    // index 1 as the right answer slot.
    _repairFlow.info = { priorStreak: 5, daysSinceBreak: 1, brokenAt: '2026-10-24' };
    _repairFlow.active = true;
    _repairFlow.attempt = 1;
    _repairFlow.currentIdx = 0;
    _repairFlow.correctCount = 0;
    _repairFlow.rtry = 0;
    _repairFlow.questions = [1,2,3].map((n) => ({
      question: 'Q' + n,
      options: ['A', 'B', 'C'],
      correctIndex: 1,
      _perm: [0, 1, 2],
      _displayCorrect: 1,
    }));
    _renderRepairQuestion();
  });
  await page.waitForTimeout(300);
  return { ctx, page };
}

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// Case A: first wrong answer → retry hint shows, rtry=1
{
  const { ctx, page } = await fresh();
  await page.evaluate(() => handleRepairAnswer(0));  // wrong
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => ({
    rtry: _repairFlow.rtry,
    hintOn: document.getElementById('rp-hint')?.classList.contains('rp-hint-on'),
    optFaded: document.querySelectorAll('.rp-opt')[0]?.classList.contains('rp-faded'),
    optLocked: document.querySelectorAll('.rp-opt')[0]?.classList.contains('rp-locked'),
    stillOnQuestion: _repairFlow.currentIdx === 0,
  }));
  rec('A. first wrong → hint + faded + locked + stay on Q', r.rtry === 1 && r.hintOn && r.optFaded && r.optLocked && r.stillOnQuestion, JSON.stringify(r));
  await ctx.close();
}

// Case B: first wrong then correct → advance to Q2, correctCount=1
{
  const { ctx, page } = await fresh();
  await page.evaluate(() => handleRepairAnswer(0));  // wrong
  await page.waitForTimeout(500);
  await page.evaluate(() => handleRepairAnswer(1));  // correct
  await page.waitForTimeout(1300);
  const r = await page.evaluate(() => ({
    currentIdx: _repairFlow.currentIdx,
    correctCount: _repairFlow.correctCount,
    rtry: _repairFlow.rtry,
  }));
  rec('B. wrong → correct → advance to Q2, correctCount=1', r.currentIdx === 1 && r.correctCount === 1 && r.rtry === 0, JSON.stringify(r));
  await ctx.close();
}

// Case C: wrong → wrong (same Q) → fail screen
{
  const { ctx, page } = await fresh();
  await page.evaluate(() => handleRepairAnswer(0));  // wrong 1
  await page.waitForTimeout(500);
  await page.evaluate(() => handleRepairAnswer(2));  // wrong 2 (different wrong option)
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({
    hasFailHero: !!document.querySelector('.rp-hero-flame.rp-out'),
    hasFailTitle: !!document.querySelector('h2.pop-cel-h'),
    currentIdx: _repairFlow.currentIdx,
  }));
  rec('C. wrong → wrong (same Q) → fail screen', r.hasFailHero, JSON.stringify(r));
  await ctx.close();
}

// Case D: all 3 correct (first try) → win screen
{
  const { ctx, page } = await fresh();
  await page.evaluate(() => handleRepairAnswer(1));  // correct Q1
  await page.waitForTimeout(1300);
  await page.evaluate(() => handleRepairAnswer(1));  // correct Q2
  await page.waitForTimeout(1300);
  await page.evaluate(() => handleRepairAnswer(1));  // correct Q3
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({
    hasWinHero: !!document.querySelector('.rp-hero-flame.rp-relit'),
    correctCount: _repairFlow.correctCount,
  }));
  rec('D. all 3 correct → win screen', r.hasWinHero && r.correctCount === 3, JSON.stringify(r));
  await ctx.close();
}

await browser.close(); app.server.close();
console.log('\n═══ Streak-repair retry regression ═══');
for (const r of results) console.log((r.pass ? ' ✓ ' : ' ✗ ') + r.name);
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
