// R39f — gift tile must mount for every user, every subject,
// regardless of philosophy ch6 progress (none / in-progress /
// completed). Dot/pulse/caption still gated on ch6GiftSheetSeen.
// Matrix: 3 subjects × 2 langs × 2 seen states × 3 progress states
// = 36 configurations. Assert: tile exists, in viewport, opacity 1,
// doesn't overlap #hv-jump.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/ch6-free/r39f';
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
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(n, p, note='') { results.push({ n, p, note }); console.log((p?'[PASS] ':'[FAIL] ')+n+(note?' — '+note:'')); }
function intersects(a, b) { return a && b && !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }

const CH6_PROGRESS = {
  none:     [],
  partial:  ['philosophy-6-1', 'philosophy-6-2'],
  complete: ['philosophy-6-1','philosophy-6-2','philosophy-6-3','philosophy-6-4','philosophy-6-5','philosophy-6-6','philosophy-6-7','philosophy-6-8'],
};

async function run(subject, lang, seen, progressKey) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cd = {};
  for (const k of CH6_PROGRESS[progressKey]) cd[k] = true;
  // Also seed ch1 so chapter-progress rendering has something to work with
  // for the SE jump-visible scenarios. Not strictly needed for this test.
  await page.addInitScript(({ s, l, sn, cd }) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject', s);
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:s, lang:l, completedDays:cd,
      framesExplainerSeen:true, streakIntroSeen:true,
      ch6GiftSheetSeen: !!sn,
      currentScreen:'home', isPaid:true,
    }));
    localStorage.removeItem('_corpus_debug');
    localStorage.removeItem('_corpus_dev_test');
    localStorage.removeItem('_corpus_dev_premium');
  }, { s: subject, l: lang, sn: seen, cd });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });

  // Allow the tile to mount via renderHome.
  await page.waitForSelector('#ch6-gift-btn', { timeout: 5000 }).catch(() => {});

  const label = `${subject} ${lang} ${seen ? 'seen' : 'unseen'} ch6=${progressKey}`;
  const geo = await page.evaluate(() => {
    const g = document.getElementById('ch6-gift-btn');
    const j = document.getElementById('hv-jump');
    const c = document.getElementById('ch6-gift-caption');
    return {
      giftRect: g ? g.getBoundingClientRect().toJSON() : null,
      giftOpacity: g ? parseFloat(getComputedStyle(g).opacity) : null,
      giftDisplay: g ? getComputedStyle(g).display : null,
      jumpVisible: j && getComputedStyle(j).display !== 'none' && j.offsetHeight > 0,
      jumpRect: (j && getComputedStyle(j).display !== 'none' && j.offsetHeight > 0) ? j.getBoundingClientRect().toJSON() : null,
      hasDot: !!(g && g.querySelector('.ch6-gift-dot')),
      hasCap: !!c,
      vw: window.innerWidth, vh: window.innerHeight,
    };
  });

  rec(`${label}: tile exists`, !!geo.giftRect);
  if (geo.giftRect) {
    rec(`${label}: tile inside viewport`,
        geo.giftRect.left >= 0 && geo.giftRect.right <= geo.vw && geo.giftRect.top >= 0 && geo.giftRect.bottom <= geo.vh,
        JSON.stringify(geo.giftRect));
    rec(`${label}: tile opacity = 1`, geo.giftOpacity === 1, `opacity=${geo.giftOpacity}`);
    rec(`${label}: tile display != none`, geo.giftDisplay !== 'none', `display=${geo.giftDisplay}`);
  }
  if (geo.jumpRect) {
    rec(`${label}: tile does NOT overlap jump`, !intersects(geo.giftRect, geo.jumpRect));
  }
  // Seen-state wiring: with seen=true, no dot and no caption.
  rec(`${label}: dot presence correct for seen=${seen}`, seen ? !geo.hasDot : geo.hasDot);
  rec(`${label}: caption presence correct for seen=${seen}`, seen ? !geo.hasCap : geo.hasCap);

  await page.screenshot({ path: `${OUT}/${subject}-${lang}-${seen ? 'seen' : 'unseen'}-${progressKey}.png`, fullPage: false });
  await ctx.close();
}

for (const subject of ['philosophy', 'economics', 'psychology']) {
  for (const lang of ['en', 'he']) {
    for (const seen of [false, true]) {
      for (const progressKey of Object.keys(CH6_PROGRESS)) {
        await run(subject, lang, seen, progressKey);
      }
    }
  }
}
await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
