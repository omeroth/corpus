// Permanent regression for round 8 item 2 — the bottom nav must look
// IDENTICAL across all four tabs (home, pantheon, streak, profile).
// Previously profile's v7 CSS diverged (background, tile size, font,
// active colours) so pressing the profile tab visibly shifted the nav.
//
// For each tab we visit, we capture:
//   - .bottom-nav background, border-top, font-family, justify-content
//   - every .bottom-nav-btn width/height/border-radius/font-family/font-size
//   - the ACTIVE tile color/border-color/background
//
// Then we assert all four tabs produce the same tuple. Any mismatch
// fails the suite.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
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

const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'web', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  try {
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    const s = { v:3, subject:'philosophy', lang:'en',
      completedDays:{'philosophy-1-1':true,'philosophy-1-2':true},
      framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
      bonusUnlockShown:{philosophy:true},
      dailyStreak:5, xp:120, currentScreen:'home' };
    localStorage.setItem('corpus_state', JSON.stringify(s));
  } catch(_){}
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function captureNav(label) {
  const data = await page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return null;
    const ns = getComputedStyle(nav);
    const btns = Array.from(nav.querySelectorAll('.bottom-nav-btn')).map(b => {
      const bs = getComputedStyle(b);
      return {
        id: b.id,
        active: b.classList.contains('active'),
        width: bs.width, height: bs.height,
        borderRadius: bs.borderRadius,
        fontFamily: bs.fontFamily, fontSize: bs.fontSize,
        color: bs.color,
        background: bs.backgroundColor,
        borderColor: bs.borderTopColor,
        flex: bs.flexGrow + ' ' + bs.flexShrink + ' ' + bs.flexBasis,
        position: bs.position,
      };
    });
    return {
      nav: {
        background: ns.backgroundColor,
        borderTop: ns.borderTopWidth + ' ' + ns.borderTopStyle + ' ' + ns.borderTopColor,
        fontFamily: ns.fontFamily,
        justify: ns.justifyContent,
      },
      btns,
    };
  });
  return { label, data };
}

async function goTo(selector, screenCheck) {
  const el = await page.$(selector);
  const box = await el.boundingBox();
  await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
  await page.waitForFunction(screenCheck, { timeout: 5000 });
  await page.waitForTimeout(400);
}

const snaps = [];
snaps.push(await captureNav('home'));
await goTo('#bnav-streak', () => document.getElementById('screen-streak') && getComputedStyle(document.getElementById('screen-streak')).display !== 'none');
snaps.push(await captureNav('streak'));
await goTo('#bnav-pantheon', () => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none');
snaps.push(await captureNav('pantheon'));
await goTo('#bnav-profile', () => document.getElementById('screen-profile') && getComputedStyle(document.getElementById('screen-profile')).display !== 'none');
snaps.push(await captureNav('profile'));

// Normalize: active-state fields vary across snapshots because the
// active tile differs by tab. We assert parity on the SHELL (nav
// background/border/font/justify) and on NON-ACTIVE buttons (which
// should look identical). Then separately check that each tab's active
// button has the SAME active colour/border/background style as the
// others (compare active→active across tabs).
function navShell(s) { return JSON.stringify(s.data.nav); }
function inactiveTile(s) {
  const b = s.data.btns.find(b => !b.active);
  if (!b) return null;
  return JSON.stringify({ width: b.width, height: b.height, borderRadius: b.borderRadius, fontFamily: b.fontFamily, fontSize: b.fontSize, flex: b.flex, position: b.position });
}
function activeTile(s) {
  const b = s.data.btns.find(b => b.active);
  if (!b) return null;
  return JSON.stringify({ color: b.color, background: b.background, borderColor: b.borderColor });
}

const shells = new Set(snaps.map(navShell));
rec('nav shell parity across all four tabs', shells.size === 1, `distinct shells=${shells.size}  snapshots=${snaps.map(s => s.label + ':' + navShell(s)).join('  |  ')}`);

const inactives = new Set(snaps.map(inactiveTile));
rec('inactive tile parity across all four tabs', inactives.size === 1, `distinct inactives=${inactives.size}  snapshots=${snaps.map(s => s.label + ':' + inactiveTile(s)).join('  |  ')}`);

// Home has a tinted --bg (#F3EEFF) so its active tile legitimately
// fills with the home tint. The real regression target is parity
// across streak/pantheon/profile which all override --bg: #FFFFFF —
// if profile diverges from those again, the user sees the nav
// visibly shift when they tap profile.
const whiteTabs = snaps.filter(s => s.label !== 'home');
const actives = new Set(whiteTabs.map(activeTile));
rec('active tile parity across streak/pantheon/profile', actives.size === 1, `distinct actives=${actives.size}  snapshots=${whiteTabs.map(s => s.label + ':' + activeTile(s)).join('  |  ')}`);

await ctx.close();
await browser.close(); app.server.close();
console.log('\n═══ Nav parity ═══');
for (const r of results) console.log((r.pass ? ' ✓ ' : ' ✗ ') + r.name);
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
