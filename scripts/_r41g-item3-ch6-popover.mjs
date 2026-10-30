// R41g Finding 3 — verify ch6 gift path lands on a popover that sits
// BELOW the sticky chapter header, not clipped under it.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41g';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(n,p,note='') { results.push({n,p,note}); console.log((p?'[PASS] ':'[FAIL] ')+n+(note?' — '+note:'')); }

async function run(lang, theme, scenario) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    try { localStorage.clear(); } catch(_) {}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:false, ch6GiftSheetSeen:false }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  if (theme === 'dark') await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });

  if (scenario === 'gift-to-ch6') {
    // Open ch6 gift sheet, click "See the chapter".
    await page.evaluate(() => { _openCh6GiftSheet(); });
    await page.waitForSelector('#modal-ch6-gift.active', { timeout: 3000 });
    await page.waitForTimeout(400);
    await page.evaluate(() => { document.querySelector('#modal-ch6-gift [data-act="see"]').click(); });
    await page.waitForTimeout(1200); // scroll + popover open
  } else if (scenario === 'normal-node-tap') {
    // Normal flow: scroll past ch1 banner then tap a lesson node just
    // below ch1's sticky banner (where the popover might clip without
    // the auto-scroll fix).
    await page.evaluate(() => {
      // Scroll so ch1 banner docks under topbar.
      window.scrollTo({ top: 100, behavior: 'auto' });
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const node = document.querySelector('.hv-node-nextup') || document.querySelector('.hv-node');
      if (node) node.click();
    });
    await page.waitForTimeout(800);
  }

  // Measure: popover top vs sticky chapter banner bottom.
  const geo = await page.evaluate(() => {
    const pop = document.getElementById('hv-popover');
    const popRect = pop && pop.style.display !== 'none' ? pop.getBoundingClientRect() : null;
    // Find all sticky chapter banners currently docked near the top.
    const banners = Array.from(document.querySelectorAll('.hv-chapter > .level-card'))
      .map(b => b.getBoundingClientRect())
      .filter(r => r.top < 150); // likely docked under topbar
    const banner = banners.length ? banners[banners.length - 1] : null;
    return {
      popTop: popRect && popRect.top,
      popBottom: popRect && popRect.bottom,
      popDisplay: pop && getComputedStyle(pop).display,
      bannerBottom: banner && banner.bottom,
      bannerTop: banner && banner.top,
    };
  });

  const label = `${lang}-${theme}-${scenario}`;
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });

  if (geo.popTop == null) {
    rec(`${label}: popover is visible`, false, JSON.stringify(geo));
  } else {
    const bannerBottom = geo.bannerBottom || 0;
    const gap = geo.popTop - bannerBottom;
    rec(`${label}: popover top ≥ sticky banner bottom + 12px (actual gap=${Math.round(gap)}px)`,
        gap >= 10, JSON.stringify(geo));
  }
  await ctx.close();
}

for (const lang of ['en', 'he']) {
  await run(lang, 'light', 'gift-to-ch6');
  await run(lang, 'light', 'normal-node-tap');
}
await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
