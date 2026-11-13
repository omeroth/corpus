import Capacitor
import FBSDKCoreKit
import Foundation
import UIKit

// ═══════════════════════════════════════════════════════════════════════════
// APP STORE CONNECT PRIVACY LABEL COMMITMENT — READ BEFORE EDITING
// ═══════════════════════════════════════════════════════════════════════════
// The App Store Connect privacy label for Corpus declares every data type
// Meta receives as "NOT USED FOR TRACKING". That declaration is only true if
// EVERY ONE of the five rules below stays in force. Apple treats a mismatch
// between the declared label and actual behavior as a Guideline 5.1.2 (Data
// Use and Sharing) rejection reason.
//
// If you change ANY of the five rules below, you MUST update the App Store
// Connect privacy label declaration FIRST. Not concurrently — first. The
// label version applies to the build being reviewed.
//
//   1. NEVER call ATTrackingManager.requestTrackingAuthorization anywhere
//      in the app. Not from this plugin, not from any other plugin, not
//      from JS. One prompt anywhere in the app flips the label.
//
//   2. NEVER set Settings.shared.isAdvertiserTrackingEnabled = true.
//      This is Meta's own switch that tells their pipeline "this install
//      is opted in to cross-app correlation". Must stay false.
//      NOTE (FB SDK 18.x): this property's setter is runtime-deprecated;
//      Meta's SDK now derives the value from ATT status at read time
//      instead. Since rule 1 keeps ATT unrequested, the flag naturally
//      reports false. We still assign = false in load() below for
//      belt-and-braces (in case the deprecation is ever reverted) AND
//      because the privacy-check positive-assertion at
//      scripts/check-privacy-invariants.mjs expects the exact line to
//      exist. Setting it in 18.x also prints a runtime console warning
//      from the SDK; that's expected and non-fatal.
//
//   3. NEVER set Settings.shared.isAdvertiserIDCollectionEnabled = true.
//      Turning this on lets Meta read the IDFA (via ATT-approved installs)
//      OR the IDFV as a persistent identifier — either way, "used for
//      tracking" becomes true.
//
//   4. NEVER call AppEvents.shared.setUserData(...) — that's Advanced
//      Matching, which passes hashed email/phone to Meta so they can join
//      the app-events stream to a Meta profile. The JS surface of this
//      plugin deliberately does not expose that method; adding it back
//      would violate the "not used for tracking" commitment.
//
//   5. NEVER enable Settings.shared.isAutoLogSubscriptionsEnabled OR any
//      other auto-log flag that hooks SKPaymentQueue. Subscription events
//      must flow through this plugin's logEvent() only, so the payload is
//      what our code puts in it — not whatever Meta's SDK decides to
//      autofill (which historically has included receipt data with
//      identifiers on some iOS versions).
//      NOTE (FB SDK 18.x): isAutoLogSubscriptionsEnabled has been REMOVED
//      from the public Settings API in 18.x — subscription auto-log is
//      now controlled by a server-side GateKeeper
//      (app_events_if_auto_log_subs) that we don't operate. That means
//      there's no property to set in Swift any more; rule 5 has no code
//      path to enforce on iOS. The privacy-check regex for this
//      property name is kept as a guard against re-introduction if a
//      future SDK version restores it. The Info.plist
//      FacebookAutoLogSubscriptionsEnabled key is still structurally
//      guarded by check-privacy-invariants.mjs; whether 18.x reads that
//      key is undocumented in the changelog, so keep the guard.
//
// SDK initialization (the four Settings flags + initializeSDK() +
// ApplicationDelegate.shared.application(_:didFinishLaunchingWithOptions:)
// forwarding) lives in ios/App/App/AppDelegate.swift, NOT in this
// plugin. The plugin.load() lifecycle hook runs AFTER Capacitor bridge
// init, which is AFTER AppDelegate.didFinishLaunchingWithOptions
// returns — so if init lived here, the AppDelegate hook would have
// nothing to activate and the FB SDK session would never start (that
// was the 2026-11-12 bug where Meta Test Events saw zero activity on
// iOS). scripts/check-privacy-invariants.mjs enforces the four safe-
// value assignments and the two SDK calls over there via positive
// assertions.
//
// Test after any config change: on a fresh install, no ATT prompt should
// appear; Meta Events Manager should show events as "unidentified" (no
// linked advertiser id / Meta profile id), and fb_mobile_activate_app
// should fire within seconds of app open.
// ═══════════════════════════════════════════════════════════════════════════

@objc(CorpusMetaEventsPlugin)
public class CorpusMetaEventsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CorpusMetaEventsPlugin"
    public let jsName = "CorpusMetaEvents"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "logEvent", returnType: CAPPluginReturnPromise)
    ]

    // No load() override: the FB SDK is initialized in AppDelegate.swift
    // (see the header block above for the ordering explanation). By the
    // time Capacitor instantiates this plugin, AppEvents.shared is live
    // and ready to accept logEvent calls.

    @objc func logEvent(_ call: CAPPluginCall) {
        guard let name = call.getString("name"), !name.isEmpty else {
            call.reject("missing event name")
            return
        }
        // params is a JS object; Capacitor bridges it as [String: Any].
        // Meta's AppEvents expects [AppEvents.ParameterName: Any] for the
        // typed API or [String: Any] for the raw logEvent — we use the
        // string variant so custom params flow through cleanly.
        let params = call.getObject("params") ?? [:]
        // _valueToSum is a Meta convention: when present, it's the
        // numeric value the event represents (e.g. subscription price).
        // Extract it if the caller passed it, then pass everything else
        // as parameters.
        var extractedValue: Double? = nil
        var otherParams: [AppEvents.ParameterName: Any] = [:]
        for (k, v) in params {
            if k == "_valueToSum", let n = v as? Double {
                extractedValue = n
            } else if k == "_valueToSum", let n = v as? Int {
                extractedValue = Double(n)
            } else {
                otherParams[AppEvents.ParameterName(k)] = v
            }
        }
        let eventName = AppEvents.Name(name)
        if let value = extractedValue {
            AppEvents.shared.logEvent(eventName, valueToSum: value, parameters: otherParams)
        } else if !otherParams.isEmpty {
            AppEvents.shared.logEvent(eventName, parameters: otherParams)
        } else {
            AppEvents.shared.logEvent(eventName)
        }
        call.resolve(["logged": true])
    }
}
