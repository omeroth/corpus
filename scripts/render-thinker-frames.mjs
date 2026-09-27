#!/usr/bin/env node
// Renders the four thinker-frame tiers (bronze, silver, gold, diamond)
// for two aspect ratios into transparent PNGs:
//
//   reveal   — 5:8 frames, taller than the card; used at end-of-dialogue
//              reveal, sheen-and-twinkle detail view.
//              Source: thinker-frames-handoff/reference/frame-tiers.dc.html
//              Output: images/thinker-frames/{tier}.png
//
//   pantheon — 3:4 frames, natively drawn to match Pantheon grid cards.
//              Ornaments composed for 3:4 (not vertically compressed
//              from the 5:8 set — see spec §10). Everything stays
//              inside a 300×400 box so grid rows never overlap.
//              Source: thinker-frames-handoff/reference/frame-tiers-3x4.dc.html
//              Output: images/thinker-frames/3x4/{tier}.png
//
// Compresses via a pngquant palette pass; falls back to the raw
// Chromium output if pngquant isn't available.
//
// Rendering: Playwright launching the system Chrome install
// (/Applications/Google Chrome.app on macOS). Chromium's SVG filter
// pipeline matches what was approved in the reference; librsvg's
// output (initial pass) missed small details that the reference
// depended on, so we switched. Runtime dependency: playwright-core
// (~1MB) and a system Chrome binary — no bundled Chromium download.
//
// If Chrome isn't installed at the default path, override with
// CHROME_PATH=/path/to/binary env var (Chromium builds work too as
// long as they support --headless=new and transparent screenshots).
//
// Output: images/thinker-frames/{bronze,silver,gold,diamond}.png
//         (source of truth for the runtime lookup in commit 3+).
//
// Gold: rendered with the outer crest but with NO subject-tinted gem.
// A small CSS element overlays the gem at runtime using
// --frame-{subject}-field/-deep tokens (added in commit 2) so the four
// files ship one gold render for all three subjects rather than three
// gold-per-subject renders. Saves ~200-450 KB; see commit-3 report.
// Pantheon-set gold uses the same trick: a transparent ellipse hole
// at (150, 38) in the frame PNG, subject-tinted gem drawn in CSS
// underneath.
//
// Usage: node scripts/render-thinker-frames.mjs
//        [--set=reveal|pantheon] [--tier=bronze|silver|gold|diamond]
// Default: both sets, all tiers.
//
// Committed PNGs are the source of truth; regenerate by running the
// script and committing the diff. The rendering pipeline is intentionally
// deterministic (fixed dimensions, no timestamps in the PNG) so a re-run
// with unchanged SVG inputs produces a byte-identical PNG.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import pngquant from 'pngquant-bin';
import { execFileSync } from 'node:child_process';

const CHROME_PATH = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR_REVEAL = path.join(ROOT, 'images', 'thinker-frames');
const OUT_DIR_PANTHEON = path.join(ROOT, 'images', 'thinker-frames', '3x4');
fs.mkdirSync(OUT_DIR_REVEAL, { recursive: true });
fs.mkdirSync(OUT_DIR_PANTHEON, { recursive: true });

// Reveal frame box in SVG units: 230 wide × 344 tall, with ornaments
// overflowing up to ~20 units above and ~12 units below (diamond rays,
// gold crest, gold scroll). Render surface: 230 × 376.
//
// Target display: the reveal's flip-card caps at 320 CSS px wide. 2× DPR
// = 640 raw px for the frame's on-screen area. The frame box is 230
// units wide, so scale = 640/230 = ~2.78. Total output width 640,
// height rounded from 376 × scale.
const REVEAL_UNIT_W = 230;
const REVEAL_UNIT_H = 376;
const REVEAL_RENDER_W = 640;
const REVEAL_RENDER_H = Math.round(REVEAL_UNIT_H * (REVEAL_RENDER_W / REVEAL_UNIT_W));

// Pantheon frame box: 300 × 400 (the natively-drawn 3:4 set). Nothing
// overshoots the box (spec §10) so no extra padding needed. The Pantheon
// grid columns typically cap at ~180 CSS px wide on phones, and the
// detail view goes larger. Rendering at 2× the unit box (600×800) covers
// pantheon thumbnails at 3× DPR without ornament pixelation, and keeps
// the file weight roughly half of the reveal set.
const PANTHEON_UNIT_W = 300;
const PANTHEON_UNIT_H = 400;
const PANTHEON_RENDER_W = 600;
const PANTHEON_RENDER_H = Math.round(PANTHEON_UNIT_H * (PANTHEON_RENDER_W / PANTHEON_UNIT_W));

// Shared <defs> reused by every reveal-set tier — pulled verbatim from
// the reference (lines 17-73), minus the l-gem gradient (only gold
// uses it, and only as a subject-tinted overlay we're moving to CSS)
// and the stone tier filter (stone was dropped from the tier list per
// spec §top).
const SHARED_DEFS_REVEAL = `
<defs>
<linearGradient id="l-bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7A4A22"/><stop offset="0.45" stop-color="#C8894A"/><stop offset="0.55" stop-color="#E0A86A"/><stop offset="1" stop-color="#8C5A2B"/></linearGradient>
<linearGradient id="l-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A9098"/><stop offset="0.45" stop-color="#E8ECEF"/><stop offset="0.52" stop-color="#FFFFFF"/><stop offset="1" stop-color="#9EA4AB"/></linearGradient>
<linearGradient id="l-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A8841C"/><stop offset="0.45" stop-color="#E3C868"/><stop offset="0.52" stop-color="#F3DE8E"/><stop offset="1" stop-color="#C9A227"/></linearGradient>
<linearGradient id="l-diamond" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9DDF7"/><stop offset="0.18" stop-color="#FFFFFF"/><stop offset="0.34" stop-color="#C7B3EC"/><stop offset="0.5" stop-color="#F6F0FF"/><stop offset="0.66" stop-color="#A98BDB"/><stop offset="0.82" stop-color="#D6ECF7"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
<clipPath id="l-c-dia"><path d="M40 22 H190 V28 H200 V36 H208 V320 H200 V328 H190 V334 H40 V328 H30 V320 H22 V36 H30 V28 H40 Z"/></clipPath>
<filter id="l-f-metal" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="blur"/>
  <feDiffuseLighting in="blur" surfaceScale="4" diffuseConstant="1.2" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
  <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1" specularExponent="28" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="55"/></feSpecularLighting>
  <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.1" k2="0" k3="0" k4="0" result="lit"/>
  <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0" result="shine"/>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="clip"/>
  <feDropShadow in="clip" dx="1.5" dy="3" stdDeviation="2.2" flood-color="#221A14" flood-opacity="0.38"/>
</filter>
<filter id="l-f-small" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="blur"/>
  <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="1.2" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
  <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1" specularExponent="24" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="55"/></feSpecularLighting>
  <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.1" k2="0" k3="0" k4="0" result="lit"/>
  <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0" result="shine"/>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="clip"/>
  <feDropShadow in="clip" dx="1" dy="2" stdDeviation="1.2" flood-color="#221A14" flood-opacity="0.4"/>
</filter>
<filter id="l-f-crystal" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur"/>
  <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.4" specularExponent="40" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>
  <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="shine"/>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="clip"/>
  <feDropShadow in="clip" dx="1.5" dy="3" stdDeviation="2.5" flood-color="#3A2A66" flood-opacity="0.4"/>
</filter>
</defs>
`.trim();

// Each tier's frame body — the inner SVG group for that tier, without
// the <img> that renders the card portrait, without the inset-shadow
// overlay div (the app adds both at runtime around the frame PNG),
// without the sheen sweep clip-group (added live in commit 6 as a
// CSS mask over the PNG so it can loop cheaply), and without any
// twinkle paths (also live CSS elements later). What lands in the PNG
// is the static frame geometry: outer band, mitred bevel gradients,
// ornament work, corner rosettes / studs / acanthus, plaques / crests,
// keyline. Ports the reference viewBox="0 0 230 344" content only —
// the ornament overflow above/below sits inside the SVG's overflow
// area, which the outer wrapper's height (376) contains.
//
// Bronze — Classical: meander border, laurel wreaths, "SAPERE AUDE"
// plaque. Reference lines 113-147 (minus animated sheen at 119).
const BRONZE_SVG = `
<path filter="url(#l-f-metal)" fill-rule="evenodd" d="M24 28 H206 V330 H24 Z M39 44 H191 V313 H39 Z" fill="url(#l-bronze)"/>
<path d="M24 28 H206 L191 44 H39 Z" fill="#FFFFFF" opacity="0.22"/>
<path d="M24 28 V330 L39 313 V44 Z" fill="#FFFFFF" opacity="0.1"/>
<path d="M206 28 V330 L191 313 V44 Z" fill="#000000" opacity="0.14"/>
<path d="M24 330 H206 L191 313 H39 Z" fill="#000000" opacity="0.26"/>
<path d="M24 28 H206 V330 H24 Z M39 44 H191 V313 H39 Z" fill="none" stroke="#3E220C" stroke-width="1"/>
<g fill="none" stroke-width="1">
  <g stroke="#F0BE85" opacity="0.8" transform="translate(0.7 0.7)">
    <path d="M45 40 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path d="M45 326 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path transform="translate(28 52) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path transform="translate(194 52) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
  </g>
  <g stroke="#3E220C" opacity="0.9">
    <path d="M45 40 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path d="M45 326 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path transform="translate(28 52) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path transform="translate(194 52) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
  </g>
</g>
<g fill="#5E9C8A" opacity="0.5"><ellipse cx="30" cy="84" rx="4" ry="10"/><ellipse cx="200" cy="248" rx="4" ry="12"/><ellipse cx="150" cy="324" rx="12" ry="3"/><ellipse cx="176" cy="33" rx="8" ry="3"/></g>
<rect filter="url(#l-f-small)" x="38.5" y="43.5" width="153" height="270" fill="none" stroke="url(#l-bronze)" stroke-width="4"/>
<g filter="url(#l-f-small)" fill="url(#l-bronze)"><circle cx="31" cy="36" r="7"/><circle cx="199" cy="36" r="7"/><circle cx="31" cy="322" r="7"/><circle cx="199" cy="322" r="7"/></g>
<g filter="url(#l-f-small)">
  <path d="M113 27 C100 18 84 12 62 11" fill="none" stroke="#6B4019" stroke-width="2"/>
  <g fill="url(#l-bronze)"><ellipse cx="104" cy="19" rx="2.6" ry="6.4" transform="rotate(-55 104 19)"/><ellipse cx="93" cy="14" rx="2.6" ry="6.4" transform="rotate(-68 93 14)"/><ellipse cx="82" cy="11" rx="2.6" ry="6.4" transform="rotate(-80 82 11)"/><ellipse cx="71" cy="10" rx="2.6" ry="6.4" transform="rotate(-88 71 10)"/><ellipse cx="100" cy="25" rx="2.6" ry="6.4" transform="rotate(-115 100 25)"/><ellipse cx="89" cy="20" rx="2.6" ry="6.4" transform="rotate(-108 89 20)"/><ellipse cx="78" cy="17" rx="2.6" ry="6.4" transform="rotate(-100 78 17)"/></g>
</g>
<g filter="url(#l-f-small)" transform="translate(230 0) scale(-1 1)">
  <path d="M113 27 C100 18 84 12 62 11" fill="none" stroke="#6B4019" stroke-width="2"/>
  <g fill="url(#l-bronze)"><ellipse cx="104" cy="19" rx="2.6" ry="6.4" transform="rotate(-55 104 19)"/><ellipse cx="93" cy="14" rx="2.6" ry="6.4" transform="rotate(-68 93 14)"/><ellipse cx="82" cy="11" rx="2.6" ry="6.4" transform="rotate(-80 82 11)"/><ellipse cx="71" cy="10" rx="2.6" ry="6.4" transform="rotate(-88 71 10)"/><ellipse cx="100" cy="25" rx="2.6" ry="6.4" transform="rotate(-115 100 25)"/><ellipse cx="89" cy="20" rx="2.6" ry="6.4" transform="rotate(-108 89 20)"/><ellipse cx="78" cy="17" rx="2.6" ry="6.4" transform="rotate(-100 78 17)"/></g>
</g>
<rect filter="url(#l-f-metal)" x="74" y="318" width="82" height="19" rx="2" fill="url(#l-bronze)"/>
<text x="115.7" y="331.7" text-anchor="middle" font-family="'Frank Ruhl Libre', Georgia, serif" font-size="8.5" font-weight="700" letter-spacing="1.8" fill="#F0BE85">SAPERE AUDE</text>
<text x="115" y="331" text-anchor="middle" font-family="'Frank Ruhl Libre', Georgia, serif" font-size="8.5" font-weight="700" letter-spacing="1.8" fill="#2A1406">SAPERE AUDE</text>
`.trim();

// Silver — Renaissance: engraved scrollwork, rosettes, cartouche.
// Reference lines 157-189 (minus sheen at 163, minus twinkle at 189).
const SILVER_SVG = `
<path filter="url(#l-f-metal)" fill-rule="evenodd" d="M26 30 H204 V326 H26 Z M39 44 H191 V313 H39 Z" fill="url(#l-silver)"/>
<path d="M26 30 H204 L191 44 H39 Z" fill="#FFFFFF" opacity="0.3"/>
<path d="M26 30 V326 L39 313 V44 Z" fill="#FFFFFF" opacity="0.14"/>
<path d="M204 30 V326 L191 313 V44 Z" fill="#000000" opacity="0.12"/>
<path d="M26 326 H204 L191 313 H39 Z" fill="#000000" opacity="0.24"/>
<path d="M26 30 H204 V326 H26 Z M39 44 H191 V313 H39 Z" fill="none" stroke="#4A5058" stroke-width="1"/>
<g fill="none" stroke-width="0.9" stroke-linecap="round">
  <g stroke="#FFFFFF" transform="translate(0.7 0.7)">
    <path d="M46 37 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"/>
    <path d="M46 320 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"/>
    <path d="M32.5 58 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
    <path d="M197.5 58 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
  </g>
  <g stroke="#3C4148">
    <path d="M46 37 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"/>
    <path d="M46 320 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"/>
    <path d="M32.5 58 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
    <path d="M197.5 58 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
  </g>
</g>
<rect filter="url(#l-f-small)" x="38.5" y="43.5" width="153" height="270" fill="none" stroke="url(#l-silver)" stroke-width="4"/>
<g filter="url(#l-f-small)">
  <g transform="translate(32 37)"><circle r="10.5" fill="url(#l-silver)"/><g fill="#4A5058"><ellipse cy="-5" rx="1.5" ry="3.2"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(60)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(120)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(180)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(240)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(300)"/></g></g>
  <g transform="translate(198 37)"><circle r="10.5" fill="url(#l-silver)"/><g fill="#4A5058"><ellipse cy="-5" rx="1.5" ry="3.2"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(60)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(120)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(180)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(240)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(300)"/></g></g>
  <g transform="translate(32 320)"><circle r="10.5" fill="url(#l-silver)"/><g fill="#4A5058"><ellipse cy="-5" rx="1.5" ry="3.2"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(60)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(120)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(180)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(240)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(300)"/></g></g>
  <g transform="translate(198 320)"><circle r="10.5" fill="url(#l-silver)"/><g fill="#4A5058"><ellipse cy="-5" rx="1.5" ry="3.2"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(60)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(120)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(180)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(240)"/><ellipse cy="-5" rx="1.5" ry="3.2" transform="rotate(300)"/></g></g>
  <path d="M32 169 L39 178 L32 187 L25 178 Z M198 169 L205 178 L198 187 L191 178 Z" fill="url(#l-silver)"/>
</g>
<path filter="url(#l-f-metal)" d="M90 20 H140 C150 20 150 34 160 34 C150 34 150 48 140 48 H90 C80 48 80 34 70 34 C80 34 80 20 90 20 Z" fill="url(#l-silver)"/>
<path d="M94 25 H136 C142 25 142 34 148 34 C142 34 142 43 136 43 H94 C88 43 88 34 82 34 C88 34 88 25 94 25 Z" fill="none" stroke="#4A5058" stroke-width="0.8"/>
<path d="M115 27.5 L119.5 34 L115 40.5 L110.5 34 Z" fill="#4A5058"/>
`.trim();

// Gold — Baroque: acanthus corners, shell crest. Subject-tinted gem
// REMOVED from the render (reference line 219: <ellipse ... fill="url(#l-gem)">
// plus the small highlight at 220) — a CSS overlay in the app paints
// it live per subject using --frame-{subject}-field/-deep tokens.
// Reference lines 199-222 minus animated sheen at 205, minus twinkle
// at 221-222, and minus lines 219-220 (the gem + highlight).
const GOLD_SVG = `
<path filter="url(#l-f-metal)" fill-rule="evenodd" d="M22 26 H208 V330 H22 Z M39 44 H191 V313 H39 Z" fill="url(#l-gold)"/>
<path d="M22 26 H208 L191 44 H39 Z" fill="#FFFFFF" opacity="0.28"/>
<path d="M22 26 V330 L39 313 V44 Z" fill="#FFFFFF" opacity="0.12"/>
<path d="M208 26 V330 L191 313 V44 Z" fill="#000000" opacity="0.12"/>
<path d="M22 330 H208 L191 313 H39 Z" fill="#000000" opacity="0.24"/>
<path d="M22 26 H208 V330 H22 Z M39 44 H191 V313 H39 Z" fill="none" stroke="#5E4608" stroke-width="1"/>
<rect filter="url(#l-f-small)" x="30.5" y="35" width="169" height="286" fill="none" stroke="#D4AE3A" stroke-width="3" stroke-dasharray="0.1 4.4" stroke-linecap="round"/>
<rect filter="url(#l-f-small)" x="38.5" y="43.5" width="153" height="270" fill="none" stroke="url(#l-gold)" stroke-width="4"/>
<g filter="url(#l-f-metal)" fill="none" stroke-linecap="round">
  <g transform="translate(22 26)"><path d="M-8 44 C-12 18 2 -2 26 -6 C40 -8 50 2 44 11 C40 17 31 13 34 7" stroke="#C9A227" stroke-width="6"/><path d="M-6 50 C-2 62 6 66 12 60" stroke="#C9A227" stroke-width="4.5"/></g>
  <g transform="translate(208 26) scale(-1 1)"><path d="M-8 44 C-12 18 2 -2 26 -6 C40 -8 50 2 44 11 C40 17 31 13 34 7" stroke="#C9A227" stroke-width="6"/><path d="M-6 50 C-2 62 6 66 12 60" stroke="#C9A227" stroke-width="4.5"/></g>
  <g transform="translate(22 330) scale(1 -1)"><path d="M-8 44 C-12 18 2 -2 26 -6 C40 -8 50 2 44 11 C40 17 31 13 34 7" stroke="#C9A227" stroke-width="6"/><path d="M-6 50 C-2 62 6 66 12 60" stroke="#C9A227" stroke-width="4.5"/></g>
  <g transform="translate(208 330) scale(-1 -1)"><path d="M-8 44 C-12 18 2 -2 26 -6 C40 -8 50 2 44 11 C40 17 31 13 34 7" stroke="#C9A227" stroke-width="6"/><path d="M-6 50 C-2 62 6 66 12 60" stroke="#C9A227" stroke-width="4.5"/></g>
  <path d="M83 334 C93 346 104 339 115 331 C126 339 137 346 147 334" stroke="#C9A227" stroke-width="5.5"/>
</g>
<path filter="url(#l-f-metal)" d="M89 30 A26 26 0 0 1 141 30 Z" fill="url(#l-gold)"/>
<g stroke="#6E5410" stroke-width="1"><path d="M115 30 L91 20 M115 30 L96.6 11.6 M115 30 L105 6 M115 30 L115 4 M115 30 L125 6 M115 30 L133.4 11.6 M115 30 L139 20"/></g>
<g stroke="#FBEFB8" stroke-width="0.6" opacity="0.8" transform="translate(-0.8 0)"><path d="M115 30 L91 20 M115 30 L96.6 11.6 M115 30 L105 6 M115 30 L115 4 M115 30 L125 6 M115 30 L133.4 11.6 M115 30 L139 20"/></g>
<ellipse filter="url(#l-f-small)" cx="115" cy="31" rx="10" ry="7.5" fill="url(#l-gold)"/>
`.trim();

// Diamond — Modern: faceted violet + ice-blue crystal, sunburst,
// keyline notches. Reference lines 232-251 (minus animated sheen
// at 243, minus twinkle group at 252-257).
const DIAMOND_SVG = `
<g stroke-width="1.8" stroke-linecap="round" opacity="0.9"><path d="M115 20 L85 -6 M115 20 L105 -15 M115 20 L125 -15 M115 20 L145 -6 M115 20 L75 2" stroke="#C7B3EC"/><path d="M115 20 L95 -12 M115 20 L115 -17 M115 20 L135 -12 M115 20 L155 2" stroke="#BFE6F3"/></g>
<path filter="url(#l-f-crystal)" fill-rule="evenodd" d="M40 22 H190 V28 H200 V36 H208 V320 H200 V328 H190 V334 H40 V328 H30 V320 H22 V36 H30 V28 H40 Z M39 44 H191 V313 H39 Z" fill="url(#l-diamond)"/>
<g clip-path="url(#l-c-dia)">
  <path d="M20 20 H210 L191 44 H39 Z" fill="#FFFFFF" opacity="0.5"/>
  <path d="M20 20 V336 L39 313 V44 Z" fill="#FFFFFF" opacity="0.25"/>
  <path d="M210 20 V336 L191 313 V44 Z" fill="#6B4FA8" opacity="0.22"/>
  <path d="M20 336 H210 L191 313 H39 Z" fill="#4A3A78" opacity="0.36"/>
</g>
<path d="M40 22 H190 V28 H200 V36 H208 V320 H200 V328 H190 V334 H40 V328 H30 V320 H22 V36 H30 V28 H40 Z M39 44 H191 V313 H39 Z" fill="none" stroke="#5B4A8A" stroke-width="1.1"/>
<g stroke="#FFFFFF" stroke-width="1.1" fill="none"><path d="M22 36 L39 44 M208 36 L191 44 M22 320 L39 313 M208 320 L191 313 M22 178 L39 178 M208 178 L191 178 M58 22 L74 44 L90 22 M140 22 L156 44 L172 22 M58 334 L74 313 L90 334 M140 334 L156 313 L172 334 M22 110 L39 130 L22 150 M208 110 L191 130 L208 150 M22 206 L39 226 L22 246 M208 206 L191 226 L208 246"/></g>
<g stroke="#6B4FA8" stroke-width="0.6" fill="none" opacity="0.6"><path d="M30 28 L39 44 M200 28 L191 44 M30 328 L39 313 M200 328 L191 313 M90 22 L106 44 M124 44 L140 22 M90 334 L106 313 M124 313 L140 334"/></g>
<g filter="url(#l-f-small)" stroke="#5B4A8A" stroke-width="0.6" stroke-linejoin="round">
  <path d="M115 21 L103 14 L115 4 Z" fill="#FFFFFF"/>
  <path d="M115 21 L115 4 L127 14 Z" fill="#EFE6FB"/>
  <path d="M115 21 L127 14 L127 28 Z" fill="#C7B3EC"/>
  <path d="M115 21 L127 28 L115 38 Z" fill="#8E6CC8"/>
  <path d="M115 21 L115 38 L103 28 Z" fill="#A98BDB"/>
  <path d="M115 21 L103 28 L103 14 Z" fill="#F6F0FF"/>
</g>
`.trim();

const TIERS_REVEAL = {
  bronze:  BRONZE_SVG,
  silver:  SILVER_SVG,
  gold:    GOLD_SVG,
  diamond: DIAMOND_SVG,
};

// ─────────────────────────────────────────────────────────────────
// Pantheon set (3:4). Ported from
// thinker-frames-handoff/reference/frame-tiers-3x4.dc.html. IDs
// prefixed `p-*` (matches the reference) so this block reads
// side-by-side with the source; the reveal set uses `l-*` for the
// same purpose. Each render is a fresh isolated page, so the two
// namespaces never collide.
//
// Skipped from the reference: the p-sheen* gradients + p-c-band /
// p-c-dband clip paths (they only feed the animated sheen sweep,
// which is a CSS mask layered live at runtime), and every twinkle
// path (also CSS-live). What lands in the PNG is the static frame
// geometry only.
// ─────────────────────────────────────────────────────────────────
const SHARED_DEFS_PANTHEON = `
<defs>
<linearGradient id="p-bronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7A4A22"/><stop offset="0.45" stop-color="#C8894A"/><stop offset="0.55" stop-color="#E0A86A"/><stop offset="1" stop-color="#8C5A2B"/></linearGradient>
<linearGradient id="p-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A9098"/><stop offset="0.45" stop-color="#E8ECEF"/><stop offset="0.52" stop-color="#FFFFFF"/><stop offset="1" stop-color="#9EA4AB"/></linearGradient>
<linearGradient id="p-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A8841C"/><stop offset="0.45" stop-color="#E3C868"/><stop offset="0.52" stop-color="#F3DE8E"/><stop offset="1" stop-color="#C9A227"/></linearGradient>
<linearGradient id="p-diamond" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9DDF7"/><stop offset="0.18" stop-color="#FFFFFF"/><stop offset="0.34" stop-color="#C7B3EC"/><stop offset="0.5" stop-color="#F6F0FF"/><stop offset="0.66" stop-color="#A98BDB"/><stop offset="0.82" stop-color="#D6ECF7"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
<clipPath id="p-c-dia"><path d="M40 4 H260 V10 H276 V20 H296 V380 H276 V390 H260 V396 H40 V390 H24 V380 H4 V20 H24 V10 H40 Z"/></clipPath>
<mask id="p-m-gem" maskUnits="userSpaceOnUse" x="-30" y="-30" width="360" height="460"><rect x="-30" y="-30" width="360" height="460" fill="#FFFFFF"/><ellipse cx="150" cy="38" rx="7.5" ry="5.6" fill="#000000"/></mask>
<filter id="p-f-metal" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="blur"/>
  <feDiffuseLighting in="blur" surfaceScale="4" diffuseConstant="1.2" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
  <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1" specularExponent="28" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="55"/></feSpecularLighting>
  <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.1" k2="0" k3="0" k4="0" result="lit"/>
  <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0" result="shine"/>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="clip"/>
  <feDropShadow in="clip" dx="1.5" dy="3" stdDeviation="2.2" flood-color="#221A14" flood-opacity="0.38"/>
</filter>
<filter id="p-f-small" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="blur"/>
  <feDiffuseLighting in="blur" surfaceScale="3" diffuseConstant="1.2" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
  <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1" specularExponent="24" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="55"/></feSpecularLighting>
  <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.1" k2="0" k3="0" k4="0" result="lit"/>
  <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.8" k4="0" result="shine"/>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="clip"/>
  <feDropShadow in="clip" dx="1" dy="2" stdDeviation="1.2" flood-color="#221A14" flood-opacity="0.4"/>
</filter>
<filter id="p-f-crystal" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur"/>
  <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.4" specularExponent="40" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>
  <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
  <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="shine"/>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="clip"/>
  <feDropShadow in="clip" dx="1.5" dy="3" stdDeviation="2.5" flood-color="#3A2A66" flood-opacity="0.4"/>
</filter>
</defs>
`.trim();

// Bronze 3:4 — meander border wraps left/right/bottom-corners, laurel
// wreath sprays into the top corners, SAPERE AUDE plaque widened and
// moved to the top band (spec §10: "SAPERE AUDE plaque moves to the top
// band and widens, with laurel running out to the corners"). Recessed
// plate seat sits at x=100 y=360 inside the frame. Reference lines
// 71-112; skipped: sheen sweep at 79.
const BRONZE_SVG_3X4 = `
<path filter="url(#p-f-metal)" fill-rule="evenodd" d="M4 4 H296 V396 H4 Z M36 46 H264 V350 H36 Z" fill="url(#p-bronze)"/>
<path d="M4 4 H296 L264 46 H36 Z" fill="#FFFFFF" opacity="0.22"/>
<path d="M4 4 V396 L36 350 V46 Z" fill="#FFFFFF" opacity="0.1"/>
<path d="M296 4 V396 L264 350 V46 Z" fill="#000000" opacity="0.14"/>
<path d="M4 396 H296 L264 350 H36 Z" fill="#000000" opacity="0.26"/>
<path d="M4 4 H296 V396 H4 Z M36 46 H264 V350 H36 Z" fill="none" stroke="#3E220C" stroke-width="1"/>
<g fill="none" stroke-width="1">
  <g stroke="#F0BE85" opacity="0.8" transform="translate(0.7 0.7)">
    <path transform="translate(16 56) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path transform="translate(276 56) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path d="M42 381 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path d="M208 381 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
  </g>
  <g stroke="#3E220C" opacity="0.9">
    <path transform="translate(16 56) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path transform="translate(276 56) rotate(90)" d="M0 0 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path d="M42 381 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
    <path d="M208 381 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2 m5 5 v-8 h8 v6 h-5 v-3 h2"/>
  </g>
</g>
<g fill="#5E9C8A" opacity="0.5"><ellipse cx="20" cy="130" rx="4" ry="11"/><ellipse cx="280" cy="270" rx="4" ry="13"/><ellipse cx="236" cy="386" rx="12" ry="3"/><ellipse cx="60" cy="40" rx="10" ry="3"/></g>
<rect filter="url(#p-f-small)" x="34.5" y="44.5" width="231" height="307" fill="none" stroke="url(#p-bronze)" stroke-width="4"/>
<g filter="url(#p-f-small)" fill="url(#p-bronze)"><circle cx="20" cy="25" r="8.5"/><circle cx="280" cy="25" r="8.5"/><circle cx="20" cy="374" r="8.5"/><circle cx="280" cy="374" r="8.5"/></g>
<g filter="url(#p-f-small)">
  <path d="M86 24 C72 22 56 22 36 26" fill="none" stroke="#6B4019" stroke-width="2"/>
  <g fill="url(#p-bronze)"><ellipse cx="78" cy="18.5" rx="2.6" ry="6.4" transform="rotate(-72 78 18.5)"/><ellipse cx="67" cy="17.5" rx="2.6" ry="6.4" transform="rotate(-80 67 17.5)"/><ellipse cx="56" cy="18" rx="2.6" ry="6.4" transform="rotate(-86 56 18)"/><ellipse cx="45" cy="19.5" rx="2.6" ry="6.4" transform="rotate(-92 45 19.5)"/><ellipse cx="73" cy="29" rx="2.6" ry="6.4" transform="rotate(-108 73 29)"/><ellipse cx="62" cy="29.5" rx="2.6" ry="6.4" transform="rotate(-100 62 29.5)"/><ellipse cx="51" cy="31" rx="2.6" ry="6.4" transform="rotate(-96 51 31)"/></g>
</g>
<g filter="url(#p-f-small)" transform="translate(300 0) scale(-1 1)">
  <path d="M86 24 C72 22 56 22 36 26" fill="none" stroke="#6B4019" stroke-width="2"/>
  <g fill="url(#p-bronze)"><ellipse cx="78" cy="18.5" rx="2.6" ry="6.4" transform="rotate(-72 78 18.5)"/><ellipse cx="67" cy="17.5" rx="2.6" ry="6.4" transform="rotate(-80 67 17.5)"/><ellipse cx="56" cy="18" rx="2.6" ry="6.4" transform="rotate(-86 56 18)"/><ellipse cx="45" cy="19.5" rx="2.6" ry="6.4" transform="rotate(-92 45 19.5)"/><ellipse cx="73" cy="29" rx="2.6" ry="6.4" transform="rotate(-108 73 29)"/><ellipse cx="62" cy="29.5" rx="2.6" ry="6.4" transform="rotate(-100 62 29.5)"/><ellipse cx="51" cy="31" rx="2.6" ry="6.4" transform="rotate(-96 51 31)"/></g>
</g>
<rect filter="url(#p-f-metal)" x="88" y="10" width="124" height="28" rx="2" fill="url(#p-bronze)"/>
<rect x="92" y="14" width="116" height="20" rx="1" fill="none" stroke="#3E220C" stroke-width="0.7" opacity="0.8"/>
<text x="150.7" y="29.2" text-anchor="middle" font-family="'Frank Ruhl Libre', Georgia, serif" font-size="11.5" font-weight="700" letter-spacing="2.2" fill="#F0BE85">SAPERE AUDE</text>
<text x="150" y="28.5" text-anchor="middle" font-family="'Frank Ruhl Libre', Georgia, serif" font-size="11.5" font-weight="700" letter-spacing="2.2" fill="#2A1406">SAPERE AUDE</text>
<rect x="100" y="360" width="100" height="30" rx="4" fill="#2A1406" opacity="0.45"/>
<path d="M102 390 H198" stroke="#F0BE85" stroke-width="1" opacity="0.6"/>
`.trim();

// Silver 3:4 — full engraved scrollwork on all four sides, rosettes at
// every corner (true circles, per spec §10), central cartouche at top
// band with a diamond mark, side diamond marks at mid-height. Reference
// lines 114-151; skipped: sheen at 122, twinkle at 149.
const SILVER_SVG_3X4 = `
<path filter="url(#p-f-metal)" fill-rule="evenodd" d="M4 4 H296 V396 H4 Z M36 46 H264 V350 H36 Z" fill="url(#p-silver)"/>
<path d="M4 4 H296 L264 46 H36 Z" fill="#FFFFFF" opacity="0.3"/>
<path d="M4 4 V396 L36 350 V46 Z" fill="#FFFFFF" opacity="0.14"/>
<path d="M296 4 V396 L264 350 V46 Z" fill="#000000" opacity="0.12"/>
<path d="M4 396 H296 L264 350 H36 Z" fill="#000000" opacity="0.24"/>
<path d="M4 4 H296 V396 H4 Z M36 46 H264 V350 H36 Z" fill="none" stroke="#4A5058" stroke-width="1"/>
<g fill="none" stroke-width="0.9" stroke-linecap="round">
  <g stroke="#FFFFFF" transform="translate(0.7 0.7)">
    <path d="M20 48 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
    <path d="M280 48 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
    <path d="M38 25 q6 -5 12 0 t12 0 t12 0 t12 0 M214 25 q6 -5 12 0 t12 0 t12 0 t12 0 M42 375 q6 -5 12 0 t12 0 t12 0 t12 0 M210 375 q6 -5 12 0 t12 0 t12 0 t12 0"/>
  </g>
  <g stroke="#3C4148">
    <path d="M20 48 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
    <path d="M280 48 q-4 6 0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12 t0 12"/>
    <path d="M38 25 q6 -5 12 0 t12 0 t12 0 t12 0 M214 25 q6 -5 12 0 t12 0 t12 0 t12 0 M42 375 q6 -5 12 0 t12 0 t12 0 t12 0 M210 375 q6 -5 12 0 t12 0 t12 0 t12 0"/>
  </g>
</g>
<rect filter="url(#p-f-small)" x="34.5" y="44.5" width="231" height="307" fill="none" stroke="url(#p-silver)" stroke-width="4"/>
<g filter="url(#p-f-small)">
  <g transform="translate(20 25)"><circle r="14" fill="url(#p-silver)"/><circle r="11" fill="none" stroke="#4A5058" stroke-width="0.7"/><g fill="#4A5058"><ellipse cy="-6.5" rx="1.9" ry="4"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(45)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(90)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(135)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(180)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(225)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(270)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(315)"/></g><circle r="2.8" fill="url(#p-silver)" stroke="#4A5058" stroke-width="0.7"/></g>
  <g transform="translate(280 25)"><circle r="14" fill="url(#p-silver)"/><circle r="11" fill="none" stroke="#4A5058" stroke-width="0.7"/><g fill="#4A5058"><ellipse cy="-6.5" rx="1.9" ry="4"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(45)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(90)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(135)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(180)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(225)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(270)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(315)"/></g><circle r="2.8" fill="url(#p-silver)" stroke="#4A5058" stroke-width="0.7"/></g>
  <g transform="translate(20 375)"><circle r="14" fill="url(#p-silver)"/><circle r="11" fill="none" stroke="#4A5058" stroke-width="0.7"/><g fill="#4A5058"><ellipse cy="-6.5" rx="1.9" ry="4"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(45)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(90)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(135)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(180)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(225)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(270)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(315)"/></g><circle r="2.8" fill="url(#p-silver)" stroke="#4A5058" stroke-width="0.7"/></g>
  <g transform="translate(280 375)"><circle r="14" fill="url(#p-silver)"/><circle r="11" fill="none" stroke="#4A5058" stroke-width="0.7"/><g fill="#4A5058"><ellipse cy="-6.5" rx="1.9" ry="4"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(45)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(90)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(135)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(180)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(225)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(270)"/><ellipse cy="-6.5" rx="1.9" ry="4" transform="rotate(315)"/></g><circle r="2.8" fill="url(#p-silver)" stroke="#4A5058" stroke-width="0.7"/></g>
  <path d="M20 189 L27 198 L20 207 L13 198 Z M280 189 L287 198 L280 207 L273 198 Z" fill="url(#p-silver)"/>
</g>
<path filter="url(#p-f-metal)" d="M104 11 H196 C207 11 207 25 216 25 C207 25 207 39 196 39 H104 C93 39 93 25 84 25 C93 25 93 11 104 11 Z" fill="url(#p-silver)"/>
<path d="M107 15.5 H193 C200 15.5 200 25 206 25 C200 25 200 34.5 193 34.5 H107 C100 34.5 100 25 94 25 C100 25 100 15.5 107 15.5 Z" fill="none" stroke="#4A5058" stroke-width="0.8"/>
<path d="M150 18.5 L155 25 L150 31.5 L145 25 Z" fill="#4A5058"/>
<path d="M118 25 H138 M162 25 H182" stroke="#4A5058" stroke-width="0.8"/>
<rect x="100" y="360" width="100" height="30" rx="4" fill="#23282E" opacity="0.4"/>
<path d="M102 390 H198" stroke="#FFFFFF" stroke-width="1" opacity="0.7"/>
`.trim();

// Gold 3:4 — every layer inside the frame is masked by p-m-gem, which
// punches a 7.5 × 5.6 elliptical hole at (150, 38) for the CSS gem
// overlay. Shell crest sits on the top edge as a 9-rib half-fan (spec
// §10), acanthus scrolls at all four corners, decorative bottom scroll
// arms. Reference lines 153-183; skipped: sheen at 162, twinkles at
// 179-180, and the CSS gem overlay at 182 (the app paints it).
const GOLD_SVG_3X4 = `
<g mask="url(#p-m-gem)">
  <path filter="url(#p-f-metal)" fill-rule="evenodd" d="M4 4 H296 V396 H4 Z M36 46 H264 V350 H36 Z" fill="url(#p-gold)"/>
  <path d="M4 4 H296 L264 46 H36 Z" fill="#FFFFFF" opacity="0.28"/>
  <path d="M4 4 V396 L36 350 V46 Z" fill="#FFFFFF" opacity="0.12"/>
  <path d="M296 4 V396 L264 350 V46 Z" fill="#000000" opacity="0.12"/>
  <path d="M4 396 H296 L264 350 H36 Z" fill="#000000" opacity="0.24"/>
  <path d="M4 4 H296 V396 H4 Z M36 46 H264 V350 H36 Z" fill="none" stroke="#5E4608" stroke-width="1"/>
  <rect filter="url(#p-f-small)" x="12.5" y="12.5" width="275" height="375" fill="none" stroke="#D4AE3A" stroke-width="3" stroke-dasharray="0.1 4.4" stroke-linecap="round"/>
  <rect filter="url(#p-f-small)" x="34.5" y="44.5" width="231" height="307" fill="none" stroke="url(#p-gold)" stroke-width="4"/>
  <g filter="url(#p-f-metal)" fill="none" stroke-linecap="round">
    <g><path d="M16 120 C11 76 20 32 58 17 C74 11 86 20 80 30 C76 36 67 32 70 26" stroke="#C9A227" stroke-width="6"/><path d="M17 134 C21 145 29 147 33 141" stroke="#C9A227" stroke-width="4.5"/></g>
    <g transform="translate(300 0) scale(-1 1)"><path d="M16 120 C11 76 20 32 58 17 C74 11 86 20 80 30 C76 36 67 32 70 26" stroke="#C9A227" stroke-width="6"/><path d="M17 134 C21 145 29 147 33 141" stroke="#C9A227" stroke-width="4.5"/></g>
    <g transform="translate(0 400) scale(1 -1)"><path d="M16 120 C11 76 20 32 58 17 C74 11 86 20 80 30 C76 36 67 32 70 26" stroke="#C9A227" stroke-width="6"/><path d="M17 134 C21 145 29 147 33 141" stroke="#C9A227" stroke-width="4.5"/></g>
    <g transform="translate(300 400) scale(-1 -1)"><path d="M16 120 C11 76 20 32 58 17 C74 11 86 20 80 30 C76 36 67 32 70 26" stroke="#C9A227" stroke-width="6"/><path d="M17 134 C21 145 29 147 33 141" stroke="#C9A227" stroke-width="4.5"/></g>
    <path d="M97 375 C88 366 76 367 72 375 C69 382 75 387 80 383 M203 375 C212 366 224 367 228 375 C231 382 225 387 220 383" stroke="#C9A227" stroke-width="4"/>
  </g>
  <path filter="url(#p-f-metal)" d="M117.0 46.0 A6.8 6.8 0 0 1 119.5 33.4 A6.8 6.8 0 0 1 126.7 22.7 A6.8 6.8 0 0 1 137.4 15.5 A6.8 6.8 0 0 1 150.0 13.0 A6.8 6.8 0 0 1 162.6 15.5 A6.8 6.8 0 0 1 173.3 22.7 A6.8 6.8 0 0 1 180.5 33.4 A6.8 6.8 0 0 1 183.0 46.0 Z" fill="url(#p-gold)"/>
  <g stroke="#6E5410" stroke-width="1"><path d="M150 46 L119.5 33.4 M150 46 L126.7 22.7 M150 46 L137.4 15.5 M150 46 L150.0 13.0 M150 46 L162.6 15.5 M150 46 L173.3 22.7 M150 46 L180.5 33.4"/></g>
  <g stroke="#FBEFB8" stroke-width="0.6" opacity="0.8" transform="translate(-0.8 0)"><path d="M150 46 L119.5 33.4 M150 46 L126.7 22.7 M150 46 L137.4 15.5 M150 46 L150.0 13.0 M150 46 L162.6 15.5 M150 46 L173.3 22.7 M150 46 L180.5 33.4"/></g>
  <ellipse filter="url(#p-f-small)" cx="150" cy="38" rx="10.5" ry="8.2" fill="url(#p-gold)"/>
  <rect x="100" y="360" width="100" height="30" rx="4" fill="#3A2C04" opacity="0.4"/>
  <path d="M102 390 H198" stroke="#FBEFB8" stroke-width="1" opacity="0.7"/>
</g>
`.trim();

// Diamond 3:4 — notched octagonal outline (crystal-cut edge), sunburst
// half-disc composed of 12 faceted wedges at the top band (spec §10),
// central 6-facet diamond, bottom-corner facet gems, interior facet
// highlights along keyline notches. Reference lines 185-221; skipped:
// sheen at 197, twinkles at 214-219.
const DIAMOND_SVG_3X4 = `
<path filter="url(#p-f-crystal)" fill-rule="evenodd" d="M40 4 H260 V10 H276 V20 H296 V380 H276 V390 H260 V396 H40 V390 H24 V380 H4 V20 H24 V10 H40 Z M36 46 H264 V350 H36 Z" fill="url(#p-diamond)"/>
<g clip-path="url(#p-c-dia)">
  <path d="M0 0 H300 L264 46 H36 Z" fill="#FFFFFF" opacity="0.5"/>
  <path d="M0 0 V400 L36 350 V46 Z" fill="#FFFFFF" opacity="0.25"/>
  <path d="M300 0 V400 L264 350 V46 Z" fill="#6B4FA8" opacity="0.22"/>
  <path d="M0 400 H300 L264 350 H36 Z" fill="#4A3A78" opacity="0.36"/>
</g>
<path d="M40 4 H260 V10 H276 V20 H296 V380 H276 V390 H260 V396 H40 V390 H24 V380 H4 V20 H24 V10 H40 Z M36 46 H264 V350 H36 Z" fill="none" stroke="#5B4A8A" stroke-width="1.1"/>
<g stroke="#FFFFFF" stroke-width="1.1" fill="none"><path d="M4 20 L36 46 M296 20 L264 46 M4 380 L36 350 M296 380 L264 350 M4 198 L36 198 M296 198 L264 198 M4 100 L36 124 L4 148 M296 100 L264 124 L296 148 M4 250 L36 274 L4 298 M296 250 L264 274 L296 298 M56 396 L76 350 L96 396 M204 396 L224 350 L244 396 M56 4 L76 46 L96 4 M204 4 L224 46 L244 4"/></g>
<g stroke="#6B4FA8" stroke-width="0.6" fill="none" opacity="0.6"><path d="M24 10 L36 46 M276 10 L264 46 M24 390 L36 350 M276 390 L264 350"/></g>
<g filter="url(#p-f-small)">
  <path d="M150 46 L110.0 46.0 L111.4 35.6 Z M150 46 L115.4 26.0 L121.7 17.7 Z M150 46 L130.0 11.4 L139.6 7.4 Z M150 46 L150.0 6.0 L160.4 7.4 Z M150 46 L170.0 11.4 L178.3 17.7 Z M150 46 L184.6 26.0 L188.6 35.6 Z" fill="#FFFFFF" stroke="#8E6CC8" stroke-width="0.5" stroke-linejoin="round"/>
  <path d="M150 46 L111.4 35.6 L115.4 26.0 Z M150 46 L121.7 17.7 L130.0 11.4 Z M150 46 L139.6 7.4 L150.0 6.0 Z M150 46 L160.4 7.4 L170.0 11.4 Z M150 46 L178.3 17.7 L184.6 26.0 Z M150 46 L188.6 35.6 L190.0 46.0 Z" fill="#C7B3EC" stroke="#8E6CC8" stroke-width="0.5" stroke-linejoin="round"/>
</g>
<path d="M110.0 46.0 A40 40 0 0 1 190.0 46.0" fill="none" stroke="#5B4A8A" stroke-width="1.2"/>
<g filter="url(#p-f-small)" stroke="#5B4A8A" stroke-width="0.6" stroke-linejoin="round">
  <path d="M150 34 L141.3 29 L150 24 Z" fill="#FFFFFF"/>
  <path d="M150 34 L150 24 L158.7 29 Z" fill="#EFE6FB"/>
  <path d="M150 34 L158.7 29 L158.7 39 Z" fill="#C7B3EC"/>
  <path d="M150 34 L158.7 39 L150 44 Z" fill="#8E6CC8"/>
  <path d="M150 34 L150 44 L141.3 39 Z" fill="#A98BDB"/>
  <path d="M150 34 L141.3 39 L141.3 29 Z" fill="#F6F0FF"/>
</g>
<g filter="url(#p-f-small)" fill="url(#p-diamond)" stroke="#5B4A8A" stroke-width="0.8"><path d="M84 367 L92 375 L84 383 L76 375 Z M216 367 L224 375 L216 383 L208 375 Z"/></g>
<rect x="100" y="360" width="100" height="30" rx="4" fill="#2E1F5A" opacity="0.35"/>
<path d="M102 390 H198" stroke="#FFFFFF" stroke-width="1" opacity="0.8"/>
`.trim();

const TIERS_PANTHEON = {
  bronze:  BRONZE_SVG_3X4,
  silver:  SILVER_SVG_3X4,
  gold:    GOLD_SVG_3X4,
  diamond: DIAMOND_SVG_3X4,
};

// The two set descriptors. Both drive the same render pipeline.
const SETS = {
  reveal: {
    name: 'reveal',
    outDir: OUT_DIR_REVEAL,
    unitW: REVEAL_UNIT_W,
    unitH: REVEAL_UNIT_H,
    // Reveal viewBox starts at y=-16 to give room for the diamond
    // sunburst rays and gold shell crest that draw negative-y.
    viewBoxX: 0,
    viewBoxY: -16,
    renderW: REVEAL_RENDER_W,
    renderH: REVEAL_RENDER_H,
    defs: SHARED_DEFS_REVEAL,
    tiers: TIERS_REVEAL,
  },
  pantheon: {
    name: 'pantheon',
    outDir: OUT_DIR_PANTHEON,
    unitW: PANTHEON_UNIT_W,
    unitH: PANTHEON_UNIT_H,
    // Pantheon set draws entirely inside the 0..300 × 0..400 box;
    // spec §10 explicitly says nothing extends outside the box.
    viewBoxX: 0,
    viewBoxY: 0,
    renderW: PANTHEON_RENDER_W,
    renderH: PANTHEON_RENDER_H,
    defs: SHARED_DEFS_PANTHEON,
    tiers: TIERS_PANTHEON,
  },
};

// The full SVG for a (set, tier) pair. Reveal wraps its viewBox at
// (0, -16, 230, 376) so the overshoot region above/below the frame band
// (diamond rays reaching y=-15, gold scroll reaching y=346) lands inside
// the render surface. Pantheon draws entirely inside (0, 0, 300, 400)
// per spec §10.
function buildSvg(set, tier) {
  const body = set.tiers[tier];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${set.viewBoxX} ${set.viewBoxY} ${set.unitW} ${set.unitH}" width="${set.renderW}" height="${set.renderH}">
${set.defs}
${body}
</svg>`;
}

// Frank Ruhl Libre 700 (Latin subset) — bundled locally at
// scripts/fonts/frank-ruhl-libre-700-latin.woff2 and inlined into
// the render HTML as a base64 data URL. The bronze plaque's
// "SAPERE AUDE" copy needs this face; without it the plaque falls
// back to Georgia and the serif ductus doesn't match the approved
// reference. Bundling means the build is offline-safe and byte-
// deterministic (Google Fonts periodically re-versions the served
// URL, which would silently drift the render even when the visible
// output is identical).
//
// Weight-700 only — the SVG doesn't use any other weight. Latin
// subset only — SAPERE AUDE is 10 Latin glyphs plus a space; Hebrew
// / Cyrillic / Vietnamese subsets aren't referenced. If a future
// plaque tier adds Greek or Hebrew, add that subset here.
const FRL_WOFF2_PATH = path.join(ROOT, 'scripts', 'fonts', 'frank-ruhl-libre-700-latin.woff2');
const FRL_WOFF2_B64 = fs.readFileSync(FRL_WOFF2_PATH).toString('base64');

// Wraps the SVG in a transparent-body page so Playwright's screenshot
// with omitBackground:true captures pure alpha. Font-face is served
// from the inline base64 (no network dependency). A programmatic
// check runs after document.fonts.ready and throws if the specific
// face didn't apply — belt-and-braces against a corrupt WOFF2 or a
// browser bug from silently falling back to Georgia and shipping a
// plaque that visually diverges from the approved design.
function buildHtml(set, tier) {
  const svg = buildSvg(set, tier);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Frank Ruhl Libre';
    font-style: normal;
    font-weight: 700;
    font-display: block;
    src: url(data:font/woff2;base64,${FRL_WOFF2_B64}) format('woff2');
  }
  html, body { margin: 0; padding: 0; background: transparent; }
  .wrap { width: ${set.renderW}px; height: ${set.renderH}px; }
  .wrap svg { width: 100%; height: 100%; display: block; }
</style>
</head><body>
<div class="wrap">${svg}</div>
</body></html>`;
}

async function renderTier(page, set, tier) {
  const html = buildHtml(set, tier);
  await page.setContent(html, { waitUntil: 'networkidle' });
  // Fail-loud font check. document.fonts.load() explicitly triggers
  // the download+parse of the WOFF2 (vs. Chrome's default lazy-load
  // which only fires when an element that references the font paints
  // — and for SVG inside a filter chain the paint can happen after
  // the screenshot). Wait on the returned promise, then run a check
  // as belt-and-braces: a silent fallback to Georgia would ship a
  // plaque diverging from the approved reference.
  const fontOk = await page.evaluate(async () => {
    if (!document.fonts) return false;
    try {
      await document.fonts.load('700 8.5px "Frank Ruhl Libre"');
      await document.fonts.ready;
      return document.fonts.check('700 8.5px "Frank Ruhl Libre"');
    } catch (e) {
      return false;
    }
  });
  if (!fontOk) {
    throw new Error(
      'Frank Ruhl Libre 700 did not load — the bronze plaque would ' +
      'render in Georgia. Check that scripts/fonts/frank-ruhl-libre-' +
      '700-latin.woff2 exists and is a valid WOFF2, and that the ' +
      'inline base64 in buildHtml() decodes cleanly.'
    );
  }
  // Screenshot the exact render surface. omitBackground:true is what
  // preserves the transparent card window and everything outside
  // the frame path.
  const rawPng = await page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: set.renderW, height: set.renderH },
  });
  const outPath = path.join(set.outDir, tier + '.png');
  const tmpIn = outPath + '.tmp-in';
  const tmpOut = outPath + '.tmp-out';
  fs.writeFileSync(tmpIn, rawPng);
  try {
    // pngquant palette reduction. Same params as the sharp-era pass;
    // the input just comes from Chromium instead of librsvg now.
    execFileSync(pngquant, [
      '--quality=78-92',
      '--speed=1',
      '--strip',
      '--force',
      '--output', tmpOut,
      tmpIn,
    ]);
    fs.renameSync(tmpOut, outPath);
  } catch (e) {
    console.warn('pngquant failed for', set.name, tier, '— saving unquantised Chromium output:', e.message);
    fs.writeFileSync(outPath, rawPng);
  }
  fs.unlinkSync(tmpIn);
  const finalBytes = fs.statSync(outPath).size;
  return { set: set.name, tier, path: outPath, bytes: finalBytes };
}

async function main() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error('Chrome not found at', CHROME_PATH);
    console.error('Set CHROME_PATH=/path/to/chrome-binary and re-run.');
    process.exit(2);
  }
  const whichTier = (process.argv.find(a => a.startsWith('--tier=')) || '').split('=')[1];
  const whichSet  = (process.argv.find(a => a.startsWith('--set=')) || '').split('=')[1];
  const setList = whichSet ? [whichSet] : Object.keys(SETS);
  for (const s of setList) {
    if (!SETS[s]) {
      console.error('Unknown set:', s, '— known:', Object.keys(SETS).join(', '));
      process.exit(2);
    }
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--force-device-scale-factor=1'],
  });

  // Viewport is per-set — resize between sets so the screenshot clip
  // maps 1:1 to the render surface. We share the browser across sets
  // to keep the Chrome cold-start cost paid once.
  const perSetTotals = {};
  let grandTotal = 0;
  try {
    for (const sname of setList) {
      const set = SETS[sname];
      const context = await browser.newContext({
        viewport: { width: set.renderW, height: set.renderH },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const tierList = whichTier ? [whichTier] : Object.keys(set.tiers);
      console.log('▸ ' + sname + ' (' + set.renderW + '×' + set.renderH + ')');
      let setTotal = 0;
      for (const tier of tierList) {
        if (!set.tiers[tier]) {
          console.error('  Unknown tier for', sname + ':', tier);
          continue;
        }
        const r = await renderTier(page, set, tier);
        setTotal += r.bytes;
        console.log('  ' + tier.padEnd(8), (r.bytes / 1024).toFixed(1).padStart(6) + ' KB', ' ' + path.relative(ROOT, r.path));
      }
      perSetTotals[sname] = setTotal;
      grandTotal += setTotal;
      await context.close();
      console.log('  ' + '─'.repeat(50));
      console.log('  ' + 'subtotal'.padEnd(8), (setTotal / 1024).toFixed(1).padStart(6) + ' KB');
      console.log('');
    }
  } finally {
    await browser.close();
  }
  console.log('═'.repeat(52));
  for (const s of Object.keys(perSetTotals)) {
    console.log('  ' + s.padEnd(10), (perSetTotals[s] / 1024).toFixed(1).padStart(6) + ' KB');
  }
  console.log('  ' + 'grand total'.padEnd(10), (grandTotal / 1024).toFixed(1).padStart(6) + ' KB');
  console.log('  target: under 300 KB per set (reveal + pantheon budgeted separately)');
  const overBudget = Object.entries(perSetTotals).filter(([, b]) => b > 300 * 1024);
  if (overBudget.length) {
    console.log('  ⚠  over budget: ' + overBudget.map(([s]) => s).join(', ') + '. Investigate before committing.');
  } else {
    console.log('  ✓  every set under budget.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
