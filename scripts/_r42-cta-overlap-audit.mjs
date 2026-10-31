// R42 CTA / content overlap audit. For each (viewport × lang) combination,
// mount each onboarding step and each popup/sheet/screen with a bottom CTA.
// For each, measure the CTA's rect AND every visible text/image/button
// above it; report any whose rect overlaps the CTA's rect.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r42-cta';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });

const VIEWPORTS = [
  { w: 360, h: 640, label: '360x640' },
  { w: 393, h: 740, label: '393x740' },
  { w: 411, h: 780, label: '411x780' },
];
const LANGS = ['en', 'he'];

// Onboarding step DOM ids (null slot 6 dropped).
const ONB_STEPS = {
  1:'onb-v7-welcome',2:'onb-v7-greet',3:'onb-v7-ask',4:'onb-v2-name',5:'onb-v2-age',
  7:'onb-v2-hours',8:'onb-v2-shock',9:'onb-v2-plan',10:'onb-v2-subject',
  11:'onb-v2-q4',12:'onb-v2-q1',13:'onb-v2-q2',14:'onb-v2-q3',15:'onb-v2-mirror',
  16:'onb-v2-how-it-works',17:'onb-v2-lets-start',18:'onb-v2-taste-1',19:'onb-v2-taste-2',
  20:'onb-v2-taste-q',21:'onb-v2-first-card',22:'onb-v2-streak',23:'onb-v2-signup',
  24:'onb-v2-building',25:'onb-v2-plan-ready',26:'onb-v2-journey',27:'onb-v2-commit',
  28:'onb-v2-goal',29:'onb-v2-adds-up',30:'onb-v2-notifications',31:'onb-v2-widget',
  32:'onb-v2-reviews',33:'onb-v2-trial',34:'onb-v2-reminder-promise',35:'onb-v2-paywall',
};

async function openCorpus(lang, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.w, height: viewport.h },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})}, CorpusWidgetBridge:{isWidgetInstalled:async()=>({installed:false,supported:true})} } };
    window.__CORPUS_DEBUG_BUILD = true;
    window._rvV8_ENABLED = true;
    try { localStorage.clear(); } catch(_) {}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({
      v:3, subject:'philosophy', lang:l,
      completedDays: { 'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,'philosophy-1-4':true,'philosophy-1-5':true },
      framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:false,
      dailyStreak:12, longestStreak:12,
      chapterCompleteShown:{}, bonusUnlockShown:{'bonus-ch1':true},
      unlockedThinkers:['socrates','plato','aristotle','kant','nietzsche'],
      _debugThinkerPoints:{socrates:12,plato:9,aristotle:6,kant:3,nietzsche:1},
    }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil:'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  // Android-like inset: 24px top (status bar), 0 bottom (gesture nav).
  await page.addStyleTag({ content: `:root { --safe-top: 24px; --safe-bottom: 0px; }` });
  return { ctx, page };
}

async function dismissWelcomeBack(page) {
  await page.evaluate(() => {
    try { closeWelcomeBackModal && closeWelcomeBackModal(); } catch (_) {}
    const wb = document.getElementById('welcome-back-modal');
    if (wb) { wb.classList.remove('active'); wb.style.display='none'; }
  });
}

async function auditScreenRect(page, screenSel, ctaSel) {
  // Query everything inside screen that's visible, measure rects, test
  // whether each overlaps the CTA's rect by any pixel. Skip the CTA
  // itself and its ancestors.
  return page.evaluate(([ss, cs]) => {
    const screen = document.querySelector(ss);
    if (!screen) return { ok:false, err:'screen not found: '+ss };
    if (getComputedStyle(screen).display === 'none') return { ok:false, err:'screen not visible' };
    const cta = screen.querySelector(cs);
    if (!cta) return { ok:false, err:'cta not found: '+cs };
    const ctaRect = cta.getBoundingClientRect();
    if (ctaRect.width === 0 || ctaRect.height === 0) return { ok:false, err:'cta has zero size' };
    const overlaps = [];
    // Walk every element inside the screen; skip CTA + its ancestors.
    const ctaAncestors = new Set();
    for (let n = cta; n; n = n.parentElement) ctaAncestors.add(n);
    const all = screen.querySelectorAll('*');
    for (const el of all) {
      if (ctaAncestors.has(el)) continue;
      const cs2 = getComputedStyle(el);
      if (cs2.display === 'none' || cs2.visibility === 'hidden' || cs2.opacity === '0') continue;
      // Skip pure containers (no actual visual).
      const tag = el.tagName.toLowerCase();
      const text = (el.childNodes.length === 1 && el.firstChild.nodeType === 3) ? el.textContent.trim() : '';
      const isLeaf = text || tag === 'img' || tag === 'svg' || tag === 'button' || tag === 'input' || tag === 'textarea';
      if (!isLeaf) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Overlap test: rects touch if NOT (one is left of / right of / above / below the other).
      const noOverlap = r.right <= ctaRect.left + 0.5 || r.left >= ctaRect.right - 0.5 || r.bottom <= ctaRect.top + 0.5 || r.top >= ctaRect.bottom - 0.5;
      if (!noOverlap) {
        overlaps.push({
          tag, text: text.slice(0, 60), id: el.id || null, cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 40) : null,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
      }
    }
    return { ok:true, ctaRect: { x: Math.round(ctaRect.x), y: Math.round(ctaRect.y), w: Math.round(ctaRect.width), h: Math.round(ctaRect.height) }, overlaps };
  }, [screenSel, ctaSel]);
}

const findings = [];

for (const vp of VIEWPORTS) {
  for (const lang of LANGS) {
    console.log(`\n═══ ${vp.label} · ${lang} ═══`);
    const { ctx, page } = await openCorpus(lang, vp);
    await dismissWelcomeBack(page);

    // Onboarding steps.
    for (const [step, id] of Object.entries(ONB_STEPS)) {
      try {
        await page.evaluate((n) => {
          try { _onbShowStep(Number(n)); } catch(_) {}
        }, step);
        await page.waitForTimeout(500);
        const screenSel = `#${id}`;
        const r = await auditScreenRect(page, screenSel, '.onb-v7-cta-holder button, .onb-v7-btn, .onb-v7-btn2');
        if (!r.ok) {
          findings.push({ kind:'onb', step, id, vp:vp.label, lang, note:r.err });
          continue;
        }
        if (r.overlaps.length) {
          findings.push({ kind:'onb', step, id, vp:vp.label, lang, cta:r.ctaRect, overlaps:r.overlaps.slice(0, 5) });
          console.log(`  [FAIL] onb step ${step} ${id} — ${r.overlaps.length} overlaps`);
        } else {
          process.stdout.write('.');
        }
      } catch (e) {
        findings.push({ kind:'onb', step, id, vp:vp.label, lang, err: String(e && e.message) });
      }
    }
    console.log('');

    await ctx.close();
  }
}

await browser.close(); app.s.close();
await writeFile(`${OUT}/findings.json`, JSON.stringify(findings, null, 2));
const bad = findings.filter(f => (f.overlaps && f.overlaps.length) || f.err);
console.log(`\n${bad.length} failures out of ${findings.length} audited  → ${OUT}/findings.json`);
