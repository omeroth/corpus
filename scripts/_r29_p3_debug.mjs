// Debug: measure title block + .rv-pc rects at pre vs post p=3 swap.
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
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.addStyleTag({ content: `body.on-reader-v7 #dc-thinker-screen.rv-v7 .rv-pc { animation: none !important; }` });
await page.evaluate(() => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 3);
});

const dump = async (label, waitMs) => {
  await page.waitForTimeout(waitMs);
  const info = await page.evaluate(() => {
    const el = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return { rect: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`, h: Math.round(r.height), pt: cs.paddingTop, pb: cs.paddingBottom, mt: cs.marginTop };
    };
    const img = document.querySelector('#dc-thinker-screen .rv-pc .rv-art img:not(.rv-frame), #dc-thinker-screen .rv-pc .rv-face img:not(.rv-frame)');
    const imgR = img ? img.getBoundingClientRect() : null;
    return {
      ttlw: el('#dc-thinker-screen .rv-ttlw'),
      t1: el('#dc-thinker-screen .rv-t1'),
      t2: el('#dc-thinker-screen .rv-t2'),
      stage: el('#dc-thinker-screen #rv-stg'),
      pc: el('#dc-thinker-screen .rv-pc'),
      body: el('#dc-thinker-screen .rv-body'),
      imgY: imgR ? Math.round(imgR.top) : null,
      framed: !!document.querySelector('.rv-root.rv-framed'),
      focus: !!document.querySelector('.rv-root.rv-focus'),
      tierCls: (document.querySelector('.rv-pc') || {}).className,
    };
  });
  console.log(`\n[${label}]`);
  for (const [k, v] of Object.entries(info)) console.log(`  ${k} =`, typeof v === 'object' && v && v.rect ? v.rect + '  pt=' + v.pt + ' mt=' + v.mt : v);
};

await dump('pre-swap (initial render)', 1000);
await dump('mid-sequence (orb landing)', 1500);
await dump('post-settled (after frame)', 5000);
await browser.close();
server.close();
