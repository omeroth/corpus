// R38 regression — chapter 6 free for everyone, chapter-order lock
// preserved, chapters 2-5 still paywall for non-subscribers, tag
// renders EN+HE, in every tier.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
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

// Three personas, defined by state fields alone.
const personas = {
  guest:      { isPaid: false, grandfathered: false },
  free:       { isPaid: false, grandfathered: false },
  subscriber: { isPaid: true,  grandfathered: false },
};

async function run(personaName, lang) {
  const p = personas[personaName];
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(({ l, pp }) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid: pp.isPaid, grandfathered: pp.grandfathered }));
  }, { l: lang, pp: p });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  // Ensure dev-premium is off.
  await page.evaluate(() => { try { localStorage.removeItem('_corpus_dev_premium'); } catch(_){} });

  // --- Access gate for ch5/ch6/ch7 under three states: no progress,
  //     ch1-4 complete, ch1-5 complete. canAccessWeek is pure wrt
  //     state.completedDays so we can rewrite state between calls.
  async function access(subj, wk) {
    return page.evaluate(([s, w]) => canAccessWeek(s, w), [subj, wk]);
  }
  async function setProgress(completedDays) {
    await page.evaluate((cd) => { state.completedDays = cd; }, completedDays);
  }

  await setProgress({});
  const accNo5  = await access('philosophy', 5);
  const accNo6  = await access('philosophy', 6);
  const accNo7  = await access('philosophy', 7);

  await setProgress({ 'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,'philosophy-1-4':true,'philosophy-1-5':true,'philosophy-1-6':true,'philosophy-1-7':true,
                      'philosophy-2-1':true,'philosophy-2-2':true,'philosophy-2-3':true,'philosophy-2-4':true,'philosophy-2-5':true,'philosophy-2-6':true,'philosophy-2-7':true,
                      'philosophy-3-1':true,'philosophy-3-2':true,'philosophy-3-3':true,'philosophy-3-4':true,'philosophy-3-5':true,'philosophy-3-6':true,'philosophy-3-7':true,
                      'philosophy-4-1':true,'philosophy-4-2':true,'philosophy-4-3':true,'philosophy-4-4':true,'philosophy-4-5':true,'philosophy-4-6':true,'philosophy-4-7':true });
  const acc14_5 = await access('philosophy', 5);
  const acc14_6 = await access('philosophy', 6);
  const acc14_7 = await access('philosophy', 7);

  await setProgress({ 'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,'philosophy-1-4':true,'philosophy-1-5':true,'philosophy-1-6':true,'philosophy-1-7':true,
                      'philosophy-2-1':true,'philosophy-2-2':true,'philosophy-2-3':true,'philosophy-2-4':true,'philosophy-2-5':true,'philosophy-2-6':true,'philosophy-2-7':true,
                      'philosophy-3-1':true,'philosophy-3-2':true,'philosophy-3-3':true,'philosophy-3-4':true,'philosophy-3-5':true,'philosophy-3-6':true,'philosophy-3-7':true,
                      'philosophy-4-1':true,'philosophy-4-2':true,'philosophy-4-3':true,'philosophy-4-4':true,'philosophy-4-5':true,'philosophy-4-6':true,'philosophy-4-7':true,
                      'philosophy-5-1':true,'philosophy-5-2':true,'philosophy-5-3':true,'philosophy-5-4':true,'philosophy-5-5':true,'philosophy-5-6':true,'philosophy-5-7':true });
  const acc15_5 = await access('philosophy', 5);
  const acc15_6 = await access('philosophy', 6);
  const acc15_7 = await access('philosophy', 7);

  const label = `${personaName} ${lang}`;
  if (personaName === 'subscriber') {
    rec(`${label} subscriber: ch5 accessible always`, accNo5 && acc14_5 && acc15_5);
    rec(`${label} subscriber: ch6 accessible always`, accNo6 && acc14_6 && acc15_6);
    rec(`${label} subscriber: ch7 accessible always`, accNo7 && acc14_7 && acc15_7);
  } else {
    rec(`${label} ${personaName}: ch5 paywalled with no progress`, !accNo5);
    rec(`${label} ${personaName}: ch5 paywalled through ch4`, !acc14_5);
    // R39b Finding 3 changed the started-clause to require
    // _isUserPaidOrTrialNow(). A non-paying user who has all of ch5
    // completed therefore gets canAccessWeek(5) === false. Specific
    // completed days remain reachable via openReader's own fall-
    // through — that's covered in _r39-part2.mjs. Here we just
    // confirm the chapter-level gate flipped as intended.
    rec(`${label} ${personaName}: ch5 chapter-level access DENIED post-R39b (started-clause gated on paid)`, !acc15_5);
    rec(`${label} ${personaName}: ch6 FREE regardless of progress (no progress)`, accNo6);
    rec(`${label} ${personaName}: ch6 FREE regardless of progress (ch1-4 done)`, acc14_6);
    rec(`${label} ${personaName}: ch6 FREE regardless of progress (ch1-5 done)`, acc15_6);
    rec(`${label} ${personaName}: ch7 paywalled with no progress`, !accNo7);
    rec(`${label} ${personaName}: ch7 paywalled through ch1-5`, !acc15_7);
  }

  // --- Reset progress to default. Order lock is enforced by
  //     _buildWeekLockMap (independent of access gate). R41f: ch6 is
  //     FREE_CHAPTERS and now always order-unlocked. ch7 still needs
  //     every prior ch (R39b all-prev-complete).
  await setProgress({});
  const lockMapFresh = await page.evaluate(() => {
    const chapters = getW();
    const m = _buildWeekLockMap(chapters);
    return { ch5: !!m[5], ch6: !!m[6], ch7: !!m[7] };
  });
  // _buildWeekLockMap returns map[id] = true WHEN ACCESSIBLE (unlocked).
  rec(`${label} order-lock ch6 ALWAYS UNlocked (R41f FREE_CHAPTERS override)`, lockMapFresh.ch6 === true);
  rec(`${label} order-lock ch7 locked when ch1-6 unfinished`, lockMapFresh.ch7 === false);

  await setProgress({ 'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,'philosophy-1-4':true,'philosophy-1-5':true,'philosophy-1-6':true,'philosophy-1-7':true,
                      'philosophy-2-1':true,'philosophy-2-2':true,'philosophy-2-3':true,'philosophy-2-4':true,'philosophy-2-5':true,'philosophy-2-6':true,'philosophy-2-7':true,
                      'philosophy-3-1':true,'philosophy-3-2':true,'philosophy-3-3':true,'philosophy-3-4':true,'philosophy-3-5':true,'philosophy-3-6':true,'philosophy-3-7':true,
                      'philosophy-4-1':true,'philosophy-4-2':true,'philosophy-4-3':true,'philosophy-4-4':true,'philosophy-4-5':true,'philosophy-4-6':true,'philosophy-4-7':true,
                      'philosophy-5-1':true,'philosophy-5-2':true,'philosophy-5-3':true,'philosophy-5-4':true,'philosophy-5-5':true,'philosophy-5-6':true,'philosophy-5-7':true });
  const lockMapPostCh5 = await page.evaluate(() => {
    const chapters = getW();
    const m = _buildWeekLockMap(chapters);
    return { ch5: !!m[5], ch6: !!m[6], ch7: !!m[7] };
  });
  rec(`${label} order-lock ch6 UNlocked when ch5 finished`, lockMapPostCh5.ch6 === true);

  // --- "🎁 Free" pill renders on ch6 card regardless of tier/progress.
  await setProgress({});
  await page.evaluate(() => { try { renderHome(); } catch(_){} });
  await page.waitForTimeout(300);
  const pillPresent = await page.evaluate(() => {
    const card = document.getElementById('level-card-6');
    const pill = card && card.querySelector('.ch-free-pill');
    return { present: !!pill, text: pill ? pill.textContent.trim() : null };
  });
  rec(`${label} 🎁 Free pill renders on ch6 card`, pillPresent.present);
  const expectText = (lang === 'en') ? 'Free' : 'חינם';
  rec(`${label} 🎁 Free pill lang text (${lang})`, pillPresent.text && pillPresent.text.includes(expectText), `got "${pillPresent.text}"`);

  // --- Mid-chapter paywall must NOT arm for ch6 (defensive).
  //     Flip _isUserPaidOrTrialNow via state and simulate.
  const midChCh6 = await page.evaluate(() => {
    state.midChapterPaywallShown = {};
    _pendingMidChapterPaywall = null;
    _maybeFlagMidChapterPaywall(6, 3);
    return _pendingMidChapterPaywall;
  });
  rec(`${label} mid-chapter paywall never arms for ch6 d3`, midChCh6 === null);

  await ctx.close();
}

for (const persona of ['guest', 'free', 'subscriber']) {
  for (const lang of ['he', 'en']) {
    await run(persona, lang);
  }
}
await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
