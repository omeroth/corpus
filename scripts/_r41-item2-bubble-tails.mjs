// R41 Finding 2 — every bubble with a ::before tail must also have a
// matching ::after cover strip (the "seamless joint" pattern). Walks
// the main stylesheet's CSSOM, looks up each bubble's ::before rule,
// and asserts a sibling ::after rule exists in the same stylesheet
// with `content: ""` and `position: absolute`. Also captures a zoomed
// screenshot of the rd-guide tail joint on the reader's first screen,
// EN + HE, which was the on-device report surface.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41-bubble-tails';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.json':'application/json; charset=utf-8' };
function srv(root) { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass?'[PASS] ':'[FAIL] ')+name+(note?'  — '+note:'')); }

// Every known bubble that has a visible ::before tail diamond. Each
// one must have a matching ::after seamless-joint cover declared in
// the same stylesheet.
const BUBBLES = [
  '.rd-guide .rd-gb',                                   // reader first screen (the on-device report)
  '.rp-qrow .rp-bubble',                                // reader quiz question
  '.rp-guide-row .rp-bubble',                           // reader guide row (quiz phase)
  '.modal-overlay.pop-v7 .pop-bubble',                  // generic popup bubble
  '.modal-overlay.pop-v7 .pop-bubble-top',              // top-pointing variant
  '.pth-hero-bubble',                                   // pantheon hero
  '.pth-locked-bubble',                                 // pantheon locked sheet
  '.pth-sheet-bubble',                                  // pantheon unlocked sheet
  '.pf7-gb',                                            // profile guide bubble
  '.pf7-sheet-bubble',                                  // profile sheet bubble
  '.rdi-gb',                                            // thinker-intro guide bubble
];

const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

const introspect = await page.evaluate((bubbles) => {
  // Flatten all CSSStyleRule objects from every stylesheet.
  const rules = [];
  for (const sheet of document.styleSheets) {
    let list;
    try { list = sheet.cssRules; } catch (_) { continue; }
    for (const r of list) rules.push(r);
  }
  // For each bubble selector key, find a rule whose selectorText contains
  // the key AND ends with ::before, and separately one with ::after.
  const out = [];
  for (const key of bubbles) {
    const beforeRule = rules.find(r => r.selectorText && r.selectorText.includes(key) && r.selectorText.includes('::before') && (r.style && r.style.content));
    const afterRule  = rules.find(r => r.selectorText && r.selectorText.includes(key) && r.selectorText.includes('::after')  && (r.style && r.style.content));
    out.push({
      key,
      beforeSel: beforeRule ? beforeRule.selectorText : null,
      beforeContent: beforeRule && beforeRule.style.content,
      afterSel:  afterRule ? afterRule.selectorText : null,
      afterContent:  afterRule && afterRule.style.content,
      afterPosition: afterRule && afterRule.style.position,
    });
  }
  return out;
}, BUBBLES);

for (const p of introspect) {
  const afterOk  = !!p.afterSel  && p.afterContent  !== 'none' && p.afterPosition === 'absolute';
  // .pop-bubble-top is a positional-override class that pairs with the
  // base .pop-bubble tail (markup: class="pop-bubble pop-bubble-top").
  // Its ::before rule only overrides placement/border, so it carries
  // no `content` declaration — the ::before content comes from
  // .pop-bubble::before (asserted separately as its own row). Skip
  // the ::before assertion here but still assert the ::after cover.
  if (p.key !== '.modal-overlay.pop-v7 .pop-bubble-top') {
    const beforeOk = !!p.beforeSel && p.beforeContent !== 'none';
    rec(`${p.key}: ::before tail rule present`, beforeOk, p.beforeSel || 'no rule');
  }
  rec(`${p.key}: ::after seamless-cover rule present`, afterOk, p.afterSel || 'no rule');
}
await ctx.close();

// Zoomed joint screenshot for the surface the on-device report flagged.
async function screenshotRdGuideJoint(lang) {
  const c = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await c.newPage();
  await p.addInitScript((l) => {
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({v:3,subject:'philosophy',lang:l,completedDays:{},framesExplainerSeen:true,streakIntroSeen:true,currentScreen:'home',isPaid:true}));
  }, lang);
  await p.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await p.evaluate(() => { if (typeof openReader === 'function') openReader(1, 1, { entry: 'other' }); });
  await p.waitForTimeout(1200);
  const joint = await p.evaluate(() => {
    const gb = document.querySelector('#screen-reader.reader-v7 .rd-guide .rd-gb');
    if (!gb) return null;
    const r = gb.getBoundingClientRect();
    const dirRtl = document.documentElement.getAttribute('dir') === 'rtl';
    // Tail is at top: 25px of the bubble (per CSS). Crop a 40x40 box
    // centred on the inline-start joint.
    const jointX = dirRtl ? Math.max(0, r.right - 20) : Math.max(0, r.left - 20);
    const jointY = Math.max(0, r.top + 25 - 20);
    return { x: jointX, y: jointY, width: 40, height: 40 };
  });
  if (joint && joint.width > 0 && joint.height > 0) {
    await p.screenshot({ path: `${OUT}/rd-guide-${lang}-full.png`, fullPage: false });
    await p.screenshot({ path: `${OUT}/rd-guide-${lang}-joint.png`, clip: joint });
    rec(`${lang} rd-guide joint screenshot captured`, true, `${OUT}/rd-guide-${lang}-joint.png`);
  } else {
    rec(`${lang} rd-guide joint screenshot`, false, 'bubble not mounted on reader (joint=' + JSON.stringify(joint) + ')');
  }
  await c.close();
}
for (const lang of ['en', 'he']) await screenshotRdGuideJoint(lang);

await browser.close(); app.s.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
