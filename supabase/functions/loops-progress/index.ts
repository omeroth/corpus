// Supabase Edge Function: loops-progress
//
// Called by the Postgres trigger notify_loops_progress on user_progress
// INSERT / UPDATE-of-last_active_at (via pg_net). Updates the user's Loops
// contact with re-engagement signals derived from the row.
//
// Mirrors loops-signup end-to-end:
//   - Same shared-secret pattern: Vault entry 'loops_webhook_secret' read
//     by the trigger AND by this function via get_loops_webhook_secret().
//     Rotate once, both integrations rotate together.
//   - Same webhook shape (type / schema / table / record / old_record).
//   - Same "no email, no problem" handling.
//   - Same 200-for-processed / 5xx-for-retryable return semantics.
//
// Derived Loops contact properties written per call:
//   lastActiveAt      : ISO from user_progress.last_active_at
//   lastSubject       : 'philosophy' | 'economics' | 'psychology'
//                       (from user_progress.last_subject)
//   subjectsStarted   : sorted comma-joined slug list of every subject
//                       the user has completed a dialogue in — e.g.
//                       'philosophy', 'economics', 'psychology',
//                       'economics,philosophy', 'philosophy,psychology',
//                       'economics,philosophy,psychology'. Loops "contains"
//                       filters answer "who has started X?"; "equals"
//                       filters answer "who has ONLY started X?".
//                       (Was 'philosophy' | 'economics' | 'both' before
//                       psychology went live — the two-of-three "both"
//                       enum couldn't represent psychology-touching users.)
//   bonusUnlocked     : boolean (any completed_days key starts with 'bonus')
//   chaptersCompleted : number (length of chapter_complete_shown)
//   inactive7d        : always false. Real activity resets the flag; the
//                       daily loops-inactive-sweep function sets it back
//                       to true when the user's last_active_at falls
//                       between 7 and 60 days ago.
//   inactive14d       : same shape, 14-to-60-day window.
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

let _cachedSecret: string | null = null;

async function getWebhookSecret(): Promise<string | null> {
  if (_cachedSecret !== null) return _cachedSecret;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[loops-progress] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    return null;
  }
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.rpc("get_loops_webhook_secret");
  if (error || !data || typeof data !== "string") {
    console.error("[loops-progress] Vault lookup via get_loops_webhook_secret RPC failed:", error);
    return null;
  }
  _cachedSecret = data;
  return _cachedSecret;
}

// Validates a candidate first-name string against a minimal "is this
// plausibly a name?" rule. No length floor — single-letter names are
// normal in Chinese and Korean, and two-letter names appear across
// many languages. Rejecting them would tell real people their name
// is invalid. We reject only what's clearly not a name: empty,
// whitespace-only, or containing no letters at all in any script.
// Cap at 40 chars to match the client-side .slice(0, 40) in the
// onboarding name capture — never send more than the client allowed.
// Returns the cleaned name (trimmed + capped) or null if it fails.
function cleanFirstName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // \p{L} matches any Unicode letter (Latin, Hebrew, CJK, Cyrillic,
  // Arabic, etc.). A candidate with zero letters is a numeric string,
  // punctuation, or symbols — not a name.
  if (!/\p{L}/u.test(trimmed)) return null;
  return trimmed.slice(0, 40);
}

// Derives the Loops contact properties from the user_progress row snapshot.
// Kept pure so it's trivial to unit-test if we ever add a test harness.
function deriveProgressProps(record: Record<string, unknown>) {
  const completedDays = Array.isArray(record.completed_days)
    ? (record.completed_days as string[])
    : [];
  const chapterCompleteShown = Array.isArray(record.chapter_complete_shown)
    ? (record.chapter_complete_shown as string[])
    : [];

  // Any subject the user has completed at least one dialogue in.
  // Collected in a stable alphabetical order (economics < philosophy
  // < psychology) so the same set of subjects always renders as the
  // same string — a user who started philosophy then economics
  // shouldn't cache-bust "economics,philosophy" into "philosophy,
  // economics" on the next sync.
  const subjects: string[] = [];
  if (completedDays.some((k) => typeof k === "string" && k.startsWith("economics-")))  subjects.push("economics");
  if (completedDays.some((k) => typeof k === "string" && k.startsWith("philosophy-"))) subjects.push("philosophy");
  if (completedDays.some((k) => typeof k === "string" && k.startsWith("psychology-"))) subjects.push("psychology");
  const subjectsStarted: string | null = subjects.length > 0 ? subjects.join(",") : null;

  const bonusUnlocked = completedDays.some((k) => typeof k === "string" && k.startsWith("bonus"));

  // First name from onboarding capture. onboarding_answers is a jsonb
  // column (migration 20260826150000). Loops' /contacts/update is an
  // idempotent PATCH, so re-sending the same firstName every sync is
  // harmless. When onboarding_answers.name fails validation, firstName
  // is omitted from the payload — Loops keeps whatever value was set
  // at signup from OAuth's raw_user_meta_data.full_name. This is by
  // design: a bad onboarding input shouldn't overwrite a good OAuth
  // name, and there's no harm in leaving one field alone.
  const onboardingAnswers = (record.onboarding_answers && typeof record.onboarding_answers === "object")
    ? (record.onboarding_answers as Record<string, unknown>)
    : {};
  const firstName = cleanFirstName(onboardingAnswers.name);

  // language: forwarded from user_progress.lang (added in migration
  // 20260730120000_user_progress_lang.sql). Only included in the derived
  // props when the record has a non-empty string — null / missing stays
  // absent so the Loops payload omits the property rather than sending
  // "" or null, which Loops would treat as a clear.
  const props: Record<string, unknown> = {
    lastActiveAt:      typeof record.last_active_at === "string" ? record.last_active_at : null,
    lastSubject:       typeof record.last_subject   === "string" ? record.last_subject   : null,
    subjectsStarted,
    bonusUnlocked,
    chaptersCompleted: chapterCompleteShown.length,
    // Reset the two inactivity flags every time the user does something
    // real. The daily loops-inactive-sweep function flips them back to
    // true when last_active_at re-crosses the corresponding threshold.
    inactive7d:  false,
    inactive14d: false,
  };
  if (typeof record.lang === "string" && record.lang) props.language = record.lang;
  if (typeof record.platform === "string" && record.platform) props.platform = record.platform;
  if (firstName) props.firstName = firstName;
  return props;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const LOOPS_API_KEY = Deno.env.get("LOOPS_API_KEY");
  if (!LOOPS_API_KEY) {
    console.error("[loops-progress] LOOPS_API_KEY not set");
    return jsonResponse({ ok: false, error: "Loops key not configured" }, 500);
  }

  const webhookSecret = await getWebhookSecret();
  if (!webhookSecret) {
    return jsonResponse({ ok: false, error: "Webhook secret unavailable" }, 500);
  }

  const provided = req.headers.get("X-Loops-Webhook-Secret")
                || req.headers.get("x-loops-webhook-secret")
                || "";
  if (!timingSafeEqual(provided, webhookSecret)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (_) {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }
  if (payload?.schema !== "public" || payload?.table !== "user_progress") {
    console.log("[loops-progress] ignoring non-progress event", {
      type: payload?.type, schema: payload?.schema, table: payload?.table,
    });
    return jsonResponse({ ok: true, action: "ignored" }, 200);
  }

  const email: string | undefined = payload.email;
  if (!email) {
    console.log("[loops-progress] no email on payload", { user_id: payload?.record?.user_id });
    return jsonResponse({ ok: true, action: "no_email" }, 200);
  }

  const record = (payload.record || {}) as Record<string, unknown>;
  const derived = deriveProgressProps(record);

  // Loops /contacts/update is an upsert-ish PATCH: mints missing fields on
  // the existing contact. loops-signup guarantees a create at auth-signup
  // time, so the contact exists whenever this function fires. If it somehow
  // doesn't (Loops was down at signup, contact was manually deleted, etc)
  // we treat the update failure as retryable and let the trigger's next
  // fire heal it.
  const body: Record<string, unknown> = {
    email,
    lastActiveAt:      derived.lastActiveAt,
    lastSubject:       derived.lastSubject,
    subjectsStarted:   derived.subjectsStarted,
    bonusUnlocked:     derived.bonusUnlocked,
    chaptersCompleted: derived.chaptersCompleted,
    inactive7d:        derived.inactive7d,
    inactive14d:       derived.inactive14d,
  };
  // language / platform / firstName: forwarded only when deriveProgressProps
  // included them. Omitting on null keeps a previously-set Loops value from
  // being cleared by a partial sync — same treatment for all three.
  if (typeof derived.language  === "string") body.language  = derived.language;
  if (typeof derived.platform  === "string") body.platform  = derived.platform;
  if (typeof derived.firstName === "string") body.firstName = derived.firstName;

  try {
    const updateRes = await fetch(LOOPS_UPDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (updateRes.ok) {
      return jsonResponse({ ok: true, action: "updated", props: derived }, 200);
    }
    let errText = "";
    try { errText = await updateRes.text(); } catch (_) {}
    console.error(`[loops-progress] update failed: ${updateRes.status} ${errText}`);
    return jsonResponse({ ok: false, error: "Loops update failed" }, 502);
  } catch (e) {
    console.error("[loops-progress] update threw:", e);
    return jsonResponse({ ok: false, error: "Loops update threw" }, 502);
  }
});
