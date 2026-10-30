// R41f Finding 2 — assert that for a sample of thinkers and dialogues,
// both the share URL and its og:image return 200 on the LIVE site.
//
// Why: the generator can produce fresh pages locally, but if the files
// aren't committed + pushed, the live site 404s and WhatsApp/iMessage
// show no preview image. This script simulates what the on-device app
// builds as a share URL, fetches the HTML, extracts og:image, fetches
// that too, asserts both 200.
//
// NOTE: requires network access to corpusapp.io. Some ISPs (BCyber,
// school/corporate filters) block github.io landing pages; run from a
// clean uplink or via a VPN if the first fetch returns the block page.
import https from 'node:https';
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass?'[PASS] ':'[FAIL] ')+name+(note?'  — '+note:'')); }

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Corpus-link-check/1.0' }, timeout: 20000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, finalUrl: res.responseUrl || url, headers: res.headers }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

// Sample set: a mix of thinkers that EXISTED pre-R41d (should be OK on
// live even without a redeploy) and new R36/R41d additions (expect to
// FAIL on live until the regen is committed + pushed).
const SAMPLES = [
  // thinker-card shares — https://corpusapp.io/t/{stem}-{lang}.html
  { kind: 'thinker', stem: 'socrates',          lang: 'en' },  // old; should be live
  { kind: 'thinker', stem: 'socrates',          lang: 'he' },
  { kind: 'thinker', stem: 'hobbes',            lang: 'en' },  // R36; untracked locally → 404 live
  { kind: 'thinker', stem: 'rousseau',          lang: 'he' },  // R36
  { kind: 'thinker', stem: 'rawls-philosophy',  lang: 'en' },  // R36 multi-subject
  { kind: 'thinker', stem: 'nozick-economics',  lang: 'he' },
  // dialogue shares — https://corpusapp.io/d/{slug}-{week}-{day}-{lang}.html
  { kind: 'dialogue', stem: 'phil-1-1', lang: 'en' },         // old; should be live
  { kind: 'dialogue', stem: 'phil-6-1', lang: 'en' },         // R36 ch6 d1; untracked
  { kind: 'dialogue', stem: 'phil-6-1', lang: 'he' },
];

const BASE = 'https://corpusapp.io';
for (const s of SAMPLES) {
  const pagePath = (s.kind === 'thinker') ? `/t/${s.stem}-${s.lang}.html` : `/d/${s.stem}-${s.lang}.html`;
  const pageUrl = BASE + pagePath;
  try {
    const r = await fetch(pageUrl);
    rec(`${s.kind} ${s.stem}/${s.lang}: page ${pageUrl} returns 200`, r.status === 200, `status=${r.status}`);
    // Find og:image.
    const m = r.body.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (m) {
      const imgUrl = m[1];
      try {
        const i = await fetch(imgUrl);
        rec(`${s.kind} ${s.stem}/${s.lang}: og:image ${imgUrl} returns 200`, i.status === 200, `status=${i.status}`);
      } catch (e) {
        rec(`${s.kind} ${s.stem}/${s.lang}: og:image fetch (${imgUrl})`, false, String(e && e.message));
      }
    } else {
      rec(`${s.kind} ${s.stem}/${s.lang}: og:image meta present in page`, false, 'no og:image tag');
    }
  } catch (e) {
    rec(`${s.kind} ${s.stem}/${s.lang}: page fetch`, false, String(e && e.message));
  }
}

const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
