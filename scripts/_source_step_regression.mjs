// Source-step regression:
//   1. Header DOM matches the neighbouring Q1 single-choice shape
//      (same .onb-v7-row > .onb-v7-fig + .onb-v7-bub classes).
//   2. No Skip link, no legacy source-head/source-sub classes left in
//      the active DOM, source_skipped is always false after a pick.
//   3. All 10 options are reachable at 393×852 and 360×640 via scroll.
//   4. Icon SVG fills retint with the active subject theme — we read
//      the first <rect style="fill: #F5B83D"> on the Instagram card
//      and confirm its computed fill matches the subject's --accent.
//   5. Picking an option writes state.onbAnswers.source and fires
//      onboarding_source_selected via _phCapture. 'Other' → inline
//      text field + Continue.
//   6. Screenshots: EN+HE × light+dark × philosophy/economics/psychology
//      × 393×852 and 360×640, each scrolled to top and to bottom. Plus
//      one side-by-side with the neighbouring Q1 screen.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/scripts/source-step-shots';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p); if (!abs.startsWith(root)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

const SUBJECT_ACCENT_LIGHT = {
  philosophy: 'rgb(123, 79, 212)',
  economics:  'rgb(37, 99, 235)',
  psychology: 'rgb(232, 133, 58)',
};
const SUBJECT_ACCENT_DARK = {
  philosophy: 'rgb(157, 122, 232)',
  economics:  'rgb(91, 141, 240)',
  psychology: 'rgb(251, 146, 60)',
};

async function freshPage({ lang='en', subject='philosophy', theme='light', vw=393, vh=852 }) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_subject', args.subject);
      localStorage.setItem('corpus_lang', args.lang);
      localStorage.setItem('corpus_appearance', args.theme);
      // Stable icon order for the Instagram-first assertion. Ends with
      // tail (used_before, other) per the source step's contract.
      // _onbThinker reads this — step > 10 selects the subject thinker
      // (smith/freud) instead of Socrates. Source step lives at slot 37
      // (satellite past _ONB_TOTAL_STEPS=35; slot 36 is the paywall-
      // close completion sentinel).
      localStorage.setItem('corpus_onboarding_step', '37');
      localStorage.setItem('corpus_onboarding_source_order', JSON.stringify([
        'instagram','tiktok','friend','app_store','google','linkedin','threads','ai','used_before','other'
      ]));
    } catch(_){}
  }, { lang, subject, theme });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  // Force the chosen subject/lang/theme at runtime (some flags only
  // apply after state init).
  await page.evaluate(({ lang, subject, theme }) => {
    try { if (typeof setAppLang === 'function') setAppLang(lang); } catch(_){}
    try { if (typeof setSubject === 'function') setSubject(subject); } catch(_){}
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      if (typeof applyTheme === 'function') applyTheme(subject);
    } catch(_){}
  }, { lang, subject, theme });
  await page.waitForTimeout(100);
  await page.evaluate(() => window.__corpusShowSourceStep && window.__corpusShowSourceStep());
  await page.waitForTimeout(400);
  return { ctx, page };
}

function fail(label, detail) { console.log('FAIL ' + label + (detail ? ' — ' + detail : '')); FAILS++; }
function pass(label) { console.log('PASS ' + label); }
let FAILS = 0;

// 1 — Header shape matches Q1.
{
  const { ctx, page } = await freshPage({});
  const info = await page.evaluate(() => {
    const src = document.getElementById('onb-v2-source');
    const q1  = document.getElementById('onb-v2-q1');
    function headShape(root) {
      const row  = root.querySelector('.onb-v7-row');
      const fig  = root.querySelector('.onb-v7-row .onb-v7-fig');
      const bub  = root.querySelector('.onb-v7-row .onb-v7-bub');
      const hint = root.querySelector('.onb-v7-row .onb-v7-bub .onb-v7-greeting');
      return { row: !!row, fig: !!fig, bub: !!bub, hint: !!hint };
    }
    const srcHead = root => {
      const el = root.querySelector('.onb-v7-row .onb-v7-bub > span');
      return el ? getComputedStyle(el).fontSize : null;
    };
    return {
      src: headShape(src),
      q1:  headShape(q1),
      srcHeadFontSize: srcHead(src),
      q1HeadFontSize:  srcHead(q1),
      srcHeadText: src.querySelector('#onb-v2-source-head')?.textContent,
    };
  });
  // row + fig + bub must match Q1; hint presence is intentionally not
  // asserted — the source step has NO subtitle after the device-test
  // fix, so info.src.hint === false while Q1's remains true. Font-size
  // on the head span and head text presence are the real contract.
  const same = info.src.row === info.q1.row
            && info.src.fig === info.q1.fig
            && info.src.bub === info.q1.bub
            && info.src.hint === false;
  const sameFont = info.srcHeadFontSize === info.q1HeadFontSize;
  if (same && sameFont && info.srcHeadText) pass('header shape (no subtitle) + font-size match Q1 (' + info.srcHeadFontSize + ')');
  else fail('header shape/font mismatch', JSON.stringify(info));
  await ctx.close();
}

// 1b — Subtitle element gone (device-test fix: no "It helps us find
// more people like you." or HE equivalent, DOM and copy both removed).
{
  const { ctx, page } = await freshPage({});
  const info = await page.evaluate(() => {
    const el = document.getElementById('onb-v2-source-sub');
    // Also sweep all .onb-v7-greeting children under the source bubble.
    const greeting = document.querySelector('#onb-v2-source .onb-v7-row .onb-v7-bub .onb-v7-greeting');
    const text = document.querySelector('#onb-v2-source .onb-v7-row .onb-v7-bub').textContent.trim();
    return { el: !!el, greeting: !!greeting, text };
  });
  if (!info.el && !info.greeting && info.text === 'How did you hear about Corpus?') pass('subtitle removed — head is the only line');
  else fail('subtitle still present', JSON.stringify(info));
  await ctx.close();
}

// 2 — No Skip in DOM, source_skipped = false after pick, wiring fires.
{
  const { ctx, page } = await freshPage({});
  const hasSkip = await page.$('#onb-v2-source-skip, .onb-v7-source-skip');
  if (!hasSkip) pass('Skip is gone from DOM'); else fail('Skip still in DOM');
  // Install PH sink
  await page.evaluate(() => {
    window.__phSink = [];
    const orig = window._phCapture;
    window._phCapture = function(ev, props){ window.__phSink.push({ev, props}); try { return orig && orig(ev, props); } catch(_){} };
  });
  // Tap Instagram (always present on ios platform).
  await page.evaluate(() => {
    const card = document.querySelector('#onb-v2-source-options .onb-v2-card[data-source-id="instagram"]');
    if (card) card.click();
  });
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({
    source: state && state.onbAnswers && state.onbAnswers.source,
    skipped: state && state.onbAnswers && state.onbAnswers.source_skipped,
    sel: (window.__phSink || []).filter(e => e.ev === 'onboarding_source_selected').map(e => e.props),
  }));
  if (after.source === 'instagram' && after.skipped === false) pass('tap writes source=instagram, source_skipped=false');
  else fail('tap write incorrect', JSON.stringify(after));
  if (after.sel.length === 1 && after.sel[0].source === 'instagram' && after.sel[0].skipped === false)
    pass('onboarding_source_selected fired with skipped:false');
  else fail('onboarding_source_selected mismatch', JSON.stringify(after.sel));
  await ctx.close();
}

// 2b — Other → text field path.
{
  const { ctx, page } = await freshPage({});
  await page.evaluate(() => {
    window.__phSink = [];
    const orig = window._phCapture;
    window._phCapture = function(ev, props){ window.__phSink.push({ev, props}); try { return orig && orig(ev, props); } catch(_){} };
    const card = document.querySelector('#onb-v2-source-options .onb-v2-card[data-source-id="other"]');
    if (card) card.click();
  });
  await page.waitForTimeout(150);
  const otherOpen = await page.$eval('#onb-v2-source-other-wrap', el => el.classList.contains('is-open'));
  if (otherOpen) pass('Other opens the inline text field'); else fail('Other wrap did not open');
  await page.evaluate(() => {
    document.getElementById('onb-v2-source-other-input').value = 'podcast';
    document.getElementById('onb-v2-source-other-cta').click();
  });
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({
    source: state.onbAnswers.source,
    other:  state.onbAnswers.source_other,
    skipped: state.onbAnswers.source_skipped,
  }));
  if (after.source === 'other' && after.other === 'podcast' && after.skipped === false) pass('Other writes source=other, source_other=podcast, source_skipped=false');
  else fail('Other write incorrect', JSON.stringify(after));
  await ctx.close();
}

// 3 — Icon retint per subject.
for (const subject of ['philosophy','economics','psychology']) {
  for (const theme of ['light','dark']) {
    const { ctx, page } = await freshPage({ subject, theme });
    const fill = await page.evaluate(() => {
      const card = document.querySelector('#onb-v2-source-options .onb-v2-card[data-source-id="instagram"]');
      if (!card) return null;
      const el = card.querySelector('svg [fill="#F5B83D"]');
      if (!el) return null;
      return getComputedStyle(el).fill;
    });
    const expected = theme === 'dark' ? SUBJECT_ACCENT_DARK[subject] : SUBJECT_ACCENT_LIGHT[subject];
    if (fill === expected) pass('icon retint ' + subject + '/' + theme + ' = ' + fill);
    else fail('icon retint ' + subject + '/' + theme, 'got ' + fill + ' expected ' + expected);
    await ctx.close();
  }
}

// 4 — Reachability: all 10 options reachable via scroll at 393×852
//     and 9 options at 360×640 (platform=ios hides google_play, so
//     10 options with no google_play row).
for (const [vw, vh] of [[393,852],[360,640]]) {
  const { ctx, page } = await freshPage({ vw, vh });
  const info = await page.evaluate(() => {
    const list = document.getElementById('onb-v2-source-options');
    const cards = Array.from(list.querySelectorAll('.onb-v2-card'));
    // Scroll last card into view.
    const last = cards[cards.length - 1];
    last.scrollIntoView({ block: 'end' });
    const listRect = list.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const canScroll = list.scrollHeight > list.clientHeight;
    const lastInView = lastRect.bottom <= listRect.bottom + 1 && lastRect.top >= listRect.top - 1;
    return { count: cards.length, canScroll, lastInView, lastId: last.dataset.sourceId, listH: list.clientHeight, listScrollH: list.scrollHeight };
  });
  // canScroll is informational — on tall viewports the whole list may
  // fit without scrolling. What we assert is that the last card is in
  // view after scrolling, and that the total count is right.
  if (info.count === 10 && info.lastInView && info.lastId === 'other')
    pass('reachability ' + vw + 'x' + vh + ': 10 cards, last=other reachable (scrollable:' + info.canScroll + ')');
  else fail('reachability ' + vw + 'x' + vh, JSON.stringify(info));
  await ctx.close();
}

// 5 — Screenshots matrix. EN + HE × light + dark × 3 subjects × 2 viewports × {top, bottom}.
const SHOT_MATRIX = [];
for (const lang of ['en','he']) for (const theme of ['light','dark'])
  for (const subject of ['philosophy','economics','psychology'])
    for (const [vw, vh] of [[393,852],[360,640]])
      for (const pos of ['top','bot']) SHOT_MATRIX.push({ lang, theme, subject, vw, vh, pos });

for (const m of SHOT_MATRIX) {
  const { ctx, page } = await freshPage(m);
  if (m.pos === 'bot') {
    await page.evaluate(() => {
      const list = document.getElementById('onb-v2-source-options');
      list.scrollTop = list.scrollHeight;
    });
    await page.waitForTimeout(80);
  }
  const name = `source_${m.lang}_${m.theme}_${m.subject}_${m.vw}x${m.vh}_${m.pos}.png`;
  await page.screenshot({ path: join(OUT, name), fullPage: false });
  await ctx.close();
}
console.log('SHOTS written to ' + OUT);

// 6 — Side-by-side with Q1 for header-match visual proof.
{
  const { ctx, page } = await freshPage({ lang: 'en', subject: 'philosophy', theme: 'light' });
  await page.screenshot({ path: join(OUT, 'sxs_source_en_phil_light.png') });
  // Switch to Q1 screen.
  await page.evaluate(() => {
    document.querySelectorAll('.onb-screen').forEach(s => { s.style.display='none'; s.classList.remove('onb-active'); });
    try { _onbV2PrepareQ1 && _onbV2PrepareQ1(); } catch(_){}
    const el = document.getElementById('onb-v2-q1');
    if (el) { el.style.display='flex'; el.classList.add('onb-active'); }
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, 'sxs_q1_en_phil_light.png') });
  await ctx.close();
}

await browser.close();
app.server.close();
console.log(FAILS === 0 ? 'ALL PASS' : ('FAILS: ' + FAILS));
process.exit(FAILS === 0 ? 0 : 1);
