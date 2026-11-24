// Supabase Edge Function: loops-trial-ending-sweep
//
// Hourly-scheduled sweep that fires the Loops "trial_ending" event ~48h
// before a free trial converts to a paid subscription. One event per
// trial per user; dedup column (loops_trial_ending_sent_at) prevents
// re-firing.
//
// Candidate rule:
//   subscriptions.status = 'trial'
//   AND will_renew = true                      (user hasn't cancelled)
//   AND loops_trial_ending_sent_at IS NULL     (never fired before)
//   AND trial_end BETWEEN now()+36h AND now()+60h
//
// The 24h window (36h-60h-to-expiry, centered on 48h) is wider than a
// single cron interval so a missed hourly run self-heals on the next —
// the dedup column is what guarantees one-shot-per-user.
//
// English-only for now (Loops currently filters language = en for this
// campaign). The sweep filters user_progress.language = 'en' before
// sending. HE users get the event once the Loops copy lands.
//
// Properties sent to Loops per contact:
//   trialEndDate   : "Friday, November 28" (in user_progress.timezone,
//                    fallback UTC, EN format)
//   planName       : "yearly" | "monthly"
//   lastSubject    : from user_progress.last_subject (omitted when null)
//   language       : "en"
//
// No price in the payload. The email copy doesn't include one, so the
// sweep deliberately carries no per-SKU table, no currency read, and
// no risk of a wrong localised amount appearing in the inbox.
//
// Modes:
//   ?mode=dry  → compute candidates + resolved properties, return JSON,
//                don't PATCH, don't POST, don't stamp.
//   default    → live: PATCH contact, POST event, stamp dedup column.
//
// Auth: X-Loops-Webhook-Secret (same shared Vault secret as the other
// Loops sweeps). Pg_cron migration schedules this hourly.
//
// Required env vars:
//   SUPABASE_URL                 (auto)
//   SUPABASE_SERVICE_ROLE_KEY    (auto)
//   LOOPS_API_KEY                (manual)
// Webhook secret: NOT an env var. Read via the get_loops_webhook_secret
// RPC which pulls from vault.decrypted_secrets. Rotating that one row
// rotates auth for every Loops sweep at once. Same pattern as
// loops-inactive-sweep.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-loops-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const LOOPS_UPDATE_URL = "https://app.loops.so/api/v1/contacts/update";
const LOOPS_EVENTS_URL = "https://app.loops.so/api/v1/events/send";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Masks the local-part of an email to the first two characters so a
// dry-run report can be eyeballed without leaking a prod user list.
// "alice@example.com" → "al***@example.com". Leaves domain intact.
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return email;
  const local  = email.slice(0, at);
  const domain = email.slice(at);
  const keep   = local.slice(0, 2);
  return `${keep}***${domain}`;
}

// Product → plan family. Any yearly SKU → "yearly"; anything else →
// "monthly". Unknown SKUs are treated as "monthly" conservatively —
// the email body is driven by this label only for grammatical fit.
function planNameFor(productId: string | null): "yearly" | "monthly" {
  if (!productId) return "monthly";
  return productId.includes("yearly") ? "yearly" : "monthly";
}

// EN format, timezone-aware. "Friday, November 28" shape.
function formatTrialEndDate(iso: string, timezone: string | null): string {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month:   "long",
      day:     "numeric",
      timeZone: timezone || "UTC",
    }).format(d);
  } catch (_) {
    // Bad IANA zone → fall back to UTC rather than crashing the row.
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month:   "long",
      day:     "numeric",
      timeZone: "UTC",
    }).format(d);
  }
}

// ─── Loops helpers ──────────────────────────────────────────────────────

async function patchContact(
  email: string,
  body: Record<string, unknown>,
  apiKey: string,
): Promise<{ ok: boolean; status: number; error: string }> {
  let attempt = 0;
  while (attempt < 2) {
    try {
      const res = await fetch(LOOPS_UPDATE_URL, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email, ...body }),
      });
      if (res.ok) return { ok: true, status: res.status, error: "" };
      if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
        await sleep(1500); attempt += 1; continue;
      }
      let errText = "";
      try { errText = (await res.text()).slice(0, 200); } catch (_) {}
      return { ok: false, status: res.status, error: errText };
    } catch (e) {
      if (attempt === 0) { await sleep(1500); attempt += 1; continue; }
      return { ok: false, status: 0, error: String(e).slice(0, 200) };
    }
  }
  return { ok: false, status: 0, error: "retries exhausted" };
}

async function sendEvent(
  email: string,
  userId: string,
  eventName: string,
  apiKey: string,
): Promise<{ ok: boolean; status: number; error: string }> {
  try {
    const res = await fetch(LOOPS_EVENTS_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email, eventName, userId }),
    });
    if (res.ok) return { ok: true, status: res.status, error: "" };
    let errText = "";
    try { errText = (await res.text()).slice(0, 200); } catch (_) {}
    return { ok: false, status: res.status, error: errText };
  } catch (e) {
    return { ok: false, status: 0, error: String(e).slice(0, 200) };
  }
}

// ─── Candidate shape ────────────────────────────────────────────────────

type Candidate = {
  userId:   string;
  email:    string;
  productId: string | null;
  trialEnd:  string;    // ISO-8601
  timezone:  string | null;
  language:  string;
  lastSubject: string | null;
  // Resolved for the Loops PATCH:
  trialEndDate: string;
  planName:     "yearly" | "monthly";
};

// ─── Main handler ───────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LOOPS_API_KEY             = Deno.env.get("LOOPS_API_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ ok: false, error: "Supabase env missing" }, 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Shared webhook secret, read from vault via RPC. Same pattern as
  // loops-inactive-sweep — one Vault row (loops_webhook_secret) covers
  // every Loops sweep, rotated together.
  const { data: secretData, error: secretErr } = await admin.rpc("get_loops_webhook_secret");
  if (secretErr || typeof secretData !== "string") {
    console.error("[trial-ending-sweep] webhook secret RPC failed:", secretErr);
    return jsonResponse({ ok: false, error: "Webhook secret unavailable" }, 500);
  }
  const provided = req.headers.get("X-Loops-Webhook-Secret") || req.headers.get("x-loops-webhook-secret") || "";
  if (!timingSafeEqual(provided, secretData)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  const url  = new URL(req.url);
  const mode = url.searchParams.get("mode") === "dry" ? "dry" : "live";
  if (mode === "live" && !LOOPS_API_KEY) {
    return jsonResponse({ ok: false, error: "LOOPS_API_KEY unset for live mode" }, 500);
  }

  // ── Candidate query ────────────────────────────────────────────────
  // trial_end in [now()+36h, now()+60h]. Supabase JS can't call now()
  // server-side; compute the bounds in JS, which is fine — the clock
  // drift between the edge runtime and PG is negligible for a 24h
  // window.
  const NOW   = Date.now();
  const H     = 3600 * 1000;
  const LOWER = new Date(NOW + 36 * H).toISOString();
  const UPPER = new Date(NOW + 60 * H).toISOString();

  const { data: subRows, error: subErr } = await admin
    .from("subscriptions")
    .select("user_id, product_id, trial_end, will_renew, status, loops_trial_ending_sent_at")
    .eq("status",       "trial")
    .eq("will_renew",   true)
    .is("loops_trial_ending_sent_at", null)
    .gte("trial_end",   LOWER)
    .lte("trial_end",   UPPER);
  if (subErr) {
    console.error("[trial-ending-sweep] subscriptions fetch failed:", subErr);
    return jsonResponse({ ok: false, error: "subscriptions fetch failed" }, 500);
  }
  const subs = (subRows || []) as Array<{
    user_id: string; product_id: string | null;
    trial_end: string; will_renew: boolean; status: string;
    loops_trial_ending_sent_at: string | null;
  }>;
  if (subs.length === 0) {
    return jsonResponse({ ok: true, mode, window: { lower: LOWER, upper: UPPER }, candidates: [], totals: { eligible: 0 } }, 200);
  }

  // user_progress for timezone + language + last_subject.
  const userIds = subs.map(s => s.user_id);
  const { data: progRows, error: progErr } = await admin
    .from("user_progress")
    .select("user_id, timezone, language, last_subject")
    .in("user_id", userIds);
  if (progErr) {
    console.error("[trial-ending-sweep] user_progress fetch failed:", progErr);
    return jsonResponse({ ok: false, error: "user_progress fetch failed" }, 500);
  }
  const progById = new Map<string, { timezone: string | null; language: string | null; last_subject: string | null }>();
  for (const r of (progRows || []) as Array<{ user_id: string; timezone: string | null; language: string | null; last_subject: string | null }>) {
    progById.set(r.user_id, { timezone: r.timezone, language: r.language, last_subject: r.last_subject });
  }

  // auth.users for email. Paginated listUsers — same pattern as
  // loops-inactive-sweep (perPage caps at 1000).
  const emailById = new Map<string, string>();
  const PER_PAGE  = 1000;
  for (let page = 1; ; page += 1) {
    const { data: userRows, error: userErr } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (userErr) {
      console.error("[trial-ending-sweep] listUsers failed:", userErr);
      return jsonResponse({ ok: false, error: "users fetch failed" }, 500);
    }
    const batch = (userRows?.users || []) as Array<{ id: string; email: string | null }>;
    for (const u of batch) { if (u && u.id && u.email) emailById.set(u.id, u.email); }
    if (batch.length < PER_PAGE) break;
  }

  // Resolve per-row properties, applying skip rules.
  const candidates: Candidate[] = [];
  const skipped: Array<{ userId: string; reason: string }> = [];
  for (const s of subs) {
    const email = emailById.get(s.user_id);
    if (!email) { skipped.push({ userId: s.user_id, reason: "no_email" }); continue; }
    const prog  = progById.get(s.user_id) || { timezone: null, language: null, last_subject: null };
    // English-only for now. HE users skipped until the Loops copy lands.
    if (prog.language !== "en") {
      skipped.push({ userId: s.user_id, reason: `language=${prog.language ?? "null"}` });
      continue;
    }
    const trialEndDate = formatTrialEndDate(s.trial_end, prog.timezone);
    candidates.push({
      userId:      s.user_id,
      email,
      productId:   s.product_id,
      trialEnd:    s.trial_end,
      timezone:    prog.timezone,
      language:    "en",
      lastSubject: prog.last_subject,
      trialEndDate,
      planName:    planNameFor(s.product_id),
    });
  }

  // ── Dry-run: report + exit ─────────────────────────────────────────
  if (mode === "dry") {
    return jsonResponse({
      ok: true,
      mode,
      window: { lower: LOWER, upper: UPPER },
      totals: { eligible: candidates.length, skipped: skipped.length, raw_rows: subs.length },
      candidates: candidates.map(c => ({
        userId:    c.userId,
        email:     maskEmail(c.email),
        productId: c.productId,
        trialEnd:  c.trialEnd,
        timezone:  c.timezone,
        properties: {
          trialEndDate: c.trialEndDate,
          planName:     c.planName,
          lastSubject:  c.lastSubject,
          language:     c.language,
        },
      })),
      skipped,
    }, 200);
  }

  // ── Live: PATCH + POST + stamp ─────────────────────────────────────
  let sent = 0, failedPatch = 0, failedEvent = 0, failedStamp = 0;
  const errors: Array<{ userId: string; stage: string; status: number; error: string }> = [];
  for (const c of candidates) {
    const patchBody: Record<string, unknown> = {
      trialEndDate: c.trialEndDate,
      planName:     c.planName,
      language:     c.language,
    };
    // lastSubject: send only when non-null so we don't clobber an
    // existing value in Loops with null for a user whose row is sparse.
    if (c.lastSubject) patchBody.lastSubject = c.lastSubject;

    const p = await patchContact(c.email, patchBody, LOOPS_API_KEY!);
    if (!p.ok) {
      failedPatch += 1;
      errors.push({ userId: c.userId, stage: "patch", status: p.status, error: p.error });
      await sleep(100);
      continue;
    }
    const ev = await sendEvent(c.email, c.userId, "trial_ending", LOOPS_API_KEY!);
    if (!ev.ok) {
      failedEvent += 1;
      errors.push({ userId: c.userId, stage: "event", status: ev.status, error: ev.error });
      await sleep(100);
      continue;
    }
    // Stamp dedup column. Failure here only means we may re-send on the
    // next sweep — log and move on.
    const { error: stampErr } = await admin
      .from("subscriptions")
      .update({ loops_trial_ending_sent_at: new Date().toISOString() })
      .eq("user_id", c.userId);
    if (stampErr) {
      failedStamp += 1;
      errors.push({ userId: c.userId, stage: "stamp", status: 0, error: String(stampErr).slice(0, 200) });
    }
    sent += 1;
    await sleep(100);
  }

  return jsonResponse({
    ok: true,
    mode,
    window: { lower: LOWER, upper: UPPER },
    totals: {
      eligible: candidates.length,
      skipped:  skipped.length,
      sent,
      failed_patch: failedPatch,
      failed_event: failedEvent,
      failed_stamp: failedStamp,
    },
    errors,
  }, 200);
});
