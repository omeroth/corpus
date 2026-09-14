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
        // Meta's iOS SDK, SPM-distributed. Pinned to a recent 17.x — pre-17.0
        // used a different plist-key contract for AdvertiserIDCollectionEnabled
        // and required different init timing. 17.x is the current major and is
        // the shape our Swift wrapper below is written against.
        .package(url: "https://github.com/facebook/facebook-ios-sdk.git", from: "17.0.0")
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
