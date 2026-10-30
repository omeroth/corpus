// R41 D items 1 + 2 — visual verification shots.
// Item 1: paywall savings badge as a corner tab.
// Item 2: stats screen Share | Home row.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41d-sim';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });

async function shoot({ device, lang, theme, item }) {
  const viewport = device === 'SE' ? { width: 375, height: 667 } : { width: 393, height: 852 };
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:false, dailyStreak: 3, xp: 67 }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  if (theme === 'dark') await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.addStyleTag({ content: ':root { --safe-top: 59px; --safe-bottom: 34px; }' });

  if (item === 'paywall') {
    await page.evaluate(() => {
      showPaywall({ subject: 'philosophy', weekId: 2, dayId: 1, source: 'chapter-lock-tap', entry: 'home_card' });
    });
    await page.waitForSelector('#modal-paywall.active', { timeout: 3000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/item1-paywall-${device}-${lang}-${theme}.png`, fullPage: false });
    // Zoomed badge crop.
    const rect = await page.evaluate(() => {
      const b = document.querySelector('#modal-paywall .paywall-yearly-badge');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: Math.max(0, r.left - 20), y: Math.max(0, r.top - 20), width: 120, height: 50 };
    });
    if (rect) await page.screenshot({ path: `${OUT}/item1-badge-crop-${device}-${lang}-${theme}.png`, clip: rect });
  }

  if (item === 'stats') {
    await page.evaluate((l) => {
      document.body.classList.add('on-reader-v7');
      document.body.classList.add('reader-editorial');
      state.currentWeek = 1; state.currentDay = 2;
      _showDcStats(
        l === 'en' ? 'Perfect dialogue!' : 'דיאלוג מושלם!',
        l === 'en' ? 'The Examined Life' : 'החיים הראויים לחקירה',
        67, 3,
        { fn: closeCompleteModal }, {}
      );
      const m = document.getElementById('modal-complete');
      if (m) m.classList.add('active');
    }, lang);
    // Wait past the dc-fade-up (2.6s) + XP count-up (0.8s + 0.9s).
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${OUT}/item2-stats-${device}-${lang}-${theme}.png`, fullPage: false });
  }

  await ctx.close();
}

const matrix = [];
for (const device of ['SE', '393']) {
  for (const lang of ['en', 'he']) {
    matrix.push({ device, lang, theme: 'light', item: 'paywall' });
  }
}
for (const lang of ['en', 'he']) {
  for (const theme of ['light', 'dark']) {
    matrix.push({ device: '393', lang, theme, item: 'stats' });
  }
}
for (const cfg of matrix) {
  console.log('shooting:', cfg);
  await shoot(cfg);
}

await browser.close(); app.s.close();
console.log('done.');
