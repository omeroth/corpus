// R39 Part 1 — gift tile stacks above the jump button when jump
// visible; drops into jump's slot when jump hidden. Caption pill
// stays clear of both tiles. Checks on 393 and SE × EN + HE.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/ch6-free/r39';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.json':'application/json; charset=utf-8' };
function srv(root) {
  const s = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p==='/'||p==='') p='/index.html';
      const abs = join(root, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => s.listen(0, '127.0.0.1', () => r({ s, port: s.address().port })));
}
function intersects(a, b) { return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(n, p, note='') { results.push({ n, p, note }); console.log((p?'[PASS] ':'[FAIL] ')+n+(note?' — '+note:'')); }

async function run(device, lang) {
  const ctx = await browser.newContext({ viewport: { width: device.w, height: device.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:'philosophy',lang:l,completedDays:{},framesExplainerSeen:true,streakIntroSeen:true,currentScreen:'home',isPaid:false}));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.waitForSelector('#ch6-gift-btn', { timeout: 5000 });

  // Scroll to top first — jump button hidden (next-up visible).
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const scenarioA = await page.evaluate(() => {
    const g = document.getElementById('ch6-gift-btn');
    const j = document.getElementById('hv-jump');
    const c = document.getElementById('ch6-gift-caption');
    return {
      jumpDisplay: j ? getComputedStyle(j).display : null,
      jumpRect: j && getComputedStyle(j).display !== 'none' ? j.getBoundingClientRect().toJSON() : null,
      giftRect: g ? g.getBoundingClientRect().toJSON() : null,
      capRect: c ? c.getBoundingClientRect().toJSON() : null,
      vw: window.innerWidth, vh: window.innerHeight,
    };
  });
  const labelA = `${device.name} ${lang} JUMP HIDDEN (scrollTop)`;
  rec(`${labelA}: jump is hidden`, scenarioA.jumpDisplay === 'none');
  rec(`${labelA}: gift inside viewport`, scenarioA.giftRect.left >= 0 && scenarioA.giftRect.right <= scenarioA.vw && scenarioA.giftRect.bottom <= scenarioA.vh);
  rec(`${labelA}: gift above bottom nav`, scenarioA.giftRect.bottom < scenarioA.vh - 60);
  await page.screenshot({ path: `${OUT}/${device.name}-${lang}-jumpHidden.png`, fullPage: false });

  // Now scroll down so the next-up node is below the fold → jump button appears.
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(600);
  const scenarioB = await page.evaluate(() => {
    const g = document.getElementById('ch6-gift-btn');
    const j = document.getElementById('hv-jump');
    const c = document.getElementById('ch6-gift-caption');
    return {
      jumpDisplay: j ? getComputedStyle(j).display : null,
      jumpRect: j && getComputedStyle(j).display !== 'none' ? j.getBoundingClientRect().toJSON() : null,
      giftRect: g ? g.getBoundingClientRect().toJSON() : null,
      capRect: c ? c.getBoundingClientRect().toJSON() : null,
      vw: window.innerWidth, vh: window.innerHeight,
    };
  });
  const labelB = `${device.name} ${lang} JUMP VISIBLE (scrolled)`;
  rec(`${labelB}: jump is visible`, scenarioB.jumpDisplay && scenarioB.jumpDisplay !== 'none');
  if (scenarioB.jumpRect) {
    const gap = scenarioB.jumpRect.top - scenarioB.giftRect.bottom;
    rec(`${labelB}: gift stacks ABOVE jump`, scenarioB.giftRect.bottom <= scenarioB.jumpRect.top + 0.5, `giftBottom=${scenarioB.giftRect.bottom.toFixed(1)} jumpTop=${scenarioB.jumpRect.top.toFixed(1)}`);
    rec(`${labelB}: gap between gift & jump ≈ 12px`, gap >= 10 && gap <= 16, `gap=${gap.toFixed(1)}`);
    rec(`${labelB}: gift & jump do not intersect`, !intersects(scenarioB.giftRect, scenarioB.jumpRect));
    rec(`${labelB}: gift & jump in same column`, Math.abs((scenarioB.giftRect.left + scenarioB.giftRect.right)/2 - (scenarioB.jumpRect.left + scenarioB.jumpRect.right)/2) < 2, `giftCx=${((scenarioB.giftRect.left+scenarioB.giftRect.right)/2).toFixed(1)} jumpCx=${((scenarioB.jumpRect.left+scenarioB.jumpRect.right)/2).toFixed(1)}`);
  }
  rec(`${labelB}: gift inside viewport`, scenarioB.giftRect.left >= 0 && scenarioB.giftRect.right <= scenarioB.vw && scenarioB.giftRect.bottom <= scenarioB.vh);
  if (scenarioB.capRect && scenarioB.jumpRect) {
    rec(`${labelB}: caption does NOT intersect jump`, !intersects(scenarioB.capRect, scenarioB.jumpRect));
  }
  if (scenarioB.capRect) {
    rec(`${labelB}: caption does NOT intersect gift`, !intersects(scenarioB.capRect, scenarioB.giftRect));
  }
  await page.screenshot({ path: `${OUT}/${device.name}-${lang}-jumpVisible.png`, fullPage: false });

  // Both buttons must stay clickable (not covered by other button).
  if (scenarioB.jumpRect) {
    const bothTappable = await page.evaluate(() => {
      const g = document.getElementById('ch6-gift-btn');
      const j = document.getElementById('hv-jump');
      // Elements from point at each tile center.
      const gr = g.getBoundingClientRect(), jr = j.getBoundingClientRect();
      const gEl = document.elementFromPoint((gr.left+gr.right)/2, (gr.top+gr.bottom)/2);
      const jEl = document.elementFromPoint((jr.left+jr.right)/2, (jr.top+jr.bottom)/2);
      return {
        giftHit: gEl === g || g.contains(gEl),
        jumpHit: jEl === j || j.contains(jEl),
      };
    });
    rec(`${labelB}: gift tappable (hit test)`, bothTappable.giftHit);
    rec(`${labelB}: jump tappable (hit test)`, bothTappable.jumpHit);
  }

  await ctx.close();
}

const devices = [{ name: '393', w: 393, h: 852 }, { name: 'SE', w: 375, h: 667 }];
for (const d of devices) {
  for (const l of ['he', 'en']) {
    await run(d, l);
  }
}
await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
