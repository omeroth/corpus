// R29 item 5 verification:
//   (1) _debugThinkerReveal (and __corpusPreviewReveal that wraps it)
//       renders the v7 reveal path (body.on-reader-v7 set, the v7
//       markup .rv-root is mounted, no legacy pre-v7 Fly/Forge
//       cream-background screen appears).
//   (2) Calling it does not change saved progress — thinker points,
//       xp, completedDays, state.unlockedThinkers, state._debugThinker-
//       Points all equal before vs. after.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const server = (() => {
  const s = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(WWW, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return s;
})();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  // Debug flag so __corpusPreviewReveal passes its gate.
  localStorage.setItem('_corpus_debug', '1');
  // Seed a known-good state: Socrates has 2 completed days (plain
  // tier, 2/3 toward bronze); 180 XP; non-empty unlockedThinkers.
  const cd = { 'philosophy-1-1': true, 'philosophy-1-2': true };
  const persistState = {
    v: 3, subject: 'philosophy', lang: 'en',
    completedDays: cd,
    xp: 180,
    unlockedThinkers: ['socrates'],
    framesExplainerSeen: true, framesOwlBeatSeen: true, streakIntroSeen: true,
    bonusUnlockShown: {}, dailyStreak: 2, currentScreen: 'home', isPaid: true,
  };
  localStorage.setItem('corpus_state', JSON.stringify(persistState));
});
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

// Snapshot before — read from in-memory state AND from localStorage.
const before = await page.evaluate(() => {
  return {
    ls: localStorage.getItem('corpus_state'),
    inMemXp: state.xp,
    inMemCompleted: Object.keys(state.completedDays || {}).sort().join(','),
    inMemUnlocked: (state.unlockedThinkers || []).slice().sort().join(','),
    inMemDbgPts: state._debugThinkerPoints ? JSON.stringify(state._debugThinkerPoints) : null,
    thinkerPointsSocrates: typeof thinkerPoints === 'function' ? thinkerPoints('socrates') : 'no-fn',
    bodyOnReaderV7: document.body.classList.contains('on-reader-v7'),
  };
});

// Call __corpusPreviewReveal — bronze-boundary (p=3).
const result = await page.evaluate(() => {
  return window.__corpusPreviewReveal('socrates', 3, { kind: 'frame' });
});

// Wait for v7 render — look for .rv-root inside #dc-thinker-screen,
// plus the body.on-reader-v7 class.
await page.waitForTimeout(500);
const during = await page.evaluate(() => {
  const dc = document.getElementById('dc-thinker-screen');
  return {
    bodyOnReaderV7: document.body.classList.contains('on-reader-v7'),
    dcHasRvV7: dc ? dc.classList.contains('rv-v7') : null,
    rvRootPresent: !!document.querySelector('#dc-thinker-screen .rv-root'),
    rvRootHasMb: !!document.querySelector('#dc-thinker-screen .rv-root .corpus-mb'),
    // Any pre-v7 cream-screen markers would be #thinker-unlock-box or
    // the legacy "Back to Home / Share this card" buttons.
    legacyUnlockBox: !!document.getElementById('thinker-unlock-box'),
  };
});

// Snapshot after — same reads.
const after = await page.evaluate(() => {
  return {
    ls: localStorage.getItem('corpus_state'),
    inMemXp: state.xp,
    inMemCompleted: Object.keys(state.completedDays || {}).sort().join(','),
    inMemUnlocked: (state.unlockedThinkers || []).slice().sort().join(','),
    inMemDbgPts: state._debugThinkerPoints ? JSON.stringify(state._debugThinkerPoints) : null,
    thinkerPointsSocrates: typeof thinkerPoints === 'function' ? thinkerPoints('socrates') : 'no-fn',
  };
});

const bytesEqual = before.ls === after.ls;
const memEqual =
  before.inMemXp === after.inMemXp
  && before.inMemCompleted === after.inMemCompleted
  && before.inMemUnlocked === after.inMemUnlocked
  && before.inMemDbgPts === after.inMemDbgPts
  && before.thinkerPointsSocrates === after.thinkerPointsSocrates;

console.log('[call] __corpusPreviewReveal(\"socrates\", 3, {kind:\"frame\"}) →', JSON.stringify(result));
console.log('[during] body.on-reader-v7 =', during.bodyOnReaderV7, '| #dc.rv-v7 =', during.dcHasRvV7, '| .rv-root present =', during.rvRootPresent, '| .corpus-mb inside =', during.rvRootHasMb, '| legacy #thinker-unlock-box =', during.legacyUnlockBox);
console.log('\n(1) v7 reveal path (not pre-v7 cream screen)');
console.log('    body.on-reader-v7 =', during.bodyOnReaderV7, '    →', during.bodyOnReaderV7 ? 'PASS' : 'FAIL');
console.log('    #dc-thinker-screen.rv-v7 =', during.dcHasRvV7, '  →', during.dcHasRvV7 ? 'PASS' : 'FAIL');
console.log('    .rv-root mounted =', during.rvRootPresent, '      →', during.rvRootPresent ? 'PASS' : 'FAIL');
console.log('    (sanity) legacy unlock box present? ', during.legacyUnlockBox);

console.log('\n(2) Saved progress unchanged');
console.log('    localStorage[corpus_state] byte-equal? ', bytesEqual ? 'YES (PASS)' : 'NO (FAIL)');
console.log('    before:');
console.log('      xp =', before.inMemXp);
console.log('      completedDays =', before.inMemCompleted);
console.log('      unlockedThinkers =', before.inMemUnlocked);
console.log('      state._debugThinkerPoints =', before.inMemDbgPts);
console.log('      thinkerPoints(\"socrates\") =', before.thinkerPointsSocrates);
console.log('    after:');
console.log('      xp =', after.inMemXp);
console.log('      completedDays =', after.inMemCompleted);
console.log('      unlockedThinkers =', after.inMemUnlocked);
console.log('      state._debugThinkerPoints =', after.inMemDbgPts);
console.log('      thinkerPoints(\"socrates\") =', after.thinkerPointsSocrates);
console.log('    in-memory equal? ', memEqual ? 'YES (PASS)' : 'NO (FAIL)');

await browser.close();
server.close();
