// Supabase Edge Function: loops-inactive-sweep
//
// Daily-scheduled sweep that flips two Loops contact properties for
// users who have lapsed:
//   inactive7d   — last_active_at between 7 and 60 days ago
//   inactive14d  — last_active_at between 14 and 60 days ago
//
// Wide windows (not one-day-crossing) by design. At Corpus's current
// scale a few hundred PATCHes a day is negligible, and Loops treats an
// identical value as a no-op — no workflow re-trigger. A missed run
// then corrects itself the next day instead of silently skipping the
// users whose threshold fell during the outage. The 60-day upper cap
// stops us from pinging long-dormant contacts (sender-reputation
// hygiene; those users are typically pruned from the mailable set
// anyway once they're deep enough into a bounce/complaint pattern).
//
// Paying users are NOT filtered out at the query level — a lapsed
// subscriber is exactly who we want to re-engage. If a given Loops
// workflow should skip paid users, gate that on subscriptionStatus at
// the campaign layer, not here.
//
// Reset semantics: loops-progress writes { inactive7d: false,
// inactive14d: false } on every real activity trigger, so a returning
// user's next open (via _bumpLastActiveIfNeeded or a real dialogue
// completion) clears both flags before this sweep next runs.
//
// Auth: shared secret in the X-Loops-Webhook-Secret header. Same Vault
// entry (loops_webhook_secret) the sibling Loops functions use — one
// rotation covers loops-signup, loops-progress, backfill-loops-progress,
// and this function.
//
// Trigger: the pg_cron migration schedules a daily 09:00 UTC net.http_post
// to this endpoint with the secret. Also runnable ad-hoc:
//
//   curl -X POST 'https://<project>.supabase.co/functions/v1/loops-inactive-sweep' \
//        -H 'X-Loops-Webhook-Secret: <secret>'
//
// Required env vars (auto-populated by Supabase Edge Functions runtime):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
// Required env vars (set manually via `supabase secrets set`):
//   - LOOPS_API_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
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

  // Webhook-secret auth. Reuses the loops_webhook_secret Vault entry;
  // rotating that one row rotates auth for every Loops function at once.
  const { data: secretData, error: secretErr } = await admin.rpc("get_loops_webhook_secret");
  if (secretErr || typeof secretData !== "string") {
    console.error("[sweep] webhook secret RPC failed:", secretErr);
    return jsonResponse({ ok: false, error: "Webhook secret unavailable" }, 500);
  }
  const provided = req.headers.get("X-Loops-Webhook-Secret") || req.headers.get("x-loops-webhook-secret") || "";
  if (!timingSafeEqual(provided, secretData)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  // Fetch user_progress rows in the 7-to-60-day window. All 14d rows
  // are a subset (14 ≤ daysSince ≤ 60), so we only query the 7d
  // window and derive the 14d subset in memory — one round-trip, one
  // join, and the client-side split is trivial. Emails come from a
  // separate auth.users select because Supabase doesn't expose a
  // one-shot JOIN across schemas in supabase-js v2. Rows without an
  // auth.users match (deleted account, missed FK) are skipped.
  const NOW      = Date.now();
  const DAY_MS   = 86400000;
  const upper    = new Date(NOW - 7  * DAY_MS).toISOString();   // last_active_at < upper
  const lower    = new Date(NOW - 60 * DAY_MS).toISOString();   // last_active_at >= lower
  const fourteen = new Date(NOW - 14 * DAY_MS).toISOString();

  const { data: progressRows, error: progressErr } = await admin
    .from("user_progress")
    .select("user_id, last_active_at")
    .gte("last_active_at", lower)
    .lt("last_active_at", upper);
  if (progressErr) {
    console.error("[sweep] user_progress fetch failed:", progressErr);
    return jsonResponse({ ok: false, error: "Progress fetch failed" }, 500);
  }
  const rows = progressRows || [];
  if (rows.length === 0) {
    return jsonResponse({ ok: true, mode: "no_candidates", totals: { seven_day: 0, fourteen_day: 0 } }, 200);
  }

  // Paginate listUsers. perPage caps at 1000 in supabase-js; a single
  // call reads at most 1000 rows regardless of the total. Loop until a
  // page comes back short, which is the API's implicit "no more".
  // Without this, past 1,000 users the sweep silently skips the tail.
  const emailById = new Map<string, string>();
  const PER_PAGE = 1000;
  for (let page = 1; ; page += 1) {
    const { data: userRows, error: userErr } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (userErr) {
      console.error("[sweep] listUsers page", page, "failed:", userErr);
      return jsonResponse({ ok: false, error: "Users fetch failed" }, 500);
    }
    const batch = (userRows?.users || []) as any[];
    for (const u of batch) {
      if (u && u.id && u.email) emailById.set(u.id, u.email as string);
    }
    if (batch.length < PER_PAGE) break;
  }

  // One target list; both flags decided per contact and shipped in a
  // single PATCH. Two separate passes would let the day-7 Loops
  // workflow fire and evaluate inactive14d BEFORE the second pass
  // set it, so a "day 7 email only when inactive14d = false" filter
  // would never catch a 7-13 day user. Bundling both flags into one
  // request removes the race.
  //   7 to 14 days:  { inactive7d: true, inactive14d: false }
  //   14 to 60 days: { inactive7d: true, inactive14d: true }
  const targets: Array<{ email: string; inactive14d: boolean }> = [];
  for (const r of rows) {
    const email = emailById.get((r as any).user_id);
    if (!email) continue;
    const lastActive = (r as any).last_active_at;
    const is14 = typeof lastActive === "string" && lastActive < fourteen;
    targets.push({ email, inactive14d: is14 });
  }

  const t0 = Date.now();
  let updated = 0, failed = 0;
  let sevenOnlyCount = 0, fourteenCount = 0;
  const errors: Array<{ email: string; status: number; error: string }> = [];

  async function patch(email: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; error: string }> {
    let attempt = 0;
    while (attempt < 2) {
      try {
        const res = await fetch(LOOPS_UPDATE_URL, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${LOOPS_API_KEY}`,
          },
          body: JSON.stringify({ email, ...body }),
        });
        if (res.ok) return { ok: true, status: res.status, error: "" };
        if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
          await sleep(1500);
          attempt += 1;
          continue;
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

  // ~10 req/s; a 300-user day finishes in 30 seconds. Half the API
  // calls of the previous two-pass version.
  for (const t of targets) {
    const r = await patch(t.email, { inactive7d: true, inactive14d: t.inactive14d });
    if (r.ok) {
      updated += 1;
      if (t.inactive14d) fourteenCount += 1; else sevenOnlyCount += 1;
    } else {
      failed += 1;
      errors.push({ email: t.email, status: r.status, error: r.error });
    }
    await sleep(100);
  }

  return jsonResponse({
    ok: true,
    mode: "live",
    totals: {
      candidates:      targets.length,
      updated,
      failed,
      seven_day_only:  sevenOnlyCount,   // { inactive7d: true, inactive14d: false }
      fourteen_day:    fourteenCount,    // { inactive7d: true, inactive14d: true  }
      elapsed_seconds: Math.round((Date.now() - t0) / 1000),
    },
    errors_sample: errors.slice(0, 10),
  }, 200);
});
