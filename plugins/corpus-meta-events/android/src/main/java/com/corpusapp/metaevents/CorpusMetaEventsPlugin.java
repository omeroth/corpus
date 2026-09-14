package com.corpusapp.metaevents;

import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;

import java.util.Iterator;

// ═══════════════════════════════════════════════════════════════════════════
// APP STORE / PLAY STORE PRIVACY DECLARATIONS — READ BEFORE EDITING
// ═══════════════════════════════════════════════════════════════════════════
// The App Store Connect privacy label (iOS) and Play Data Safety declaration
// (Android) both declare every data type Meta receives as "NOT USED FOR
// TRACKING". That declaration is only true if EVERY ONE of the five rules
// below stays in force. Both stores treat a mismatch between declared and
// actual behavior as a rejection reason (Apple Guideline 5.1.2, Play Data
// Safety policy).
//
// If you change ANY of the five rules below, you MUST update BOTH store
// privacy declarations FIRST. Not concurrently — first. The declaration
// version applies to the build being reviewed.
//
//   1. NEVER trigger an Android tracking-consent prompt (equivalent of iOS
//      ATT) for advertising ID access, and NEVER declare the AD_ID
//      permission in the Corpus AndroidManifest.
//
//   2. NEVER call FacebookSdk.setAdvertiserIDCollectionEnabled(true).
//      This is Meta's own switch that tells their pipeline "this install
//      is opted in to advertising-ID collection." Must stay false.
//
//   3. NEVER expose AppEventsLogger.setUserData(...) or any Advanced
//      Matching entry point from this plugin's JS surface. Advanced Matching
//      passes hashed email/phone to Meta so they can join the app-events
//      stream to a Meta profile — that's tracking by any definition.
//
//   4. NEVER enable auto-log for in-app-purchase / subscription events at
//      the SDK level (there is no direct Java equivalent of iOS's
//      isAutoLogSubscriptionsEnabled today, but Meta occasionally adds
//      similar hooks; check release notes on every SDK version bump).
//      Subscription events must flow through this plugin's logEvent() only.
//
//   5. NEVER add a second SDK anywhere in the app that requests advertising
//      consent (AppsFlyer, Adjust, Branch, etc.) — even one such prompt
//      flips the whole-app privacy declaration, regardless of what this
//      plugin does.
//
// The load() call below sets the collection flag to false BEFORE SDK
// initialization. Ordering matters: if any event is logged before the
// flag is set, Meta's SDK reads the pre-set default (which favors
// collection, not privacy).
//
// Test after any config change: on a fresh install, no advertising
// consent prompt should appear; Meta Events Manager should show events as
// "unidentified" (no linked advertiser id / Meta profile id).
// ═══════════════════════════════════════════════════════════════════════════

@CapacitorPlugin(name = "CorpusMetaEvents")
public class CorpusMetaEventsPlugin extends Plugin {

    private AppEventsLogger logger;

    @Override
    public void load() {
        // Rule 2 enforced HERE, before SDK init.
        FacebookSdk.setAdvertiserIDCollectionEnabled(false);
        // Auto-log app-activation events is OK — those don't carry the
        // advertising ID once the flag above is set. Auto-log purchases /
        // subscriptions is NOT ok (rule 4).
        FacebookSdk.setAutoLogAppEventsEnabled(true);
        // App ID + client token are wired via the host AndroidManifest
        // <meta-data> entries. sdkInitialize picks them up automatically.
        FacebookSdk.sdkInitialize(getContext());
        AppEventsLogger.activateApp(getActivity().getApplication());
        logger = AppEventsLogger.newLogger(getContext());
    }

    @PluginMethod
    public void logEvent(PluginCall call) {
        String name = call.getString("name");
        if (name == null || name.isEmpty()) {
            call.reject("missing event name");
            return;
        }
        JSObject params = call.getObject("params");
        Bundle bundle = new Bundle();
        Double valueToSum = null;
        if (params != null) {
            Iterator<String> keys = params.keys();
            while (keys.hasNext()) {
                String k = keys.next();
                Object v = params.opt(k);
                if ("_valueToSum".equals(k) && v instanceof Number) {
                    valueToSum = ((Number) v).doubleValue();
                } else if (v instanceof String) {
                    bundle.putString(k, (String) v);
                } else if (v instanceof Integer) {
                    bundle.putInt(k, (Integer) v);
                } else if (v instanceof Long) {
                    bundle.putLong(k, (Long) v);
                } else if (v instanceof Double) {
                    bundle.putDouble(k, (Double) v);
                } else if (v instanceof Boolean) {
                    bundle.putBoolean(k, (Boolean) v);
                } else if (v != null) {
                    bundle.putString(k, v.toString());
                }
            }
        }
        if (valueToSum != null) {
            logger.logEvent(name, valueToSum, bundle);
        } else if (!bundle.isEmpty()) {
            logger.logEvent(name, bundle);
        } else {
            logger.logEvent(name);
        }
        JSObject ret = new JSObject();
        ret.put("logged", true);
        call.resolve(ret);
    }
}
