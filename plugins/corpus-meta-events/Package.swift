// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CorpusMetaEvents",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CorpusMetaEvents",
            targets: ["CorpusMetaEventsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.4"),
        // Meta's iOS SDK, SPM-distributed. 18.x, matching
        // @capgo/capacitor-social-login's dependency range so SPM resolves
        // both plugins against a single copy of the SDK on disk (having two
        // parallel copies fails SPM's uniqueness constraint at build time).
        //
        // Behavioural notes for the 17.x → 18.x bump — read before touching
        // the Swift wrapper below:
        //   - Settings.isAdvertiserTrackingEnabled: setter runtime-deprecated
        //     in 18.x; the flag is now derived from ATT status. Since rule 1
        //     keeps ATT unrequested, it stays false naturally. We keep the
        //     explicit `= false` assignment in load() for belt-and-braces
        //     AND because the privacy-check positive-assertion at
        //     scripts/check-privacy-invariants.mjs expects the exact line
        //     to exist.
        //   - Settings.isAutoLogSubscriptionsEnabled: REMOVED from the
        //     public Settings API in 18.x. Subscription auto-log is now
        //     server-side gate-keepered (app_events_if_auto_log_subs); we
        //     don't operate that gate. The privacy-check regex for this
        //     property remains as a guard against re-introduction.
        //   - All other API surface we use (initializeSDK, AppEvents.logEvent,
        //     isAdvertiserIDCollectionEnabled, isAutoLogAppEventsEnabled,
        //     isSKAdNetworkReportEnabled) is unchanged across 17→18.
        .package(url: "https://github.com/facebook/facebook-ios-sdk.git", .upToNextMajor(from: "18.0.3"))
    ],
    targets: [
        .target(
            name: "CorpusMetaEventsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "FacebookCore", package: "facebook-ios-sdk")
            ],
            path: "ios/Sources/CorpusMetaEventsPlugin")
    ]
)
