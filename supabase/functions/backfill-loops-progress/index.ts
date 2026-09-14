// One-shot backfill Edge Function.
//
// Iterates every auth.users row, joins user_progress, derives the five
// Loops properties (byte-identical to loops-progress), and PATCHes each
// contact via Loops /contacts/update. Paces at ~10 req/s to stay under
// Loops' documented rate ceiling.
//
// Reuses the loops_webhook_secret Vault entry for auth — same pattern
// as loops-signup / loops-progress. Not exposed to anon/authenticated.
//
// Intended as a one-off after the loops-progress migration lands, so
// users who haven't opened the app since then get their initial fields
// without waiting for the next sync. Safe to re-run — Loops updates are
// idempotent — but there's no point unless the derivation logic changes.
//
// Env vars (auto-populated by Supabase runtime):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOOPS_API_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-loops-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const LOOPS_UPDATE_URL = "https://app.loops.so/api/v1/contacts/update";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Mirror of the same helper in revenuecat-webhook. Kept duplicated
// intentionally — cross-function imports in Supabase Edge Functions add
// deploy complexity for a 20-line helper. Any change to the field shape
// must land in both places (rc-webhook is the real-time writer; this
// backfill sweeps the whole population on demand). loops-signup sets
// the same defaults on new-contact CREATE.
function deriveSubscriptionProps(row: any | null | undefined): {
  subscriptionStatus:           string;
  willRenew:                    boolean;
  subscriptionCurrentPeriodEnd: string | null;
  subscriptionPlatform:         string | null;
} {
  if (!row) {
    return {
      subscriptionStatus:           "none",
      willRenew:                    false,
      subscriptionCurrentPeriodEnd: null,
      subscriptionPlatform:         null,
    };
  }
  return {
    subscriptionStatus:           typeof row.status === "string" ? row.status : "none",
    willRenew:                    !!row.will_renew,
    subscriptionCurrentPeriodEnd: typeof row.current_period_end === "string" ? row.current_period_end : null,
    subscriptionPlatform:         typeof row.platform === "string" ? row.platform : null,
  };
}

// Validation mirror of cleanFirstName in loops-progress. Reject empty,
// whitespace-only, or letter-less strings; no length floor (single-letter
// names are normal in some languages). Cap at 40 chars.
function cleanFirstName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/\p{L}/u.test(trimmed)) return null;
  return trimmed.slice(0, 40);
}

// Same derivation as supabase/functions/loops-progress/index.ts. Kept
// duplicated intentionally — cross-function imports in Supabase edge
// functions add deploy complexity for a one-off script.
function deriveProgressProps(record: Record<string, unknown> | null | undefined) {
  const rec = record || {};
  const completedDays = Array.isArray(rec.completed_days) ? (rec.completed_days as string[]) : [];
  const chapterCompleteShown = Array.isArray(rec.chapter_complete_shown) ? (rec.chapter_complete_shown as string[]) : [];
  const hasPhilosophy = completedDays.some((k) => typeof k === "string" && k.startsWith("philosophy-"));
  const hasEconomics  = completedDays.some((k) => typeof k === "string" && k.startsWith("economics-"));
  let subjectsStarted: "philosophy" | "economics" | "both" | null = null;
  if (hasPhilosophy && hasEconomics) subjectsStarted = "both";
  else if (hasPhilosophy)            subjectsStarted = "philosophy";
  else if (hasEconomics)             subjectsStarted = "economics";
  // firstName: pulled from user_progress.onboarding_answers.name (jsonb,
  // migration 20260826150000). Validated by cleanFirstName above. Omitted
  // when invalid so the spread at the callsite doesn't clear an existing
  // Loops firstName that was set at signup from OAuth meta.
  const onboardingAnswers = (rec.onboarding_answers && typeof rec.onboarding_answers === "object")
    ? (rec.onboarding_answers as Record<string, unknown>)
    : {};
  const firstName = cleanFirstName(onboardingAnswers.name);
  // language: forwarded from user_progress.lang (migration 20260730120000).
  // Kept out of the returned object when the value is null / empty so the
  // spread at the callsite (body = { email, ...props }) omits the property
  // entirely — sending "" or null would clear Loops' language field.
  const props: Record<string, unknown> = {
    lastActiveAt:      typeof rec.last_active_at === "string" ? rec.last_active_at : null,
    // Fallback for users whose last_subject was never written: infer from
    // subjectsStarted when unambiguous; leave null when both were touched.
    lastSubject:       (typeof rec.last_subject === "string" && rec.last_subject)
                    || (subjectsStarted === "both" ? null : subjectsStarted),
    subjectsStarted,
    bonusUnlocked:     completedDays.some((k) => typeof k === "string" && k.startsWith("bonus")),
    chaptersCompleted: chapterCompleteShown.length,
  };
  if (typeof rec.lang === "string" && rec.lang) props.language = rec.lang;
  if (typeof rec.platform === "string" && rec.platform) props.platform = rec.platform;
  if (firstName) props.firstName = firstName;
  return props;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  const SUPABASE_URL              = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LOOPS_API_KEY             = Deno.env.get("LOOPS_API_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOOPS_API_KEY) {
    return jsonResponse({ ok: false, error: "Runtime env missing" }, 500);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Webhook-secret auth (reuses the Vault entry loops-signup + loops-progress
  // read from — rotating that row rotates auth for this function too).
  const { data: secretData, error: secretErr } = await admin.rpc("get_loops_webhook_secret");
  if (secretErr || typeof secretData !== "string") {
    console.error("[backfill] webhook secret RPC failed:", secretErr);
    return jsonResponse({ ok: false, error: "Webhook secret unavailable" }, 500);
  }
  const provided = req.headers.get("X-Loops-Webhook-Secret") || req.headers.get("x-loops-webhook-secret") || "";
  if (!timingSafeEqual(provided, secretData)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

  // Fetch every auth user + their (optional) progress row.
  const { data: rawUsers, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) {
    console.error("[backfill] listUsers failed:", usersErr);
    return jsonResponse({ ok: false, error: "Users fetch failed" }, 500);
  }
  const users = (rawUsers?.users || []).filter((u: any) => !!u.email);

  const { data: progressRows, error: progressErr } = await admin
    .from("user_progress")
    .select("user_id, last_active_at, last_subject, completed_days, chapter_complete_shown, lang, platform, onboarding_answers");
  if (progressErr) {
    console.error("[backfill] user_progress fetch failed:", progressErr);
    return jsonResponse({ ok: false, error: "Progress fetch failed" }, 500);
  }
  const byUser = new Map<string, any>();
  for (const row of progressRows || []) byUser.set(row.user_id, row);

  // Pull subscription rows so we can forward the four subscription-state
  // fields (subscriptionStatus / willRenew / subscriptionCurrentPeriodEnd
  // / subscriptionPlatform) on the same PATCH. Users without a row →
  // subscriptionStatus: 'none', willRenew: false, others null.
  const { data: subRows, error: subErr } = await admin
    .from("subscriptions")
    .select("user_id, status, will_renew, current_period_end, platform");
  if (subErr) {
    console.error("[backfill] subscriptions fetch failed:", subErr);
    return jsonResponse({ ok: false, error: "Subscriptions fetch failed" }, 500);
  }
  const subByUser = new Map<string, any>();
  for (const row of subRows || []) subByUser.set(row.user_id, row);

  const targets = users.map((u: any) => ({
    email: u.email as string,
    id:    u.id as string,
    props: {
      ...deriveProgressProps(byUser.get(u.id)),
      ...deriveSubscriptionProps(subByUser.get(u.id)),
    },
  }));

  if (dryRun) {
    return jsonResponse({
      ok: true,
      mode: "dry_run",
      totals: { users: users.length, progress_rows: progressRows?.length || 0 },
      sample: targets.slice(0, 5).map((t) => ({ email: t.email, ...t.props })),
    });
  }

  let updated = 0, notFound = 0, failed = 0;
  const errors: Array<{ email: string; status: number; error: string }> = [];
  const t0 = Date.now();

  for (const t of targets) {
    const body = { email: t.email, ...t.props };
    let attempt = 0, ok = false, lastStatus = 0, lastError = "";
    while (attempt < 2 && !ok) {
      try {
        const res = await fetch(LOOPS_UPDATE_URL, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${LOOPS_API_KEY}`,
          },
          body: JSON.stringify(body),
        });
        lastStatus = res.status;
        if (res.ok) { ok = true; break; }
        if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
          await sleep(1500);
          attempt += 1;
          continue;
        }
        try { lastError = (await res.text()).slice(0, 200); } catch (_) {}
        break;
      } catch (e) {
        lastError = String(e).slice(0, 200);
        if (attempt === 0) { await sleep(1500); attempt += 1; continue; }
        break;
      }
    }
    if (ok) updated += 1;
    else if (lastStatus === 404) { notFound += 1; errors.push({ email: t.email, status: 404, error: "contact not in Loops" }); }
    else { failed += 1; errors.push({ email: t.email, status: lastStatus, error: lastError }); }

    // ~10 req/s
    await sleep(100);
  }

  return jsonResponse({
    ok: true,
    mode: "live",
    totals: {
      users_total: users.length,
      progress_rows: progressRows?.length || 0,
      updated,
      not_found: notFound,
      failed,
      elapsed_seconds: Math.round((Date.now() - t0) / 1000),
    },
    errors: errors.slice(0, 20),
  }, 200);
});
