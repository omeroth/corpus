// R38d checks:
//   1. Thinker fully visible, no ancestor clips its bounding box.
//   2. Sheet uses Nunito (EN) / Rubik (HE) — matches home.
//   3. Button hierarchy swap:
//        primary (.pop-btn) = "See the chapter" + see_chapter action
//        secondary (.pop-link) = "Got it, thanks" + thanks action
//   4. Chapter card title single-line, inline-start aligned.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/ch6-free/r38d';
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

async function run(device, lang) {
  const ctx = await browser.newContext({ viewport: { width: device.w, height: device.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
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
  await page.evaluate(() => {
    const orig = window._phCapture;
    window._phCapture = function (name, props) {
      try { window.__capturePhEvent(name, props); } catch(_){}
      if (typeof orig === 'function') { try { return orig.apply(this, arguments); } catch(_){} }
    };
  });

  await page.evaluate(() => _openCh6GiftSheet());
  await page.waitForSelector('#modal-ch6-gift.active', { timeout: 3000 });
  await page.waitForTimeout(500);

  const label = `${device.name} ${lang}`;

  // (1) Thinker not clipped by any ancestor.
  const thinkerClip = await page.evaluate(() => {
    const t = document.querySelector('#modal-ch6-gift .ch6g-thinker');
    if (!t) return { noThinker: true };
    const tRect = t.getBoundingClientRect();
    // Walk up and check each ancestor's own clipping rect vs the
    // thinker. An ancestor with overflow !== visible clips its
    // descendants to the ancestor's border box.
    const clips = [];
    let p = t.parentElement;
    while (p && p !== document.documentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const pr = p.getBoundingClientRect();
        if (tRect.top < pr.top - 0.5 || tRect.left < pr.left - 0.5 ||
            tRect.bottom > pr.bottom + 0.5 || tRect.right > pr.right + 0.5) {
          clips.push({
            tag: p.tagName, id: p.id, cls: p.className,
            overflow: cs.overflow, overflowY: cs.overflowY,
            parentRect: { top: pr.top, left: pr.left, bottom: pr.bottom, right: pr.right },
            thinkerRect: { top: tRect.top, left: tRect.left, bottom: tRect.bottom, right: tRect.right },
          });
        }
      }
      p = p.parentElement;
    }
    return { thinker: { top: tRect.top, left: tRect.left, bottom: tRect.bottom, right: tRect.right }, clips };
  });
  rec(`${label} thinker not clipped by any ancestor`, thinkerClip.clips && thinkerClip.clips.length === 0, thinkerClip.clips && thinkerClip.clips.length ? JSON.stringify(thinkerClip.clips[0]) : '');

  // Also assert thinker's visual box is entirely inside the viewport.
  const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const t = thinkerClip.thinker;
  rec(`${label} thinker inside viewport`, t && t.top >= 0 && t.left >= 0 && t.bottom <= vp.h + 1 && t.right <= vp.w + 1, JSON.stringify(t));

  // (2) Font family check — eyebrow/title/body/link should resolve to Nunito/Rubik.
  const fonts = await page.evaluate(() => {
    function ff(sel) {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontFamily : null;
    }
    return {
      eyebrow: ff('#modal-ch6-gift .ch6g-eyebrow'),
      title:   ff('#modal-ch6-gift .ch6g-title'),
      body:    ff('#modal-ch6-gift .ch6g-body'),
      btn:     ff('#modal-ch6-gift .pop-btn'),
      link:    ff('#modal-ch6-gift .pop-link'),
    };
  });
  const expect = lang === 'en' ? /Nunito/ : /Rubik/;
  // R41 Finding 8 — eyebrow removed; skip its font assertion (null font).
  rec(`${label} title font`,   expect.test(fonts.title),   fonts.title);
  rec(`${label} body font`,    expect.test(fonts.body),    fonts.body);
  rec(`${label} button font`,  expect.test(fonts.btn),     fonts.btn);
  rec(`${label} link font`,    expect.test(fonts.link),    fonts.link);

  // Title weight 25/900, body 15.5/700.
  const sizes = await page.evaluate(() => {
    const t = document.querySelector('#modal-ch6-gift .ch6g-title');
    const b = document.querySelector('#modal-ch6-gift .ch6g-body');
    const tCs = t && getComputedStyle(t);
    const bCs = b && getComputedStyle(b);
    return {
      titleSize: tCs && tCs.fontSize, titleWeight: tCs && tCs.fontWeight,
      bodySize: bCs && bCs.fontSize, bodyWeight: bCs && bCs.fontWeight,
    };
  });
  rec(`${label} title 25/900`, sizes.titleSize === '25px' && parseInt(sizes.titleWeight,10) >= 900, JSON.stringify(sizes));
  rec(`${label} body 15.5/700`, sizes.bodySize === '15.5px' && parseInt(sizes.bodyWeight,10) >= 700, JSON.stringify(sizes));

  // (3) Button hierarchy — primary = see_chapter copy + see action,
  //     secondary = thanks copy + thanks action.
  const buttons = await page.evaluate((isEn) => {
    const primary = document.querySelector('#modal-ch6-gift .pop-btn');
    const secondary = document.querySelector('#modal-ch6-gift .pop-link');
    return {
      primaryText: primary ? primary.textContent.trim() : null,
      primaryAct:  primary ? primary.getAttribute('data-act') : null,
      secondaryText: secondary ? secondary.textContent.trim() : null,
      secondaryAct:  secondary ? secondary.getAttribute('data-act') : null,
    };
  }, lang === 'en');
  const expPrim = lang === 'en' ? 'See the chapter' : 'לראות את הפרק';
  const expSec  = lang === 'en' ? 'Got it, thanks'  : 'יופי, תודה';
  rec(`${label} primary CTA text`, buttons.primaryText === expPrim, `got "${buttons.primaryText}"`);
  rec(`${label} primary CTA action = see`, buttons.primaryAct === 'see', `got "${buttons.primaryAct}"`);
  rec(`${label} secondary CTA text`, buttons.secondaryText === expSec, `got "${buttons.secondaryText}"`);
  rec(`${label} secondary CTA action = thanks`, buttons.secondaryAct === 'thanks', `got "${buttons.secondaryAct}"`);

  // Primary tap → analytics cta='see_chapter' + subject switched if needed.
  // (This persona starts on philosophy, so no switch happens, but analytics fires.)
  await page.evaluate(() => document.querySelector('#modal-ch6-gift .pop-btn').click());
  await page.waitForTimeout(400);
  const ctaEvents = posthogEvents.filter(e => e.name === 'ch6_gift_cta');
  rec(`${label} ch6_gift_cta fired with see_chapter on primary`, ctaEvents.length >= 1 && ctaEvents[ctaEvents.length-1].props.cta === 'see_chapter', JSON.stringify(ctaEvents));

  // (4) Chapter card title single-line, inline-start aligned.
  // Re-open sheet to measure.
  await page.evaluate(() => _openCh6GiftSheet());
  await page.waitForSelector('#modal-ch6-gift.active', { timeout: 3000 });
  await page.waitForTimeout(300);
  const chTitle = await page.evaluate(() => {
    const t = document.querySelector('#modal-ch6-gift .hv-chapter .level-title');
    if (!t) return null;
    const cs = getComputedStyle(t);
    const r = t.getBoundingClientRect();
    const parentCs = getComputedStyle(t.parentElement);
    return {
      whitespace: cs.whiteSpace,
      lineCount: Math.round(r.height / parseFloat(cs.lineHeight || cs.fontSize)),
      height: r.height, lineHeight: cs.lineHeight, fontSize: cs.fontSize,
      textAlign: parentCs.textAlign,
    };
  });
  rec(`${label} ch card title white-space:nowrap`, chTitle.whitespace === 'nowrap');
  rec(`${label} ch card title single line`, chTitle.lineCount === 1, JSON.stringify(chTitle));
  // R38d — title text must be fully visible, not truncated by
  // ellipsis. User rule: shrink font only if it doesn't fit, never
  // wrap (and never ellipsize).
  const notTruncated = await page.evaluate(() => {
    const t = document.querySelector('#modal-ch6-gift .hv-chapter .level-title');
    return t ? { scroll: t.scrollWidth, client: t.clientWidth } : null;
  });
  rec(`${label} ch card title not ellipsized`, notTruncated.scroll <= notTruncated.client + 0.5, `scroll=${notTruncated.scroll} client=${notTruncated.client}`);

  await page.screenshot({ path: `${OUT}/${device.name}-${lang}-sheet.png`, fullPage: false });
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
