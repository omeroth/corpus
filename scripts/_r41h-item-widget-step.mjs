// R41i — widget prompt is step 31 of onboarding. Verify, across the
// three bridge outcomes:
//   A. installed=true  → auto-skip 31→32, no screen rendered.
//   B. installed=false → step 31 shown, Maybe later advances to 32.
//   C. installed=true + Debug-build force flag → step shown anyway.
// Also assert the preview card loads the SAME v7 thinker PNG the real
// widget uses (bytes copied from ios/App/CorpusWidget/Resources/thinkers/
// into images/widget-thinkers/ at the end of R41i item 3). And non-iOS
// auto-skips as before.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
const ROOT = '/Users/omeroth/CORPUS';
const WWW = `${ROOT}/www`;
const OUT = `${ROOT}/design-ref/r41h`;
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(n, p, note='') { results.push({ n, p, note }); console.log((p?'[PASS] ':'[FAIL] ')+n+(note?' — '+note:'')); }

async function sha(path) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
}

// Precompute widget-asset hashes for the subject preview-src assertion.
const WIDGET_HASHES = {};
for (const subj of ['freud', 'smith', 'socrates']) {
  for (const mood of ['curious', 'happy']) {
    WIDGET_HASHES[`${subj}-${mood}`] = await sha(`${ROOT}/ios/App/CorpusWidget/Resources/thinkers/${subj}-${mood}.png`);
  }
}

async function openAt(lang, { iosNative, installed, supported = true, debug = false, forceFlag = false, subject = 'philosophy' }) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(({ l, native, inst, sup, dbg, force, subj }) => {
    if (native) {
      window.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
        Plugins: { Haptics: { impact: async () => ({}) }, SplashScreen: { hide: async () => ({}) }, App: { addListener: () => ({ remove: () => {} }) }, Preferences: { get: async () => ({}) }, StatusBar: { setStyle: async () => ({}) },
          CorpusWidgetBridge: { isWidgetInstalled: async () => ({ installed: inst, supported: sup }) } },
      };
    }
    if (dbg) window.__CORPUS_DEBUG_BUILD = true;
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_subject', subj);
    if (force) localStorage.setItem('_corpus_force_widget_step', '1');
  }, { l: lang, native: iosNative, inst: !!installed, sup: supported, dbg: debug, force: forceFlag, subj: subject });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return { ctx, page };
}

// ---------- Case A: iOS native, widget INSTALLED → auto-skip ----------
for (const lang of ['en', 'he']) {
  const { ctx, page } = await openAt(lang, { iosNative: true, installed: true });
  await page.evaluate(() => { _onbShowStep(31); });
  await page.waitForTimeout(900); // allow isWidgetInstalled promise + advance
  const geo = await page.evaluate(() => ({
    step: localStorage.getItem('corpus_onboarding_step'),
    visible: !!(document.getElementById('onb-v2-widget') && getComputedStyle(document.getElementById('onb-v2-widget')).display !== 'none'),
  }));
  rec(`${lang} iOS installed=true: step auto-advances 31 → 32`, geo.step === '32', JSON.stringify(geo));
  rec(`${lang} iOS installed=true: widget screen NOT rendered`, geo.visible === false, JSON.stringify(geo));
  await ctx.close();
}

// ---------- Case B: iOS native, widget NOT installed → step shown ----------
for (const lang of ['en', 'he']) {
  for (const subject of ['philosophy', 'economics', 'psychology']) {
    const { ctx, page } = await openAt(lang, { iosNative: true, installed: false, subject });
    await page.evaluate((l) => {
      if (typeof setAppLang === 'function') setAppLang(l);
      _onbShowStep(31);
    }, lang);
    await page.waitForTimeout(900);
    const geo = await page.evaluate(() => {
      const el = document.getElementById('onb-v2-widget');
      const card = el && el.querySelector('.wp-card');
      const addBtn = el && el.querySelector('.wp-add');
      const laterBtn = el && el.querySelectorAll('.wp-later');
      const caption = el && el.querySelector('.wp-card-caption');
      const thinker = el && el.querySelector('.wp-card-thinker');
      return {
        stepId: localStorage.getItem('corpus_onboarding_step'),
        visible: el && getComputedStyle(el).display !== 'none',
        cardMounted: !!card,
        addLabel: addBtn && addBtn.textContent,
        laterCount: laterBtn ? laterBtn.length : 0,
        source: (typeof _widgetPromptSource !== 'undefined') ? _widgetPromptSource : null,
        caption: caption && caption.textContent,
        thinkerSrc: thinker && thinker.getAttribute('src'),
      };
    });
    await page.screenshot({ path: `${OUT}/${lang}-${subject}-step31-ios.png`, fullPage: false });
    rec(`${lang} ${subject} iOS not-installed: step 31 shows #onb-v2-widget`, geo.visible === true, JSON.stringify(geo));
    rec(`${lang} ${subject} iOS not-installed: _widgetPromptSource = onboarding_step31`, geo.source === 'onboarding_step31', JSON.stringify(geo));
    rec(`${lang} ${subject} iOS not-installed: step cursor persisted = 31`, geo.stepId === '31', 'step=' + geo.stepId);
    rec(`${lang} ${subject} iOS not-installed: Add widget button present`, !!geo.addLabel, 'label=' + geo.addLabel);

    // Caption localization: matches WidgetCopy.ready for lang.
    const expected = (lang === 'en') ? "Let's talk" : 'בואו נדבר';
    rec(`${lang} ${subject} caption matches WidgetCopy.ready (${expected})`,
        (geo.caption || '').trim() === expected,
        `got "${geo.caption}"`);

    // Preview thinker src matches widget asset for this subject.
    const slug = subject === 'philosophy' ? 'socrates' : subject === 'economics' ? 'smith' : 'freud';
    const expectedSrcSuffix = `images/widget-thinkers/${slug}-curious.png`;
    rec(`${lang} ${subject} preview thinker src = ${expectedSrcSuffix}`,
        (geo.thinkerSrc || '').endsWith(expectedSrcSuffix),
        `src=${geo.thinkerSrc}`);

    // Resolve the src that the browser actually loaded and hash the file off disk; compare to widget asset hash.
    const srcUrl = new URL(geo.thinkerSrc, `http://127.0.0.1:${app.port}/`).pathname.replace(/^\//, '');
    const previewHash = await sha(join(WWW, srcUrl));
    rec(`${lang} ${subject} preview PNG bytes identical to widget asset (sha256)`,
        previewHash === WIDGET_HASHES[`${slug}-curious`],
        `preview=${previewHash.slice(0,12)}… widget=${WIDGET_HASHES[`${slug}-curious`].slice(0,12)}…`);

    // Click Maybe later; expect advance to step 32.
    await page.evaluate(() => { const b = document.querySelector('#onb-v2-widget .wp-later'); if (b) b.click(); });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => localStorage.getItem('corpus_onboarding_step'));
    rec(`${lang} ${subject} iOS: Maybe later advances step 31 → 32`, after === '32', 'step=' + after);
    await ctx.close();
  }
}

// ---------- Case C: iOS native, INSTALLED, Debug + force flag → shown ----------
{
  const { ctx, page } = await openAt('en', { iosNative: true, installed: true, debug: true, forceFlag: true });
  await page.evaluate(() => { _onbShowStep(31); });
  await page.waitForTimeout(900);
  const geo = await page.evaluate(() => ({
    visible: !!(document.getElementById('onb-v2-widget') && getComputedStyle(document.getElementById('onb-v2-widget')).display !== 'none'),
    step: localStorage.getItem('corpus_onboarding_step'),
  }));
  rec('Debug+force+installed: step 31 shown despite installed=true', geo.visible === true && geo.step === '31', JSON.stringify(geo));
  await ctx.close();
}

// ---------- Case C-neg: force flag set but NOT a Debug build → still auto-skip ----------
{
  const { ctx, page } = await openAt('en', { iosNative: true, installed: true, debug: false, forceFlag: true });
  await page.evaluate(() => { _onbShowStep(31); });
  await page.waitForTimeout(900);
  const geo = await page.evaluate(() => ({
    visible: !!(document.getElementById('onb-v2-widget') && getComputedStyle(document.getElementById('onb-v2-widget')).display !== 'none'),
    step: localStorage.getItem('corpus_onboarding_step'),
  }));
  rec('Release+force+installed: force flag ignored, auto-skips to 32', geo.visible === false && geo.step === '32', JSON.stringify(geo));
  await ctx.close();
}

// ---------- Case D: non-iOS, step 31 should auto-skip to 32. ----------
{
  const { ctx, page } = await openAt('en', { iosNative: false });
  await page.evaluate(() => { _onbShowStep(31); });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => localStorage.getItem('corpus_onboarding_step'));
  rec('non-iOS: step 31 auto-skips to 32', after === '32', 'step=' + after);
  await ctx.close();
}

await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
