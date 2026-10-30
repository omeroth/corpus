// R41j — layout-fix screenshots. Shoots the two surfaces the fix
// touches, in EN + HE, at iPhone 17 Pro metrics (393×852), light
// theme. Written against www/ (same bundle the sim loads).
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41j';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });

async function openCorpus(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})}, CorpusWidgetBridge:{isWidgetInstalled:async()=>({ installed:false, supported:true })} } };
    try { localStorage.clear(); } catch(_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const today = new Date();
    const activeDates = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      activeDates.push(d.toISOString().slice(0, 10));
    }
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3, subject: 'philosophy', lang: l,
      completedDays: {}, framesExplainerSeen: true, streakIntroSeen: true,
      currentScreen: 'home', isPaid: false,
      dailyStreak: 12, longestStreak: 12,
      activeDates, widgetInstalledKnown: false,
    }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  return { ctx, page };
}

for (const lang of ['en', 'he']) {
  // ─── Paywall ───
  {
    const { ctx, page } = await openCorpus(lang);
    await page.evaluate(() => { try { showPaywall({ reason: 'chapter_lock', chapter: 2 }); } catch(_) {} });
    await page.waitForTimeout(900);
    // Confirm pop-v7 modal is active + yearly badge mounted.
    const geo = await page.evaluate((l) => {
      const pw = document.getElementById('modal-paywall');
      const yearly = pw && pw.querySelector('.paywall-card-yearly');
      const badge = yearly && yearly.querySelector('.paywall-card-badge');
      if (!pw || !yearly || !badge) return { mounted: false };
      const yr = yearly.getBoundingClientRect();
      const br = badge.getBoundingClientRect();
      const cs = getComputedStyle(badge);
      const ys = getComputedStyle(yearly);
      return {
        mounted: true,
        popV7: pw.classList.contains('pop-v7'),
        badgeText: badge.textContent,
        yearlyRect: { x: yr.x, y: yr.y, w: yr.width, h: yr.height },
        badgeRect:  { x: br.x, y: br.y, w: br.width, h: br.height },
        topInside: Math.round(br.top - yr.top),            // should = border-width (~2.5)
        inlineGap: Math.round(l === 'he' ? (br.left - yr.left) : (yr.right - br.right)),
        startEndRadius: cs.borderStartEndRadius,
        endStartRadius: cs.borderEndStartRadius,
        yearlyPadTop: ys.paddingTop,
        position: cs.position,
        top: cs.top, left: cs.left, right: cs.right, bottom: cs.bottom,
        insetInlineEnd: cs.insetInlineEnd, insetInlineStart: cs.insetInlineStart,
        transform: cs.transform,
        yearlyPosition: ys.position,
      };
    }, lang);
    console.log(`PAYWALL ${lang}:`, JSON.stringify(geo));
    await page.screenshot({ path: `${OUT}/paywall-${lang}.png`, fullPage: false });
    await ctx.close();
  }

  // ─── Streak screen ───
  {
    const { ctx, page } = await openCorpus(lang);
    await page.evaluate(() => { try { showScreen('streak'); } catch(_) {} try { renderStreakScreen(); } catch(_) {} });
    await page.waitForTimeout(600);
    // Force widget row visible for the screenshot (plugin check is async native-only).
    await page.evaluate(() => {
      const row = document.querySelector('.sk-widget-row');
      if (row) row.style.display = 'flex';
    });
    await page.waitForTimeout(300);
    const geo = await page.evaluate(() => {
      const row = document.querySelector('.sk-widget-row');
      const next = document.querySelector('.sk-next');
      if (!row || !next) return { mounted: false };
      const r1 = row.getBoundingClientRect();
      const r2 = next.getBoundingClientRect();
      return {
        mounted: true,
        widgetRow: { x: r1.x, w: r1.width },
        nextCard:  { x: r2.x, w: r2.width },
        widthDelta: Math.round(r1.width - r2.width),
        leftDelta:  Math.round(r1.left  - r2.left),
      };
    });
    console.log(`STREAK ${lang}:`, JSON.stringify(geo));
    // Scroll the widget row + next card into frame; viewport capture then
    // includes both so the width-match is directly visible side-by-side.
    await page.evaluate(() => {
      const row = document.querySelector('.sk-widget-row');
      if (row) row.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/streak-${lang}.png`, fullPage: false });
    await ctx.close();
  }
}

await browser.close(); app.s.close();
console.log('done.');
