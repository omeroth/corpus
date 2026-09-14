// Supabase Edge Function: loops-signup
//
// Called by a Postgres trigger on auth.users INSERT (via pg_net). Adds the
// newly signed-up user to Loops (loops.so) so they receive a welcome email.
//
// Why a trigger (not client-side): fires the instant the auth.users row is
// inserted, regardless of signup method (OAuth, email + password) or
// email-confirmation timing. A client-side hook would miss users who close
// the app between signup and email confirmation.
//
// Design notes:
//   - Payload contract: Supabase-Database-Webhook-shaped JSON, produced by
//     the trigger's pg_net call. Body shape:
//       { type: 'INSERT', schema: 'auth', table: 'users', record: {...}, old_record: null }
//     `record.email` and `record.raw_user_meta_data` are what we care about.
//   - Webhook authenticity: the caller MUST present a shared-secret token in
//     the X-Loops-Webhook-Secret header. The secret has a SINGLE source of
//     truth: the Vault entry named 'loops_webhook_secret'. The trigger reads
//     it from vault.decrypted_secrets at fire time; this function reads the
//     same row via the public.get_loops_webhook_secret() RPC (SECURITY
//     DEFINER, EXECUTE granted to service_role only). Both sides load the
//     same bytes from the same row — they cannot drift.
//   - Vault query is done once per isolate and cached at module scope. To
//     rotate the secret: UPDATE vault.secrets and redeploy this function
//     (redeploy recycles the isolate, which busts the cache).
//   - "Already exists" from Loops' create endpoint is treated as success by
//     falling through to /contacts/update so retries don't fail.
//   - Return semantics: 200 for everything we consider "processed" (created
//     / updated / no_email / ignored). 5xx only for transient failures the
//     trigger's HTTP client should let retry naturally.
//
// Required env vars (auto-populated by Supabase Edge Functions runtime):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
// Required env vars (set manually via `supabase secrets set`):
//   - LOOPS_API_KEY   (Loops private API key)
//
// LOOPS_WEBHOOK_SECRET is intentionally no longer used — the shared secret
// lives only in Vault, read on demand through the RPC.

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

const LOOPS_CREATE_URL = "https://app.loops.so/api/v1/contacts/create";
const LOOPS_UPDATE_URL = "https://app.loops.so/api/v1/contacts/update";

// Constant-time string comparison to prevent timing-oracle leaks on the secret.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Module-scoped cache — lives as long as this isolate. A redeploy recycles the
// isolate and clears this, which is our secret-rotation mechanism.
let _cachedSecret: string | null = null;

async function getWebhookSecret(): Promise<string | null> {
  if (_cachedSecret !== null) return _cachedSecret;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[loops-signup] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    return null;
  }
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.rpc("get_loops_webhook_secret");
  if (error || !data || typeof data !== "string") {
    console.error("[loops-signup] Vault lookup via get_loops_webhook_secret RPC failed:", error);
    return null;
  }
  _cachedSecret = data;
  return _cachedSecret;
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
    console.error("[loops-signup] LOOPS_API_KEY not set");
    return jsonResponse({ ok: false, error: "Loops key not configured" }, 500);
  }

  const webhookSecret = await getWebhookSecret();
  if (!webhookSecret) {
    // Vault or its RPC is unreachable / misconfigured. Treat as retryable.
    return jsonResponse({ ok: false, error: "Webhook secret unavailable" }, 500);
  }

  // Verify shared-secret. Custom header so we don't collide with Supabase's own
  // Authorization: Bearer <service-role JWT> that its webhooks would inject.
  const provided = req.headers.get("X-Loops-Webhook-Secret")
                || req.headers.get("x-loops-webhook-secret")
                || "";
  if (!timingSafeEqual(provided, webhookSecret)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  // Parse and shape-check the webhook payload.
  let payload: any;
  try {
    payload = await req.json();
  } catch (_) {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }
  if (payload?.type !== "INSERT" || payload?.schema !== "auth" || payload?.table !== "users") {
    console.log("[loops-signup] ignoring non-signup event", {
      type: payload?.type, schema: payload?.schema, table: payload?.table,
    });
    return jsonResponse({ ok: true, action: "ignored" }, 200);
  }

  const record = payload.record || {};
  const email: string | undefined = record.email;
  if (!email) {
    // Phone-only signup or other emailless row — nothing to sync. Not an error.
    console.log("[loops-signup] no email on new auth.users row", { id: record.id });
    return jsonResponse({ ok: true, action: "no_email" }, 200);
  }

  const meta = (record.raw_user_meta_data || {}) as Record<string, unknown>;
  const fullName = String(meta.full_name || meta.name || "").trim();
  const firstName = fullName.split(/\s+/)[0] || "";

  // Signup method — auth.users.raw_app_meta_data.provider is populated by GoTrue
  // on every insert: 'email' for email/password, 'google' / 'apple' for OAuth.
  // Forward it as a custom Loops contact property so onboarding emails can
  // segment on signup channel (e.g. skip "confirm your email" for OAuth users).
  // The trigger already includes the full row via row_to_json(NEW), so no
  // migration is needed — the field is present on the webhook payload today.
  const appMeta = (record.raw_app_meta_data || {}) as Record<string, unknown>;
  const provider = typeof appMeta.provider === "string" ? appMeta.provider : "";

  // Language pick from onboarding step 1. Email signup passes it explicitly
  // via signUp({ options: { data: { lang } } }) — see the client at the
  // handleAuthSubmit signup branch — so raw_user_meta_data.lang carries the
  // pick when this trigger fires. OAuth signups can't inject app-side meta
  // pre-INSERT (the provider owns raw_user_meta_data), so lang stays absent
  // for those; loops-progress heals them on their first successful sync.
  // Only included when present — a missing/empty lang omits the property so
  // Loops keeps whatever value it currently has (rather than clearing it).
  const lang = typeof meta.lang === "string" && meta.lang ? meta.lang : "";

  const body: Record<string, unknown> = { email, source: "app_signup" };
  if (firstName) body.firstName    = firstName;
  if (provider)  body.signupMethod = provider;
  if (lang)      body.language     = lang;
  // Subscription-state fields default to "not subscribed" on signup.
  // Every new contact lands with the field populated so Loops segment
  // filters like `subscriptionStatus = none` work from day one. The
  // revenuecat-webhook updates these fields on every state transition
  // going forward (initial purchase, cancel, expire, refund, etc.).
  // Not sending subscriptionCurrentPeriodEnd / subscriptionPlatform
  // because they have no meaningful value at signup — Loops treats
  // omitted keys as unset, which is what we want.
  body.subscriptionStatus = "none";
  body.willRenew          = false;

  const loopsHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${LOOPS_API_KEY}`,
  };

  try {
    const createRes = await fetch(LOOPS_CREATE_URL, {
      method: "POST",
      headers: loopsHeaders,
      body: JSON.stringify(body),
    });
    if (createRes.ok) {
      return jsonResponse({ ok: true, action: "created" }, 200);
    }

    let errText = "";
    try { errText = await createRes.text(); } catch (_) {}

    if (/already/i.test(errText)) {
      try {
        const updateRes = await fetch(LOOPS_UPDATE_URL, {
          method: "POST",
          headers: loopsHeaders,
          body: JSON.stringify(body),
        });
        if (updateRes.ok) {
          return jsonResponse({ ok: true, action: "updated" }, 200);
        }
        let updateErrText = "";
        try { updateErrText = await updateRes.text(); } catch (_) {}
        console.error(`[loops-signup] update failed: ${updateRes.status} ${updateErrText}`);
        return jsonResponse({ ok: false, error: "Loops update failed" }, 502);
      } catch (e) {
        console.error("[loops-signup] update threw:", e);
        return jsonResponse({ ok: false, error: "Loops update threw" }, 502);
      }
    }

    console.error(`[loops-signup] create failed: ${createRes.status} ${errText}`);
    return jsonResponse({ ok: false, error: "Loops create failed" }, 502);
  } catch (e) {
    console.error("[loops-signup] create threw:", e);
    return jsonResponse({ ok: false, error: "Loops create threw" }, 502);
  }
});
