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
const LOOPS_EVENTS_URL = "https://app.loops.so/api/v1/events/send";

// ─── Onboarding plan copy ──────────────────────────────────────────
// Bilingual copy lookup for the three onboarding answers that drive
// the "Your plan" email template. Keys here MUST match the client-
// side option ids:
//   - q1 (state.onbAnswers.q1[0]) → onbGoal / onbGoalHow
//   - q2 (state.onbAnswers.q2[0]) → onbWho / onbWhoHow
//   - dailyGoal (state.onbAnswers.dailyGoal) → onbRhythm
// See index.html _ONB_COPY (~31817 q1, ~31877 q2, ~32253 goal) for
// the authored client-side option lists; the keys below must stay
// in lockstep with those id values.
//
// DEFAULTS when the answer is missing or doesn't match a known id:
//   q1        → build-habit
//   q2        → own-ideas
//   dailyGoal → one
// Chosen so a user who somehow lands at _onbComplete without an
// answer still receives a plan email that reads as intentional.
//
// Hebrew copy uses the plural voice (סיימתם / תדעו / תוכלו), per
// the Corpus copy rule.
//
// If you change a string here, also run scripts/_verify_loops.mjs
// so the verifier's expected-output changes propagate to review.
const ONB_PLAN_COPY = {
  q1: {
    "understand-ideas": {
      en: { term: "Understand the big ideas",
            how: "Each dialogue explains one big idea in plain language, in about five minutes." },
      he: { term: "להבין את הרעיונות הגדולים",
            how: "כל דיאלוג מסביר רעיון גדול אחד בשפה פשוטה, בערך בחמש דקות." },
    },
    "worth-reading": {
      en: { term: "Read something worth your time",
            how: "Every day you read a real passage by a great thinker, instead of another feed." },
      he: { term: "לקרוא משהו ששווה את הזמן",
            how: "כל יום קוראים קטע אמיתי של הוגה גדול, במקום עוד פיד." },
    },
    "hold-own": {
      en: { term: "Hold your own in a deep conversation",
            how: "You'll know what the great thinkers actually said, and bring it up with confidence." },
      he: { term: "להחזיק מעמד בשיחה עמוקה",
            how: "תדעו מה ההוגים הגדולים אמרו באמת, ותוכלו להביא את זה לשיחה בביטחון." },
    },
    "read-thinkers": {
      en: { term: "Get to know the great thinkers",
            how: "You'll meet the great thinkers through their own words, one at a time." },
      he: { term: "להכיר את ההוגים הגדולים",
            how: "תפגשו את ההוגים הגדולים דרך המילים שלהם, אחד בכל פעם." },
    },
    "build-habit": {
      en: { term: "Build a daily learning habit",
            how: "Five minutes a day, with streaks and reminders that help you keep going." },
      he: { term: "לבנות הרגל למידה יומי",
            how: "חמש דקות ביום, עם רצפים ותזכורות שעוזרים להתמיד." },
    },
  },
  q2: {
    "own-ideas": {
      en: { term: "Someone who thinks for themselves",
            how: "Every dialogue ends with a question about what you think, not what to memorize." },
      he: { term: "מישהו שחושב בעצמו",
            how: "כל דיאלוג נגמר בשאלה על מה שאתם חושבים, לא על מה לשנן." },
    },
    "explain-clearly": {
      en: { term: "Someone who explains ideas clearly",
            how: "You'll leave each dialogue able to explain one idea in a sentence." },
      he: { term: "מישהו שמסביר רעיונות בבהירות",
            how: "מכל דיאלוג תצאו עם רעיון אחד שתוכלו להסביר במשפט." },
    },
    "know-where": {
      en: { term: "Someone who knows where ideas come from",
            how: "Every idea comes with its source: who said it, where and when." },
      he: { term: "מישהו שיודע מאיפה רעיונות מגיעים",
            how: "כל רעיון מגיע עם המקור שלו: מי אמר, איפה ומתי." },
    },
    "well-read": {
      en: { term: "Someone with broad knowledge",
            how: "Chapter by chapter, you'll get to know the key thinkers of philosophy, economics and psychology." },
      he: { term: "מישהו בעל ידע רחב",
            how: "פרק אחרי פרק, תכירו את ההוגים החשובים בפילוסופיה, בכלכלה ובפסיכולוגיה." },
    },
    "understand-world": {
      en: { term: "Someone who understands the world",
            how: "Bonus chapters connect the big ideas to what's happening in the news." },
      he: { term: "מישהו שמבין את העולם",
            how: "פרקי הבונוס מחברים את הרעיונות הגדולים למה שקורה בחדשות." },
    },
  },
  dailyGoal: {
    // Duration ("about N minutes") was dropped from this line — the
    // email renders the duration next to the glyph in its own slot,
    // and doubling it up read as cluttered. Example rendered rhythm:
    // "One dialogue a day · Reminder at 20:00".
    "one":      { en: "One dialogue a day",   he: "דיאלוג אחד ביום" },
    "two":      { en: "Two dialogues a day",  he: "שני דיאלוגים ביום" },
    "own_pace": { en: "At your own pace",     he: "בקצב שלכם" },
  },
  reminderSuffix: {
    en: " · Reminder at {time}",
    he: " · תזכורת ב-{time}",
  },
} as const;
type OnbLang = "en" | "he";
function pickLang(raw: unknown): OnbLang {
  return raw === "en" ? "en" : "he";
}
// Derives the 5 "plan" contact properties from a user_progress row.
// Returns { onbGoal, onbGoalHow, onbWho, onbWhoHow, onbRhythm } as
// plain strings (not nullable) — defaults kick in on missing /
// unknown answers so the body always has all five fields.
// Base URL for the 192px PNG icons hosted at corpusapp.io/email-icons/<subject>/.
// Deployed by .github/workflows/pages.yml from _marketing/email-icons/.
const EMAIL_ICON_BASE = "https://corpusapp.io/email-icons";
const KNOWN_SUBJECTS = new Set(["philosophy", "economics", "psychology"]);
function pickSubject(raw: unknown): "philosophy" | "economics" | "psychology" {
  return (typeof raw === "string" && KNOWN_SUBJECTS.has(raw))
    ? raw as "philosophy" | "economics" | "psychology"
    : "philosophy";
}
function derivePlanProps(record: Record<string, unknown>): {
  onbGoal:       string;
  onbGoalHow:    string;
  onbWho:        string;
  onbWhoHow:     string;
  onbRhythm:     string;
  onbGoalIcon:   string;
  onbWhoIcon:    string;
  onbRhythmIcon: string;
} {
  const lang = pickLang(record.lang);
  const onb = (record.onboarding_answers && typeof record.onboarding_answers === "object")
    ? (record.onboarding_answers as Record<string, unknown>)
    : {};
  // q1 / q2 are single-choice arrays (length-1). Accept any truthy
  // first element; otherwise fall back to the default id.
  const q1Arr = Array.isArray(onb.q1) ? onb.q1 : [];
  const q2Arr = Array.isArray(onb.q2) ? onb.q2 : [];
  const q1Id: string = (typeof q1Arr[0] === "string" && q1Arr[0] in ONB_PLAN_COPY.q1) ? q1Arr[0] as string : "build-habit";
  const q2Id: string = (typeof q2Arr[0] === "string" && q2Arr[0] in ONB_PLAN_COPY.q2) ? q2Arr[0] as string : "own-ideas";
  const q1Entry = ONB_PLAN_COPY.q1[q1Id as keyof typeof ONB_PLAN_COPY.q1];
  const q2Entry = ONB_PLAN_COPY.q2[q2Id as keyof typeof ONB_PLAN_COPY.q2];

  const dgRaw = typeof onb.dailyGoal === "string" ? onb.dailyGoal : "";
  const dgId: string = (dgRaw && dgRaw in ONB_PLAN_COPY.dailyGoal) ? dgRaw : "one";
  let rhythm: string = ONB_PLAN_COPY.dailyGoal[dgId as keyof typeof ONB_PLAN_COPY.dailyGoal][lang];

  // daily_reminder is a jsonb column { enabled: bool, time: 'HH:MM', ... }.
  // Only append the suffix when enabled=true AND time is a string. A
  // malformed value silently skips — bad input must not break the main
  // plan send.
  const dr = (record.daily_reminder && typeof record.daily_reminder === "object")
    ? (record.daily_reminder as Record<string, unknown>)
    : {};
  if (dr.enabled === true && typeof dr.time === "string" && /^\d{1,2}:\d{2}$/.test(dr.time)) {
    rhythm += ONB_PLAN_COPY.reminderSuffix[lang].replace("{time}", dr.time);
  }

  const subject = pickSubject(record.last_subject);
  return {
    onbGoal:       q1Entry[lang].term,
    onbGoalHow:    q1Entry[lang].how,
    onbWho:        q2Entry[lang].term,
    onbWhoHow:     q2Entry[lang].how,
    onbRhythm:     rhythm,
    onbGoalIcon:   `${EMAIL_ICON_BASE}/${subject}/q1-${q1Id}.png`,
    onbWhoIcon:    `${EMAIL_ICON_BASE}/${subject}/q2-${q2Id}.png`,
    onbRhythmIcon: `${EMAIL_ICON_BASE}/${subject}/dailyGoal-${dgId}.png`,
  };
}
export { derivePlanProps, ONB_PLAN_COPY };

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

// Current UTC offset for an IANA timezone, as "+HH:MM" / "-HH:MM".
// Recomputed on every sync so DST transitions correct automatically —
// no stored offset to go stale. Uses Intl's 'longOffset' timeZoneName
// style ("GMT±HH:MM"), parses to the sign+colon format Loops expects,
// no arithmetic, no DST tables. Returns null when the zone name is
// bad or the runtime rejects it; the caller omits the property
// entirely in that case rather than sending null (Loops reads null
// as "clear this field").
//
// Lives in three places: here, supabase/functions/loops-inactive-sweep
// /index.ts, and scripts/backfill-loops-progress.mjs. Edge Functions
// don't share modules and the backfill is a plain Node file, so the
// function is duplicated rather than imported. Keep all three copies
// byte-identical — a divergence would silently send different offsets
// from different code paths.
function computeUtcOffset(timezone: string, when: Date = new Date()): string | null {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const parts = dtf.formatToParts(when);
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // longOffset emits "GMT+HH:MM" / "GMT-HH:MM" for offset zones.
    // Bare "GMT" / "UTC" render for the zero-offset zones (UTC, Etc/
    // UTC, Africa/Abidjan in winter, etc.) — normalize to "+00:00".
    const m = tzPart.match(/^GMT([+-]\d{2}:\d{2})$/);
    if (m) return m[1];
    if (tzPart === "GMT" || tzPart === "UTC") return "+00:00";
    return null;
  } catch (_) {
    return null;
  }
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
    subjectsStarted,
    bonusUnlocked,
    chaptersCompleted: chapterCompleteShown.length,
    // Reset the two inactivity flags every time the user does something
    // real. The daily loops-inactive-sweep function flips them back to
    // true when last_active_at re-crosses the corresponding threshold.
    inactive7d:  false,
    inactive14d: false,
  };
  // lastSubject: omit when absent so a user whose user_progress.last_subject
  // is briefly null (OAuth signup before subject pick; pre-onboarding state)
  // doesn't have their Loops lastSubject wiped. Matches the "only send when
  // present" pattern used for every other optional prop below (language,
  // platform, firstName, timezone, utcOffset). The earlier version sent
  // null explicitly, which Loops treats as "clear this property" — a 2026-11-23
  // audit found 56/511 users with null last_subject, meaning the trigger
  // silently cleared any previously-set value every time one of them touched
  // the app. See scripts/backfill-loops-subject-lang.mjs for the one-time
  // repair of users whose Loops value was already wiped.
  if (typeof record.last_subject === "string" && record.last_subject) props.lastSubject = record.last_subject;
  if (typeof record.lang === "string" && record.lang) props.language = record.lang;
  if (typeof record.platform === "string" && record.platform) props.platform = record.platform;
  if (firstName) props.firstName = firstName;
  // timezone / utcOffset: added together, both omitted when the zone is
  // null. Omitting (vs sending null) keeps Loops' previously-set value
  // alive instead of clearing it — matches the convention above for
  // language / platform / firstName. utcOffset is recomputed here from
  // the current time, not cached, so a stale user_progress row (user
  // hasn't opened the app in weeks) still sends the right offset for
  // today's DST state — this function is what loops-inactive-sweep calls
  // through for the daily DST-drift refresh too.
  if (typeof record.timezone === "string" && record.timezone) {
    const _tz = record.timezone;
    const _off = computeUtcOffset(_tz);
    if (_off) {
      props.timezone = _tz;
      props.utcOffset = _off;
    }
  }
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
  if (typeof derived.timezone  === "string") body.timezone  = derived.timezone;
  if (typeof derived.utcOffset === "string") body.utcOffset = derived.utcOffset;

  try {
    const updateRes = await fetch(LOOPS_UPDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!updateRes.ok) {
      let errText = "";
      try { errText = await updateRes.text(); } catch (_) {}
      console.error(`[loops-progress] update failed: ${updateRes.status} ${errText}`);
      return jsonResponse({ ok: false, error: "Loops update failed" }, 502);
    }

    // ─── Onboarding-plan one-shot ─────────────────────────────────
    // Gate: onboarding_done = true AND loops_onb_plan_sent_at IS
    // NULL. A dedicated column (not reuse of onboarding_done alone)
    // because onboarding_done is sent on every subsequent sync —
    // without the sent_at stamp we'd fire "onboarding_completed"
    // every time this function runs for the user.
    //
    // Sequence: 1) PATCH the 5 plan contact properties (+ lastSubject
    // belt-and-braces, already sent in the main update above but
    // repeating it here keeps a Loops workflow self-contained if
    // anyone ever splits the two POSTs). 2) /events/send with
    // eventName: "onboarding_completed" and the userId. 3) Only on
    // event-send success, stamp loops_onb_plan_sent_at. A failed
    // event-send leaves the stamp NULL and the next trigger fire
    // retries — at most one duplicate /events/send for Loops to
    // de-dupe via its own "fire once per contact" workflow setting.
    let planResult: Record<string, unknown> = { onb_plan_sent: false };
    const isOnbDone = record.onboarding_done === true;
    const alreadySent = record.loops_onb_plan_sent_at != null;
    if (isOnbDone && !alreadySent) {
      try {
        const plan = derivePlanProps(record);
        const planBody: Record<string, unknown> = {
          email,
          onbGoal:       plan.onbGoal,
          onbGoalHow:    plan.onbGoalHow,
          onbWho:        plan.onbWho,
          onbWhoHow:     plan.onbWhoHow,
          onbRhythm:     plan.onbRhythm,
          onbGoalIcon:   plan.onbGoalIcon,
          onbWhoIcon:    plan.onbWhoIcon,
          onbRhythmIcon: plan.onbRhythmIcon,
        };
        if (derived.lastSubject) planBody.lastSubject = derived.lastSubject;
        const planPatch = await fetch(LOOPS_UPDATE_URL, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${LOOPS_API_KEY}`,
          },
          body: JSON.stringify(planBody),
        });
        if (!planPatch.ok) {
          let pet = "";
          try { pet = await planPatch.text(); } catch (_) {}
          console.warn(`[loops-progress] plan contact-update failed: ${planPatch.status} ${pet.slice(0, 200)}`);
          planResult = { onb_plan_sent: false, reason: "contact_update_failed", status: planPatch.status };
        } else {
          const userId = typeof record.user_id === "string" ? record.user_id : null;
          const eventBody: Record<string, unknown> = {
            email,
            eventName: "onboarding_completed",
          };
          if (userId) eventBody.userId = userId;
          const eventRes = await fetch(LOOPS_EVENTS_URL, {
            method: "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${LOOPS_API_KEY}`,
            },
            body: JSON.stringify(eventBody),
          });
          if (!eventRes.ok) {
            let eet = "";
            try { eet = await eventRes.text(); } catch (_) {}
            console.warn(`[loops-progress] onboarding_completed event failed: ${eventRes.status} ${eet.slice(0, 200)}`);
            planResult = { onb_plan_sent: false, reason: "event_send_failed", status: eventRes.status };
          } else {
            // Stamp loops_onb_plan_sent_at. Service-role client reaches
            // user_progress bypassing RLS. The UPDATE itself re-fires
            // notify_loops_progress but that fire is a no-op because
            // the 30-second debounce or the NEW IS NOT DISTINCT FROM
            // OLD.last_active_at guard (we're only touching
            // loops_onb_plan_sent_at here) catches the re-entry.
            const SUPABASE_URL              = Deno.env.get("SUPABASE_URL");
            const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && typeof record.user_id === "string") {
              const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
                auth: { autoRefreshToken: false, persistSession: false },
              });
              const { error: stampErr } = await admin
                .from("user_progress")
                .update({ loops_onb_plan_sent_at: new Date().toISOString() })
                .eq("user_id", record.user_id);
              if (stampErr) {
                console.warn("[loops-progress] stamp loops_onb_plan_sent_at failed:", stampErr);
              }
            }
            planResult = { onb_plan_sent: true, plan: plan };
          }
        }
      } catch (e) {
        console.warn("[loops-progress] onboarding plan path threw:", e);
        planResult = { onb_plan_sent: false, reason: "threw" };
      }
    }

    return jsonResponse({ ok: true, action: "updated", props: derived, ...planResult }, 200);
  } catch (e) {
    console.error("[loops-progress] update threw:", e);
    return jsonResponse({ ok: false, error: "Loops update threw" }, 502);
  }
});
