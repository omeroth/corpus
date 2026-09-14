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
//
// The plugin.load() below sets all three Meta-side flags to their
// safe values BEFORE SDK initialization. Ordering matters: if any event
// is logged before these flags are set, Meta's SDK reads the pre-set
// defaults (which favor tracking, not privacy).
//
// Test after any config change: on a fresh install, no ATT prompt should
// appear; Meta Events Manager should show events as "unidentified" (no
// linked advertiser id / Meta profile id).
// ═══════════════════════════════════════════════════════════════════════════

@objc(CorpusMetaEventsPlugin)
public class CorpusMetaEventsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CorpusMetaEventsPlugin"
    public let jsName = "CorpusMetaEvents"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "logEvent", returnType: CAPPluginReturnPromise)
    ]

    public override func load() {
        // Rules 2 + 3 + 5 enforced HERE, before SDK init.
        Settings.shared.isAdvertiserTrackingEnabled = false
        Settings.shared.isAdvertiserIDCollectionEnabled = false
        // Auto-log app-activation events is OK — those don't carry IDFA once
        // the three flags above are set. Auto-log subscription events is
        // NOT ok (rule 5) — Meta's SKPaymentQueue hook can attach receipt
        // data with identifiers.
        Settings.shared.isAutoLogAppEventsEnabled = true
        // SKAdNetwork reporting: opt in. This is Apple's privacy-preserving
        // attribution channel and is orthogonal to IDFA/tracking. Meta reads
        // aggregated conversion signals from Apple, never per-user data.
        Settings.shared.isSKAdNetworkReportEnabled = true

        // Initialize the SDK after flags are set. The app-level
        // ApplicationDelegate.application(_:didFinishLaunchingWithOptions:)
        // call happens from AppDelegate.swift (Capacitor host) — this
        // load() runs during Capacitor bridge init, which precedes the
        // JS runtime by design, so our flags are always the ones in
        // force when any event fires.
        ApplicationDelegate.shared.initializeSDK()
    }

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
