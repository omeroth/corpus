// 28 debug — inspect why the ungate isn't firing on animated p=2.
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
page.on('console', msg => console.log('[page]', msg.text()));
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });

// Verify helper exists
const helperExists = await page.evaluate(() => typeof _rvV7UngateCta);
console.log('typeof _rvV7UngateCta =', helperExists);

// Patch _rvV7UngateCta to log every call.
await page.evaluate(() => {
  const orig = window._rvV7UngateCta;
  window._rvV7UngateCta = function(tier) {
    const dc = document.getElementById('dc-thinker-screen');
    const cta = dc && dc.querySelector('.rd-cta');
    console.log('[ungate] called tier=' + tier + ' hasCta=' + !!cta + ' isGated=' + (cta ? cta.classList.contains('rv-cta-gated') : 'n/a'));
    return orig.call(this, tier);
  };
  // Patch _rvV7Gen bumping to log.
  const origSet = Object.getOwnPropertyDescriptor(window, '_rvV7Gen');
  console.log('[init] _rvV7Gen=' + window._rvV7Gen);
});

await page.evaluate(() => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 2);
});

// Poll state every 500ms for 5s
for (let t = 500; t <= 5000; t += 500) {
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => {
    const cta = document.querySelector('#dc-thinker-screen .rd-cta');
    const dc = document.getElementById('dc-thinker-screen');
    const stg = document.getElementById('rv-stg');
    return cta ? {
      cls: cta.className,
      opacity: getComputedStyle(cta.querySelector('.rd-btn-primary')).opacity,
      gen: window._rvV7Gen,
      stgConnected: stg ? stg.isConnected : 'no-stg',
      dcConnected: dc ? dc.isConnected : 'no-dc',
      orbs: document.querySelectorAll('.rv-orb').length,
    } : 'no-cta';
  });
  console.log(`[t=${t}ms]`, JSON.stringify(s));
}

await browser.close();
server.close();
