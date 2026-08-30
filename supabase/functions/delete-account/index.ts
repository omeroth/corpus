// Supabase Edge Function: delete-account
//
// Deletes the calling user's account and all their data.
//
// Flow:
//   1. Verify the JWT from the Authorization header (user must be signed in).
//   2. Delete the user's rows in user_progress and subscriptions using the admin client.
//   3. Best-effort: delete the user's PostHog person record (events too) via the
//      PostHog Personal API. Failures here MUST NOT block the auth deletion.
//   4. Delete the auth.users row via admin.auth.admin.deleteUser().
//   5. Respond { ok: true } on success, or { ok: false, error } on failure.
//
// Required Edge Function env vars (set via `supabase secrets set`):
//   - SUPABASE_URL                (auto-populated by Supabase)
//   - SUPABASE_ANON_KEY           (auto-populated)
//   - SUPABASE_SERVICE_ROLE_KEY   (auto-populated — never expose this to the client)
//   - POSTHOG_PERSONAL_API_KEY    (must be set manually: a Personal API Key from PostHog)
//
// Invoked from the client via:
//   const { data, error } = await sb.functions.invoke('delete-account');

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const POSTHOG_PROJECT_ID = 388655;
const POSTHOG_HOST = "https://us.posthog.com";

async function deletePosthogPerson(userId: string, apiKey: string): Promise<void> {
  // Best-effort: any failure here is logged and swallowed so it doesn't block auth deletion.
  try {
    // 1. Look up the PostHog person ID by distinct_id (the user's Supabase user.id, which is what
    //    posthog.identify(user.id, ...) sets in the main app at index.html L14556).
    const lookupRes = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/persons/?distinct_id=${encodeURIComponent(userId)}`,
      { headers: { "Authorization": `Bearer ${apiKey}` } },
    );
    if (!lookupRes.ok) {
      console.error(`[delete-account] PostHog person lookup failed: ${lookupRes.status} ${lookupRes.statusText}`);
      return;
    }
    const lookupJson = await lookupRes.json();
    const personId = lookupJson?.results?.[0]?.id;
    if (!personId) {
      // No PostHog person found for this distinct_id (e.g. user never had analytics fire). Nothing to delete.
      return;
    }
    // 2. Delete the person + their events.
    const deleteRes = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/persons/${personId}/?delete_events=true`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${apiKey}` },
      },
    );
    if (!deleteRes.ok) {
      console.error(`[delete-account] PostHog person delete failed: ${deleteRes.status} ${deleteRes.statusText}`);
    }
  } catch (e) {
    console.error("[delete-account] PostHog delete threw:", e);
  }
}

serve(async (req: Request): Promise<Response> => {
  // 1. CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // 2. Pull the caller's JWT from the Authorization header
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ ok: false, error: "Missing Authorization header" }, 401);
  }

  // 3. Validate the JWT by asking Supabase Auth for the user (using an anon-key client
  //    that forwards the caller's Authorization header — auth.getUser() then verifies
  //    the token server-side and returns the corresponding user.id).
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const POSTHOG_PERSONAL_API_KEY = Deno.env.get("POSTHOG_PERSONAL_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[delete-account] Missing Supabase env vars");
    return jsonResponse({ ok: false, error: "Server misconfigured" }, 500);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: getUserError } = await userClient.auth.getUser();
  if (getUserError || !userData?.user) {
    return jsonResponse({ ok: false, error: "Invalid or expired token" }, 401);
  }
  const userId = userData.user.id;

  // 4. Admin client (service-role) for privileged ops. Disable auto-refresh + persist session
  //    since this is a stateless server context.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 5. Delete user data rows. Each wrapped in try/catch so one failing doesn't stop the rest;
  //    we want a best-effort wipe even if one table is unavailable or doesn't have an RLS-free
  //    policy ready for the service-role client (service role bypasses RLS anyway, but defensive).
  try {
    const { error } = await admin.from("user_progress").delete().eq("user_id", userId);
    if (error) console.error("[delete-account] user_progress delete error:", error.message);
  } catch (e) {
    console.error("[delete-account] user_progress delete threw:", e);
  }
  // subscriptions is NOT deleted here — the FK ON DELETE CASCADE on
  // subscriptions.user_id → auth.users(id) (added in migration
  // 20260830120000) removes the row automatically when the auth.users
  // row is deleted in step 7. Keeping a manual delete would be two
  // mechanisms pointed at the same cleanup, which is how these drift.

  // 6. Best-effort PostHog person deletion. The whole helper is wrapped in try/catch internally;
  //    it never throws back here. If POSTHOG_PERSONAL_API_KEY is unset, skip silently.
  if (POSTHOG_PERSONAL_API_KEY) {
    await deletePosthogPerson(userId, POSTHOG_PERSONAL_API_KEY);
  } else {
    console.error("[delete-account] POSTHOG_PERSONAL_API_KEY not set — skipping PostHog person deletion");
  }

  // 7. Delete the auth.users row. This is the only step that MUST succeed for the function
  //    to return ok:true. Anything else above is best-effort cleanup.
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    console.error("[delete-account] auth.admin.deleteUser error:", deleteAuthError.message);
    return jsonResponse({ ok: false, error: deleteAuthError.message }, 500);
  }

  // 8. Done.
  return jsonResponse({ ok: true }, 200);
});
