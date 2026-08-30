// Supabase Edge Function: revenuecat-webhook
//
// Receives RevenueCat webhook events and upserts public.subscriptions.
// This is the single writer for the table — the client only reads.
//
// Auth: RevenueCat sends a static bearer token in the Authorization header,
// configured in the RC dashboard. We compare against REVENUECAT_WEBHOOK_SECRET
// with a constant-time compare (see verifyAuth).
//
// Sandbox filter: SANDBOX events are dropped silently in production. Flip
// WEBHOOK_ACCEPT_SANDBOX=true temporarily during dev to accept them.
//
// Idempotency: writes are shaped as upserts against current state, so a
// redelivered event is a no-op. No dedup table for v1. Out-of-order
// delivery (stale event landing after a fresh one) is accepted; measure
// before hardening — RC's own SLO is <1% out-of-order.
//
// Required env vars (set via `supabase secrets set`):
//   - SUPABASE_URL                  (auto-populated)
//   - SUPABASE_SERVICE_ROLE_KEY     (auto-populated — bypasses RLS)
//   - REVENUECAT_WEBHOOK_SECRET     (manually set; matches RC dashboard value)
// Optional:
//   - WEBHOOK_ACCEPT_SANDBOX        (any truthy value → sandbox events processed)
//
// Deploy: supabase functions deploy revenuecat-webhook --no-verify-jwt
// (--no-verify-jwt because RC doesn't send a Supabase JWT; we do our own
// bearer verification.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ──────────────────────────────────────────────────────────────

// Not exhaustive — only fields we read. RC's event shape is documented at
// https://www.revenuecat.com/docs/integrations/webhooks/event-flows.
type RCEvent = {
  id: string;
  type: string;
  event_timestamp_ms?: number;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[];
  period_type?: "TRIAL" | "NORMAL" | "INTRO" | "PROMOTIONAL";
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  environment?: "SANDBOX" | "PRODUCTION";
  store?: "APP_STORE" | "PLAY_STORE" | "MAC_APP_STORE" | "AMAZON" | "PROMOTIONAL" | "STRIPE";
  transaction_id?: string;
  original_transaction_id?: string;
  original_purchase_date_ms?: number;
  is_family_share?: boolean;
  is_refund?: boolean;
  // RC also sends price, currency, country_code, subscriber_attributes,
  // aliases, and offer/discount metadata. Deliberately omitted from this
  // type so no future edit accidentally references them — they should
  // never round-trip through our storage.
};

type SubRow = {
  user_id: string;
  entitlement: "paid";
  product_id: string | null;
  platform: "ios" | "android" | "grandfathered" | null;
  store_transaction_id: string | null;
  status: "active" | "trial" | "grace_period" | "billing_retry" | "canceled" | "expired" | "refunded";
  current_period_end: string | null;   // ISO-8601 for the JS client's implicit cast
  trial_end: string | null;
  will_renew: boolean;
  originally_purchased_at: string | null;
  raw_event: Record<string, unknown>;
};

// ─── Auth ───────────────────────────────────────────────────────────────

// Constant-time string compare to avoid timing leaks on the shared secret.
// TextEncoder + XOR-accumulate — Deno's crypto.subtle has no built-in
// constant-time compare, and this is short enough that a hand-rolled loop
// is fine.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < ae.length; i++) diff |= ae[i] ^ be[i];
  return diff === 0;
}

function verifyAuth(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") || "";
  return timingSafeEqual(header, secret);
}

// ─── Event helpers ──────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function platformFor(store: RCEvent["store"]): SubRow["platform"] {
  if (store === "APP_STORE" || store === "MAC_APP_STORE") return "ios";
  if (store === "PLAY_STORE") return "android";
  if (store === "PROMOTIONAL") return "grandfathered";
  return null;
}

function toIso(ms: number | undefined | null): string | null {
  if (ms == null) return null;
  return new Date(ms).toISOString();
}

// Whitelist projection — debugging fields only. Never persist:
//   - subscriber_attributes (may contain $email / $phoneNumber / $displayName)
//   - aliases, original_app_user_id, app_user_id (row PK, no need to duplicate)
//   - price, currency, country_code (payment data, not debugging data —
//     product_id + store already tell us which SKU on which platform,
//     which is all we consult to diagnose a webhook write)
function stripToWhitelist(e: RCEvent): Record<string, unknown> {
  return {
    id:                      e.id,
    type:                    e.type,
    event_timestamp_ms:      e.event_timestamp_ms,
    product_id:              e.product_id,
    entitlement_ids:         e.entitlement_ids,
    period_type:             e.period_type,
    purchased_at_ms:         e.purchased_at_ms,
    expiration_at_ms:        e.expiration_at_ms,
    environment:             e.environment,
    store:                   e.store,
    transaction_id:          e.transaction_id,
    original_transaction_id: e.original_transaction_id,
    is_family_share:         e.is_family_share,
    is_refund:               e.is_refund,
  };
}

// ─── Event → row mapping ────────────────────────────────────────────────

// Full upserts (write every field). Used for events that describe complete
// subscription state: initial purchase, renewal, product change, etc.
function fullUpsert(e: RCEvent, status: SubRow["status"], willRenew: boolean): Partial<SubRow> {
  return {
    user_id:                 e.app_user_id,
    entitlement:             "paid",
    product_id:              e.product_id ?? null,
    platform:                platformFor(e.store),
    store_transaction_id:    e.original_transaction_id ?? null,
    status,
    current_period_end:      toIso(e.expiration_at_ms),
    trial_end:               e.period_type === "TRIAL" ? toIso(e.expiration_at_ms) : null,
    will_renew:              willRenew,
    originally_purchased_at: toIso(e.original_purchase_date_ms) ?? toIso(e.purchased_at_ms),
    raw_event:               stripToWhitelist(e),
  };
}

// Partial updates (write only the fields that change). Used for events
// that flip one boolean without describing full state — CANCELLATION,
// UNCANCELLATION, TRIAL_CANCELLED — where the rest of the row must
// survive untouched. Fires an UPDATE (not upsert) so missing rows fall
// through as no-ops rather than being created with empty defaults.
async function partialUpdate(
  db: ReturnType<typeof createClient>,
  userId: string,
  patch: Partial<SubRow>,
  rawEvent: Record<string, unknown>,
): Promise<{ error: unknown }> {
  return await db.from("subscriptions")
    .update({ ...patch, raw_event: rawEvent })
    .eq("user_id", userId);
}

async function handleEvent(
  db: ReturnType<typeof createClient>,
  e: RCEvent,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const t = e.type;
  const raw = stripToWhitelist(e);

  // Read-modify-write for the "flip one field" events.
  if (t === "CANCELLATION" || t === "TRIAL_CANCELLED") {
    const { error } = await partialUpdate(db, e.app_user_id, { will_renew: false }, raw);
    if (error) return { status: 500, body: { ok: false, where: "partialUpdate", type: t, error: String(error) } };
    return { status: 200, body: { ok: true, type: t, action: "will_renew=false" } };
  }
  if (t === "UNCANCELLATION") {
    const { error } = await partialUpdate(db, e.app_user_id, { will_renew: true }, raw);
    if (error) return { status: 500, body: { ok: false, where: "partialUpdate", type: t, error: String(error) } };
    return { status: 200, body: { ok: true, type: t, action: "will_renew=true" } };
  }

  // Full upserts for state-carrying events.
  let row: Partial<SubRow> | null = null;

  if (t === "INITIAL_PURCHASE" || t === "TRIAL_STARTED") {
    row = fullUpsert(e, e.period_type === "TRIAL" ? "trial" : "active", true);
  } else if (t === "RENEWAL" || t === "TRIAL_CONVERTED" || t === "PRODUCT_CHANGE" || t === "SUBSCRIPTION_EXTENDED") {
    row = fullUpsert(e, "active", true);
  } else if (t === "BILLING_ISSUE") {
    row = fullUpsert(e, "grace_period", true);   // still trying to renew
  } else if (t === "EXPIRATION") {
    row = fullUpsert(e, e.is_refund ? "refunded" : "expired", false);
  } else if (t === "SUBSCRIPTION_PAUSED") {
    row = fullUpsert(e, "canceled", false);
  } else if (t === "TEMPORARY_ENTITLEMENT_GRANT") {
    // Admin-granted access. Treat as grandfathered so the app knows this
    // wasn't a real store transaction and skips the manage-deeplink.
    row = { ...fullUpsert(e, "active", false), platform: "grandfathered" };
  } else if (t === "TRANSFER") {
    // Sub moved from one app_user_id to another. RC includes both in the
    // event, and we can't safely infer both directions from this shape
    // alone. Log and drop for now — rare, and the app can prompt the
    // user to hit "Restore purchases" if they lose access.
    console.warn("[rc-webhook] TRANSFER event received — not implemented", { event_id: e.id, from: e.original_app_user_id, to: e.app_user_id });
    return { status: 200, body: { ok: true, type: t, action: "dropped-unimplemented" } };
  } else if (t === "TEST" || t === "SUBSCRIBER_ALIAS") {
    // TEST fires from the RC dashboard's "Send test event" button.
    // SUBSCRIBER_ALIAS is legacy and no longer sent on new integrations.
    console.log("[rc-webhook] " + t + " event received — dropped", { event_id: e.id });
    return { status: 200, body: { ok: true, type: t, action: "dropped-noop" } };
  } else {
    // Unknown event type. RC ships new types over time; 5xx-ing on
    // unknown would trigger their retry storm for events we can't
    // handle. Log and 200.
    console.warn("[rc-webhook] unknown event type — dropped", { type: t, event_id: e.id });
    return { status: 200, body: { ok: true, type: t, action: "dropped-unknown" } };
  }

  const { error } = await db.from("subscriptions")
    .upsert(row as SubRow, { onConflict: "user_id" });
  if (error) return { status: 500, body: { ok: false, where: "upsert", type: t, error: String(error) } };
  return { status: 200, body: { ok: true, type: t, action: "upserted" } };
}

// ─── Handler ────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  // RC posts JSON. No CORS needed — RC is server-to-server, not a browser.
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth.
  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
  if (!secret) {
    console.error("[rc-webhook] REVENUECAT_WEBHOOK_SECRET not configured — refusing all requests");
    return new Response("Server misconfigured", { status: 500 });
  }
  if (!verifyAuth(req, secret)) {
    // 200 rather than 401 on purpose. A shared-secret mismatch is never
    // transient — retrying with the same wrong header will fail forever.
    // 401 would give RC a permanent retry storm for every event until a
    // human intervenes; 200 stops it. The log line is the alert channel
    // (and obscures the auth check from a probing attacker as a bonus).
    console.error("[rc-webhook] AUTH REJECTED — bearer token mismatch. Check REVENUECAT_WEBHOOK_SECRET vs the RC dashboard's Authorization Header Value.");
    return new Response(JSON.stringify({ ok: true, dropped: "auth" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  // Parse body.
  let body: { event?: RCEvent; api_version?: string };
  try {
    body = await req.json();
  } catch (e) {
    console.error("[rc-webhook] malformed JSON", e);
    return new Response("Malformed JSON", { status: 400 });
  }
  const event = body.event;
  if (!event || typeof event !== "object" || !event.type || !event.app_user_id) {
    console.error("[rc-webhook] missing event/type/app_user_id");
    return new Response("Malformed event", { status: 400 });
  }

  // Sandbox filter. RC sends sandbox and production events to the same
  // URL by default; production should never grant entitlement from a
  // sandbox purchase. Flip WEBHOOK_ACCEPT_SANDBOX=true to allow them
  // during dev.
  if (event.environment === "SANDBOX" && !Deno.env.get("WEBHOOK_ACCEPT_SANDBOX")) {
    console.log("[rc-webhook] sandbox event dropped", { type: event.type, event_id: event.id });
    return new Response(JSON.stringify({ ok: true, dropped: "sandbox" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  // Validate app_user_id shape. RC anonymous IDs look like $RCAnonymousID:...
  // and won't match auth.users. If we get one, the client hasn't wired
  // Purchases.logIn correctly — log + 200 rather than 5xx-ing.
  if (!UUID_RE.test(event.app_user_id)) {
    console.warn("[rc-webhook] non-UUID app_user_id — dropped", { app_user_id: event.app_user_id, type: event.type });
    return new Response(JSON.stringify({ ok: true, dropped: "non-uuid-app-user-id" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  // Route.
  const db = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const { status, body: respBody } = await handleEvent(db, event);
    return new Response(JSON.stringify(respBody), {
      status, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[rc-webhook] uncaught in handleEvent", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
