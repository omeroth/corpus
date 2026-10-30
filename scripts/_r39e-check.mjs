// R39e — gift sheet always Socrates + philosophy purple regardless of
// user's current subject. Matrix: 3 subjects × 2 langs × 2 themes.
// Assertions: thinker src contains 'socrates-celebrate'; primary CTA
// background resolves to the philosophy accent (#7B4FD4); eyebrow bg
// is the philosophy accent tint; chapter card number stays "6".
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/ch6-free/r39e';
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

// Accent values in RGB form (what getComputedStyle returns).
const PHIL_ACCENT_RGB = 'rgb(123, 79, 212)';
const PHIL_ACCENT_TINT_RGB = 'rgba(123, 79, 212, 0.12)';

async function run(subject, lang, dark) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await page.addInitScript(({ s, l, dk }) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject', s);
    localStorage.setItem('corpus_lang', l);
    if (dk) localStorage.setItem('corpus_appearance', 'dark');
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:s,lang:l,completedDays:{},framesExplainerSeen:true,streakIntroSeen:true,currentScreen:'home',isPaid:true,appearance:dk?'dark':'light'}));
    localStorage.removeItem('_corpus_debug');
    localStorage.removeItem('_corpus_dev_test');
    localStorage.removeItem('_corpus_dev_premium');
  }, { s: subject, l: lang, dk: dark });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(()=>document.getElementById('screen-home')&&getComputedStyle(document.getElementById('screen-home')).display!=='none',{timeout:15000});
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  if (dark) await page.evaluate(() => { document.documentElement.classList.add('dark'); });

  // Open the sheet (bypasses the eligibility gate when not from a tap).
  await page.evaluate(() => _openCh6GiftSheet());
  await page.waitForSelector('#modal-ch6-gift.active', { timeout: 3000 });
  await page.waitForTimeout(400);

  const geo = await page.evaluate(() => {
    const img = document.querySelector('#modal-ch6-gift .ch6g-thinker');
    const eyebrow = document.querySelector('#modal-ch6-gift .ch6g-eyebrow');
    const btn = document.querySelector('#modal-ch6-gift .pop-btn');
    const link = document.querySelector('#modal-ch6-gift .pop-link');
    const chCard = document.querySelector('#modal-ch6-gift .hv-chapter .level-card');
    const chNum = document.querySelector('#modal-ch6-gift .hv-chapter .level-num');
    const chTitle = document.querySelector('#modal-ch6-gift .hv-chapter .level-title');
    const htmlClass = document.documentElement.className;
    return {
      thinkerSrc: img ? img.getAttribute('src') : null,
      eyebrowBg: eyebrow ? getComputedStyle(eyebrow).backgroundColor : null,
      eyebrowColor: eyebrow ? getComputedStyle(eyebrow).color : null,
      btnBg: btn ? getComputedStyle(btn).backgroundColor : null,
      btnShadow: btn ? getComputedStyle(btn).boxShadow : null,
      linkColor: link ? getComputedStyle(link).color : null,
      chCardBg: chCard ? getComputedStyle(chCard).backgroundColor : null,
      chNumText: chNum ? chNum.textContent.trim() : null,
      chTitle: chTitle ? chTitle.textContent.trim() : null,
      htmlClass,
    };
  });

  const label = `${subject} ${lang} ${dark ? 'dark' : 'light'}`;
  rec(`${label}: thinker is Socrates (celebrate)`,
      !!geo.thinkerSrc && /socrates-celebrate/.test(geo.thinkerSrc),
      geo.thinkerSrc);
  rec(`${label}: primary CTA = philosophy accent`,
      geo.btnBg === PHIL_ACCENT_RGB,
      `bg=${geo.btnBg}`);
  // R41 Finding 8 — eyebrow pill removed. The pre-R41 sheet had
  // "A gift from us" / "מתנה מאיתנו" above the title; the new copy
  // drops it so the single big title carries the moment. The
  // eyebrowBg/eyebrowColor fields on `geo` are now null and the
  // element is absent from the DOM — assert that directly.
  rec(`${label}: eyebrow pill removed (shorter copy)`,
      geo.eyebrowBg == null && geo.eyebrowColor == null,
      `eyebrowBg=${geo.eyebrowBg} eyebrowColor=${geo.eyebrowColor}`);
  rec(`${label}: chapter card bg = philosophy accent`,
      geo.chCardBg === PHIL_ACCENT_RGB,
      `bg=${geo.chCardBg}`);
  rec(`${label}: chapter number = 6`,
      geo.chNumText === '6');
  rec(`${label}: chapter title is Political Philosophy / פילוסופיה פוליטית`,
      geo.chTitle === (lang === 'en' ? 'Political Philosophy' : 'פילוסופיה פוליטית'),
      geo.chTitle);
  // App theme must NOT be forced to philosophy — only the sheet is scoped.
  if (subject !== 'philosophy') {
    rec(`${label}: html.theme-${subject} still in place (app theme unchanged)`,
        new RegExp('theme-' + subject).test(geo.htmlClass),
        geo.htmlClass);
  }

  await page.screenshot({ path: `${OUT}/${subject}-${lang}-${dark ? 'dark' : 'light'}.png`, fullPage: false });
  await ctx.close();
}

for (const subject of ['philosophy', 'economics', 'psychology']) {
  for (const lang of ['en', 'he']) {
    for (const dark of [false, true]) {
      await run(subject, lang, dark);
    }
  }
}
await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
