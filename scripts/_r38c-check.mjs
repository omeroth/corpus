// R38c checks:
//   (A) Gift tile stays on home after first open; dot/pulse/caption
//       suppressed; second tap re-opens the sheet.
//   (B) ch6_gift_opened fires with is_first (true then false).
//   (C) Sheet layout: centred thinker ~120px, eyebrow without emoji,
//       chapter card uses .hv-chapter > .level-card structure, link
//       is plain grey 14/800 (no caps).
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/ch6-free/r38c';
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

async function run(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  // Capture posthog events.
  const posthogEvents = [];
  await page.exposeFunction('__capturePhEvent', (name, props) => posthogEvents.push({ name, props }));
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

  // Hook posthog so ch6_gift_* events bubble to the test.
  await page.evaluate(() => {
    const orig = window._phCapture;
    window._phCapture = function (name, props) {
      try { window.__capturePhEvent(name, props); } catch(_){}
      if (typeof orig === 'function') { try { return orig.apply(this, arguments); } catch(_){} }
    };
  });

  // Wait for the first mount via renderHome.
  await page.evaluate(() => _mountCh6GiftBtn());
  await page.waitForSelector('#ch6-gift-btn', { timeout: 3000 });

  // (A1) Before first open — dot + caption present, not .wt-seen.
  const stateA = await page.evaluate(() => {
    const b = document.getElementById('ch6-gift-btn');
    const c = document.getElementById('ch6-gift-caption');
    return {
      btnSeen: b.classList.contains('wt-seen'),
      hasDot: !!b.querySelector('.ch6-gift-dot'),
      hasCap: !!c,
    };
  });
  rec(`${lang} before first open: tile not .wt-seen`, !stateA.btnSeen);
  rec(`${lang} before first open: red dot present`, stateA.hasDot);
  rec(`${lang} before first open: caption present`, stateA.hasCap);

  // (B1) Open sheet, check is_first=true in captured event.
  await page.evaluate(() => _openCh6GiftSheet());
  await page.waitForSelector('#modal-ch6-gift.active', { timeout: 3000 });
  await page.waitForTimeout(500);

  // (C) Sheet layout checks.
  const sheetGeo = await page.evaluate(() => {
    const wrap = document.querySelector('#modal-ch6-gift .pop-wrap');
    const thinker = wrap && wrap.querySelector('.ch6g-thinker');
    const eyebrow = wrap && wrap.querySelector('.ch6g-eyebrow');
    const chCard = wrap && wrap.querySelector('.hv-chapter > .level-card');
    const chCardNum = wrap && wrap.querySelector('.hv-chapter .level-num');
    const chCardTitle = wrap && wrap.querySelector('.hv-chapter .level-title');
    const chCardPill = wrap && wrap.querySelector('.hv-chapter .ch-free-pill');
    const link = wrap && wrap.querySelector('.pop-link');
    const linkCs = link && getComputedStyle(link);
    const eyebrowCs = eyebrow && getComputedStyle(eyebrow);
    return {
      thinkerW: thinker ? thinker.getBoundingClientRect().width : 0,
      thinkerCx: thinker ? (thinker.getBoundingClientRect().left + thinker.getBoundingClientRect().width/2) : 0,
      wrapCx: wrap ? (wrap.getBoundingClientRect().left + wrap.getBoundingClientRect().width/2) : 0,
      wrapTop: wrap ? wrap.getBoundingClientRect().top : 0,
      thinkerTop: thinker ? thinker.getBoundingClientRect().top : 0,
      eyebrowText: eyebrow ? eyebrow.textContent.trim() : null,
      eyebrowHasEmoji: eyebrow ? /🎁/.test(eyebrow.textContent) : false,
      eyebrowLetterSpacing: eyebrowCs && eyebrowCs.letterSpacing,
      eyebrowFontSize: eyebrowCs && eyebrowCs.fontSize,
      eyebrowFontWeight: eyebrowCs && eyebrowCs.fontWeight,
      chCardExists: !!chCard,
      chCardNumExists: !!chCardNum,
      chCardTitle: chCardTitle ? chCardTitle.textContent.trim() : null,
      chCardPillExists: !!chCardPill,
      linkFontSize: linkCs && linkCs.fontSize,
      linkFontWeight: linkCs && linkCs.fontWeight,
      linkTransform: linkCs && linkCs.textTransform,
      linkSpacing: linkCs && linkCs.letterSpacing,
    };
  });

  rec(`${lang} thinker ~120px wide`, Math.abs(sheetGeo.thinkerW - 120) < 5, `got ${sheetGeo.thinkerW.toFixed(1)}`);
  rec(`${lang} thinker centred vs sheet`, Math.abs(sheetGeo.thinkerCx - sheetGeo.wrapCx) < 2, `|${sheetGeo.thinkerCx.toFixed(1)} - ${sheetGeo.wrapCx.toFixed(1)}|`);
  rec(`${lang} thinker overlaps sheet top (~half above)`, sheetGeo.thinkerTop < sheetGeo.wrapTop, `thinker top=${sheetGeo.thinkerTop.toFixed(1)}, wrap top=${sheetGeo.wrapTop.toFixed(1)}`);
  // R41 Finding 8 — eyebrow pill removed (shorter copy). Assert absence.
  rec(`${lang} eyebrow pill removed`, sheetGeo.eyebrowText == null, `eyebrowText=${sheetGeo.eyebrowText}`);
  rec(`${lang} chapter card uses .hv-chapter structure`, sheetGeo.chCardExists && sheetGeo.chCardNumExists && sheetGeo.chCardPillExists);
  rec(`${lang} chapter card title correct`, sheetGeo.chCardTitle === (lang === 'en' ? 'Political Philosophy' : 'פילוסופיה פוליטית'), `got "${sheetGeo.chCardTitle}"`);
  rec(`${lang} link font 14px/800`, sheetGeo.linkFontSize === '14px' && (sheetGeo.linkFontWeight === '800' || parseInt(sheetGeo.linkFontWeight,10) >= 800), `size=${sheetGeo.linkFontSize} weight=${sheetGeo.linkFontWeight}`);
  rec(`${lang} link no uppercase, no letter-spacing`, sheetGeo.linkTransform === 'none' && (sheetGeo.linkSpacing === 'normal' || sheetGeo.linkSpacing === '0px'), `transform=${sheetGeo.linkTransform} spacing=${sheetGeo.linkSpacing}`);

  await page.screenshot({ path: `${OUT}/${lang}-sheet.png`, fullPage: false });

  // Close via thanks CTA.
  await page.evaluate(() => {
    const t = document.querySelector('#modal-ch6-gift .pop-btn');
    if (t) t.click();
  });
  await page.waitForTimeout(400);

  // (A2) After first close — tile STAYS, is .wt-seen, no dot, no caption.
  const stateB = await page.evaluate(() => {
    const b = document.getElementById('ch6-gift-btn');
    const c = document.getElementById('ch6-gift-caption');
    return {
      btnPresent: !!b,
      btnSeen: b && b.classList.contains('wt-seen'),
      hasDot: !!(b && b.querySelector('.ch6-gift-dot')),
      hasCap: !!c,
      seenFlag: !!state.ch6GiftSheetSeen,
    };
  });
  rec(`${lang} after close: tile stays on home`, stateB.btnPresent);
  rec(`${lang} after close: tile has .wt-seen class`, stateB.btnSeen);
  rec(`${lang} after close: no red dot`, !stateB.hasDot);
  rec(`${lang} after close: no caption`, !stateB.hasCap);
  rec(`${lang} after close: seen flag flipped`, stateB.seenFlag);

  // (A3) Second tap re-opens the sheet.
  await page.evaluate(() => {
    const b = document.getElementById('ch6-gift-btn');
    if (b) b.click();
  });
  await page.waitForSelector('#modal-ch6-gift.active', { timeout: 3000 });
  await page.waitForTimeout(300);
  const reopened = await page.evaluate(() => !!document.querySelector('#modal-ch6-gift.active .pop-wrap'));
  rec(`${lang} second tap reopens sheet`, reopened);

  // (B2) Events: first ch6_gift_opened is_first=true, second is_first=false.
  const openedEvents = posthogEvents.filter(e => e.name === 'ch6_gift_opened');
  rec(`${lang} ch6_gift_opened fired twice`, openedEvents.length === 2, `fired ${openedEvents.length} times`);
  if (openedEvents.length === 2) {
    rec(`${lang} first open: is_first=true`, openedEvents[0].props.is_first === true, JSON.stringify(openedEvents[0].props));
    rec(`${lang} second open: is_first=false`, openedEvents[1].props.is_first === false, JSON.stringify(openedEvents[1].props));
  }

  // (A4) Re-render home: tile re-mounts, stays .wt-seen, no caption on second visit.
  await page.evaluate(() => {
    const t = document.querySelector('#modal-ch6-gift .pop-btn');
    if (t) t.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => _mountCh6GiftBtn());
  const stateC = await page.evaluate(() => {
    const b = document.getElementById('ch6-gift-btn');
    const c = document.getElementById('ch6-gift-caption');
    return {
      btnPresent: !!b,
      btnSeen: b && b.classList.contains('wt-seen'),
      hasDot: !!(b && b.querySelector('.ch6-gift-dot')),
      hasCap: !!c,
    };
  });
  rec(`${lang} re-mount after seen: tile present`, stateC.btnPresent);
  rec(`${lang} re-mount after seen: .wt-seen class`, stateC.btnSeen);
  rec(`${lang} re-mount after seen: no dot`, !stateC.hasDot);
  rec(`${lang} re-mount after seen: no caption`, !stateC.hasCap);

  await ctx.close();
}

await run('he');
await run('en');
await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
